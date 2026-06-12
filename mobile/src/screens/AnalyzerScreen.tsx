import React, { useState, useMemo, useCallback } from 'react'
import { StyleSheet, View, ScrollView, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native'
import { AppText } from '../components/AppText'
import { Camera, FileText, Search, ShieldAlert, Cpu, TrendingDown, AlertTriangle } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { useAnalysisStore } from '../store/useAnalysisStore'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useToast } from '../hooks/useToast'
import { GlassCard } from '../components/GlassCard'
import { KPICard } from '../components/KPICard'
import { IncidentCard } from '../components/IncidentCard'
import { LogImportSheet } from '../components/LogImportSheet'
import { SeverityFilter } from '../components/SeverityFilter'
import { TopErrorsBar } from '../components/TopErrorsBar'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { EventsList } from '../components/EventsList'
import { AIDiagnosticResult } from '../components/AIDiagnosticResult'
import { ConsumableBar } from '../components/ConsumableBar'
import { extractSdsLogs, aiDiagnose } from '../services/api'
import { theme } from '../theme'
import type { AIDiagnosisResponse, RealtimeConsumable } from '../types/api'

// Botón con micro-animación de escala al presionar
function ScalePressable({ onPress, disabled, style, children }: {
  onPress: () => void
  disabled?: boolean
  style?: any
  children: React.ReactNode
}) {
  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.92) }}
        onPressOut={() => { scale.value = withSpring(1) }}
        onPress={onPress}
        disabled={disabled}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  )
}

