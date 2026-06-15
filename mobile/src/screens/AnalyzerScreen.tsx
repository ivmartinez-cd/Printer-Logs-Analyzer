import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { StyleSheet, View, ScrollView, TextInput, ActivityIndicator, Alert, TouchableOpacity, Linking, BackHandler, Share } from 'react-native'
import { AppText } from '../components/AppText'
import { Search, ShieldAlert, Cpu, TrendingDown, AlertTriangle, Calendar, X, Globe, ArrowLeft, ScanLine, Share2 } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useCameraPermissions } from 'expo-camera'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useAnalysisStore } from '../store/useAnalysisStore'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useToast } from '../hooks/useToast'
import { useDateFilter } from '../hooks/useDateFilter'
import { useAnalyzerKpis } from '../hooks/useAnalyzerKpis'
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
import { ScalePressable } from '../components/ScalePressable'
import { BarcodeScannerModal } from '../components/BarcodeScannerModal'
import { SelectionBottomSheet } from '../components/SelectionBottomSheet'
import { extractSdsLogs, aiDiagnose, listFleetClients, getFleetClient, getInsightAlerts, getRemoteEwsAccess } from '../services/api'
import { theme } from '../theme'
import type { AIDiagnosisResponse, RealtimeConsumable, FleetClientSummary, FleetDeviceSummary, DeviceAlertsResponse } from '../types/api'
import { useFocusEffect } from '@react-navigation/native'
import { styles } from './AnalyzerScreen.styles'

