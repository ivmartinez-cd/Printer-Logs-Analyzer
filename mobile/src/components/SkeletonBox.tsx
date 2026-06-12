import React, { useEffect } from 'react'
import { Dimensions, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { theme } from '../theme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface SkeletonBoxProps {
  width?: number | string
  height?: number | string
  borderRadius?: number
  style?: any
}

export function SkeletonBox({ width = '100%', height = 20, borderRadius = theme.radius.sm, style }: SkeletonBoxProps) {
  const shimmer = useSharedValue(-1)

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    )
  }, [shimmer])

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmer.value * SCREEN_WIDTH }],
  }))

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height: height as any,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.06)', 'rgba(0, 161, 224, 0.18)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: theme.colors.surfaceLight,
    overflow: 'hidden',
  },
})
