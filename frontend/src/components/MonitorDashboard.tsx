import React, { useEffect, useState, useMemo } from 'react'
import { getFleetClient, scanFleet } from '../services/api'
import type { FleetClientDetail, FleetScanResult, RollerComponent } from '../types/api'
import { useAnalysisStore } from '../store/useAnalysisStore'
import { SolutionContentModal } from './SolutionContentModal'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'

const STATUS_COLOR = {
  ok: { bg: 'rgba(0, 200, 83, 0.1)', text: '#00e676', border: 'rgba(0, 200, 83, 0.2)', label: 'Saludable' },
  warning: { bg: 'rgba(255, 160, 0, 0.1)', text: '#ffb300', border: 'rgba(255, 160, 0, 0.2)', label: 'Advertencia' },
  critical: { bg: 'rgba(211, 47, 47, 0.1)', text: '#ff5252', border: 'rgba(211, 47, 47, 0.2)', label: 'Crítico' },
  unreachable: { bg: 'rgba(100,100,100,0.1)', text: '#888', border: 'rgba(100,100,100,0.2)', label: 'Sin contacto' },
}

function formatLabel(label: string) {
  return label
    .replace(/RECOGIDA RODILLO/gi, 'Rec. Rodillo')
    .replace(/SEPARACIÓN RODILLO/gi, 'Sep. Rodillo')
    .replace(/ADF RECOGIDA RODILLO/gi, 'ADF Rec.')
    .replace(/ADF RECOGIDA/gi, 'ADF Rec.')
    .replace(/TRAY ([0-9]+)/gi, 'T$1')
    .replace(/BANDEJA ([0-9]+)/gi, 'T$1')
    .trim();
}

function StatusLegend() {
  const items = [
    { label: 'Saludable', desc: 'Consumibles > 30% y sin alertas.', color: '#00e676' },
    { label: 'Advertencia', desc: 'Consumibles 15-30% o alertas preventivas.', color: '#ffb300' },
    { label: 'Crítico', desc: 'Consumibles < 15% o alertas de error.', color: '#ff5252' },
    { label: 'Sin contacto', desc: 'No alcanzable.', color: '#888' },
  ]
  return (
    <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', padding: '12px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
      {items.map(i => (
        <div key={i.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: i.color, boxShadow: `0 0 8px ${i.color}` }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: i.color, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{i.label}:</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{i.desc}</span>
        </div>
      ))}
    </div>
  )
}

