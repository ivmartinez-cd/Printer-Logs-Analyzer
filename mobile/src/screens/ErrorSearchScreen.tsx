import React, { useState, useRef } from 'react'
import { StyleSheet, View, ScrollView, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native'
import { AppText } from '../components/AppText'
import { Search } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { GlassCard } from '../components/GlassCard'
import { SolutionBottomSheet } from '../components/SolutionBottomSheet'
import { theme } from '../theme'

function ScalePressable({ onPress, disabled, style, children, accessibilityLabel, accessibilityRole }: {
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

export function ErrorSearchScreen() {
  const insets = useSafeAreaInsets()
  const [code, setCode] = useState('')
  const [inputFocused, setInputFocused] = useState(false)
  const [selectedErrorCode, setSelectedErrorCode] = useState<string | null>(null)
  const [solutionSheetOpen, setSolutionSheetOpen] = useState(false)

  const handleSearch = () => {
    const trimmed = code.trim()
    if (!trimmed) return
    setSelectedErrorCode(trimmed)
    setSolutionSheetOpen(true)
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { flexGrow: 1, justifyContent: 'center' }
        ]}
      >
        <View style={styles.initialHeaderContainer}>
          <AppText style={styles.initialHeaderMain}>HP Logs </AppText>
          <AppText style={styles.initialHeaderSuffix}>CATALOG</AppText>
        </View>

        <GlassCard style={styles.searchCard}>
          <AppText style={styles.cardTitle}>Buscar Solución por Código de Error</AppText>
          <View style={styles.searchRow}>
            <TextInput
              style={[styles.input, inputFocused && styles.inputFocused]}
              placeholder="Ej: 41.03.02"
              placeholderTextColor={theme.colors.textDim}
              value={code}
              onChangeText={setCode}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              autoCapitalize="none"
              onSubmitEditing={handleSearch}
            />

            <ScalePressable
              onPress={handleSearch}
              style={styles.searchBtn}
              disabled={!code.trim()}
              accessibilityLabel="Buscar"
              accessibilityRole="button"
            >
              <Search size={20} color="#fff" />
            </ScalePressable>
          </View>
        </GlassCard>
      </ScrollView>

      <SolutionBottomSheet
        isOpen={solutionSheetOpen}
        onClose={() => setSolutionSheetOpen(false)}
        code={selectedErrorCode}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  searchCard: {
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: theme.fontFamily.bold,
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    color: theme.colors.text,
    fontFamily: theme.fontFamily.regular,
    paddingHorizontal: theme.spacing.md,
    height: 44,
  },
  inputFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(0, 161, 224, 0.05)',
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  initialHeaderMain: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 28,
    color: '#ffffff',
  },
  initialHeaderSuffix: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 28,
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
})
