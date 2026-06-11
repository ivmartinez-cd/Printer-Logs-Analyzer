import React, { useState, useEffect } from 'react'
import { StyleSheet, View, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { AppText } from '../components/AppText'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ShieldAlert, Layers, RefreshCw } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from 'react-native-reanimated'
import { GlassCard } from '../components/GlassCard'
import { listFleetClients, getFleetClient } from '../services/api'
import { theme } from '../theme'
import type { FleetClientSummary, FleetDeviceSummary } from '../types/api'

const MOCK_CLIENTS: FleetClientSummary[] = [
  { id: '1', name: 'Cliente Principal A', device_count: 5 },
  { id: '2', name: 'Corporación Médica Sur', device_count: 3 },
]

const MOCK_DEVICES: FleetDeviceSummary[] = [
  { serial: 'CNB1H99887', location: 'Piso 3 - Oficina Principal', model: 'HP Color LaserJet E60055' },
  { serial: 'CNB1H55443', location: 'Planta Baja - Recepción', model: 'HP LaserJet E60165' },
]

const MOCK_ALERTS: { id: string; model: string; severity: 'CRITICAL' | 'WARNING'; description: string; time: string }[] = [
  {
    id: 'a1',
    model: 'HP Color LaserJet E60055',
    severity: 'CRITICAL',
    description: 'Advertencia de ciclo de vida: Unidad Fusora por debajo del 5% de vida útil (Fuser Kit).',
    time: 'Hace 2 horas · Serial: CNB1H99887',
  },
  {
    id: 'a2',
    model: 'HP LaserJet E60165',
    severity: 'WARNING',
    description: 'Código 48.01.05: Error de comunicación interno del motor de la platina.',
    time: 'Ayer · Serial: CNB1H55443',
  },
]

// Indicador pulsante para alertas críticas
function PulseDot({ color }: { color: string }) {
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)

  useEffect(() => {
    scale.value = withRepeat(withTiming(1.8, { duration: 1000, easing: Easing.out(Easing.ease) }), -1, false)
    opacity.value = withRepeat(withTiming(0, { duration: 1000, easing: Easing.out(Easing.ease) }), -1, false)
  }, [opacity, scale])

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <View style={styles.pulseDotContainer}>
      <View style={[styles.pulseDotCore, { backgroundColor: color }]} />
      <Animated.View style={[styles.pulseDotRing, { backgroundColor: color }, ringStyle]} />
    </View>
  )
}

// Pill de selección de cliente con cristal y degradado activo
function ClientPill({ client, active, onPress }: { client: FleetClientSummary; active: boolean; onPress: () => void }) {
  const opacity = useSharedValue(active ? 1 : 0)

  useEffect(() => {
    opacity.value = withTiming(active ? 1 : 0, { duration: 250 })
  }, [active, opacity])

  const gradientStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Pressable onPress={onPress} style={styles.clientBtn}>
      <Animated.View style={[StyleSheet.absoluteFill, gradientStyle]}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <AppText style={[styles.clientBtnText, active && styles.activeClientBtnText]}>
        {client.name} ({client.device_count})
      </AppText>
    </Pressable>
  )
}

function getSeverityColor(severity: string): string {
  if (severity === 'CRITICAL') return theme.colors.error
  if (severity === 'WARNING') return theme.colors.warning
  return theme.colors.info
}