function DeviceMiniAnalysis({ device, onViewSolution }: { device: FleetScanResult, onViewSolution: (code: string) => void }) {
  const hasData = (device.top_errors && device.top_errors.length > 0) || 
                  (device.timeline_data && device.timeline_data.length > 0);

  if (!hasData) {
    return (
      <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontStyle: 'italic', marginTop: '8px' }}>
        No hay datos de análisis detallados disponibles para este periodo.
      </div>
    )
  }

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'minmax(200px, 1fr) 2fr', 
      gap: '32px', 
      marginTop: '16px', 
      padding: '20px', 
      background: 'rgba(255,255,255,0.02)', 
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.05)'
    }}>
      {/* Top Errores column */}
      <div>
        <h4 style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--hp-blue-vibrant)', margin: '0 0 12px', fontWeight: 800, letterSpacing: '0.05em' }}>Top Errores Detectados</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {device.top_errors?.map(err => (
            <div 
              key={err.code} 
              onClick={() => onViewSolution(err.code)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '8px 12px', 
                background: 'rgba(255,255,255,0.03)', 
                borderRadius: '8px', 
                border: '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--hp-blue-vibrant)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
            >
              <span style={{ 
                fontFamily: 'monospace', 
                fontSize: '0.75rem', 
                fontWeight: 700, 
                color: 'var(--hp-blue-vibrant)',
                textDecoration: 'underline'
              }}>{err.code}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-error)', fontWeight: 800 }}>{err.count}</span>
            </div>
          ))}
          {(!device.top_errors || device.top_errors.length === 0) && (
            <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Sin errores críticos registrados.</span>
          )}
        </div>
      </div>

      {/* Timeline chart column */}
      <div style={{ height: '140px', display: 'flex', flexDirection: 'column' }}>
        <h4 style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--hp-blue-vibrant)', margin: '0 0 12px', fontWeight: 800, letterSpacing: '0.05em' }}>Tendencia de Incidentes (30 días)</h4>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={device.timeline_data}>
              <defs>
                <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff5252" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ff5252" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorWarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffb300" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#ffb300" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="date" 
                hide 
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ background: '#0e121a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                itemStyle={{ padding: '2px 0' }}
                labelStyle={{ marginBottom: '4px', color: 'var(--text-dim)' }}
              />
              <Area 
                type="monotone" 
                dataKey="errors" 
                name="Errores"
                stroke="#ff5252" 
                fillOpacity={1} 
                fill="url(#colorErrors)" 
                strokeWidth={2} 
                isAnimationActive={false} 
              />
              <Area 
                type="monotone" 
                dataKey="warnings" 
                name="Advertencias"
                stroke="#ffb300" 
                fillOpacity={1}
                fill="url(#colorWarnings)"
                strokeWidth={1.5} 
                strokeDasharray="4 4"
                isAnimationActive={false} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function TelemetryGauge({ percent, label }: { percent: number | null | undefined, label: string }) {
  const value = percent ?? 0
  const color = value < 15 ? '#ff5252' : value < 30 ? '#ffb300' : '#00e676'
  
  const radius = 18
  const circumference = Math.PI * radius
  const dash = (value / 100) * circumference

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: '4px', 
      width: '74px',
      flexShrink: 0
    }}>
      <svg width="42" height="26" viewBox="0 0 46 28">
        <path 
           d="M 5,25 A 18,18 0 0,1 41,25" 
           fill="none" 
           stroke="rgba(255,255,255,0.05)" 
           strokeWidth="5" 
           strokeLinecap="round" 
        />
        <path 
           d="M 5,25 A 18,18 0 0,1 41,25" 
           fill="none" 
           stroke={color} 
           strokeWidth="5" 
           strokeDasharray={`${dash} ${circumference}`}
           strokeLinecap="round" 
           style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
        />
        <text x="23" y="24" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">{value}%</text>
      </svg>
      <span 
        title={label}
        style={{ 
          fontSize: '0.62rem', 
          color: 'var(--text-muted)', 
          textTransform: 'uppercase', 
          letterSpacing: '0.02em',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          whiteSpace: 'normal',
          textAlign: 'center',
          lineHeight: '1.2',
          height: '2.4em'
        }}
      >
        {formatLabel(label)}
      </span>
    </div>
  )
}

type StatusFilter = 'all' | 'critical' | 'warning' | 'ok' | 'unreachable'

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: 'Todos',
  critical: 'Crítico',
  warning: 'Advertencia',
  ok: 'Saludable',
  unreachable: 'Sin contacto',
}

