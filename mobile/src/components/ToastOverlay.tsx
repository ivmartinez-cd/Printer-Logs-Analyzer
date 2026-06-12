import React, { useState, useEffect } from 'react'
import { StyleSheet, View, Dimensions, Platform } from 'react-native'
import { AppText } from './AppText'
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react-native'
import { ToastMessage, addToastListener } from '../hooks/useToast'
import { theme } from '../theme'

const { width } = Dimensions.get('window')

export function ToastOverlay() {
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const insets = useSafeAreaInsets()
  const translateY = useSharedValue(-100)

  useEffect(() => {
    const unsubscribe = addToastListener((msg) => {
      setToast(msg)
      
      // Animar hacia abajo (Spring)
      translateY.value = withSpring(insets.top + 10)
      
      // Auto ocultar tras 3.5 segundos
      setTimeout(() => {
        translateY.value = withTiming(-100, { duration: 300 })
      }, 3500)
    })

    return unsubscribe
  }, [insets, translateY])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    }
  })

  if (!toast) return null

  // Colores y diseño según tipo
  let bg = theme.colors.surface
  let border = theme.colors.border
  let icon = <Info size={20} color={theme.colors.info} />

  if (toast.type === 'success') {
    border = theme.colors.success
    icon = <CheckCircle2 size={20} color={theme.colors.success} />
  } else if (toast.type === 'warning') {
    border = theme.colors.warning
    icon = <AlertTriangle size={20} color={theme.colors.warning} />
  } else if (toast.type === 'error') {
    border = theme.colors.error
    icon = <AlertCircle size={20} color={theme.colors.error} />
  }

  return (
    <Animated.View style={[styles.container, animatedStyle, { borderColor: border }]}>
      <View style={styles.iconContainer}>{icon}</View>
      <AppText style={styles.text}>{toast.text}</AppText>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  iconContainer: {
    marginRight: theme.spacing.sm,
  },
  text: {
    color: theme.colors.text,
    fontSize: 13,
    fontFamily: theme.fontFamily.semibold,
    flex: 1,
  },
})
