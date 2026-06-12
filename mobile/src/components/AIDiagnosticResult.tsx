import React from 'react'
import { StyleSheet, View, ActivityIndicator } from 'react-native'
import { Sparkles, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { AppText } from './AppText'
import { GlassCard } from './GlassCard'
import { theme } from '../theme'
import type { AIDiagnosisResponse } from '../types/api'

interface AIDiagnosticResultProps {
  result: AIDiagnosisResponse | null
  loading: boolean
  error: string | null
}

function parseSection(text: string, header: string): string[] {
  const regex = new RegExp(`${header}[:\\s]*([\\s\\S]*?)(?=\\n(?:##|\\*\\*[A-Z])|$)`, 'i')
  const match = text.match(regex)
  if (!match) return []
  return match[1]
    .split('\n')
    .map((l) => l.replace(/^[-•*]\s*/, '').trim())
    .filter((l) => l.length > 0)
}

export function AIDiagnosticResult({ result, loading, error }: AIDiagnosticResultProps) {
  if (loading) {
    return (
      <GlassCard style={styles.card}>
        <View style={styles.loadingContainer}>
          <Sparkles size={20} color={theme.colors.warning} />
          <AppText style={styles.loadingText}>Consultando Copiloto Técnico...</AppText>
          <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 12 }} />
        </View>
      </GlassCard>
    )
  }

  if (error) {
    return (
      <GlassCard style={styles.card}>
        <View style={styles.errorContainer}>
          <AlertTriangle size={18} color={theme.colors.error} />
          <AppText style={styles.errorText}>{error}</AppText>
        </View>
      </GlassCard>
    )
  }

  if (!result) return null

  const text = result.diagnosis || ''
  const diagnoses = parseSection(text, '(?:Diagnóstico|diagnóstico|diagnostic)')
  const recommendations = parseSection(text, '(?:Recomendaci|Acciones|Plan)')

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Sparkles size={16} color={theme.colors.warning} />
        <AppText style={styles.title}>Diagnóstico IA</AppText>
        {result.urgencia && (
          <View style={[styles.severityBadge, { backgroundColor: severityBg(result.urgencia) }]}>
            <AppText style={styles.severityText}>{result.urgencia}</AppText>
          </View>
        )}
      </View>

      {/* Full diagnosis text */}
      <AppText style={styles.bodyText}>{text}</AppText>

      {/* Parsed recommendations if any */}
      {recommendations.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lightbulb size={14} color={theme.colors.primary} />
            <AppText style={styles.sectionTitle}>Acciones Recomendadas</AppText>
          </View>
          {recommendations.slice(0, 5).map((r, i) => (
            <View key={i} style={styles.bulletRow}>
              <CheckCircle size={12} color={theme.colors.success} />
              <AppText style={styles.bulletText}>{r}</AppText>
            </View>
          ))}
        </View>
      )}
    </GlassCard>
  )
}

function severityBg(sev: string): string {
  const s = sev.toUpperCase()
  if (s === 'CRITICAL' || s === 'HIGH') return 'rgba(255,82,82,0.2)'
  if (s === 'MEDIUM') return 'rgba(255,179,0,0.2)'
  return 'rgba(59,130,246,0.2)'
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontFamily: theme.fontFamily.semibold,
    marginTop: 10,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 4,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: theme.fontFamily.bold,
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  severityText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: theme.fontFamily.bold,
    textTransform: 'uppercase',
  },
  bodyText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 19,
    marginBottom: 12,
  },
  section: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 12,
    fontFamily: theme.fontFamily.bold,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
    paddingLeft: 4,
  },
  bulletText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
})
