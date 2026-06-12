import React, { useState, useMemo } from 'react'
import { StyleSheet, View, TextInput, TouchableOpacity, Modal, KeyboardAvoidingView, Platform, FlatList, ActivityIndicator } from 'react-native'
import { AppText } from './AppText'
import { X, Search } from 'lucide-react-native'
import { theme } from '../theme'

export interface SelectorItem {
  id: string
  name: string
  detail?: string
}

interface SelectionBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  searchTermPlaceholder?: string
  items: SelectorItem[]
  onSelect: (item: SelectorItem) => void
  loading?: boolean
}

export function SelectionBottomSheet({
  isOpen,
  onClose,
  title,
  searchTermPlaceholder = 'Buscar...',
  items,
  onSelect,
  loading = false,
}: SelectionBottomSheetProps) {
  const [search, setSearch] = useState('')

  const filteredItems = useMemo(() => {
    const term = search.toLowerCase().trim()
    if (!term) return items
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        (item.detail && item.detail.toLowerCase().includes(term))
    )
  }, [items, search])

  const handleSelect = (item: SelectorItem) => {
    onSelect(item)
    setSearch('')
    onClose()
  }

  const handleClose = () => {
    setSearch('')
    onClose()
  }

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <AppText style={styles.title}>{title}</AppText>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Cerrar"
              accessibilityRole="button"
            >
              <X size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchContainer}>
            <Search size={16} color={theme.colors.textDim} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={searchTermPlaceholder}
              placeholderTextColor={theme.colors.textDim}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
          </View>

          {/* List Content */}
          <View style={styles.listContainer}>
            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <AppText style={styles.loadingText}>Cargando opciones...</AppText>
              </View>
            ) : filteredItems.length === 0 ? (
              <View style={styles.centerContainer}>
                <AppText style={styles.emptyText}>No se encontraron elementos.</AppText>
              </View>
            ) : (
              <FlatList
                data={filteredItems}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.itemRow}
                    onPress={() => handleSelect(item)}
                  >
                    <View style={styles.itemInfo}>
                      <AppText style={styles.itemName}>{item.name}</AppText>
                      {item.detail && (
                        <AppText style={styles.itemDetail}>{item.detail}</AppText>
                      )}
                    </View>
                    <AppText style={styles.selectArrow}>→</AppText>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    height: '100%',
    padding: 0,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  emptyText: {
    color: theme.colors.textDim,
    fontSize: 13,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  itemInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  itemName: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: theme.fontFamily.semibold,
  },
  itemDetail: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  selectArrow: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.bold,
    fontSize: 16,
  },
})
