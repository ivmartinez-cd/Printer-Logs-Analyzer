import React, { useState, useMemo, useCallback } from 'react'
import { StyleSheet, View, ScrollView, TextInput, Pressable, ActivityIndicator, Alert, TouchableOpacity } from 'react-native'
import { AppText } from '../components/AppText'
import { Camera, FileText, Search, ShieldAlert, Cpu, TrendingDown, AlertTriangle, Calendar, X } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { useAnalysisStore } from '../store/useAnalysisStore'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useToast } from '../hooks/useToast'
import { GlassCard } from '../components/GlassCard'
import { KPICard } from '../components/KPICard'
import { IncidentCard } from '../components/IncidentCard'
import { SolutionBottomSheet } from '../components/SolutionBottomSheet'
import { SeverityFilter } from '../components/SeverityFilter'
import { ChartsCarousel } from '../components/ChartsCarousel'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { EventsList } from '../components/EventsList'
import { AIDiagnosticResult } from '../components/AIDiagnosticResult'
import { ConsumableBar } from '../components/ConsumableBar'
import { InsightAlertsPanel } from '../components/InsightAlertsPanel'
import { extractSdsLogs, aiDiagnose, listFleetClients, getFleetClient, getSolutionProxy, getInsightAlerts } from '../services/api'
import { theme } from '../theme'
import type { AIDiagnosisResponse, RealtimeConsumable, FleetClientSummary, FleetDeviceSummary, DeviceAlertsResponse } from '../types/api'
import { SelectionBottomSheet } from '../components/SelectionBottomSheet'

