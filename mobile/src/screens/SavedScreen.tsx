import React, { useState, useEffect } from 'react'
import { StyleSheet, View, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native'
import { AppText } from '../components/AppText'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Bookmark, Trash2, Calendar } from 'lucide-react-native'
import { Swipeable } from 'react-native-gesture-handler'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { GlassCard } from '../components/GlassCard'
import { SeverityBadge } from '../components/SeverityBadge'
import { listSavedAnalyses, deleteSavedAnalysis } from '../services/api'
import { theme } from '../theme'
import type { SavedAnalysisSummary } from '../types/api'

export function SavedScreen() {
  const insets = useSafeAreaInsets()
  const [saved, setSaved] = useState<SavedAnalysisSummary[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSaved()
  }, [])

  const loadSaved = async () => {
    setLoading(true)
    try {
      const data = await listSavedAnalyses()
      setSaved(data)
    } catch {
      // Mock de contingencia
      setSaved([
        { id: '1', name: 'Diagnóstico Crítico Fusora', equipment_identifier: 'CNB1H99887', global_severity: 'ERROR', created_at: new Date().toISOString() },
        { id: '2', name: 'Chequeo Mensual HP M608', equipment_identifier: 'CNB1H55443', global_severity: 'WARNING', created_at: new Date().toISOString() }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Eliminar Análisis',
      `¿Deseas eliminar el diagnóstico guardado "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSavedAnalysis(id)
              setSaved(saved.filter(s => s.id !== id))
            } catch {
              // Si falla (offline), limpiar localmente para testing
              setSaved(saved.filter(s => s.id !== id))
            }
          }
        }
      ]
    )
  }

  const renderRightActions = (item: SavedAnalysisSummary) => (
    <Pressable style={styles.deleteAction} onPress={() => handleDelete(item.id, item.name)}>
      <Trash2 size={20} color="#fff" />
    </Pressable>
  )

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AppText style={styles.sectionTitle}>Historial de Diagnósticos Guardados</AppText>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : saved.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Bookmark size={48} color={theme.colors.textDim} />
            <AppText style={styles.emptyText}>No hay diagnósticos guardados actualmente.</AppText>
          </View>
        ) : (
          <View style={styles.grid}>
            {saved.map((item, idx) => (
              <Animated.View key={item.id} entering={FadeInDown.delay(idx * 60).duration(350)} style={styles.gridItem}>
                <Swipeable renderRightActions={() => renderRightActions(item)} overshootRight={false}>
                  <GlassCard contentStyle={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <AppText style={styles.name} numberOfLines={2}>{item.name}</AppText>
                      <Pressable
                        onPress={() => handleDelete(item.id, item.name)}
                        style={styles.deleteBtn}
                      >
                        <Trash2 size={14} color={theme.colors.error} />
                      </Pressable>
                    </View>
                    {item.equipment_identifier && (
                      <AppText style={styles.serial} numberOfLines={1}>Serie: {item.equipment_identifier}</AppText>
                    )}

                    <View style={styles.footer}>
                      <SeverityBadge severity={item.global_severity} />
                      <View style={styles.dateRow}>
                        <Calendar size={11} color={theme.colors.textDim} />
                        <AppText style={styles.dateText}>
                          {new Date(item.created_at).toLocaleDateString()}
                        </AppText>
                      </View>
                    </View>
                  </GlassCard>
                </Swipeable>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
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
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: theme.fontFamily.bold,
    marginBottom: theme.spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: theme.spacing.md,
  },
  cardContent: {
    padding: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    color: theme.colors.text,
    fontSize: 13,
    fontFamily: theme.fontFamily.bold,
    flex: 1,
    marginRight: 4,
  },
  serial: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 2,
  },
  footer: {
    marginTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
    gap: 6,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    color: theme.colors.textDim,
    fontSize: 11,
  },
  deleteAction: {
    width: 56,
    height: '100%',
    backgroundColor: theme.colors.error,
    borderRadius: theme.radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
})
export default SavedScreen
