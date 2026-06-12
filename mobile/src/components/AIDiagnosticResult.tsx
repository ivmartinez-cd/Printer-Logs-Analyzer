import React from 'react'
import { StyleSheet, View, ActivityIndicator } from 'react-native'
import { Sparkles, AlertTriangle, CheckCircle, Lightbulb, Settings, ShieldAlert, Cpu } from 'lucide-react-native'
import { AppText } from './AppText'
import { GlassCard } from './GlassCard'
import { theme } from '../theme'
import type { AIDiagnosisResponse } from '../types/api'

interface AIDiagnosticResultProps {
  result: AIDiagnosisResponse | null
  loading: boolean
  error: string | null
}

interface DiagnosisData {
  diagnostico: string
  acciones: string[]
  tareas_resumen?: string | null
  urgencia?: 'urgente' | 'programar' | 'monitorear' | null
  despacho?: 'si' | 'no' | 'remoto' | null
  despacho_motivo?: string | null
  prioridad: 'alta' | 'media' | 'baja'
  impacto?: string
}

function parseDiagnosis(text: string): DiagnosisData | null {
  try {
    const cleaned = text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim()

    if (cleaned.startsWith('{')) {
      return JSON.parse(cleaned) as DiagnosisData
    }
  } catch (e) {
    console.warn('Failed to parse AI diagnosis as JSON:', e)
  }

  // Fallback a parseo manual por regex si no viene en JSON válido
  const regex = /(DIAGNÓSTICO|ACCIÓN|PRIORIDAD):\s*([\s\S]*?)(?=\n(?:DIAGNÓSTICO|ACCIÓN|PRIORIDAD):|$)/g
  const data: Partial<DiagnosisData> = { acciones: [] }
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    const key = match[1]
    const content = match[2].trim()
    if (key === 'DIAGNÓSTICO') data.diagnostico = content
    if (key === 'ACCIÓN') data.acciones = content.split('. ').filter(s => s.length > 5)
    if (key === 'PRIORIDAD') data.prioridad = content.toLowerCase() as DiagnosisData['prioridad']
  }

  return data.diagnostico ? (data as DiagnosisData) : null
}

function renderFormattedText(textStr: string) {
  if (!textStr) return null
  return textStr.split('\n\n').map((paragraph, pIdx) => (
    <AppText key={pIdx} style={styles.bodyText}>
      {paragraph.split(/(\*\*.*?\*\*)/).map((segment, sIdx) => {
        if (segment.startsWith('**') && segment.endsWith('**')) {
          return (
            <AppText key={sIdx} style={styles.boldSegment}>
              {segment.slice(2, -2)}
            </AppText>
          )
        }
        return segment
      })}
    </AppText>
  ))
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

  const rawText = result.diagnosis || ''
  const data = parseDiagnosis(rawText)

  // Si no se puede parsear, mostramos el fallback crudo
  if (!data) {
    return (
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <Sparkles size={16} color={theme.colors.warning} />
          <AppText style={styles.title}>Diagnóstico IA</AppText>
        </View>
        <AppText style={styles.fallbackRawText}>{rawText}</AppText>
      </GlassCard>
    )
  }

  return (
    <View style={styles.container}>
      {/* Encabezado Principal */}
      <GlassCard style={[styles.card, styles.headerCard]}>
        <View style={styles.header}>
          <Sparkles size={16} color={theme.colors.warning} />
          <AppText style={styles.title}>Diagnóstico IA</AppText>
          <View style={[styles.priorityBadge, { backgroundColor: priorityBg(data.prioridad) }]}>
            <AppText style={styles.priorityText}>{data.prioridad}</AppText>
          </View>
        </View>

        {/* Despacho / Visita Técnica */}
        {data.despacho && (
          <View style={[styles.statusRow, (styles[`despacho_${data.despacho}` as keyof typeof styles] || styles.despacho_no) as any]}>
            <AppText style={styles.statusIcon}>
              {data.despacho === 'si' ? '🔧' : data.despacho === 'remoto' ? '💻' : '✅'}
            </AppText>
            <View style={styles.statusContent}>
              <AppText style={styles.statusLabel}>
                {data.despacho === 'si'
                  ? 'Requiere visita técnica'
                  : data.despacho === 'remoto'
                  ? 'Resoluble de forma remota'
                  : 'Sin visita técnica necesaria'}
              </AppText>
              {data.despacho_motivo && (
                <AppText style={styles.statusMotivo}>{data.despacho_motivo}</AppText>
              )}
            </View>
          </View>
        )}

        {/* Urgencia */}
        {data.urgencia && (
          <View style={[styles.statusRow, (styles[`urgencia_${data.urgencia}` as keyof typeof styles] || styles.urgencia_monitorear) as any]}>
            <AppText style={styles.statusIcon}>
              {data.urgencia === 'urgente' ? '🚨' : data.urgencia === 'programar' ? '📅' : '👁️'}
            </AppText>
            <View style={styles.statusContent}>
              <AppText style={styles.statusLabel}>
                {data.urgencia === 'urgente'
                  ? 'Enviar técnico hoy (Urgente)'
                  : data.urgencia === 'programar'
                  ? 'Programar visita esta semana'
                  : 'Monitorear — sin intervención inmediata'}
              </AppText>
            </View>
          </View>
        )}

        {/* Banner de Tareas Resumen */}
        {data.tareas_resumen && (
          <View style={styles.summaryBanner}>
            <AppText style={styles.summaryIcon}>📋</AppText>
            <AppText style={styles.summaryText}>{data.tareas_resumen}</AppText>
          </View>
        )}
      </GlassCard>

      {/* Hallazgos del Sistema */}
      <GlassCard style={styles.card}>
        <View style={styles.sectionHeader}>
          <Lightbulb size={15} color={theme.colors.primary} />
          <AppText style={styles.sectionTitle}>Hallazgos del Sistema</AppText>
        </View>
        <View style={styles.textBlock}>
          {renderFormattedText(data.diagnostico)}
        </View>

        {data.impacto && (
          <View style={styles.impactBox}>
            <AppText style={styles.impactLabel}>Impacto estimado:</AppText>
            <AppText style={styles.impactText}>{data.impacto}</AppText>
          </View>
        )}
      </GlassCard>

      {/* Pasos a Seguir */}
      {data.acciones && data.acciones.length > 0 && (
        <GlassCard style={styles.card}>
          <View style={styles.sectionHeader}>
            <Settings size={15} color={theme.colors.success} />
            <AppText style={styles.sectionTitle}>Pasos a Seguir</AppText>
          </View>
          <View style={styles.actionsList}>
            {data.acciones.map((accion, idx) => (
              <View key={idx} style={styles.actionItem}>
                <View style={styles.actionNumberBox}>
                  <AppText style={styles.actionNumber}>{idx + 1}</AppText>
                </View>
                <AppText style={styles.actionText}>{accion}</AppText>
              </View>
            ))}
          </View>
        </GlassCard>
      )}
    </View>
  )
}

