import React, { useState, useEffect } from 'react'
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { AppText } from '../components/AppText'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RefreshCw, Send, Hammer } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { GlassCard } from '../components/GlassCard'
import { ConsumableBar } from '../components/ConsumableBar'
import { getMaintenanceDevices, getMaintenanceModelRules } from '../services/api'
import { theme } from '../theme'
import type { MaintenanceDevice, MaintenanceModelRule } from '../types/api'

const MOCK_HISTORY: { id: string; date: string; component: string; desc: string; tech: string; incident: string; tone: 'success' | 'info' }[] = [
  { id: 'h1', date: '10/05/2026', component: 'Fuser Kit', desc: 'reemplazado a las 150,000 páginas.', tech: 'Juan Pérez', incident: 'INC-9988', tone: 'success' },
  { id: 'h2', date: '02/02/2026', component: 'Roller Kit', desc: 'reemplazado preventivamente a las 140,000 páginas.', tech: 'Ana Gómez', incident: 'INC-9750', tone: 'info' },
  { id: 'h3', date: '15/11/2025', component: 'Fuser Kit', desc: 'instalación inicial del kit de fusión.', tech: 'Equipo de Instalación', incident: 'INC-9001', tone: 'info' },
]

export function MaintenanceScreen() {
  const insets = useSafeAreaInsets()
  const [devices, setDevices] = useState<MaintenanceDevice[]>([])
  const [rules, setRules] = useState<MaintenanceModelRule[]>([])
  const [selectedDevice, setSelectedDevice] = useState<MaintenanceDevice | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const devs = await getMaintenanceDevices()
      setDevices(devs)
      if (devs.length > 0) {
        setSelectedDevice(devs[0])
        const modelRules = await getMaintenanceModelRules(devs[0].model_family || 'M608')
        setRules(modelRules)
      }
    } catch {
      // Mock de contingencia
      const mockDevs: MaintenanceDevice[] = [
        { serial: 'CNB1H99887', model_family: 'HP LaserJet M608', last_sync_counter: 180000, is_active: true },
        { serial: 'CNB1H55443', model_family: 'HP Color LaserJet E60055', last_sync_counter: 125000, is_active: true }
      ]
      setDevices(mockDevs)
      setSelectedDevice(mockDevs[0])
      setRules([
        { model_family: 'HP LaserJet M608', component_type: 'Fuser Kit', expected_life: 200000, alert_margin: 20000 },
        { model_family: 'HP LaserJet M608', component_type: 'Roller Kit', expected_life: 150000, alert_margin: 15000 }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleRecordChange = (componentType: string) => {
    Alert.alert(
      'Registrar Cambio',
      `¿Deseas registrar el cambio y reiniciar el ciclo de vida del componente "${componentType}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => Alert.alert('Éxito', 'Cambio registrado y ciclo reiniciado.') }
      ]
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Dispositivos en Mantenimiento */}
        <AppText style={styles.sectionTitle}>Dispositivos en Monitoreo</AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.deviceScroll}>
          {devices.map((d) => (
            <TouchableOpacity
              key={d.serial}
              style={[
                styles.deviceBtn,
                selectedDevice?.serial === d.serial && styles.activeDeviceBtn,
              ]}
              onPress={() => setSelectedDevice(d)}
            >
              <AppText style={[styles.deviceBtnText, selectedDevice?.serial === d.serial && styles.activeDeviceBtnText]}>
                {d.serial} ({d.model_family})
              </AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : selectedDevice ? (
          <View style={styles.detailContainer}>

            {/* Estado de los Consumibles */}
            <GlassCard style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <AppText style={styles.cardTitle}>Componentes de Mantenimiento</AppText>
                <TouchableOpacity onPress={loadData} style={styles.syncBtn}>
                  <RefreshCw size={14} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>

              {rules.map((rule, idx) => {
                // Cálculo simple de porcentaje restante simulado
                const remainingPages = rule.expected_life - (selectedDevice.last_sync_counter % rule.expected_life)
                const pct = Math.round((remainingPages / rule.expected_life) * 100)

                return (
                  <Animated.View key={rule.component_type} entering={FadeInDown.delay(idx * 60).duration(350)} style={styles.ruleBarContainer}>
                    <ConsumableBar
                      label={rule.component_type}
                      percentage={pct}
                      subtitle={`Esperado: ${rule.expected_life.toLocaleString()} pág. · Restante: ${remainingPages.toLocaleString()}`}
                    />

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleRecordChange(rule.component_type)}
                      >
                        <Hammer size={12} color="#fff" />
                        <AppText style={styles.actionBtnText}>Registrar Cambio</AppText>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionBtn, styles.alertBtn]}>
                        <Send size={12} color="#fff" />
                        <AppText style={styles.actionBtnText}>Enviar Alerta</AppText>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                )
              })}
            </GlassCard>

            {/* Historial */}
            <AppText style={styles.sectionTitle}>Historial de Intervenciones</AppText>
            <GlassCard>
              {MOCK_HISTORY.map((item, idx) => {
                const nodeColor = item.tone === 'success' ? theme.colors.success : theme.colors.primary
                const isLast = idx === MOCK_HISTORY.length - 1
                return (
                  <Animated.View key={item.id} entering={FadeInDown.delay(idx * 60).duration(350)} style={styles.timelineRow}>
                    <View style={styles.timelineMarkerColumn}>
                      <View style={[styles.timelineNode, { backgroundColor: nodeColor }]} />
                      {!isLast && <View style={styles.timelineLine} />}
                    </View>
                    <View style={[styles.timelineContent, isLast && styles.timelineContentLast]}>
                      <AppText style={styles.historyDate}>{item.date}</AppText>
                      <AppText style={styles.historyDesc}>
                        <AppText style={styles.historyComponent}>{item.component}</AppText> {item.desc}
                      </AppText>
                      <AppText style={styles.historyTech}>Téc: {item.tech} · Incidente #{item.incident}</AppText>
                    </View>
                  </Animated.View>
                )
              })}
            </GlassCard>

          </View>
        ) : null}

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
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: theme.fontFamily.bold,
    marginBottom: theme.spacing.sm,
  },
  deviceScroll: {
    paddingBottom: theme.spacing.md,
  },
  deviceBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceLight,
    borderColor: theme.colors.border,
    borderWidth: 1,
    marginRight: 8,
  },
  activeDeviceBtn: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  deviceBtnText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: theme.fontFamily.semibold,
  },
  activeDeviceBtnText: {
    color: '#fff',
  },
  detailContainer: {
    marginTop: theme.spacing.sm,
  },
  sectionCard: {
    marginBottom: theme.spacing.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: theme.fontFamily.bold,
  },
  syncBtn: {
    padding: 6,
  },
  ruleBarContainer: {
    marginBottom: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: theme.spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
    gap: 4,
  },
  alertBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: theme.fontFamily.bold,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineMarkerColumn: {
    width: 20,
    alignItems: 'center',
  },
  timelineNode: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    borderLeftColor: theme.colors.border,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  timelineContentLast: {
    paddingBottom: 0,
  },
  historyDate: {
    color: theme.colors.textDim,
    fontSize: 10,
    marginBottom: 2,
  },
  historyDesc: {
    color: theme.colors.text,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  historyComponent: {
    fontFamily: theme.fontFamily.bold,
  },
  historyTech: {
    color: theme.colors.textMuted,
    fontSize: 10,
  },
})
export default MaintenanceScreen