export function AnalyzerScreen({ route }: any) {
  const isOnline = useOnlineStatus()
  const toast = useToast()
  const insets = useSafeAreaInsets()

  const { result, loading, handleAnalyze, setResult } = useAnalysisStore()

  const [serial, setSerial] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)

  // Barcode scanner states
  const [scannerOpen, setScannerOpen] = useState(false)
  const [cameraPermission, requestCameraPermission] = useCameraPermissions()
  const scanProcessed = useRef(false)
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

  // AI diagnosis state
  const [aiResult, setAiResult] = useState<AIDiagnosisResponse | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

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
  const [loadingRemoteEws, setLoadingRemoteEws] = useState(false)

  // Text search filter inside detailed analysis
  const [textFilter, setTextFilter] = useState('')

  // Severity filter state
  const [activeSeverities, setActiveSeverities] = useState<Set<string>>(new Set(['ERROR', 'WARNING', 'INFO']))

  const incidents = result?.incidents ?? []
  const events = result?.events ?? []

  // Filtro de fecha (estado + presets + datos filtrados por rango)
  const {
    selectedDate,
    setSelectedDate,
    handleDateSelect,
    dateItems,
    dateButtonLabel,
    dateFilteredIncidents,
    dateFilteredEvents,
  } = useDateFilter(incidents, events)

  const [dateSheetOpen, setDateSheetOpen] = useState(false)

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

  // Búsqueda automática vía SDS (única implementación para input, scanner y deep-link)
  const runSdsSearch = useCallback(async (rawSerial: string) => {
    const trimmed = rawSerial.trim().toUpperCase()
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
  }, [isOnline, toast, handleAnalyze, setSelectedDate])

  const handleSdsSearch = useCallback(() => { void runSdsSearch(serial) }, [runSdsSearch, serial])

  // Autodisparar búsqueda si se ingresa por Deep Link (ej: hplogs://analyze/CNB1H23456)
  const routeSerial = route?.params?.serial
  useEffect(() => {
    if (routeSerial) {
      const trimmed = routeSerial.trim().toUpperCase()
      setSerial(trimmed)
      const timer = setTimeout(() => { void runSdsSearch(trimmed) }, 300)
      return () => clearTimeout(timer)
    }
  }, [routeSerial, runSdsSearch])

  const handleGoBack = useCallback(() => {
    setResult(null)
    setSearchCollapsed(false)
    setSerial('')
    setSelectedClient(null)
    setSelectedDevice(null)
    setDevices([])
    setConsumables([])
    setCurrentModelName(null)
    setCurrentSerial(null)
    setInsightData(null)
    setInsightError(null)
    setAiResult(null)
    setAiError(null)
    setTextFilter('')
    setSelectedDate(null)
    return true
  }, [setResult, setSelectedDate])

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (result) {
          handleGoBack()
          return true
        } else {
          Alert.alert(
            'Salir de la app',
            '¿Estás seguro de que quieres salir?',
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => { } },
              {
                text: 'Salir',
                style: 'destructive',
                onPress: () => {
                  setTimeout(() => {
                    BackHandler.exitApp()
                  }, 100)
                }
              }
            ]
          )
          return true
        }
      }

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress)
      return () => backHandler.remove()
    }, [result, handleGoBack])
  )

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
    setSerial(device ? device.serial : '')
  }

  // Barcode scanner handlers
  const handleOpenScanner = async () => {
    if (!cameraPermission?.granted) {
      const res = await requestCameraPermission()
      if (!res.granted) {
        toast.showError('Se necesita permiso de cámara para escanear códigos de barras.')
        return
      }
    }
    scanProcessed.current = false
    setScannerOpen(true)
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanProcessed.current) return
    scanProcessed.current = true
    const scanned = data.trim().toUpperCase()
    setScannerOpen(false)
    setSerial(scanned)
    // Auto-trigger search after a small delay to let state settle
    setTimeout(() => { void runSdsSearch(scanned) }, 100)
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

  const handleRemoteEws = async () => {
    if (!currentSerial) return
    setLoadingRemoteEws(true)
    try {
      const res = await getRemoteEwsAccess(currentSerial)
      if (res.ews_url) {
        await Linking.openURL(res.ews_url)
      } else {
        toast.showError('No se recibió la URL de EWS Remoto.')
      }
    } catch (err: any) {
      toast.showError(err.message || 'Error al obtener acceso a EWS Remoto')
    } finally {
      setLoadingRemoteEws(false)
    }
  }

  const handleShareReport = async () => {
    if (!result) return

    let shareText = `📋 REPORTE DE ANÁLISIS DE IMPRESORA HP\n`
    if (currentSerial) shareText += `Número de Serie: ${currentSerial}\n`
    if (currentModelName) shareText += `Modelo: ${currentModelName}\n`
    shareText += `------------------------------------\n`
    shareText += `Severidad Global: ${result.global_severity}\n`
    shareText += `Eventos Analizados: ${result.events.length}\n`
    shareText += `Incidencias Detectadas: ${result.incidents.length}\n\n`

    if (aiResult) {
      shareText += `✨ DIAGNÓSTICO COPILOTO IA:\n`
      shareText += `${aiResult.diagnosis || 'Sin diagnóstico detallado.'}\n\n`
    } else {
      shareText += `Incidencias Críticas:\n`
      const criticals = result.incidents.filter(i => i.severity.toUpperCase() === 'ERROR')
      if (criticals.length > 0) {
        criticals.forEach((c) => {
          shareText += `- Código: ${c.code} (${c.occurrences} veces)\n`
        })
      } else {
        shareText += `- Ningún error crítico detectado.\n`
      }
    }

    try {
      await Share.share({
        message: shareText,
        title: `Reporte Analizador HP - ${currentSerial || 'Impresora'}`
      })
    } catch (err: any) {
      toast.showError('Error al compartir el reporte: ' + err.message)
    }
  }

  // Filtros por severidad y texto (sobre los datos ya filtrados por fecha)
  const filteredIncidents = useMemo(() => {
    return dateFilteredIncidents.filter(i => {
      if (!activeSeverities.has(i.severity.toUpperCase())) return false
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
      if (!activeSeverities.has(e.type.toUpperCase())) return false
      if (textFilter.trim()) {
        const q = textFilter.toLowerCase().trim()
        const code = (e.code ?? '').toLowerCase()
        const desc = (e.code_description ?? '').toLowerCase()
        if (!code.includes(q) && !desc.includes(q)) return false
      }
      return true
    })
  }, [dateFilteredEvents, activeSeverities, textFilter])

  // KPIs del panel de errores
  const {
    errorIncidents,
    warningCount,
    infoCount,
    lastErrorEvent,
    lastErrorLabel,
    topCodes,
    errorRateData,
  } = useAnalyzerKpis(dateFilteredIncidents, dateFilteredEvents)

  // Callback estable: abrir la solución de un código (memoizado para no romper React.memo)
  const handleOpenSolution = useCallback((code: string) => {
    setSelectedErrorCode(code)
    setSolutionSheetOpen(true)
  }, [])

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#081c30', '#06080c', '#030508']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.85 }}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          !result && { flexGrow: 1, justifyContent: 'center' }
        ]}
      >

        {/* Barra de Búsqueda */}
        {!loading && (result && searchCollapsed ? (
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
          <>
            {!result && (
              <View style={styles.initialHeaderContainer}>
                <View style={styles.initialLogoRow}>
                  <AppText style={styles.initialHeaderMain}>HP Logs </AppText>
                  <AppText style={styles.initialHeaderSuffix}>ANALYZER</AppText>
                </View>
                <AppText style={styles.initialSubtitle}>
                  Análisis técnico avanzado de logs HP con detección inteligente de errores y estado de hardware en tiempo real.
                </AppText>
              </View>
            )}

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

                  <ScalePressable
                    onPress={handleOpenScanner}
                    style={styles.scanBtn}
                    disabled={extracting || loading}
                    accessibilityLabel="Escanear código de barras"
                    accessibilityRole="button"
                  >
                    <ScanLine size={20} color={theme.colors.primary} />
                  </ScalePressable>

                  <ScalePressable
                    onPress={handleSdsSearch}
                    style={styles.searchBtn}
                    disabled={extracting || loading || !serial}
                    accessibilityLabel="Buscar"
                    accessibilityRole="button"
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
                    accessibilityLabel="Buscar"
                    accessibilityRole="button"
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
          </>
        ))}

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

            {/* Custom Top Bar for Navigation */}
            <View style={styles.resultsHeaderBar}>
              <TouchableOpacity
                onPress={handleGoBack}
                style={styles.backBtn}
                accessibilityLabel="Volver al buscador"
                accessibilityRole="button"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ArrowLeft size={20} color={theme.colors.text} />
              </TouchableOpacity>
              <View style={styles.resultsHeaderTitleRow}>
                <AppText style={styles.resultsLogoMain}>HP Logs </AppText>
                <AppText style={styles.resultsLogoSuffix}>ANALYZER</AppText>
              </View>
              <TouchableOpacity
                onPress={handleShareReport}
                style={styles.backBtn}
                accessibilityLabel="Compartir reporte"
                accessibilityRole="button"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Share2 size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Header del Panel */}
            <View style={styles.panelHeaderRow}>
              <View style={{ flex: 1 }}>
                <AppText style={styles.panelTitle}>Panel de errores</AppText>
                {(currentModelName || currentSerial) && (
                  <AppText style={styles.panelMeta}>
                    {currentModelName}{currentSerial ? ` · ${currentSerial}` : ''}
                  </AppText>
                )}
              </View>
              {currentSerial && (
                <TouchableOpacity
                  onPress={handleRemoteEws}
                  disabled={loadingRemoteEws}
                  style={styles.ewsButton}
                  activeOpacity={0.7}
                  hitSlop={{ top: 9, bottom: 9, left: 6, right: 6 }}
                >
                  {loadingRemoteEws ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Globe size={14} color="#fff" />
                      <AppText style={styles.ewsButtonText}>EWS Remoto</AppText>
                    </>
                  )}
                </TouchableOpacity>
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
                    <TouchableOpacity
                      onPress={() => setTextFilter('')}
                      style={styles.clearBtn}
                      hitSlop={{ top: 11, bottom: 11, left: 11, right: 11 }}
                      accessibilityLabel="Limpiar búsqueda"
                      accessibilityRole="button"
                    >
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
                onPressError={handleOpenSolution}
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
                      onPressSolution={handleOpenSolution}
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

      {/* Scanner Modal */}
      <BarcodeScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanned={handleBarCodeScanned}
        paused={scanProcessed.current}
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