export function MonitorDashboard() {
  const { monitorClientId, monitorModels } = useAnalysisStore()
  const [client, setClient] = useState<FleetClientDetail | null>(null)
  const [results, setResults] = useState<FleetScanResult[]>([])
  const [scanning, setScanning] = useState(false)
  const [expandedSerial, setExpandedSerial] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [viewingSolution, setViewingSolution] = useState<string | null>(null)

  useEffect(() => {
    if (!monitorClientId) return
    getFleetClient(monitorClientId).then(setClient).catch(() => setClient(null))
  }, [monitorClientId])

  useEffect(() => {
    setExpandedSerial(null)
  }, [results])

  const handleScan = async () => {
    if (!monitorClientId) return
    setScanning(true)
    try {
      const data = await scanFleet(monitorClientId, monitorModels)
      setResults(data)
    } catch {
      // keep previous results
    } finally {
      setScanning(false)
    }
  }

  const displayRows = useMemo(() => {
    if (results.length > 0) return results
    if (!client) return []
    
    let devices = client.devices
    if (monitorModels && monitorModels.length > 0) {
      devices = devices.filter(d => monitorModels.includes(d.model || 'Desconocido'))
    }

    return devices.map(d => ({
      serial: d.serial,
      location: d.location,
      status: 'unreachable' as const,
      error_count: 0,
      warning_count: 0,
      model_name: d.model || null,
      firmware: null,
      last_event_date: null,
      fuser_life_percent: null,
      black_toner_percent: null,
      roller_components: [],
      error_message: null
    }))
  }, [results, client, monitorModels])

  const kpis = useMemo(() => ({
    critical: displayRows.filter(d => d.status === 'critical').length,
    warning: displayRows.filter(d => d.status === 'warning').length,
    ok: displayRows.filter(d => d.status === 'ok').length,
    unreachable: displayRows.filter(d => d.status === 'unreachable').length,
  }), [displayRows])

  const filteredRows = useMemo(() =>
    statusFilter === 'all' ? displayRows : displayRows.filter(d => d.status === statusFilter),
    [displayRows, statusFilter]
  )

  return (
    <div className="monitor-dashboard" style={{ padding: '0 40px 40px', maxWidth: '1600px', margin: '0 auto', color: '#fff' }}>
      <header className="dashboard__subheader" style={{ marginTop: '32px', marginBottom: '32px', padding: '24px', border: 'var(--border-glass)', background: 'var(--bg-glass)', backdropFilter: 'var(--glass-blur)' }}>
        <div className="dashboard__subheader-title-group">
          <h2 className="dashboard__subheader-title" style={{ fontSize: '1.8rem', background: 'var(--text-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
            Monitor de Flota
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
             <p className="dashboard__subheader-meta" style={{ margin: 0 }}>
               {client ? <span style={{ color: '#fff', fontWeight: 600 }}>{client.name}</span> : '—'}
               {' · '}
               <span style={{ color: 'var(--text-dim)' }}>{displayRows.length} dispositivos</span>
             </p>
             {monitorModels && monitorModels.length > 0 && (
                <div style={{ display: 'flex', gap: '6px' }}>
                   {monitorModels.map(m => (
                     <span key={m} style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', fontSize: '0.7rem', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)' }}>
                       {m}
                     </span>
                   ))}
                </div>
             )}
          </div>
        </div>
        <div className="dashboard__subheader-actions">
          <button className="dashboard__btn dashboard__btn--secondary" onClick={() => {
            window.history.pushState({ viewMode: 'dashboard' }, '', '/')
            window.dispatchEvent(new CustomEvent('hp-navigation-change'))
          }}>
            Cerrar Monitor
          </button>
          <button className="dashboard__btn dashboard__btn--primary" onClick={handleScan} disabled={scanning}>
            {scanning ? 'Escaneando…' : '🔄 Sincronizar Todo'}
          </button>
        </div>
      </header>

      {/* KPI Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
        {([
          { key: 'critical', label: 'Críticos', color: '#ff5252', bg: 'rgba(211,47,47,0.08)', border: 'rgba(211,47,47,0.2)' },
          { key: 'warning',  label: 'Advertencia', color: '#ffb300', bg: 'rgba(255,160,0,0.08)', border: 'rgba(255,160,0,0.2)' },
          { key: 'ok',       label: 'Saludables', color: '#00e676', bg: 'rgba(0,200,83,0.08)', border: 'rgba(0,200,83,0.2)' },
          { key: 'unreachable', label: 'Sin contacto', color: '#888', bg: 'rgba(100,100,100,0.08)', border: 'rgba(100,100,100,0.2)' },
        ] as const).map(({ key, label, color, bg, border }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(prev => prev === key ? 'all' : key)}
            style={{
              padding: '20px 24px',
              borderRadius: '16px',
              border: `1px solid ${statusFilter === key ? color : border}`,
              background: statusFilter === key ? bg : 'var(--bg-card)',
              backdropFilter: 'blur(20px)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
              boxShadow: statusFilter === key ? `0 0 20px ${bg}` : 'none',
            }}
          >
            <div style={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>
              {kpis[key]}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {label}
            </div>
          </button>
        ))}
      </div>
      
      <StatusLegend />

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '4px' }}>Filtrar:</span>
        {(Object.keys(FILTER_LABELS) as StatusFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            style={{
              padding: '5px 14px',
              borderRadius: '20px',
              border: `1px solid ${statusFilter === f ? 'var(--hp-blue-vibrant)' : 'rgba(255,255,255,0.1)'}`,
              background: statusFilter === f ? 'rgba(0,161,255,0.15)' : 'transparent',
              color: statusFilter === f ? 'var(--hp-blue-vibrant)' : 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: statusFilter === f ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {FILTER_LABELS[f]}{f !== 'all' ? ` (${kpis[f]})` : ` (${displayRows.length})`}
          </button>
        ))}
      </div>

      {scanning && (
        <div className="dashboard__parse-errors-banner" style={{ textAlign: 'center', marginBottom: '16px', background: 'rgba(0, 161, 224, 0.05)', borderColor: 'rgba(0, 161, 224, 0.2)', color: 'var(--hp-blue-vibrant)' }}>
          Extrayendo logs de {displayRows.length} dispositivos via SDS… esto puede tomar hasta 2 minutos.
        </div>
      )}

      <div className="monitor-grid" style={{ background: 'var(--bg-card)', border: 'var(--border-glass)', borderRadius: '24px', overflow: 'hidden', backdropFilter: 'blur(20px)', boxShadow: 'var(--shadow-premium)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Número de Serie</th>
              <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ubicación</th>
              <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
              <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Telemetría</th>
              <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Errores</th>
              <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Warnings</th>
              <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Última Lectura</th>
              <th style={{ padding: '20px 24px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay dispositivos en este estado.
                </td>
              </tr>
            )}
            {filteredRows.map(device => {
              const s = STATUS_COLOR[device.status] ?? STATUS_COLOR.unreachable
              const isExpanded = expandedSerial === device.serial
              return (
                <React.Fragment key={device.serial}>
                  <tr
                    onClick={() => setExpandedSerial(isExpanded ? null : device.serial)}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s', background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent' }}
                  >
                    <td style={{ padding: '20px 24px', fontWeight: 700 }}>
                      <a 
                        href={`/${device.serial}`}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          window.history.pushState(null, '', `/${device.serial}`)
                          window.dispatchEvent(new CustomEvent('hp-navigation-change'))
                        }}
                        style={{ 
                          color: 'var(--hp-blue-vibrant)', 
                          textDecoration: 'none',
                          borderBottom: '1px solid transparent',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.borderBottomColor = 'var(--hp-blue-vibrant)')}
                        onMouseOut={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}
                      >
                        {device.serial}
                      </a>
                    </td>
                    <td style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {'location' in device ? (device as FleetScanResult).location : '—'}
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
                        {s.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 24px' }}>
                       <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <TelemetryGauge percent={device.black_toner_percent} label="Tóner" />
                          <TelemetryGauge percent={device.fuser_life_percent} label="Fusor" />
                          {(device.roller_components ?? []).map((r: RollerComponent) => (
                            <TelemetryGauge key={r.label} percent={r.percent} label={r.label} />
                          ))}
                       </div>
                    </td>
                    <td style={{ padding: '20px 24px', color: device.error_count > 0 ? '#ff5252' : 'var(--text-muted)', fontWeight: device.error_count > 0 ? 700 : 400 }}>{device.error_count}</td>
                    <td style={{ padding: '20px 24px', color: device.warning_count > 0 ? '#ffb300' : 'var(--text-muted)' }}>{device.warning_count}</td>
                    <td style={{ padding: '20px 24px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>{device.last_event_date ? new Date(device.last_event_date).toLocaleDateString('es-AR') : '—'}</td>
                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                      <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>▼</span>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${device.serial}-detail`}>
                      <td colSpan={8} style={{ padding: 0 }}>
                        <div style={{ padding: '24px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--hp-blue-vibrant)' }}>
                          {device.error_message ? (
                            <p style={{ color: '#ff5252', fontFamily: 'monospace', fontSize: '0.85rem' }}>{device.error_message}</p>
                          ) : results.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>Presioná "Sincronizar Todo" para cargar los logs de este dispositivo.</p>
                          ) : (
                            <>
                              <div style={{ display: 'flex', gap: '24px', marginBottom: '12px' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Firmware: <strong style={{ color: '#fff' }}>{device.firmware ?? '—'}</strong></span>
                                <span>Errores: <strong style={{ color: 'var(--color-error)' }}>{device.error_count}</strong></span>
                                <span>Warnings: <strong style={{ color: 'var(--color-warning)' }}>{device.warning_count}</strong></span>
                              </div>
                              
                              <DeviceMiniAnalysis 
                                device={device} 
                                onViewSolution={(code) => setViewingSolution(code)}
                              />
                              
                              <p style={{ margin: '16px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Para análisis completo, usá el flujo individual desde la pantalla principal.
                              </p>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {viewingSolution && (
        <SolutionContentModal
          code={viewingSolution}
          onClose={() => setViewingSolution(null)}
        />
      )}
    </div>
  )
}
