import React, { useState, useEffect } from 'react'
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity } from 'react-native'
import { AppText } from '../components/AppText'
import { Search, Trash2, Clock } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { GlassCard } from '../components/GlassCard'
import { ScalePressable } from '../components/ScalePressable'
import { SolutionBottomSheet } from '../components/SolutionBottomSheet'
import { theme } from '../theme'
import { LinearGradient } from 'expo-linear-gradient'

// Formatea el código a MAYÚSCULAS y agrupa de a 2 caracteres con puntos.
// Ej: "13b2d2" -> "13.B2.D2"
function formatErrorCode(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
  const groups = clean.match(/.{1,2}/g)
  return groups ? groups.join('.') : ''
}

export function ErrorSearchScreen() {
  const insets = useSafeAreaInsets()
  const [code, setCode] = useState('')
  const [inputFocused, setInputFocused] = useState(false)
  const [selectedErrorCode, setSelectedErrorCode] = useState<string | null>(null)
  const [solutionSheetOpen, setSolutionSheetOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Cargar búsquedas recientes al montar la pantalla
  useEffect(() => {
    const loadRecents = async () => {
      try {
        const stored = await AsyncStorage.getItem('recent_error_codes')
        if (stored) {
          setRecentSearches(JSON.parse(stored))
        }
      } catch {
        // Ignorar fallas al cargar
      }
    }
    loadRecents()
  }, [])

  const saveRecentSearch = async (newCode: string) => {
    const trimmed = newCode.trim().toUpperCase()
    if (!trimmed) return
    const updated = [trimmed, ...recentSearches.filter((c) => c !== trimmed)].slice(0, 8)
    setRecentSearches(updated)
    try {
      await AsyncStorage.setItem('recent_error_codes', JSON.stringify(updated))
    } catch {
      // Ignorar fallas al guardar
    }
  }

  const handleSearch = () => {
    const trimmed = code.trim()
    if (!trimmed) return
    saveRecentSearch(trimmed)
    setSelectedErrorCode(trimmed)
    setSolutionSheetOpen(true)
  }

  const handlePressRecent = (recentCode: string) => {
    const formatted = formatErrorCode(recentCode)
    setCode(formatted)
    setSelectedErrorCode(formatted)
    setSolutionSheetOpen(true)
  }

  const handleClearRecents = async () => {
    setRecentSearches([])
    try {
      await AsyncStorage.removeItem('recent_error_codes')
    } catch {
      // Ignorar
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#081c30', '#06080c', '#030508']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.85 }}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          recentSearches.length === 0 && { flexGrow: 1, justifyContent: 'center' }
        ]}
      >
        <View style={styles.initialHeaderContainer}>
          <View style={styles.initialLogoRow}>
            <AppText style={styles.initialHeaderMain}>HP Logs </AppText>
            <AppText style={styles.initialHeaderSuffix}>CATALOG</AppText>
          </View>
          <AppText style={styles.initialSubtitle}>
            Búsqueda rápida en el catálogo de códigos de error de impresoras HP para encontrar soluciones técnicas instantáneas.
          </AppText>
        </View>

        <GlassCard style={styles.searchCard}>
          <AppText style={styles.cardTitle}>Buscar Solución por Código de Error</AppText>
          <View style={styles.searchRow}>
            <TextInput
              style={[styles.input, inputFocused && styles.inputFocused]}
              placeholder="Ej: 41.03.02"
              placeholderTextColor={theme.colors.textDim}
              value={code}
              onChangeText={(t) => setCode(formatErrorCode(t))}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              autoCapitalize="characters"
              autoCorrect={false}
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

        {/* Búsquedas recientes */}
        {recentSearches.length > 0 && (
          <GlassCard style={styles.recentsCard}>
            <View style={styles.recentsHeader}>
              <View style={styles.recentsTitleRow}>
                <Clock size={14} color={theme.colors.textDim} />
                <AppText style={styles.recentsTitle}>Búsquedas Recientes</AppText>
              </View>
              <TouchableOpacity onPress={handleClearRecents} style={styles.clearBtn}>
                <Trash2 size={14} color={theme.colors.error} />
                <AppText style={styles.clearText}>Limpiar</AppText>
              </TouchableOpacity>
            </View>
            <View style={styles.chipsContainer}>
              {recentSearches.map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => handlePressRecent(item)}
                  style={styles.chip}
                  activeOpacity={0.7}
                >
                  <AppText style={styles.chipText}>{item}</AppText>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>
        )}
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
    borderWidth: 1.5,
    backgroundColor: 'rgba(0, 161, 224, 0.08)',
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
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  initialLogoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
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
  initialSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontFamily: theme.fontFamily.medium,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    opacity: 0.8,
  },
  // Recientes styles
  recentsCard: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  recentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  recentsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentsTitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: theme.fontFamily.bold,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearText: {
    color: theme.colors.error,
    fontSize: 11,
    fontFamily: theme.fontFamily.semibold,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    color: theme.colors.text,
    fontSize: 12,
    fontFamily: theme.fontFamily.medium,
  },
})
