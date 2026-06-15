import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Linking } from 'react-native'
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { AppText } from './AppText'
import { X, ExternalLink, ShieldAlert, User, PhoneCall, Wrench } from 'lucide-react-native'
import { theme } from '../theme'
import { getSolutionProxy } from '../services/api'

interface SolutionBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  code: string | null
}

interface ParsedResolution {
  title: string          // "qué es" / causa del error → cabecera
  customer: string[]
  agent: string[]
  technician: string[]
  general: string[]      // procedimiento cuando no hay secciones por audiencia
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function parseResolutionText(text: string, code: string | null): ParsedResolution {
  const empty: ParsedResolution = { title: '', customer: [], agent: [], technician: [], general: [] }
  if (!text) return empty

  const decodedText = decodeHtmlEntities(text)
  const rawLines = decodedText.split('\n').map(l => l.trim()).filter(Boolean)
  const processedLines: string[] = []

  const isHeaderOrCode = (str: string) => {
    const lower = str.toLowerCase()
    if (lower.includes('action for')) return true
    if (/^\d+(\.\d+)+$/.test(str)) return true
    return false
  }

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i]
    if (processedLines.length === 0) {
      processedLines.push(line)
      continue
    }

    const prevLine = processedLines[processedLines.length - 1]
    const prevEndsWithPunctuation = /[\.\?\!\:]$/.test(prevLine)
    const currentStartsWithLowercase = /^[a-z]/.test(line)
    const currentIsUrlOrSubtext = line.startsWith('www.') || line.startsWith('http://') || line.startsWith('https://') || line === '.'

    const prevLower = prevLine.toLowerCase()
    const currentLower = line.toLowerCase()
    let shouldJoin = false

    if (!isHeaderOrCode(prevLine) && !isHeaderOrCode(line)) {
      if (!prevEndsWithPunctuation || currentStartsWithLowercase || currentIsUrlOrSubtext) {
        shouldJoin = true
      } else if (prevLine.endsWith(':')) {
        if (!/^\d+[\.\)]\s*/.test(line)) {
          shouldJoin = true
        }
      } else if (
        currentLower === 'path:' || 
        currentLower.startsWith('path:') || 
        currentLower.startsWith('support tools') || 
        line.includes(' > ')
      ) {
        shouldJoin = true
      }
    }

    if (shouldJoin) {
      if (line === '.') {
        processedLines[processedLines.length - 1] = prevLine + '.'
      } else {
        processedLines[processedLines.length - 1] = prevLine + ' ' + line
      }
    } else {
      processedLines.push(line)
    }
  }

  let currentSection: 'customer' | 'agent' | 'technician' | null = null
  const introLines: string[] = []
  const general: string[] = []
  const sections = { customer: [] as string[], agent: [] as string[], technician: [] as string[] }

  for (const line of processedLines) {
    const lower = line.toLowerCase()

    if (lower.includes('action for customers') || lower.includes('action for customer')) {
      currentSection = 'customer'
      continue
    } else if (
      lower.includes('action for call-center') ||
      lower.includes('action for call center') ||
      lower.includes('action for agents')
    ) {
      currentSection = 'agent'
      continue
    } else if (
      lower.includes('action for onsite') ||
      lower.includes('action for technicians')
    ) {
      currentSection = 'technician'
      continue
    }

    if (
      lower.includes('follow these troubleshooting steps') ||
      lower.includes('order presented')
    ) {
      continue
    }

    // ¿La línea original arranca como paso (número o viñeta)?
    const isStep = /^(\d{1,2}[.)]|[-•*])\s+/.test(line)

    let cleanedLine = line
    if (cleanedLine.startsWith('-') || cleanedLine.startsWith('•') || cleanedLine.startsWith('*')) {
      cleanedLine = cleanedLine.slice(1).trim()
    }
    cleanedLine = cleanedLine.replace(/^\d{1,2}[.)]\s+/, '').trim()

    if (code) {
      const normalizedCleaned = cleanedLine.replace(/[\s.]/g, '')
      const normalizedCode = code.replace(/[\s.]/g, '')
      if (
        normalizedCleaned === normalizedCode ||
        normalizedCode.endsWith(normalizedCleaned) ||
        (normalizedCleaned.length <= 5 && /^\d+$/.test(normalizedCleaned))
      ) {
        continue
      }
    }

    if (!cleanedLine || cleanedLine === '.' || cleanedLine === ':') {
      continue
    }

    if (currentSection) {
      sections[currentSection].push(cleanedLine)
    } else if (isStep) {
      // Paso sin encabezado de audiencia → lista "Procedimiento"
      general.push(cleanedLine)
    } else if (general.length > 0) {
      // Continuación de un paso previo (no es un paso nuevo)
      general[general.length - 1] = general[general.length - 1] + ' ' + cleanedLine
    } else {
      // Texto introductorio antes de cualquier paso/sección → "qué es"
      introLines.push(cleanedLine)
    }
  }

  return {
    title: introLines.join(' '),
    customer: sections.customer,
    agent: sections.agent,
    technician: sections.technician,
    general,
  }
}