export function AnalyzerScreen() {
  const insets = useSafeAreaInsets()
  const isOnline = useOnlineStatus()
  const toast = useToast()

  const {
    result,
    loading,
    handleAnalyze,
  } = useAnalysisStore()

  const [serial, setSerial] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [consumables, setConsumables] = useState<RealtimeConsumable[]>([])
  const [currentModelName, setCurrentModelName] = useState<string | null>(null)
  const [currentSerial, setCurrentSerial] = useState<string | null>(null)

  // Severity filter state
  const [activeSeverities, setActiveSeverities] = useState<Set<string>>(new Set(['ERROR', 'WARNING', 'INFO']))

  // AI diagnosis state
  const [aiResult, setAiResult] = useState<AIDiagnosisResponse | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const handleSeverityToggle = useCallback((sev: string) => {
    setActiveSeverities(prev => {
      const next = new Set(prev)
      if (next.has(sev)) {
        if (next.size > 1) next.delete(sev)
      } else {
        next.add(sev)
      }
      return next
    })
  }, [])

  // Búsqueda automática vía SDS
  const handleSdsSearch = async () => {
    const trimmed = serial.trim().toUpperCase()
    if (!trimmed) return
    if (!isOnline) {
      toast.showError('No hay conexión a internet para sincronizar con SDS.')
      return
    }

    setExtracting(true)
    setAiResult(null)
    setAiError(null)
    try {
      const sdsRes = await extractSdsLogs(trimmed)
      setConsumables(sdsRes.realtime_consumables || [])
      setCurrentModelName(sdsRes.model_name_sds || null)
      setCurrentSerial(trimmed)
      if (sdsRes.logs_text) {
        await handleAnalyze(sdsRes.logs_text, `Portal_SDS_${trimmed}.tsv`, sdsRes.suggested_model_id)
        toast.showSuccess(`Logs extraídos para ${trimmed}`)
      } else {
        toast.showWarning('No se encontraron logs para este número de serie.')
      }
    } catch (err: any) {
      toast.showError(err.message || 'Error al buscar en SDS')
    } finally {
      setExtracting(false)
    }
  }

  // Pegar logs manualmente
  const handleImportText = async (text: string) => {
    setAiResult(null)
    setAiError(null)
    setConsumables([])
    setCurrentModelName(null)
    setCurrentSerial(null)
    try {
      await handleAnalyze(text, 'Texto Pegado.tsv')
      toast.showSuccess('Logs importados correctamente')
    } catch (err: any) {
      toast.showError(err.message || 'Error al procesar logs')
    }
  }

  // AI Diagnosis
  const handleAiDiagnose = async () => {
    if (!result) return
    setAiLoading(true)
    setAiError(null)
    setAiResult(null)
    try {
      const res = await aiDiagnose(result, {
        consumables,
        serialNumber: currentSerial,
        modelName: currentModelName,
      })
      setAiResult(res)
    } catch (err: any) {
      setAiError(err.message || 'Error al consultar la IA')
    } finally {
      setAiLoading(false)
    }
  }

  // Mock de cámara OCR / Escáner
  const handleCameraScan = () => {
    Alert.alert(
      'Escáner Táctil',
      'El motor de cámara OCR requiere un dispositivo físico. Escribe el serial manualmente para pruebas.',
      [{ text: 'Entendido' }]
    )
  }

  const incidents = result?.incidents ?? []
  const events = result?.events ?? []

  // Filtered data based on severity
  const filteredIncidents = useMemo(
    () => incidents.filter(i => activeSeverities.has(i.severity.toUpperCase())),
    [incidents, activeSeverities]
  )
  const filteredEvents = useMemo(
    () => events.filter(e => activeSeverities.has(e.type.toUpperCase())),
    [events, activeSeverities]
  )

  // KPI computations
  const errorIncidents = useMemo(
    () => incidents.filter(i => i.severity.toUpperCase() === 'ERROR'),
    [incidents]
  )
  const lastErrorIncident = useMemo(
    () => errorIncidents.length > 0
      ? errorIncidents.reduce((latest, inc) =>
          new Date(inc.end_time) > new Date(latest.end_time) ? inc : latest
        )
      : null,
    [errorIncidents]
  )

  // Top error codes
  const topCodes = useMemo(() => {
    const map = new Map<string, { count: number; severity: string }>()
    for (const inc of incidents) {
      const existing = map.get(inc.code)
      if (existing) {
        existing.count += inc.occurrences
      } else {
        map.set(inc.code, { count: inc.occurrences, severity: inc.severity })
      }
    }
    return Array.from(map.entries())
      .map(([name, { count, severity }]) => ({ name, count, severity }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [incidents])

  // Error rate
  const errorRate = useMemo(() => {
    if (!result || events.length === 0) return null
    const errorEvents = events.filter(e => e.type.toUpperCase() === 'ERROR')
    if (errorEvents.length === 0) return null
    const counters = events.map(e => e.counter).filter(c => c > 0)
    if (counters.length < 2) return null
    const totalPages = Math.max(...counters) - Math.min(...counters)
    if (totalPages <= 0) return null
    return Math.round(totalPages / errorEvents.length)
  }, [result, events])

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Barra de Búsqueda de Serie */}
        <GlassCard style={styles.searchCard}>
          <AppText style={styles.cardTitle}>Buscar por Número de Serie</AppText>
          <View style={styles.searchRow}>
            <TextInput
              style={[styles.input, inputFocused && styles.inputFocused]}
              placeholder="Ej: CNB1H23456"
              placeholderTextColor={theme.colors.textDim}
              value={serial}
              onChangeText={setSerial}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              autoCapitalize="characters"
            />
            <ScalePressable onPress={handleCameraScan} style={styles.iconBtn}>
              <Camera size={20} color={theme.colors.text} />
            </ScalePressable>
            <ScalePressable
              onPress={handleSdsSearch}
              style={styles.searchBtn}
              disabled={extracting || loading}
            >
              {extracting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Search size={20} color="#fff" />
              )}
            </ScalePressable>
          </View>
        </GlassCard>

        {/* Carga Manual de logs */}
        <Pressable
          style={styles.importBtn}
          onPress={() => setSheetOpen(true)}
        >
          <FileText size={18} color="#fff" />
          <AppText style={styles.importBtnText}>Pegar Logs de Eventos</AppText>
        </Pressable>

        {/* Estado de carga */}
        {loading && (
          <View style={styles.loadingContainer}>
            <View style={styles.logoTextContainer}>
              <AppText style={styles.logoTextMain}>HP Logs </AppText>
              <AppText style={styles.logoTextSuffix}>ANALYZER</AppText>
            </View>
            <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loadingSpinner} />
            <AppText style={styles.loadingText}>Parseando logs y calculando incidentes...</AppText>
          </View>
        )}

        {/* Resultados del análisis */}
        {result && !loading && (
          <View style={styles.resultsContainer}>

            {/* Header del Panel */}
            <View style={styles.panelHeader}>
              <AppText style={styles.panelTitle}>Panel de errores</AppText>
              {(currentModelName || currentSerial) && (
                <AppText style={styles.panelMeta}>
                  {currentModelName}{currentSerial ? ` · ${currentSerial}` : ''}
                </AppText>
              )}
            </View>

            {/* KPIs en horizontal */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.kpiScroll}
            >
              <KPICard
                title="ÚLTIMO ERROR CRÍTICO"
                value={lastErrorIncident?.code ?? '—'}
                icon={<AlertTriangle size={16} color={theme.colors.error} />}
                accentColor={theme.colors.error}
              />
              <KPICard
                title="ERRORES CRÍTICOS"
                value={errorIncidents.length}
                icon={<ShieldAlert size={16} color={theme.colors.error} />}
                accentColor={theme.colors.error}
              />
              <KPICard
                title="INCIDENCIAS ACTIVAS"
                value={incidents.length}
                icon={<Cpu size={16} color={theme.colors.warning} />}
                accentColor={theme.colors.warning}
              />
              <KPICard
                title="TASA DE ERRORES"
                value={errorRate ? `1 c/${errorRate} pág` : '—'}
                icon={<TrendingDown size={16} color={theme.colors.info} />}
                accentColor={theme.colors.info}
              />
            </ScrollView>

            {/* Filtros de severidad */}
            <SeverityFilter active={activeSeverities} onToggle={handleSeverityToggle} />

            {/* Top errores más frecuentes */}
            <Animated.View entering={FadeInDown.delay(100).duration(350)}>
              <TopErrorsBar topCodes={topCodes} activeSeverities={activeSeverities} />
            </Animated.View>

            {/* Panel de Diagnóstico IA */}
            {!aiResult && !aiLoading && (
              <GlassCard style={styles.iaCard}>
                <LinearGradient
                  colors={['rgba(0, 161, 224, 0.08)', 'rgba(99, 102, 241, 0.08)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iaGradient}
                >
                  <View style={styles.iaHeader}>
                    <View style={styles.iaDot} />
                    <AppText style={styles.iaTitle}>✨ Diagnóstico con IA (Recomendado)</AppText>
                  </View>
                  <ScalePressable onPress={handleAiDiagnose} style={styles.iaButtonPressable}>
                    <LinearGradient
                      colors={[theme.colors.primary, theme.colors.accentSecondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.iaButton}
                    >
                      <AppText style={styles.iaButtonText}>Consultar Copiloto Técnico</AppText>
                    </LinearGradient>
                  </ScalePressable>
                </LinearGradient>
              </GlassCard>
            )}

            {/* AI Diagnosis Result */}
            {(aiLoading || aiResult || aiError) && (
              <Animated.View entering={FadeInDown.duration(350)}>
                <AIDiagnosticResult result={aiResult} loading={aiLoading} error={aiError} />
              </Animated.View>
            )}

            {/* ANÁLISIS DETALLADO - Paneles colapsables */}
            <AppText style={styles.sectionLabel}>ANÁLISIS DETALLADO</AppText>

            {/* Incidencias detectadas */}
            <CollapsibleSection
              title="Incidencias detectadas"
              icon="📋"
              badge={`${filteredIncidents.length} incidencias`}
            >
              {filteredIncidents.length === 0 ? (
                <AppText style={styles.emptyText}>No se detectaron fallas en este filtro.</AppText>
              ) : (
                filteredIncidents.map((inc, idx) => (
                  <Animated.View key={inc.id} entering={FadeInDown.delay(idx * 40).duration(300)}>
                    <IncidentCard
                      incident={inc}
                      onPressSolution={(code) => {
                        Alert.alert('Solución Técnica', `Buscando guía técnica para el código ${code}...`)
                      }}
                    />
                  </Animated.View>
                ))
              )}
            </CollapsibleSection>

            {/* Eventos del período */}
            <CollapsibleSection
              title="Eventos del período"
              icon="📊"
              badge={`${filteredEvents.length} eventos`}
            >
              <EventsList events={filteredEvents} />
            </CollapsibleSection>

            {/* Consumibles en tiempo real */}
            {consumables.length > 0 && (
              <CollapsibleSection
                title={`Estado de consumibles en tiempo real (${consumables.length})`}
                icon="⚙️"
              >
                {consumables.map((c, i) => (
                  <ConsumableBar
                    key={i}
                    label={c.description || c.type}
                    percentage={c.percentLeft}
                    subtitle={c.sku}
                  />
                ))}
              </CollapsibleSection>
            )}

          </View>
        )}
      </ScrollView>

      {/* Modal / Bottom Sheet para Importar Log */}
      <LogImportSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onImport={handleImportText}
        loading={loading}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  searchCard: {
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: theme.fontFamily.bold,
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    color: theme.colors.text,
    fontFamily: theme.fontFamily.regular,
    paddingHorizontal: theme.spacing.md,
    height: 44,
  },
  inputFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(0, 161, 224, 0.05)',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.lg,
    borderColor: theme.colors.border,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  importBtn: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceLight,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.xl,
  },
  importBtnText: {
    color: '#fff',
    fontFamily: theme.fontFamily.bold,
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoTextMain: {
    color: '#ffffff',
    fontSize: 26,
    fontFamily: theme.fontFamily.bold,
  },
  logoTextSuffix: {
    color: theme.colors.primary,
    fontSize: 26,
    fontFamily: theme.fontFamily.regular,
    letterSpacing: 1,
  },
  loadingSpinner: {
    marginBottom: theme.spacing.md,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  resultsContainer: {
    marginTop: theme.spacing.sm,
  },
  panelHeader: {
    marginBottom: theme.spacing.md,
  },
  panelTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: theme.fontFamily.bold,
  },
  panelMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  kpiScroll: {
    paddingBottom: theme.spacing.md,
    gap: 10,
  },
  sectionLabel: {
    color: theme.colors.textDim,
    fontSize: 10,
    fontFamily: theme.fontFamily.bold,
    letterSpacing: 1.5,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  iaCard: {
    marginBottom: theme.spacing.lg,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  iaGradient: {
    margin: -theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  iaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  iaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  iaTitle: {
    color: theme.colors.text,
    fontSize: 13,
    fontFamily: theme.fontFamily.bold,
    flex: 1,
  },
  iaButtonPressable: {
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  iaButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  iaButtonText: {
    color: '#fff',
    fontFamily: theme.fontFamily.bold,
    fontSize: 13,
  },
  emptyText: {
    color: theme.colors.textDim,
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
})
