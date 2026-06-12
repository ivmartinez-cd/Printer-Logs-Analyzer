import React from 'react'
import { StyleSheet, View, Pressable } from 'react-native'
import { AppText } from './AppText'
import { theme } from '../theme'

const SEVERITIES = [
  { key: 'ERROR', label: 'ERROR', color: theme.colors.error },
  { key: 'WARNING', label: 'WARNING', color: theme.colors.warning },
  { key: 'INFO', label: 'INFO', color: theme.colors.info },
] as const

interface SeverityFilterProps {
  active: Set<string>
  onToggle: (severity: string) => void
}

export function SeverityFilter({ active, onToggle }: SeverityFilterProps) {
  return (
    <View style={styles.container}>
      <AppText style={styles.label}>FILTRAR:</AppText>
      <View style={styles.row}>
        {SEVERITIES.map(({ key, label, color }) => {
          const isActive = active.has(key)
          return (
            <Pressable
              key={key}
              onPress={() => onToggle(key)}
              hitSlop={{ top: 9, bottom: 9, left: 4, right: 4 }}
              style={[
                styles.chip,
                isActive
                  ? { backgroundColor: color, borderColor: color }
                  : { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.15)' },
              ]}
            >
              <AppText
                style={[
                  styles.chipText,
                  { color: isActive ? '#fff' : 'rgba(255,255,255,0.4)' },
                ]}
              >
                {label}
              </AppText>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 10,
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 9,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.textDim,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 10,
    fontFamily: theme.fontFamily.bold,
    letterSpacing: 0.5,
  },
})
