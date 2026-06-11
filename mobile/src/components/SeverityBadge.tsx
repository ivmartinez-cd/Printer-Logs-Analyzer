import React from 'react'
import { StyleSheet, View } from 'react-native'
import { AppText } from './AppText'
import { theme } from '../theme'

interface SeverityBadgeProps {
  severity: string
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const norm = severity.toUpperCase()
  
  let bg = 'rgba(59, 130, 246, 0.15)'
  let text = theme.colors.info
  
  if (norm === 'ERROR' || norm === 'CRITICAL') {
    bg = 'rgba(239, 68, 68, 0.15)'
    text = theme.colors.error
  } else if (norm === 'WARNING' || norm === 'WATCH') {
    bg = 'rgba(245, 158, 11, 0.15)'
    text = theme.colors.warning
  } else if (norm === 'OK' || norm === 'SUCCESS') {
    bg = 'rgba(16, 185, 129, 0.15)'
    text = theme.colors.success
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <AppText style={[styles.text, { color: text }]}>{norm}</AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontFamily: theme.fontFamily.bold,
    letterSpacing: 0.5,
  },
})
