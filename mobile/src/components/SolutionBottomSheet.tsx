import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Linking } from 'react-native'
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { AppText } from './AppText'
import { X, ExternalLink, ShieldAlert } from 'lucide-react-native'
import { theme } from '../theme'
import { getSolutionProxy } from '../services/api'

interface SolutionBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  code: string | null
}

export function SolutionBottomSheet({ isOpen, onClose, code }: SolutionBottomSheetProps) {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const snapPoints = useMemo(() => ['50%', '90%'], [])

  useEffect(() => {
    if (isOpen && code) {
      bottomSheetModalRef.current?.present()
      fetchSolution()
    } else {
      bottomSheetModalRef.current?.dismiss()
      // reset state on close
      setTimeout(() => {
        setContent(null)
        setUrl(null)
        setError(null)
      }, 300)
    }
  }, [isOpen, code])

  const fetchSolution = async () => {
    setLoading(true)
    setError(null)
    setContent(null)
    setUrl(null)
    try {
      const res = await getSolutionProxy(code!)
      setContent(res.content)
      setUrl(res.url)
      if (!res.content) {
        setError('No hay un procedimiento registrado para este código de error.')
      }
    } catch (err: any) {
      setError(err.message || 'Error al obtener la solución del servidor.')
    } finally {
      setLoading(false)
    }
  }

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose()
    }
  }, [onClose])

  const handleOpenUrl = async () => {
    if (url) {
      const canOpen = await Linking.canOpenURL(url)
      if (canOpen) {
        await Linking.openURL(url)
      }
    }
  }

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.65}
      />
    ),
    []
  )

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <View style={styles.sheetContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <View style={styles.iconContainer}>
              <ShieldAlert size={20} color={theme.colors.primary} />
            </View>
            <AppText style={styles.title}>Resolución: {code}</AppText>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <AppText style={styles.loadingText}>Consultando base de conocimiento...</AppText>
            </View>
          ) : error ? (
            <View style={styles.centerContainer}>
              <AppText style={styles.errorText}>{error}</AppText>
              {url && (
                <TouchableOpacity style={styles.linkButton} onPress={handleOpenUrl}>
                  <ExternalLink size={16} color="#fff" />
                  <AppText style={styles.linkButtonText}>Ver en HP Portal</AppText>
                </TouchableOpacity>
              )}
            </View>
          ) : content ? (
            <View style={styles.solutionWrapper}>
              {url && (
                <TouchableOpacity style={styles.topLinkButton} onPress={handleOpenUrl}>
                  <ExternalLink size={14} color={theme.colors.primary} />
                  <AppText style={styles.topLinkLabel}>Abrir artículo oficial de HP</AppText>
                </TouchableOpacity>
              )}
              <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
                <AppText style={styles.bodyText}>{content}</AppText>
              </BottomSheetScrollView>
            </View>
          ) : (
            <View style={styles.centerContainer}>
              <AppText style={styles.emptyText}>Sin información para este código.</AppText>
            </View>
          )}
        </View>
      </View>
    </BottomSheetModal>
  )
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  sheetContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  iconContainer: {
    backgroundColor: theme.colors.primaryGlow,
    padding: 6,
    borderRadius: theme.radius.sm,
  },
  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: theme.fontFamily.bold,
  },
  closeButton: {
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.radius.full,
  },
  contentContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: 16,
  },
  loadingText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontFamily: theme.fontFamily.medium,
    textAlign: 'center',
  },
  errorText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyText: {
    color: theme.colors.textDim,
    fontSize: 14,
  },
  solutionWrapper: {
    flex: 1,
  },
  topLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'rgba(0, 161, 224, 0.08)',
  },
  topLinkLabel: {
    color: theme.colors.primary,
    fontSize: 13,
    fontFamily: theme.fontFamily.semibold,
  },
  scrollContent: {
    padding: theme.spacing.xl,
    paddingBottom: 40,
  },
  bodyText: {
    color: theme.colors.text,
    fontSize: 15,
    fontFamily: theme.fontFamily.regular,
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    marginTop: 12,
  },
  linkButtonText: {
    color: '#fff',
    fontFamily: theme.fontFamily.semibold,
    fontSize: 14,
  },
})