function priorityBg(priority: string): string {
  const p = priority.toUpperCase()
  if (p === 'ALTA' || p === 'HIGH') return 'rgba(239, 68, 68, 0.25)'
  if (p === 'MEDIA' || p === 'MEDIUM') return 'rgba(245, 158, 11, 0.25)'
  return 'rgba(16, 185, 129, 0.25)'
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  card: {
    marginBottom: 0,
    padding: theme.spacing.md,
  },
  headerCard: {
    gap: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 12,
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
    marginBottom: 4,
  },
  title: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: theme.fontFamily.bold,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  priorityText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: theme.fontFamily.bold,
    textTransform: 'uppercase',
  },
  statusRow: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: theme.radius.md,
    gap: 10,
    borderWidth: 1,
  },
  statusIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  statusContent: {
    flex: 1,
    gap: 2,
  },
  statusLabel: {
    color: '#fff',
    fontSize: 12,
    fontFamily: theme.fontFamily.bold,
  },
  statusMotivo: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10.5,
    lineHeight: 14,
    fontFamily: theme.fontFamily.regular,
  },
  // Despacho backgrounds
  despacho_si: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  despacho_remoto: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  despacho_no: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  // Urgencia backgrounds
  urgencia_urgente: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  urgencia_programar: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  urgencia_monitorear: {
    backgroundColor: 'rgba(107, 114, 128, 0.08)',
    borderColor: 'rgba(107, 114, 128, 0.2)',
  },
  summaryBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 10,
    borderRadius: theme.radius.md,
    gap: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  summaryIcon: {
    fontSize: 14,
  },
  summaryText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontFamily: theme.fontFamily.medium,
    flex: 1,
    lineHeight: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 13,
    fontFamily: theme.fontFamily.bold,
  },
  textBlock: {
    gap: 8,
  },
  bodyText: {
    color: theme.colors.textMuted,
    fontSize: 11.5,
    lineHeight: 16.5,
    fontFamily: theme.fontFamily.regular,
  },
  boldSegment: {
    fontFamily: theme.fontFamily.bold,
    color: '#fff',
  },
  fallbackRawText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: theme.fontFamily.regular,
  },
  impactBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  impactLabel: {
    color: '#fff',
    fontSize: 11,
    fontFamily: theme.fontFamily.bold,
  },
  impactText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontFamily: theme.fontFamily.regular,
  },
  actionsList: {
    gap: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  actionNumberBox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  actionNumber: {
    color: theme.colors.success,
    fontSize: 9.5,
    fontFamily: theme.fontFamily.bold,
  },
  actionText: {
    color: theme.colors.textMuted,
    fontSize: 11.5,
    lineHeight: 16.5,
    flex: 1,
    fontFamily: theme.fontFamily.regular,
  },
})
