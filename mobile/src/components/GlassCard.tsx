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
      <BlurView
        intensity={25}
        tint="dark"
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, styles.tint]} pointerEvents="none" />
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.01)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={[styles.innerContent, contentStyle]}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  outerContainer: {
    borderRadius: theme.radius.xl,
    borderColor: theme.colors.borderLight,
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
