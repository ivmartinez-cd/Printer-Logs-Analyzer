import React from 'react'
import { StyleSheet, View } from 'react-native'
import { AppText } from './AppText'
import { GlassCard } from './GlassCard'
import { theme } from '../theme'

interface TopError {
  name: string
  count: number
  severity: string
}

interface TopErrorsBarProps {
  topCodes: TopError[]
  activeSeverities: Set<string>
}

function barColor(severity: string): string {
  const s = severity.toUpperCase()
  if (s === 'ERROR') return theme.colors.error
  if (s === 'WARNING') return theme.colors.warning
  return theme.colors.info
}

export function TopErrorsBar({ topCodes, activeSeverities }: TopErrorsBarProps) {
  const filtered = topCodes.filter((c) => activeSeverities.has(c.severity.toUpperCase()))
  if (filtered.length === 0) return null
  const maxCount = Math.max(...filtered.map((c) => c.count), 1)

  return (
    <GlassCard style={styles.card}>
      <AppText style={styles.title}>Errores más frecuentes</AppText>
      {filtered.map((item, idx) => (
        <View key={item.name} style={styles.row}>
          <AppText style={styles.code}>{item.name}</AppText>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${(item.count / maxCount) * 100}%`,
                  backgroundColor: barColor(item.severity),
                },
              ]}
            />
          </View>
          <AppText style={styles.count}>{item.count}</AppText>
        </View>
      ))}
    </GlassCard>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: theme.fontFamily.bold,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  code: {
    color: theme.colors.primary,
    fontSize: 11,
    fontFamily: theme.fontFamily.bold,
    width: 68,
    textAlign: 'right',
  },
  barTrack: {
    flex: 1,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  count: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontFamily: theme.fontFamily.bold,
    width: 28,
    textAlign: 'right',
  },
})