export function MonitorScreen() {
  const insets = useSafeAreaInsets()
  const [clients, setClients] = useState<FleetClientSummary[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'alerts' | 'devices'>('alerts')
  const [devices, setDevices] = useState<FleetDeviceSummary[]>(MOCK_DEVICES)
  const [devicesLoading, setDevicesLoading] = useState(false)

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    if (!selectedClientId) return
    loadDevices(selectedClientId)
  }, [selectedClientId])

  const loadClients = async () => {
    setLoading(true)
    try {
      const data = await listFleetClients()
      setClients(data)
      if (data.length > 0) {
        setSelectedClientId(data[0].id)
      }
    } catch {
      setClients(MOCK_CLIENTS)
      setSelectedClientId(MOCK_CLIENTS[0].id)
    } finally {
      setLoading(false)
    }
  }

  const loadDevices = async (clientId: string) => {
    setDevicesLoading(true)
    try {
      const detail = await getFleetClient(clientId)
      setDevices(detail.devices.length > 0 ? detail.devices : MOCK_DEVICES)
    } catch {
      setDevices(MOCK_DEVICES)
    } finally {
      setDevicesLoading(false)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Selector de Cliente en horizontal */}
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle}>Seleccionar Cliente de Flota</AppText>
          <Pressable onPress={loadClients} style={styles.refreshBtn}>
            <RefreshCw size={14} color={theme.colors.textMuted} />
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.clientScroll}
        >
          {clients.map((cli) => (
            <ClientPill
              key={cli.id}
              client={cli}
              active={selectedClientId === cli.id}
              onPress={() => setSelectedClientId(cli.id)}
            />
          ))}
        </ScrollView>

        {/* Pestañas de Vista */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tab, activeTab === 'alerts' && styles.activeTab]}
            onPress={() => setActiveTab('alerts')}
          >
            <ShieldAlert size={16} color={activeTab === 'alerts' ? theme.colors.primary : theme.colors.textMuted} />
            <AppText style={[styles.tabText, activeTab === 'alerts' && styles.activeTabText]}>Alertas</AppText>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'devices' && styles.activeTab]}
            onPress={() => setActiveTab('devices')}
          >
            <Layers size={16} color={activeTab === 'devices' ? theme.colors.primary : theme.colors.textMuted} />
            <AppText style={[styles.tabText, activeTab === 'devices' && styles.activeTabText]}>Equipos</AppText>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.content}>
            {activeTab === 'alerts' ? (
              <View>
                {MOCK_ALERTS.map((alert, idx) => {
                  const sevColor = getSeverityColor(alert.severity)
                  return (
                    <Animated.View key={alert.id} entering={FadeInDown.delay(idx * 60).duration(350)}>
                      <GlassCard style={[styles.alertCard, { borderLeftWidth: 3, borderLeftColor: sevColor }]}>
                        <View style={styles.alertHeader}>
                          <AppText style={styles.alertModel} numberOfLines={1}>{alert.model}</AppText>
                          <View style={styles.alertSeverityRow}>
                            {alert.severity === 'CRITICAL' && <PulseDot color={sevColor} />}
                            <AppText style={[styles.alertSeverity, { color: sevColor }]}>{alert.severity}</AppText>
                          </View>
                        </View>
                        <AppText style={styles.alertDesc}>{alert.description}</AppText>
                        <AppText style={styles.alertTime}>{alert.time}</AppText>
                      </GlassCard>
                    </Animated.View>
                  )
                })}
              </View>
            ) : (
              <View>
                {devicesLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 20 }} />
                ) : (
                  devices.map((dev, idx) => (
                    <Animated.View key={dev.serial} entering={FadeInDown.delay(idx * 60).duration(350)}>
                      <GlassCard style={styles.deviceRow}>
                        <AppText style={styles.deviceSerial}>{dev.serial}</AppText>
                        <AppText style={styles.deviceModel}>{dev.model ?? 'Modelo no especificado'}</AppText>
                        <AppText style={styles.deviceLoc}>{dev.location}</AppText>
                      </GlassCard>
                    </Animated.View>
                  ))
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: theme.fontFamily.bold,
  },
  refreshBtn: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceLight,
    borderColor: theme.colors.border,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientScroll: {
    paddingBottom: theme.spacing.md,
  },
  clientBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceLight,
    borderColor: theme.colors.border,
    borderWidth: 1,
    marginRight: 8,
    overflow: 'hidden',
  },
  clientBtnText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: theme.fontFamily.semibold,
  },
  activeClientBtnText: {
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 4,
    marginBottom: theme.spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
  },
  activeTab: {
    backgroundColor: theme.colors.surfaceLight,
  },
  tabText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontFamily: theme.fontFamily.semibold,
  },
  activeTabText: {
    color: theme.colors.text,
  },
  content: {
    marginTop: theme.spacing.sm,
  },
  alertCard: {
    marginBottom: theme.spacing.md,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  alertModel: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: theme.fontFamily.bold,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  alertSeverityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertSeverity: {
    fontSize: 11,
    fontFamily: theme.fontFamily.bold,
  },
  alertDesc: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  alertTime: {
    color: theme.colors.textDim,
    fontSize: 10,
  },
  deviceRow: {
    marginBottom: theme.spacing.sm,
  },
  deviceSerial: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: theme.fontFamily.bold,
  },
  deviceModel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  deviceLoc: {
    color: theme.colors.textDim,
    fontSize: 10,
    marginTop: 2,
  },
  pulseDotContainer: {
    width: 8,
    height: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseDotCore: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pulseDotRing: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
})
