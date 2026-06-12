import React, { useState } from 'react'
import { StyleSheet, View, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native'
import { AppText } from './AppText'
import { ChevronDown, ChevronUp, Calendar, AlertCircle } from 'lucide-react-native'
import { GlassCard } from './GlassCard'
import { SeverityBadge } from './SeverityBadge'
import { theme } from '../theme'
import type { Incident } from '../types/api'

// Habilitar animaciones de layout en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

interface IncidentCardProps {
  incident: Incident
  onPressSolution?: (code: string) => void
}

function getSeverityColor(severity: string): string {
  const norm = severity.toUpperCase()
  if (norm === 'ERROR' || norm === 'CRITICAL') return theme.colors.error
  if (norm === 'WARNING' || norm === 'WATCH') return theme.colors.warning
  if (norm === 'OK' || norm === 'SUCCESS') return theme.colors.success
  return theme.colors.info
}

export function IncidentCard({ incident, onPressSolution }: IncidentCardProps) {
  const [expanded, setExpanded] = useState(false)
  const severityColor = getSeverityColor(incident.severity)

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpanded(!expanded)
  }

  const startDate = new Date(incident.start_time).toLocaleDateString()
  const endDate = new Date(incident.end_time).toLocaleDateString()

  return (
    <View style={[styles.glowWrapper, { shadowColor: severityColor }]}>
      <GlassCard style={[styles.card, { borderLeftWidth: 3, borderLeftColor: severityColor }]}>
        <TouchableOpacity onPress={toggleExpand} activeOpacity={0.7} style={styles.header}>
          <View style={styles.headerLeft}>
            <AppText style={styles.code}>{incident.code}</AppText>
            <AppText style={styles.classification} numberOfLines={1}>{incident.classification}</AppText>
          </View>
          <View style={styles.headerRight}>
            <SeverityBadge severity={incident.severity} />
            {expanded ? <ChevronUp size={18} color={theme.colors.textMuted} /> : <ChevronDown size={18} color={theme.colors.textMuted} />}
          </View>
        </TouchableOpacity>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <AlertCircle size={14} color={theme.colors.textDim} />
            <AppText style={styles.metaText}>{incident.occurrences} ocurrencias</AppText>
          </View>
          <View style={styles.metaItem}>
            <Calendar size={14} color={theme.colors.textDim} />
            <AppText style={styles.metaText}>{startDate} - {endDate}</AppText>
          </View>
        </View>

        {expanded && (
          <View style={styles.expandableContent}>
            <View style={styles.divider} />
            <AppText style={styles.subtitle}>Detalle del Rango de Contadores:</AppText>
            <AppText style={styles.detailText}>
              Páginas: {incident.counter_range[0].toLocaleString()} – {incident.counter_range[1].toLocaleString()}
            </AppText>

            {onPressSolution && (
              <TouchableOpacity
                style={styles.solutionButton}
                onPress={() => onPressSolution(incident.code)}
              >
                <AppText style={styles.solutionButtonText}>Ver Procedimiento Técnico</AppText>
              </TouchableOpacity>
            )}

            <AppText style={styles.subtitle}>Eventos en el Log ({incident.events.length}):</AppText>
            {incident.events.slice(0, 5).map((evt, idx) => (
              <View key={idx} style={styles.eventItem}>
                <AppText style={styles.eventTime}>
                  {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Cnt: {evt.counter.toLocaleString()}
                </AppText>
                {evt.firmware && <AppText style={styles.eventFw}>FW: {evt.firmware}</AppText>}
              </View>
            ))}
            {incident.events.length > 5 && (
              <AppText style={styles.moreEventsText}>+ {incident.events.length - 5} eventos adicionales...</AppText>
            )}
          </View>
        )}
      </GlassCard>
    </View>
  )
}

const styles = StyleSheet.create({
  glowWrapper: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.radius.xl,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  card: {
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  code: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: theme.fontFamily.bold,
  },
  classification: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: theme.colors.textDim,
    fontSize: 11,
  },
  expandableContent: {
    marginTop: theme.spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontFamily: theme.fontFamily.bold,
    marginBottom: 4,
    marginTop: theme.spacing.sm,
  },
  detailText: {
    color: theme.colors.text,
    fontSize: 13,
  },
  solutionButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  solutionButtonText: {
    color: '#fff',
    fontFamily: theme.fontFamily.bold,
    fontSize: 13,
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  eventTime: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  eventFw: {
    color: theme.colors.textDim,
    fontSize: 10,
  },
  moreEventsText: {
    color: theme.colors.textDim,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
    fontStyle: 'italic',
  },
})
