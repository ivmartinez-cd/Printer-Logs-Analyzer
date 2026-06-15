import React from 'react'
import { StyleSheet, View } from 'react-native'
import { AppText } from './AppText'
import { theme } from '../theme'
import type { EnrichedEvent } from '../types/api'

interface EventsListProps {
  events: EnrichedEvent[]
  maxItems?: number
}

function typeColor(type: string): string {
  const t = type?.toUpperCase()
  if (t === 'ERROR') return theme.colors.error
  if (t === 'WARNING') return theme.colors.warning
  return theme.colors.info
}

function EventsListComponent({ events, maxItems = 30 }: EventsListProps) {
  const display = events.slice(0, maxItems)
  if (display.length === 0) {
    return <AppText style={styles.empty}>Sin eventos en este período.</AppText>
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <AppText style={[styles.headerCell, { flex: 2 }]}>Fecha</AppText>
        <AppText style={[styles.headerCell, { width: 52 }]}>Tipo</AppText>
        <AppText style={[styles.headerCell, { flex: 3 }]}>Código</AppText>
        <AppText style={[styles.headerCell, { width: 54 }]}>Cnt</AppText>
      </View>

      {display.map((evt, i) => (
        <View key={i} style={styles.row}>
          <AppText style={[styles.cell, styles.dateCell, { flex: 2 }]} numberOfLines={1}>
            {evt.timestamp
              ? new Date(evt.timestamp).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'}
          </AppText>
          <View style={{ width: 52 }}>
            <AppText style={[styles.typeBadge, { color: typeColor(evt.type) }]}>
              {evt.type}
            </AppText>
          </View>
          <AppText style={[styles.cell, { flex: 3, color: theme.colors.text }]} numberOfLines={1}>
            {evt.code || '—'}
          </AppText>
          <AppText style={[styles.cell, styles.counterCell, { width: 54 }]} numberOfLines={1}>
            {evt.counter != null ? evt.counter.toLocaleString() : '—'}
          </AppText>
        </View>
      ))}

      {events.length > maxItems && (
        <AppText style={styles.moreText}>
          + {events.length - maxItems} eventos más...
        </AppText>
      )}
    </View>
  )
}

export const EventsList = React.memo(EventsListComponent)

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    marginBottom: 2,
  },
  headerCell: {
    color: theme.colors.textDim,
    fontSize: 9,
    fontFamily: theme.fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  cell: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  dateCell: {
    fontFamily: theme.fontFamily.regular,
  },
  typeBadge: {
    fontSize: 9,
    fontFamily: theme.fontFamily.bold,
  },
  counterCell: {
    textAlign: 'right',
    fontFamily: theme.fontFamily.regular,
  },
  empty: {
    color: theme.colors.textDim,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 16,
    fontStyle: 'italic',
  },
  moreText: {
    color: theme.colors.textDim,
    fontSize: 11,
    textAlign: 'center',
    paddingTop: 10,
    fontStyle: 'italic',
  },
})
