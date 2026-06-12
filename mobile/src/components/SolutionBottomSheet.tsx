import React, { useState, useEffect } from 'react'
import { StyleSheet, View, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Linking, Platform } from 'react-native'
import { AppText } from './AppText'
import { X, ExternalLink } from 'lucide-react-native'
import { theme } from '../theme'
import { getSolutionProxy } from '../services/api'

interface SolutionBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  code: string | null
}

export function SolutionBottomSheet({ isOpen, onClose, code }: SolutionBottomSheetProps) {
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !code) {
      setContent(null)
      setUrl(null)
      setError(null)
      return
    }

    const fetchSolution = async () => {
      setLoading(true)
      setError(null)
      setContent(null)
      setUrl(null)
      try {
        const res = await getSolutionProxy(code)
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

    fetchSolution()
  }, [isOpen, code])

  const handleOpenUrl = async () => {
    if (url) {
      const canOpen = await Linking.canOpenURL(url)
      if (canOpen) {
        await Linking.openURL(url)
      }
    }
  }

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <AppText style={styles.title}>Procedimiento Técnico: {code}</AppText>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Cerrar"
              accessibilityRole="button"
            >
              <X size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <AppText style={styles.loadingText}>Consultando base de datos y portales de HP...</AppText>
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
                    <AppText style={styles.topLinkLabel}>Link al HP Portal original</AppText>
                  </TouchableOpacity>
                )}
                <ScrollView contentContainerStyle={styles.scrollContent}>
                  <AppText style={styles.bodyText}>{content}</AppText>
                </ScrollView>
              </View>
            ) : (
              <View style={styles.centerContainer}>
                <AppText style={styles.emptyText}>Sin información para este código.</AppText>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: '75%',
    minHeight: '40%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: theme.fontFamily.bold,
  },
  closeButton: {
    padding: 4,
  },
  contentContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: 12,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  errorText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  emptyText: {
    color: theme.colors.textDim,
    fontSize: 13,
  },
  solutionWrapper: {
    flex: 1,
  },
  topLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  topLinkLabel: {
    color: theme.colors.primary,
    fontSize: 12,
    fontFamily: theme.fontFamily.semibold,
    textDecorationLine: 'underline',
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  bodyText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontFamily: 'Courier',
    lineHeight: 20,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    marginTop: 10,
  },
  linkButtonText: {
    color: '#fff',
    fontFamily: theme.fontFamily.bold,
    fontSize: 13,
  },
})
