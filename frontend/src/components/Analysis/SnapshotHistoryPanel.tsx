import { useState, useEffect } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { GitCompare, TrendingUp, Loader2 } from 'lucide-react'
import { listSavedAnalyses } from '../../services/api'
import type { SavedAnalysisSummary } from '../../types/api'
import { formatDateTime } from '../../hooks/useDateFilter'

interface Props {
  currentId: string
  currentCreatedAt: string
  currentGlobalSeverity: string
  equipmentIdentifier: string
  selectedCompareId: string
  diffLoading: boolean
  onCompare: (targetId: string) => void
  onClearCompare: () => void
}

function severityToScore(sev: string): number {
  const s = (sev || '').toUpperCase()
  if (s.includes('ERROR') || s.includes('CRITICAL')) return 25
  if (s.includes('WARNING')) return 58
  if (s.includes('INFO')) return 82
  return 90
}

function scoreColor(score: number): string {
  if (score >= 75) return '#22c55e'
  if (score >= 50) return '#eab308'
  return '#ef4444'
}

interface ChartPoint {
  date: string
  score: number
  id: string
  name: string
  isCurrent: boolean
}

export function SnapshotHistoryPanel({
  currentId,
  currentCreatedAt,
  currentGlobalSeverity,
  equipmentIdentifier,
  selectedCompareId,
  diffLoading,
  onCompare,
  onClearCompare,
}: Props) {
  const [siblings, setSiblings] = useState<SavedAnalysisSummary[]>([])

  useEffect(() => {
    const ctrl = new AbortController()
    listSavedAnalyses(ctrl.signal)
      .then((all) => {
        const same = all
          .filter((s) => s.equipment_identifier === equipmentIdentifier && s.id !== currentId)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        setSiblings(same)
      })
      .catch(() => {})
    return () => ctrl.abort()
  }, [currentId, equipmentIdentifier])

  const currentScore = severityToScore(currentGlobalSeverity)

  const chartData: ChartPoint[] = [
    ...siblings.slice(-14).map((s) => ({
      date: new Date(s.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short' }),
      score: severityToScore(s.global_severity),
      id: s.id,
      name: s.name,
      isCurrent: false,
    })),
    {
      date: new Date(currentCreatedAt).toLocaleDateString('es', { day: '2-digit', month: 'short' }),
      score: currentScore,
      id: currentId,
      name: 'Actual',
      isCurrent: true,
    },
  ]

  const areaColor = scoreColor(currentScore)
  const hasHistory = siblings.length > 0

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.45)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.37)',
      borderRadius: '20px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={17} style={{ color: areaColor }} />
          Historial de Salud — {equipmentIdentifier}
          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', marginLeft: '4px' }}>
            ({chartData.length} lectura{chartData.length !== 1 ? 's' : ''})
          </span>
        </h3>

        {/* Comparison selector */}
        {hasHistory && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {selectedCompareId ? (
              <button
                type="button"
                onClick={onClearCompare}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#f87171',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                × Salir de comparación
              </button>
            ) : (
              <>
                <select
                  value={selectedCompareId}
                  onChange={(e) => e.target.value && onCompare(e.target.value)}
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#e2e8f0',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    maxWidth: '260px',
                  }}
                >
                  <option value="">Comparar con…</option>
                  {[...siblings].reverse().map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatDateTime(s.created_at)} — {s.global_severity}
                    </option>
                  ))}
                </select>
                {diffLoading && <Loader2 size={16} style={{ color: '#38bdf8', animation: 'spin 1s linear infinite' }} />}
              </>
            )}
          </div>
        )}
      </div>

      {/* Chart */}
      {chartData.length >= 2 ? (
        <div style={{ height: '120px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={areaColor} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={areaColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: '#475569', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#475569', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  color: '#e2e8f0',
                }}
                formatter={(value: number) => [`${value} / 100`, 'Health Score']}
                labelFormatter={(label: string, payload) => {
                  const pt = payload?.[0]?.payload as ChartPoint | undefined
                  return pt?.name ?? label
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke={areaColor}
                strokeWidth={2}
                fill="url(#healthGrad)"
                dot={{ fill: areaColor, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: areaColor }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>
          Guarda más lecturas para ver el historial de salud del equipo.
        </p>
      )}

      {/* Comparison active indicator */}
      {selectedCompareId && !diffLoading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: '10px',
          fontSize: '0.82rem',
          color: '#7dd3fc',
        }}>
          <GitCompare size={14} />
          Comparación activa — los gráficos muestran diferencias respecto al snapshot seleccionado.
        </div>
      )}
    </div>
  )
}