const formatYMD = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

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
  const [extracting, setExtracting] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [consumables, setConsumables] = useState<RealtimeConsumable[]>([])
  const [currentModelName, setCurrentModelName] = useState<string | null>(null)
  const [currentSerial, setCurrentSerial] = useState<string | null>(null)
  
  // Collapse search card state
  const [searchCollapsed, setSearchCollapsed] = useState(false)

  // Solution modal states
  const [selectedErrorCode, setSelectedErrorCode] = useState<string | null>(null)
  const [solutionSheetOpen, setSolutionSheetOpen] = useState(false)

  // Insight portal states
  const [insightData, setInsightData] = useState<DeviceAlertsResponse | null>(null)
  const [insightLoading, setInsightLoading] = useState(false)
  const [insightError, setInsightError] = useState<string | null>(null)

  // Fleet search states
  const [searchMode, setSearchMode] = useState<'serial' | 'client'>('serial')
  const [clients, setClients] = useState<FleetClientSummary[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [selectedClient, setSelectedClient] = useState<FleetClientSummary | null>(null)
  const [devices, setDevices] = useState<FleetDeviceSummary[]>([])
  const [loadingDevices, setLoadingDevices] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<FleetDeviceSummary | null>(null)
  const [clientSheetOpen, setClientSheetOpen] = useState(false)
  const [deviceSheetOpen, setDeviceSheetOpen] = useState(false)

  // Text search filter inside detailed analysis
  const [textFilter, setTextFilter] = useState('')

  // Date filter states
  const [selectedDate, setSelectedDate] = useState<string | { start: string; end: string } | null>(null)
  const [dateSheetOpen, setDateSheetOpen] = useState(false)

  const loadClientsIfNeeded = async () => {
    if (clients.length > 0) return
    setLoadingClients(true)
    try {
      const data = await listFleetClients()
      setClients(data)
    } catch (err: any) {
      toast.showError('Error al cargar clientes: ' + err.message)
    } finally {
      setLoadingClients(false)
    }
  }

  const handleClientChange = async (clientItem: { id: string }) => {
    const client = clients.find(c => c.id === clientItem.id) || null
    setSelectedClient(client)
    setSelectedDevice(null)
    setDevices([])
    setSerial('')
    if (!clientItem.id) return

    setLoadingDevices(true)
    try {
      const detail = await getFleetClient(clientItem.id)
      setDevices(detail.devices || [])
    } catch (err: any) {
      toast.showError('Error al cargar equipos: ' + err.message)
    } finally {
      setLoadingDevices(false)
    }
  }

  const handleDeviceChange = (deviceItem: { id: string }) => {
    const device = devices.find(d => d.serial === deviceItem.id) || null
    setSelectedDevice(device)
    if (device) {
      setSerial(device.serial)
    } else {
      setSerial('')
    }
  }

  const handleDateSelect = (item: { id: string }) => {
    if (item.id === 'divider') return
    
    if (item.id === 'all') {
      setSelectedDate(null)
    } else if (item.id === 'today') {
      const today = new Date()
      const s = formatYMD(today)
      setSelectedDate({ start: s, end: s })
    } else if (item.id === 'this_week') {
      const now = new Date()
      const day = now.getDay()
      const diff = day === 0 ? -6 : 1 - day
      const monday = new Date(now)
      monday.setDate(now.getDate() + diff)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      setSelectedDate({ start: formatYMD(monday), end: formatYMD(sunday) })
    } else if (item.id === 'last_week') {
      const now = new Date()
      const day = now.getDay()
      const diff = day === 0 ? -13 : 1 - day - 7
      const monday = new Date(now)
      monday.setDate(now.getDate() + diff)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      setSelectedDate({ start: formatYMD(monday), end: formatYMD(sunday) })
    } else if (item.id === 'this_month') {
      const now = new Date()
      const first = new Date(now.getFullYear(), now.getMonth(), 1)
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      setSelectedDate({ start: formatYMD(first), end: formatYMD(last) })
    } else if (item.id === 'last_month') {
      const now = new Date()
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const last = new Date(now.getFullYear(), now.getMonth(), 0)
      setSelectedDate({ start: formatYMD(first), end: formatYMD(last) })
    } else if (item.id === 'last_7_days') {
      const today = new Date()
      const start = new Date(today)
      start.setDate(today.getDate() - 6)
      setSelectedDate({ start: formatYMD(start), end: formatYMD(today) })
    } else if (item.id === 'last_30_days') {
      const today = new Date()
      const start = new Date(today)
      start.setDate(today.getDate() - 29)
      setSelectedDate({ start: formatYMD(start), end: formatYMD(today) })
    } else if (item.id.startsWith('day:')) {
      const dayStr = item.id.substring(4)
      setSelectedDate(dayStr)
    }
  }

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

  const fetchInsightData = async (serialNo: string) => {
    setInsightLoading(true)
    setInsightError(null)
    setInsightData(null)
    try {
      const res = await getInsightAlerts(serialNo)
      setInsightData(res)
    } catch (err: any) {
      setInsightError(err.message || 'Error al obtener alertas de Insight')
    } finally {
      setInsightLoading(false)
    }
  }

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
    setTextFilter('')
    setSelectedDate(null)
    
    // Consultar telemetría del portal HP Insight en paralelo
    void fetchInsightData(trimmed)

    try {
      const sdsRes = await extractSdsLogs(trimmed)
      setConsumables(sdsRes.realtime_consumables || [])
      setCurrentModelName(sdsRes.model_name_sds || null)
      setCurrentSerial(trimmed)
      if (sdsRes.logs_text) {
        await handleAnalyze(sdsRes.logs_text, `Portal_SDS_${trimmed}.tsv`, sdsRes.suggested_model_id)
        toast.showSuccess(`Logs extraídos para ${trimmed}`)
        setSearchCollapsed(true)
      } else {
        toast.showWarning('No se encontraron logs para este número de serie.')
      }
    } catch (err: any) {
      toast.showError(err.message || 'Error al buscar en SDS')
    } finally {
      setExtracting(false)
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

  // Unique dates from logs (YYYY-MM-DD)
  const uniqueDates = useMemo(() => {
    if (!result || events.length === 0) return []
    const datesSet = new Set<string>()
    for (const e of events) {
      if (e.timestamp) {
        const dateStr = e.timestamp.split('T')[0]
        if (dateStr) datesSet.add(dateStr)
      }
    }
    return Array.from(datesSet).sort((a, b) => b.localeCompare(a))
  }, [result, events])

  // Date items for SelectionBottomSheet
  const dateItems = useMemo(() => {
    const items: Array<{ id: string; name: string; detail?: string }> = [
      { id: 'all', name: 'Todo el período', detail: 'Mostrar todos los eventos' },
      { id: 'today', name: 'Hoy', detail: 'Filtrar por el día de hoy' },
      { id: 'this_week', name: 'Esta semana', detail: 'De lunes a domingo' },
      { id: 'last_week', name: 'Semana anterior', detail: 'Semana pasada completa' },
      { id: 'this_month', name: 'Este mes', detail: 'Mes en curso' },
      { id: 'last_month', name: 'Mes anterior', detail: 'Mes pasado completo' },
      { id: 'last_7_days', name: 'Últimos 7 días', detail: 'Últimos 7 días corridos' },
      { id: 'last_30_days', name: 'Últimos 30 días', detail: 'Últimos 30 días corridos' },
    ]
    if (uniqueDates.length > 0) {
      items.push({ id: 'divider', name: '— Días Específicos del Log —', detail: undefined })
      for (const d of uniqueDates) {
        const [y, m, dayNum] = d.split('-').map(Number)
        const formatted = new Date(y, m - 1, dayNum).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
        items.push({ id: `day:${d}`, name: formatted, detail: `Filtrar por el día ${formatted}` })
      }
    }
    return items
  }, [uniqueDates])

  const dateButtonLabel = useMemo(() => {
    if (!selectedDate) return 'Todo el período'
    if (typeof selectedDate === 'string') {
      const [y, m, d] = selectedDate.split('-').map(Number)
      return new Date(y, m - 1, d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    }
    const fmtShort = (s: string) => {
      const [y, m, d] = s.split('-').map(Number)
      return new Date(y, m - 1, d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    }
    return `${fmtShort(selectedDate.start)} – ${fmtShort(selectedDate.end)}`
  }, [selectedDate])

  // Date filtered data (acts as the base for KPIs and detailed views)
  const dateFilteredIncidents = useMemo(() => {
    if (!selectedDate) return incidents

    let startTs = 0
    let endTs = Infinity
    if (typeof selectedDate === 'string') {
      const [y, m, d] = selectedDate.split('-').map(Number)
      startTs = new Date(y, m - 1, d, 0, 0, 0, 0).getTime()
      endTs = new Date(y, m - 1, d, 23, 59, 59, 999).getTime()
    } else {
      const [sy, sm, sd] = selectedDate.start.split('-').map(Number)
      const [ey, em, ed] = selectedDate.end.split('-').map(Number)
      startTs = new Date(sy, sm - 1, sd, 0, 0, 0, 0).getTime()
      endTs = new Date(ey, em - 1, ed, 23, 59, 59, 999).getTime()
    }

    return incidents.filter(i => 
      i.events.some(e => {
        if (!e.timestamp) return false
        const t = new Date(e.timestamp).getTime()
        return t >= startTs && t <= endTs
      })
    )
  }, [incidents, selectedDate])

  const dateFilteredEvents = useMemo(() => {
    if (!selectedDate) return events

    let startTs = 0
    let endTs = Infinity
    if (typeof selectedDate === 'string') {
      const [y, m, d] = selectedDate.split('-').map(Number)
      startTs = new Date(y, m - 1, d, 0, 0, 0, 0).getTime()
      endTs = new Date(y, m - 1, d, 23, 59, 59, 999).getTime()
    } else {
      const [sy, sm, sd] = selectedDate.start.split('-').map(Number)
      const [ey, em, ed] = selectedDate.end.split('-').map(Number)
      startTs = new Date(sy, sm - 1, sd, 0, 0, 0, 0).getTime()
      endTs = new Date(ey, em - 1, ed, 23, 59, 59, 999).getTime()
    }

    return events.filter(e => {
      if (!e.timestamp) return false
      const t = new Date(e.timestamp).getTime()
      return t >= startTs && t <= endTs
    })
  }, [events, selectedDate])

  // Filtered data based on severity and text search
  const filteredIncidents = useMemo(() => {
    return dateFilteredIncidents.filter(i => {
      // 1. Severity filter
      if (!activeSeverities.has(i.severity.toUpperCase())) return false

      // 2. Text search filter
      if (textFilter.trim()) {
        const q = textFilter.toLowerCase().trim()
        const code = (i.code ?? '').toLowerCase()
        const classification = (i.classification ?? '').toLowerCase()
        if (!code.includes(q) && !classification.includes(q)) return false
      }

      return true
    })
  }, [dateFilteredIncidents, activeSeverities, textFilter])

  const filteredEvents = useMemo(() => {
    return dateFilteredEvents.filter(e => {
      // 1. Severity filter
      if (!activeSeverities.has(e.type.toUpperCase())) return false

      // 2. Text search filter
      if (textFilter.trim()) {
        const q = textFilter.toLowerCase().trim()
        const code = (e.code ?? '').toLowerCase()
        const desc = (e.code_description ?? '').toLowerCase()
        if (!code.includes(q) && !desc.includes(q)) return false
      }

      return true
    })
  }, [dateFilteredEvents, activeSeverities, textFilter])

  // KPI computations
  const errorIncidents = useMemo(
    () => dateFilteredIncidents.filter(i => i.severity.toUpperCase() === 'ERROR'),
    [dateFilteredIncidents]
  )

  const warningCount = useMemo(
    () => dateFilteredIncidents.filter(i => i.severity.toUpperCase() === 'WARNING').length,
    [dateFilteredIncidents]
  )

  const infoCount = useMemo(
    () => dateFilteredIncidents.filter(i => i.severity.toUpperCase() === 'INFO').length,
    [dateFilteredIncidents]
  )

  const lastErrorEvent = useMemo(() => {
    const errorEvents = dateFilteredEvents.filter(e => e.type.toUpperCase() === 'ERROR')
    if (errorEvents.length === 0) return null
    return [...errorEvents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
  }, [dateFilteredEvents])

  const lastErrorLabel = useMemo(() => {
    if (!lastErrorEvent) return null
    return new Date(lastErrorEvent.timestamp).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }, [lastErrorEvent])

  // Top error codes
  const topCodes = useMemo(() => {
    const map = new Map<string, { count: number; severity: string }>()
    for (const inc of dateFilteredIncidents) {
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
  }, [dateFilteredIncidents])

  // Error rate
  const errorRateData = useMemo(() => {
    const errorEvents = dateFilteredEvents.filter((e) => e.type.toUpperCase() === 'ERROR')
    const errorCount = errorEvents.length

    const counters = dateFilteredEvents
      .map((e) => e.counter)
      .filter((c) => typeof c === 'number' && c > 0)

    if (counters.length < 2) {
      return { label: '—', sub: 'sin datos', totalIntervalPages: 0, maxCounter: 0 }
    }

    const minC = counters.reduce((a, b) => Math.min(a, b))
    const maxC = counters.reduce((a, b) => Math.max(a, b))
    const counterRange = maxC - minC

    if (counterRange === 0) {
      return { label: '—', sub: 'sin rango', totalIntervalPages: 0, maxCounter: maxC }
    }

    if (errorCount === 0) {
      return {
        label: 'Sin err.',
        sub: 'no hay errores',
        totalIntervalPages: counterRange,
        maxCounter: maxC,
      }
    }

    const freq: Record<string, number> = {}
    for (const e of errorEvents) {
      freq[e.code] = (freq[e.code] ?? 0) + 1
    }
    const topCode = Object.entries(freq).reduce((a, b) => (b[1] > a[1] ? b : a))[0]

    const pagesPerError = Math.round(counterRange / errorCount)
    const label = pagesPerError >= 1 ? `1 c/${pagesPerError.toLocaleString('es-AR')} pág.` : `${errorCount} err.`

    return { label, sub: topCode, totalIntervalPages: counterRange, maxCounter: maxC }
  }, [dateFilteredEvents])

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Barra de Búsqueda */}
        {result && searchCollapsed ? (
          <TouchableOpacity
            onPress={() => setSearchCollapsed(false)}
            activeOpacity={0.7}
          >
            <GlassCard style={styles.searchCardCollapsed}>
              <View style={styles.collapsedSearchContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Search size={16} color={theme.colors.primary} />
                  <AppText style={styles.collapsedSearchText} numberOfLines={1}>
                    {searchMode === 'serial'
                      ? `Serie: ${currentSerial}`
                      : `${selectedClient?.name || 'Cliente'} (${selectedDevice?.serial || 'Serie'})`}
                  </AppText>
                </View>
                <AppText style={styles.collapsedSearchAction}>Editar</AppText>
              </View>
            </GlassCard>
          </TouchableOpacity>
        ) : (
          <GlassCard style={styles.searchCard}>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                onPress={() => setSearchMode('serial')}
                style={[styles.tab, searchMode === 'serial' && styles.tabActive]}
              >
                <AppText style={[styles.tabText, searchMode === 'serial' && styles.tabTextActive]}>
                  Buscar por Serie
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setSearchMode('client')
                  loadClientsIfNeeded()
                }}
                style={[styles.tab, searchMode === 'client' && styles.tabActive]}
              >
                <AppText style={[styles.tabText, searchMode === 'client' && styles.tabTextActive]}>
                  Buscar por Cliente
                </AppText>
              </TouchableOpacity>
            </View>

            {searchMode === 'serial' ? (
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
                  disabled={extracting || loading || !serial}
                >
                  {extracting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Search size={20} color="#fff" />
                  )}
                </ScalePressable>
              </View>
            ) : (
              <View style={styles.searchRow}>
                <View style={{ flex: 1, gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setClientSheetOpen(true)
                      loadClientsIfNeeded()
                    }}
                    style={styles.pickerButton}
                  >
                    <AppText style={selectedClient ? styles.pickerButtonTextActive : styles.pickerButtonText} numberOfLines={1}>
                      {selectedClient ? `${selectedClient.name} (${selectedClient.device_count} eq.)` : 'Seleccionar Cliente...'}
                    </AppText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      if (selectedClient) setDeviceSheetOpen(true)
                    }}
                    style={[styles.pickerButton, !selectedClient && styles.pickerButtonDisabled]}
                    disabled={!selectedClient}
                  >
                    <AppText style={selectedDevice ? styles.pickerButtonTextActive : styles.pickerButtonText} numberOfLines={1}>
                      {selectedDevice
                        ? `${selectedDevice.serial}${selectedDevice.model ? ` - ${selectedDevice.model}` : ''}`
                        : 'Seleccionar Equipo/Serie...'}
                    </AppText>
                  </TouchableOpacity>
                </View>

                <ScalePressable
                  onPress={handleSdsSearch}
                  style={[styles.searchBtn, { height: 96 }]}
                  disabled={extracting || loading || !serial}
                >
                  {extracting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Search size={20} color="#fff" />
                  )}
                </ScalePressable>
              </View>
            )}
          </GlassCard>
        )}

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
                value={lastErrorEvent?.code ?? '—'}
                icon={<AlertTriangle size={16} color={theme.colors.error} />}
                accentColor={theme.colors.error}
                subtitle={
                  lastErrorEvent ? (
                    <View>
                      {lastErrorEvent.code_description ? (
                        <AppText style={styles.kpiSubtext} numberOfLines={1}>
                          {lastErrorEvent.code_description}
                        </AppText>
                      ) : null}
                      <AppText style={styles.kpiTimestamp}>
                        {lastErrorLabel}
                      </AppText>
                    </View>
                  ) : (
                    'No se registraron errores'
                  )
                }
              />
              <KPICard
                title="ERRORES CRÍTICOS"
                value={errorIncidents.length}
                icon={<ShieldAlert size={16} color={theme.colors.error} />}
                accentColor={theme.colors.error}
                subtitle={`Alertas menores: ${warningCount} advert. · ${infoCount} info`}
              />
              <KPICard
                title="INCIDENCIAS ACTIVAS"
                value={dateFilteredIncidents.length}
                icon={<Cpu size={16} color={theme.colors.warning} />}
                accentColor={theme.colors.warning}
                subtitle="en el período"
              />
              <KPICard
                title="TASA DE ERRORES"
                value={errorRateData.label}
                icon={<TrendingDown size={16} color={theme.colors.info} />}
                accentColor={theme.colors.info}
                subtitle={
                  <View>
                    {errorRateData.sub ? (
                      <AppText style={styles.kpiSubtext} numberOfLines={1}>
                        {errorRateData.sub}
                      </AppText>
                    ) : null}
                    {errorRateData.totalIntervalPages > 0 ? (
                      <AppText style={styles.kpiInterval}>
                        En período: <AppText style={{ fontFamily: theme.fontFamily.bold, fontSize: 8.5 }}>{errorRateData.totalIntervalPages.toLocaleString('es-AR')}</AppText> págs.
                      </AppText>
                    ) : null}
                    {errorRateData.maxCounter > 0 ? (
                      <AppText style={styles.kpiInterval}>
                        Contador total: <AppText style={{ fontFamily: theme.fontFamily.bold, fontSize: 8.5 }}>{errorRateData.maxCounter.toLocaleString('es-AR')}</AppText> págs.
                      </AppText>
                    ) : null}
                  </View>
                }
              />
            </ScrollView>

            {/* Filtros de severidad */}
            <SeverityFilter active={activeSeverities} onToggle={handleSeverityToggle} />

            {/* Buscador de texto y selector de fecha */}
            <GlassCard style={styles.detailedFiltersCard}>
              <View style={styles.detailedSearchRow}>
                <View style={styles.searchFieldWrapper}>
                  <Search size={16} color={theme.colors.textDim} style={styles.searchFieldIcon} />
                  <TextInput
                    style={styles.detailedSearchInput}
                    placeholder="Buscar código o clasificación..."
                    placeholderTextColor={theme.colors.textDim}
                    value={textFilter}
                    onChangeText={setTextFilter}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {textFilter.length > 0 && (
                    <TouchableOpacity onPress={() => setTextFilter('')} style={styles.clearBtn}>
                      <X size={14} color={theme.colors.textDim} />
                    </TouchableOpacity>
                  )}
                </View>
                
                <TouchableOpacity
                  onPress={() => setDateSheetOpen(true)}
                  style={styles.dateFilterBtn}
                >
                  <Calendar size={16} color={theme.colors.primary} />
                  <AppText style={styles.dateFilterBtnText} numberOfLines={1}>
                    {dateButtonLabel}
                  </AppText>
                </TouchableOpacity>
              </View>
            </GlassCard>

            {/* Carrusel de Gráficos Deslizables (Volumen, Top Errores, Heatmap) */}
            <Animated.View entering={FadeInDown.delay(100).duration(350)}>
              <ChartsCarousel
                events={dateFilteredEvents}
                topCodes={topCodes}
                activeSeverities={activeSeverities}
                onPressError={(code) => {
                  setSelectedErrorCode(code)
                  setSolutionSheetOpen(true)
                }}
              />
            </Animated.View>

            {/* Panel de Diagnóstico IA */}
            {!aiResult && !aiLoading && (
              <GlassCard style={styles.iaCard}>
                <View style={styles.iaHeader}>
                  <View style={styles.iaDot} />
                  <AppText style={styles.iaTitle}>✨ Diagnóstico con IA (Recomendado)</AppText>
                </View>
                <ScalePressable onPress={handleAiDiagnose} style={styles.iaButtonPressable}>
                  <View style={[styles.iaButton, { backgroundColor: theme.colors.primary }]}>
                    <AppText style={styles.iaButtonText}>Consultar Copiloto Técnico</AppText>
                  </View>
                </ScalePressable>
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
                        setSelectedErrorCode(code)
                        setSolutionSheetOpen(true)
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

            {/* Alertas del portal SDS */}
            {currentSerial && (insightData || insightLoading || insightError) && (
              <CollapsibleSection
                title={`Alertas del portal SDS${currentSerial ? ` - ${currentSerial}` : ''}`}
                icon="🔔"
                badge={insightData ? `${(insightData.current?.length || 0) + (insightData.history?.length || 0)}` : undefined}
              >
                <InsightAlertsPanel
                  data={insightData}
                  loading={insightLoading}
                  error={insightError}
                />
              </CollapsibleSection>
            )}

          </View>
        )}
      </ScrollView>

      {/* Detalle de Solución Técnica */}
      <SolutionBottomSheet
        isOpen={solutionSheetOpen}
        onClose={() => setSolutionSheetOpen(false)}
        code={selectedErrorCode}
      />

      {/* Selector de Cliente */}
      <SelectionBottomSheet
        isOpen={clientSheetOpen}
        onClose={() => setClientSheetOpen(false)}
        title="Seleccionar Cliente"
        searchTermPlaceholder="Buscar por nombre..."
        items={clients.map(c => ({ id: c.id, name: c.name, detail: `${c.device_count} equipos` }))}
        onSelect={handleClientChange}
        loading={loadingClients}
      />

      {/* Selector de Dispositivo */}
      <SelectionBottomSheet
        isOpen={deviceSheetOpen}
        onClose={() => setDeviceSheetOpen(false)}
        title="Seleccionar Equipo/Serie"
        searchTermPlaceholder="Buscar serie o modelo..."
        items={devices.map(d => ({
          id: d.serial,
          name: d.serial,
          detail: `${d.model ? `${d.model} · ` : ''}${d.location || ''}`
        }))}
        onSelect={handleDeviceChange}
        loading={loadingDevices}
      />

      {/* Selector de Fecha */}
      <SelectionBottomSheet
        isOpen={dateSheetOpen}
        onClose={() => setDateSheetOpen(false)}
        title="Filtrar por Fecha"
        searchTermPlaceholder="Buscar fecha o período..."
        items={dateItems}
        onSelect={handleDateSelect}
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
  searchCardCollapsed: {
    marginBottom: theme.spacing.md,
  },
  collapsedSearchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  collapsedSearchText: {
    color: theme.colors.text,
    fontSize: 13,
    fontFamily: theme.fontFamily.semibold,
    flex: 1,
  },
  collapsedSearchAction: {
    color: theme.colors.primary,
    fontSize: 12,
    fontFamily: theme.fontFamily.bold,
    textTransform: 'uppercase',
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: theme.radius.md,
    padding: 3,
    marginBottom: theme.spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.radius.sm,
  },
  tabActive: {
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabText: {
    fontSize: 12,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.textMuted,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.bold,
  },
  pickerButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    height: 44,
    justifyContent: 'center',
  },
  pickerButtonDisabled: {
    opacity: 0.4,
  },
  pickerButtonText: {
    color: theme.colors.textDim,
    fontSize: 13,
    fontFamily: theme.fontFamily.regular,
  },
  pickerButtonTextActive: {
    color: theme.colors.text,
    fontSize: 13,
    fontFamily: theme.fontFamily.semibold,
  },
  detailedFiltersCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.sm,
  },
  detailedSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchFieldWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: 10,
    height: 40,
  },
  searchFieldIcon: {
    marginRight: 6,
  },
  detailedSearchInput: {
    flex: 1,
    color: theme.colors.text,
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    height: '100%',
    padding: 0,
  },
  clearBtn: {
    padding: 4,
  },
  dateFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: 10,
    height: 40,
    gap: 6,
    maxWidth: 150,
  },
  dateFilterBtnText: {
    color: theme.colors.text,
    fontSize: 12,
    fontFamily: theme.fontFamily.semibold,
  },
  kpiSubtext: {
    color: theme.colors.textMuted,
    fontSize: 9,
    fontFamily: theme.fontFamily.regular,
    marginBottom: 2,
  },
  kpiTimestamp: {
    color: theme.colors.textDim,
    fontSize: 9,
    fontFamily: theme.fontFamily.regular,
  },
  kpiInterval: {
    color: theme.colors.textDim,
    fontSize: 8.5,
    fontFamily: theme.fontFamily.regular,
    marginTop: 1,
  },
})
