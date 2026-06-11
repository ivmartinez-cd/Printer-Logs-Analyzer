import React, { useState } from 'react'
import { StyleSheet, View, ScrollView, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native'
import { AppText } from '../components/AppText'
import { Camera, FileText, Search, ShieldAlert, Cpu, Sparkles } from 'lucide-react-native'
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
import { extractSdsLogs } from '../services/api'
import { theme } from '../theme'

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

  // Búsqueda automática vía SDS
  const handleSdsSearch = async () => {
    const trimmed = serial.trim().toUpperCase()
    if (!trimmed) return
    if (!isOnline) {
      toast.showError('No hay conexión a internet para sincronizar con SDS.')
      return
    }

    setExtracting(true)
    try {
      const sdsRes = await extractSdsLogs(trimmed)
      if (sdsRes.logs_text) {
        await handleAnalyze(sdsRes.logs_text, `Portal_SDS_${trimmed}.tsv`, sdsRes.suggested_model_id)
        toast.showSuccess(`Logs extraídos para el serial ${trimmed}`)
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
    try {
      await handleAnalyze(text, 'Texto Pegado.tsv')
      toast.showSuccess('Logs importados correctamente')
    } catch (err: any) {
      toast.showError(err.message || 'Error al procesar logs')
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

            {/* KPIs en horizontal */}
            <AppText style={styles.sectionTitle}>Métricas del Log</AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.kpiScroll}
            >
              <KPICard
                title="Eventos Totales"
                value={events.length}
                icon={<FileText size={16} color={theme.colors.info} />}
                accentColor={theme.colors.info}
              />
              <KPICard
                title="Críticos"
                value={incidents.filter(i => i.severity === 'ERROR').length}
                icon={<ShieldAlert size={16} color={theme.colors.error} />}
                accentColor={theme.colors.error}
              />
              <KPICard
                title="Líneas procesadas"
                value={result.total_lines}
                icon={<Cpu size={16} color={theme.colors.success} />}
                accentColor={theme.colors.success}
              />
            </ScrollView>

            {/* Panel de Diagnóstico IA */}
            <GlassCard style={styles.iaCard}>
              <LinearGradient
                colors={['rgba(0, 161, 224, 0.08)', 'rgba(99, 102, 241, 0.08)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iaGradient}
              >
                <View style={styles.iaHeader}>
                  <Sparkles size={18} color={theme.colors.warning} />
                  <AppText style={styles.iaTitle}>Asistente de IA (Diagnóstico)</AppText>
                </View>
                <AppText style={styles.iaText}>
                  Presiona "Ver Diagnóstico IA" para solicitar una explicación inteligente de las fallas detectadas y un plan de acción sugerido.
                </AppText>
                <ScalePressable onPress={() => {}} style={styles.iaButtonPressable}>
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

            {/* Lista de Incidentes */}
            <AppText style={styles.sectionTitle}>Incidentes Detectados ({incidents.length})</AppText>
            {incidents.length === 0 ? (
              <AppText style={styles.emptyText}>No se detectaron fallas críticas en este log.</AppText>
            ) : (
              incidents.map((inc, idx) => (
                <Animated.View key={inc.id} entering={FadeInDown.delay(idx * 60).duration(350)}>
                  <IncidentCard
                    incident={inc}
                    onPressSolution={(code) => {
                      Alert.alert('Solución Técnica', `Buscando guía técnica para el código ${code}...`)
                    }}
                  />
                </Animated.View>
              ))
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
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: theme.fontFamily.bold,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  kpiScroll: {
    paddingBottom: theme.spacing.md,
  },
  iaCard: {
    marginBottom: theme.spacing.xl,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  iaGradient: {
    margin: -theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  iaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iaTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: theme.fontFamily.bold,
  },
  iaText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: theme.spacing.md,
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
  },
})
