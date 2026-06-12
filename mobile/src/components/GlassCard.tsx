import React from 'react'
import { Platform, StyleSheet, View, ViewProps, ViewStyle, StyleProp } from 'react-native'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { theme } from '../theme'

interface GlassCardProps extends ViewProps {
  children: React.ReactNode
  contentStyle?: StyleProp<ViewStyle>
}

export function GlassCard({ children, style, contentStyle, ...props }: GlassCardProps) {
  return (
    <View style={[styles.outerContainer, style]} {...props}>
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={25}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.surface }]} />
      )}
      <View style={[StyleSheet.absoluteFill, styles.tint]} pointerEvents="none" />
      <View style={[styles.innerContent, contentStyle]}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  outerContainer: {
    borderRadius: theme.radius.xl,
    borderColor: theme.colors.border,
    borderWidth: 1,
    backgroundColor: theme.colors.surfaceCard,
    overflow: 'hidden',
  },
  tint: {
    backgroundColor: theme.colors.surfaceCard,
  },
  innerContent: {
    padding: theme.spacing.lg,
  },
})
