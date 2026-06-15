import React from 'react'
import { Pressable } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'

// Botón con micro-animación de escala al presionar
export function ScalePressable({ onPress, disabled, style, children, accessibilityLabel, accessibilityRole }: {
  onPress: () => void
  disabled?: boolean
  style?: any
  children: React.ReactNode
  accessibilityLabel?: string
  accessibilityRole?: 'button'
}) {
  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.92) }}
        onPressOut={() => { scale.value = withSpring(1) }}
        onPress={onPress}
        disabled={disabled}
        style={style}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
      >
        {children}
      </Pressable>
    </Animated.View>
  )
}