export function SolutionBottomSheet({ isOpen, onClose, code }: SolutionBottomSheetProps) {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const snapPoints = useMemo(() => ['50%', '90%'], [])

  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchSolution = useCallback(async (targetCode: string) => {
    // Cancelar cualquier consulta anterior en vuelo
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)
    setContent(null)
    setUrl(null)
    try {
      const res = await getSolutionProxy(targetCode, controller.signal)
      if (controller.signal.aborted) return
      setContent(res.content)
      setUrl(res.url)
      if (!res.content) {
        setError('No hay un procedimiento registrado para este código de error.')
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || controller.signal.aborted) return
      setError(err.message || 'Error al obtener la solución del servidor.')
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen && code) {
      bottomSheetModalRef.current?.present()
      fetchSolution(code)
    } else {
      bottomSheetModalRef.current?.dismiss()
      // reset state on close (cancelando el reset previo si lo hubiera)
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
      resetTimeoutRef.current = setTimeout(() => {
        setContent(null)
        setUrl(null)
        setError(null)
      }, 300)
    }

    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
        resetTimeoutRef.current = null
      }
    }
  }, [isOpen, code, fetchSolution])

  // Cancelar fetch en vuelo al desmontar
  useEffect(() => () => abortRef.current?.abort(), [])

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose()
    }
  }, [onClose])

  const handleOpenUrl = async () => {
    if (url) {
      const canOpen = await Linking.canOpenURL(url)
      if (canOpen) {
        await Linking.openURL(url)
      }
    }
  }

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.65}
      />
    ),
    []
  )

  const parsedContent = useMemo(() => {
    return parseResolutionText(content || '', code)
  }, [content, code])

  const tabs = useMemo(() => {
    const list = []
    if (parsedContent.customer.length > 0) {
      list.push({ id: 'customer', label: 'Cliente', icon: User })
    }
    if (parsedContent.agent.length > 0) {
      list.push({ id: 'agent', label: 'Soporte', icon: PhoneCall })
    }
    if (parsedContent.technician.length > 0) {
      list.push({ id: 'technician', label: 'Técnico', icon: Wrench })
    }
    return list
  }, [parsedContent])

  const [activeTab, setActiveTab] = useState<'customer' | 'agent' | 'technician'>('customer')

  useEffect(() => {
    if (tabs.length > 0) {
      if (tabs.some(t => t.id === 'customer')) {
        setActiveTab('customer')
      } else {
        setActiveTab(tabs[0].id as any)
      }
    }
  }, [tabs])

  const steps = useMemo(() => {
    if (tabs.length === 0) return parsedContent.general
    if (activeTab === 'customer') return parsedContent.customer
    if (activeTab === 'agent') return parsedContent.agent
    if (activeTab === 'technician') return parsedContent.technician
    return parsedContent.general
  }, [tabs, activeTab, parsedContent])

  // Etiqueta de la lista de pasos cuando no hay barra de tabs (0 o 1 audiencia)
  const stepsLabel = useMemo(() => {
    if (tabs.length > 1) return null
    if (tabs.length === 1) {
      const id = tabs[0].id
      return id === 'customer' ? 'CLIENTE' : id === 'agent' ? 'SOPORTE' : 'TÉCNICO'
    }
    return parsedContent.general.length > 0 ? 'PROCEDIMIENTO' : null
  }, [tabs, parsedContent])

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <View style={styles.sheetContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <View style={styles.iconContainer}>
              <ShieldAlert size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.headerTexts}>
              <AppText style={styles.headerOverline}>CÓDIGO DE ERROR</AppText>
              <AppText style={styles.title}>{code}</AppText>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <AppText style={styles.loadingText}>Consultando base de conocimiento...</AppText>
            </View>
          ) : error ? (
            <View style={styles.centerContainer}>
              <AppText style={styles.errorText}>{error}</AppText>
              {url && (
                <TouchableOpacity style={styles.linkButton} onPress={handleOpenUrl}>
                  <ExternalLink size={16} color="#fff" />
                  <AppText style={styles.linkButtonText}>Ver en HP Portal</AppText>
                </TouchableOpacity>
              )}
            </View>
          ) : content ? (
            <View style={styles.solutionWrapper}>
              <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
                {/* 1. Qué es / causa del error */}
                {parsedContent.title ? (
                  <View style={styles.heroBlock}>
                    <AppText style={styles.heroLabel}>QUÉ SIGNIFICA</AppText>
                    <AppText style={styles.heroTitle}>{parsedContent.title}</AppText>
                  </View>
                ) : null}

                {/* 2. Tabs Bar */}
                {tabs.length > 1 && (
                  <View style={styles.tabBar}>
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id
                      const Icon = tab.icon
                      return (
                        <TouchableOpacity
                          key={tab.id}
                          onPress={() => setActiveTab(tab.id as any)}
                          style={[styles.tabButton, isActive && styles.tabButtonActive]}
                        >
                          <Icon size={14} color={isActive ? '#fff' : theme.colors.textMuted} />
                          <AppText style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                            {tab.label}
                          </AppText>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                )}

                {/* 3. Lista de pasos */}
                {stepsLabel && steps.length > 0 && (
                  <AppText style={styles.stepsLabel}>{stepsLabel}</AppText>
                )}
                {steps.map((step, idx) => (
                  <View key={idx} style={styles.stepCard}>
                    <View style={styles.stepIndexContainer}>
                      <AppText style={styles.stepIndex}>{idx + 1}</AppText>
                    </View>
                    <AppText style={styles.stepText}>{step}</AppText>
                  </View>
                ))}

                {/* Sin pasos ni descripción parseable */}
                {!parsedContent.title && steps.length === 0 && (
                  <AppText style={styles.emptyText}>
                    No se pudo estructurar el procedimiento. Abrí el artículo oficial de HP para ver el detalle.
                  </AppText>
                )}
              </BottomSheetScrollView>

              {url && (
                <View style={styles.footer}>
                  <TouchableOpacity style={styles.primaryButton} onPress={handleOpenUrl}>
                    <ExternalLink size={16} color="#fff" />
                    <AppText style={styles.primaryButtonText}>Abrir artículo oficial de HP</AppText>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.centerContainer}>
              <AppText style={styles.emptyText}>Sin información para este código.</AppText>
            </View>
          )}
        </View>
      </View>
    </BottomSheetModal>
  )
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  sheetContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  iconContainer: {
    backgroundColor: theme.colors.primaryGlow,
    padding: 6,
    borderRadius: theme.radius.sm,
  },
  headerTexts: {
    flex: 1,
  },
  headerOverline: {
    color: theme.colors.textDim,
    fontSize: 9,
    fontFamily: theme.fontFamily.bold,
    letterSpacing: 1.2,
    marginBottom: 1,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontFamily: theme.fontFamily.bold,
  },
  heroBlock: {
    backgroundColor: theme.colors.surfaceLight,
    borderColor: 'rgba(0, 161, 224, 0.18)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: theme.spacing.lg,
  },
  heroLabel: {
    color: theme.colors.primary,
    fontSize: 9,
    fontFamily: theme.fontFamily.bold,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  heroTitle: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: theme.fontFamily.semibold,
  },
  stepsLabel: {
    color: theme.colors.textDim,
    fontSize: 10,
    fontFamily: theme.fontFamily.bold,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  closeButton: {
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.radius.full,
  },
  contentContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: 16,
  },
  loadingText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontFamily: theme.fontFamily.medium,
    textAlign: 'center',
  },
  errorText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyText: {
    color: theme.colors.textDim,
    fontSize: 14,
  },
  solutionWrapper: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.xl,
    paddingBottom: 40,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  tabButtonText: {
    fontSize: 13,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.textMuted,
  },
  tabButtonTextActive: {
    color: '#fff',
    fontFamily: theme.fontFamily.semibold,
  },
  stepCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: theme.colors.surfaceLight,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  stepIndexContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 161, 224, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndex: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 12,
    color: theme.colors.primary,
  },
  stepText: {
    flex: 1,
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    marginTop: 12,
  },
  linkButtonText: {
    color: '#fff',
    fontFamily: theme.fontFamily.semibold,
    fontSize: 14,
  },
  footer: {
    padding: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: theme.colors.surface,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontFamily: theme.fontFamily.bold,
    fontSize: 15,
  },
})
