import React from 'react'
import { StyleSheet, View } from 'react-native'
import { AppText } from './AppText'
import { LinearGradient } from 'expo-linear-gradient'
import { theme } from '../theme'

interface ConsumableBarProps {
  label: string
  percentage: number // 0 a 100
  subtitle?: string
}

export function ConsumableBar({ label, percentage, subtitle }: ConsumableBarProps) {
  // Limitar porcentaje entre 0 y 100
  const clamped = Math.max(0, Math.min(100, percentage))

  // Asignar color y gradiente dinámico según la vida útil restante
  let textColor = theme.colors.success
  let gradientColors: [string, string] = [theme.colors.success, '#34d399']
  if (clamped <= 10) {
    textColor = theme.colors.error
    gradientColors = [theme.colors.error, '#dc2626']
  } else if (clamped <= 25) {
    textColor = theme.colors.warning
    gradientColors = [theme.colors.warning, theme.colors.error]
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText style={styles.label}>{label}</AppText>
        <AppText style={[styles.percentage, { color: textColor }]}>{clamped}%</AppText>
      </View>
      <View style={styles.track}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${clamped}%` }]}
        />
      </View>
      {subtitle && <AppText style={styles.subtitle}>{subtitle}</AppText>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    color: theme.colors.text,
    fontSize: 13,
    fontFamily: theme.fontFamily.semibold,
  },
  percentage: {
    fontSize: 13,
    fontFamily: theme.fontFamily.bold,
  },
  track: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius.full,
  },
  subtitle: {
    color: theme.colors.textDim,
    fontSize: 10,
    marginTop: 4,
  },
})
