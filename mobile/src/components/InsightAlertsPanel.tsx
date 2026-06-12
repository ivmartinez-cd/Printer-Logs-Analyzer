import React, { useState } from 'react'
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native'
import { AppText } from './AppText'
import { theme } from '../theme'
import type { DeviceAlertsResponse, InsightAlert } from '../types/api'

interface InsightAlertsPanelProps {
  data: DeviceAlertsResponse | null
  loading: boolean
  error: string | null
}

const MAX_ALERTS = 30

const ALERT_CLASS_LABEL: Record<string, string> = {
  SYSTEM_WARNING: 'Sistema',
  OTHER: 'Otro',
  SUPPLY: 'Consumible',
  PAPER_JAM: 'Atasco',
  OFFLINE: 'Sin conexión',
  DOOR_OPEN: 'Puerta abierta',
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function InsightAlertsPanel({ data, loading, error }: InsightAlertsPanelProps) {
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current')

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <AppText style={styles.loadingText}>Consultando portal HP SDS...</AppText>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <AppText style={styles.errorText}>⚠️ {error}</AppText>
      </View>
    )
  }

  if (!data || !data.insight_configured) {
    return (
      <View style={styles.centerContainer}>
        <AppText style={styles.infoText}>El servicio de telemetría HP Insight no está configurado para este equipo.</AppText>
      </View>
    )
  }

  const currentAlerts = data.current || []
  const historyAlerts = data.history || []
  const alerts = activeTab === 'current' ? currentAlerts : historyAlerts

  return (
    <View style={styles.container}>
      {/* Meta info if available */}
      {(data.model || data.zone) && (
        <View style={styles.metaRow}>
          {data.model && <AppText style={styles.metaText}>📠 {data.model}</AppText>}
          {data.zone && <AppText style={styles.metaText}>📍 {data.zone}</AppText>}
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('current')}
          style={[styles.tab, activeTab === 'current' && styles.tabActive]}
        >
          <AppText style={[styles.tabText, activeTab === 'current' && styles.tabTextActive]}>
            Activas ({currentAlerts.length})
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('history')}
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
        >
          <AppText style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Historial ({historyAlerts.length})
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <AppText style={styles.emptyText}>
            {activeTab === 'current' ? '✅ Sin alertas activas en este momento.' : 'Sin alertas en el historial.'}
          </AppText>
        </View>
      ) : (
        <>
          {alerts.slice(0, MAX_ALERTS).map((alert, i) => {
            const isCritical = alert.severityLevel >= 4
            const isModerate = alert.severityLevel >= 3
            const severityLabel = isCritical ? 'Crítico' : isModerate ? 'Moderado' : 'Bajo'
            const severityColor = isCritical ? theme.colors.error : isModerate ? theme.colors.warning : theme.colors.info
            const severityBg = isCritical ? 'rgba(239, 68, 68, 0.12)' : isModerate ? 'rgba(245, 158, 11, 0.12)' : 'rgba(59, 130, 246, 0.12)'

            return (
              <View key={i} style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <View style={styles.badgeRow}>
                    <View style={styles.classBadge}>
                      <AppText style={styles.classBadgeText}>
                        {ALERT_CLASS_LABEL[alert.alertClass] || alert.alertClass}
                      </AppText>
                    </View>
                    <View style={[styles.severityBadge, { backgroundColor: severityBg }]}>
                      <AppText style={[styles.severityBadgeText, { color: severityColor }]}>
                        {severityLabel}
                      </AppText>
                    </View>
                  </View>
                  {alert.cleared ? (
                    <AppText style={styles.clearedText}>Resuelto: {formatDate(alert.cleared)}</AppText>
                  ) : (
                    <AppText style={styles.activeLabel}>Activa ●</AppText>
                  )}
                </View>

                <AppText style={styles.description}>{alert.description}</AppText>

                <View style={styles.alertFooter}>
                  <AppText style={styles.footerText}>Fecha: {formatDate(alert.date)}</AppText>
                  <AppText style={styles.footerText}>Ciclos: {alert.engineCycles.toLocaleString('es-AR')}</AppText>
                </View>
              </View>
            )
          })}
          {alerts.length > MAX_ALERTS && (
            <AppText style={styles.moreText}>
              + {alerts.length - MAX_ALERTS} alertas más...
            </AppText>
          )}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: theme.spacing.md,
    paddingHorizontal: 4,
  },
  metaText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: theme.fontFamily.semibold,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: theme.radius.sm,
    padding: 2,
    marginBottom: theme.spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.radius.sm,
  },
  tabActive: {
    backgroundColor: theme.colors.surfaceLight,
  },
  tabText: {
    fontSize: 11,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.textMuted,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.bold,
  },
  centerContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    textAlign: 'center',
  },
  infoText: {
    color: theme.colors.textDim,
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textDim,
    fontSize: 12,
    fontStyle: 'italic',
  },
  alertCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  classBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  classBadgeText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontFamily: theme.fontFamily.bold,
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityBadgeText: {
    fontSize: 10,
    fontFamily: theme.fontFamily.bold,
  },
  clearedText: {
    color: theme.colors.textDim,
    fontSize: 10,
  },
  activeLabel: {
    color: theme.colors.error,
    fontSize: 10,
    fontFamily: theme.fontFamily.bold,
  },
  description: {
    color: theme.colors.text,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.03)',
    paddingTop: 8,
  },
  footerText: {
    color: theme.colors.textDim,
    fontSize: 10,
  },
  moreText: {
    color: theme.colors.textDim,
    fontSize: 11,
    textAlign: 'center',
    paddingTop: 6,
    fontStyle: 'italic',
  },
})
