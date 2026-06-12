import React from 'react'
import { StyleSheet, View } from 'react-native'
import { AppText } from './AppText'
import { LinearGradient } from 'expo-linear-gradient'
import { GlassCard } from './GlassCard'
import { theme } from '../theme'

interface KPICardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  subtitle?: string | React.ReactNode
  accentColor?: string
}

export function KPICard({ title, value, icon, subtitle, accentColor = theme.colors.primary }: KPICardProps) {
  return (
    <GlassCard style={styles.container} contentStyle={styles.content}>
      <LinearGradient
        colors={[accentColor, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentBar}
      />
      <View style={styles.header}>
        <AppText style={styles.title} numberOfLines={1}>{title}</AppText>
        <View style={styles.iconContainer}>{icon}</View>
      </View>
      <AppText style={styles.value}>{value}</AppText>
      {subtitle && (
        <View style={styles.subtitleContainer}>
          {typeof subtitle === 'string' ? (
            <AppText style={styles.subtitle}>{subtitle}</AppText>
          ) : (
            subtitle
          )}
        </View>
      )}
    </GlassCard>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 165,
    minHeight: 120,
    height: 'auto',
    borderRadius: theme.radius.xl,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
    justifyContent: 'space-between',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  title: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: theme.fontFamily.semibold,
    flex: 1,
    marginRight: 4,
  },
  iconContainer: {
    opacity: 0.8,
  },
  value: {
    color: theme.colors.text,
    fontSize: 22,
    fontFamily: theme.fontFamily.bold,
  },
  subtitleContainer: {
    marginTop: 4,
  },
  subtitle: {
    color: theme.colors.textDim,
    fontSize: 10,
  },
})
