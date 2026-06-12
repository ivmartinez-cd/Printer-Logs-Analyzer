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
  subtitle?: string
  accentColor?: string
}

export function KPICard({ title, value, icon, subtitle, accentColor = theme.colors.primary }: KPICardProps) {
  return (
    <View style={[styles.glowWrapper, { shadowColor: accentColor }]}>
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
        {subtitle && <AppText style={styles.subtitle} numberOfLines={1}>{subtitle}</AppText>}
      </GlassCard>
    </View>
  )
}

const styles = StyleSheet.create({
  glowWrapper: {
    width: 150,
    height: 110,
    marginRight: theme.spacing.md,
    borderRadius: theme.radius.xl,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  container: {
    flex: 1,
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
  subtitle: {
    color: theme.colors.textDim,
    fontSize: 10,
    marginTop: 2,
  },
})
