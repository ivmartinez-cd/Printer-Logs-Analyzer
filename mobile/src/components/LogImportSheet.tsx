import React, { useState } from 'react'
import { StyleSheet, View, TextInput, TouchableOpacity, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { AppText } from './AppText'
import { X, FileText } from 'lucide-react-native'
import { theme } from '../theme'

interface LogImportSheetProps {
  isOpen: boolean
  onClose: () => void
  onImport: (text: string) => void
  loading?: boolean
}

export function LogImportSheet({ isOpen, onClose, onImport, loading }: LogImportSheetProps) {
  const [logsText, setLogsText] = useState('')

  const handleImport = () => {
    if (!logsText.trim()) return
    onImport(logsText)
    setLogsText('')
    onClose()
  }

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <FileText size={20} color={theme.colors.primary} />
              <AppText style={styles.title}>Pegar Logs de Impresora</AppText>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.content}>
            <AppText style={styles.description}>
              Copiá y pegá el contenido de los logs en formato TSV, HTML o texto plano para analizar la severidad y detectar incidentes.
            </AppText>
            
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={12}
              placeholder="Pegá tus logs aquí..."
              placeholderTextColor={theme.colors.textDim}
              value={logsText}
              onChangeText={setLogsText}
              textAlignVertical="top"
            />
            
            <TouchableOpacity 
              style={[styles.importButton, !logsText.trim() && styles.disabledButton]}
              onPress={handleImport}
              disabled={!logsText.trim() || loading}
            >
              <AppText style={styles.importButtonText}>
                {loading ? 'Analizando...' : 'Iniciar Análisis'}
              </AppText>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: theme.fontFamily.bold,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: theme.spacing.lg,
  },
  description: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: theme.spacing.md,
  },
  textInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    color: theme.colors.text,
    padding: theme.spacing.md,
    fontSize: 13,
    minHeight: 180,
    marginBottom: theme.spacing.lg,
  },
  importButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: theme.colors.surfaceLight,
    opacity: 0.6,
  },
  importButtonText: {
    color: '#fff',
    fontFamily: theme.fontFamily.bold,
    fontSize: 14,
  },
})
