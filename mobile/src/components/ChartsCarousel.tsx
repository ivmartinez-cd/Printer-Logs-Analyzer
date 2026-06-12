import React, { useState, useMemo } from 'react'
import { StyleSheet, View, ScrollView, Dimensions, TouchableOpacity } from 'react-native'
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Rect, G } from 'react-native-svg'
import { AppText } from './AppText'
import { GlassCard } from './GlassCard'
import { theme } from '../theme'
import { Activity, BarChart2, Grid } from 'lucide-react-native'

const { width: screenWidth } = Dimensions.get('window')
const CARD_PADDING = 16
const PAGE_WIDTH = screenWidth - 32 - (CARD_PADDING * 2)
const CHART_WIDTH = PAGE_WIDTH - 16
const CHART_HEIGHT = 160

interface ApiEvent {
  timestamp: string
  type: string
  code: string
  code_description?: string | null
  counter?: number
}

interface TopError {
  name: string
  count: number
  severity: string
}

interface ChartsCarouselProps {
  events: ApiEvent[]
  topCodes: TopError[]
  activeSeverities: Set<string>
  onPressError?: (code: string) => void
}

export function ChartsCarousel({ events, topCodes, activeSeverities, onPressError }: ChartsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  // 1. Datos para el Gráfico de Volumen de Incidencias (SVG Line/Area)
  const volumeChartData = useMemo(() => {
    if (events.length === 0) return []

    // Encontrar rango temporal
    const timestamps = events
      .map(e => new Date(e.timestamp).getTime())
      .filter(t => !isNaN(t))
      .sort((a, b) => a - b)

    if (timestamps.length === 0) return []
    const minTime = timestamps[0]
    const maxTime = timestamps[timestamps.length - 1]
    const diff = maxTime - minTime

    // Agrupar en 8 puntos uniformes (buckets)
    const numPoints = 8
    const interval = diff === 0 ? 1 : diff / (numPoints - 1)

    const points = Array.from({ length: numPoints }, (_, idx) => {
      const targetTime = minTime + idx * interval
      return {
        timestamp: targetTime,
        label: new Date(targetTime).toLocaleDateString('es-AR', {
          day: '2-digit',
          month: 'short',
        }),
        ERROR: 0,
        WARNING: 0,
        INFO: 0,
      }
    })

    // Asignar eventos a su punto más cercano
    for (const e of events) {
      const t = new Date(e.timestamp).getTime()
      if (isNaN(t)) continue

      const type = e.type.toUpperCase()
      if (type !== 'ERROR' && type !== 'WARNING' && type !== 'INFO') continue
      if (!activeSeverities.has(type)) continue

      // Buscar el punto más cercano
      let closestIdx = 0
      let minDistance = Infinity
      for (let i = 0; i < numPoints; i++) {
        const dist = Math.abs(points[i].timestamp - t)
        if (dist < minDistance) {
          minDistance = dist
          closestIdx = i
        }
      }
      points[closestIdx][type]++
    }

    return points
  }, [events, activeSeverities])

  // Coordenadas SVG para Gráfico 1 (Volumen)
  const volumePaths = useMemo(() => {
    if (volumeChartData.length === 0) return null

    // Encontrar máximo valor para escala Y
    const maxVal = Math.max(
      ...volumeChartData.map(p => Math.max(p.ERROR, p.WARNING, p.INFO)),
      1
    )

    const getX = (index: number) => {
      return (index / (volumeChartData.length - 1)) * (CHART_WIDTH - 40) + 30
    }

    const getY = (val: number) => {
      return CHART_HEIGHT - 30 - (val / maxVal) * (CHART_HEIGHT - 50)
    }

    const errorCoords = volumeChartData.map((p, i) => ({ x: getX(i), y: getY(p.ERROR) }))
    const warningCoords = volumeChartData.map((p, i) => ({ x: getX(i), y: getY(p.WARNING) }))
    const infoCoords = volumeChartData.map((p, i) => ({ x: getX(i), y: getY(p.INFO) }))

    const createPath = (coords: { x: number; y: number }[]) => {
      if (coords.length === 0) return ''
      return coords.reduce((acc, c, i) => {
        return i === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`
      }, '')
    }

    const createAreaPath = (coords: { x: number; y: number }[]) => {
      if (coords.length === 0) return ''
      const line = createPath(coords)
      const first = coords[0]
      const last = coords[coords.length - 1]
      const bottomY = CHART_HEIGHT - 30
      return `${line} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`
    }

    return {
      errorLine: createPath(errorCoords),
      errorArea: createAreaPath(errorCoords),
      warningLine: createPath(warningCoords),
      warningArea: createAreaPath(warningCoords),
      infoLine: createPath(infoCoords),
      infoArea: createAreaPath(infoCoords),
      coords: { error: errorCoords, warning: warningCoords, info: infoCoords },
      labels: volumeChartData.map((p, i) => ({ x: getX(i), label: p.label })),
      maxVal,
    }
  }, [volumeChartData])

  // 2. Gráfico 2: Errores más Frecuentes (Vertical Bar Chart)
  const topErrorsData = useMemo(() => {
    const filtered = topCodes.filter(c => activeSeverities.has(c.severity.toUpperCase()))
    return filtered.slice(0, 5)
  }, [topCodes, activeSeverities])

  // 3. Gráfico 3: Distribución Temporal (Heatmap 7x6)
  const heatmapData = useMemo(() => {
    // 7 días de la semana (0: Lunes a 6: Domingo)
    // 6 Bloques de hora (0: 00-04, 1: 04-08, 2: 08-12, 3: 12-16, 4: 16-20, 5: 20-24)
    const grid = Array.from({ length: 7 }, () => Array(6).fill(0))

    for (const e of events) {
      const d = new Date(e.timestamp)
      const t = d.getTime()
      if (isNaN(t)) continue

      const type = e.type.toUpperCase()
      if (type !== 'ERROR') continue // Graficamos la intensidad de los errores críticos en el heatmap

      // getDay devuelve 0 para domingo, 1 para lunes... lo mapeamos a Lunes=0 ... Domingo=6
      const rawDay = d.getDay()
      const day = rawDay === 0 ? 6 : rawDay - 1

      const hour = d.getHours()
      const hourBlock = Math.min(5, Math.floor(hour / 4))

      grid[day][hourBlock]++
    }

    const maxCount = Math.max(...grid.flatMap(row => row), 1)

    return { grid, maxCount }
  }, [events])

  const daysLabel = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  const hourBlocksLabel = ['0-4', '4-8', '8-12', '12-16', '16-20', '20-24']

  return (
    <GlassCard style={styles.card}>
      {/* Header del Carrusel con Controles de Página */}
      <View style={styles.headerRow}>
        <AppText style={styles.title}>Gráficos del Período</AppText>
        <View style={styles.dotContainer}>
          {[0, 1, 2].map(idx => (
            <View
              key={idx}
              style={[
                styles.dot,
                activeIndex === idx && styles.dotActive
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          const contentOffset = e.nativeEvent.contentOffset.x
          const viewSize = e.nativeEvent.layoutMeasurement.width
          const index = Math.round(contentOffset / viewSize)
          setActiveIndex(index)
        }}
        scrollEventThrottle={16}
        style={{ width: PAGE_WIDTH }}
      >
        {/* GRÁFICO 1: Volumen de Incidencias */}
        <View style={[styles.chartPage, { width: PAGE_WIDTH }]}>
          <View style={styles.chartTitleRow}>
            <Activity size={16} color={theme.colors.primary} />
            <AppText style={styles.chartTitle}>Volumen de Incidencias (Tendencia)</AppText>
          </View>

          {volumePaths ? (
            <View style={styles.svgContainer}>
              <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                <Defs>
                  <LinearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={theme.colors.error} stopOpacity={0.25} />
                    <Stop offset="1" stopColor={theme.colors.error} stopOpacity={0.0} />
                  </LinearGradient>
                  <LinearGradient id="warnGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={theme.colors.warning} stopOpacity={0.25} />
                    <Stop offset="1" stopColor={theme.colors.warning} stopOpacity={0.0} />
                  </LinearGradient>
                  <LinearGradient id="infoGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={theme.colors.info} stopOpacity={0.25} />
                    <Stop offset="1" stopColor={theme.colors.info} stopOpacity={0.0} />
                  </LinearGradient>
                </Defs>

                {/* Líneas de cuadrícula horizontal */}
                {[0, 0.5, 1].map((ratio, i) => {
                  const y = CHART_HEIGHT - 30 - ratio * (CHART_HEIGHT - 50)
                  return (
                    <G key={i}>
                      <Path
                        d={`M 30 ${y} L ${CHART_WIDTH - 10} ${y}`}
                        stroke="rgba(255,255,255,0.06)"
                        strokeDasharray="4 4"
                      />
                      <Rect
                        x={0}
                        y={y - 8}
                        width={25}
                        height={16}
                        fill="transparent"
                      />
                      <Circle cx={15} cy={y} r={0} />
                    </G>
                  )
                })}

                {/* Áreas y líneas de severidad */}
                {activeSeverities.has('INFO') && volumePaths.infoLine ? (
                  <>
                    <Path d={volumePaths.infoArea} fill="url(#infoGrad)" />
                    <Path d={volumePaths.infoLine} stroke={theme.colors.info} strokeWidth={2} fill="none" />
                    {volumePaths.coords.info.map((c, idx) => (
                      <Circle key={idx} cx={c.x} cy={c.y} r={3} fill={theme.colors.info} />
                    ))}
                  </>
                ) : null}

                {activeSeverities.has('WARNING') && volumePaths.warningLine ? (
                  <>
                    <Path d={volumePaths.warningArea} fill="url(#warnGrad)" />
                    <Path d={volumePaths.warningLine} stroke={theme.colors.warning} strokeWidth={2} fill="none" />
                    {volumePaths.coords.warning.map((c, idx) => (
                      <Circle key={idx} cx={c.x} cy={c.y} r={3} fill={theme.colors.warning} />
                    ))}
                  </>
                ) : null}

                {activeSeverities.has('ERROR') && volumePaths.errorLine ? (
                  <>
                    <Path d={volumePaths.errorArea} fill="url(#errGrad)" />
                    <Path d={volumePaths.errorLine} stroke={theme.colors.error} strokeWidth={2} fill="none" />
                    {volumePaths.coords.error.map((c, idx) => (
                      <Circle key={idx} cx={c.x} cy={c.y} r={3} fill={theme.colors.error} />
                    ))}
                  </>
                ) : null}
              </Svg>

              {/* Etiquetas Eje X */}
              <View style={styles.xAxisRow}>
                {volumePaths.labels.filter((_, idx) => idx % 2 === 0).map((l, i) => (
                  <AppText key={i} style={styles.axisText}>
                    {l.label}
                  </AppText>
                ))}
              </View>

              {/* Leyenda */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendIndicator, { backgroundColor: theme.colors.error }]} />
                  <AppText style={styles.legendText}>Error</AppText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendIndicator, { backgroundColor: theme.colors.warning }]} />
                  <AppText style={styles.legendText}>Warning</AppText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendIndicator, { backgroundColor: theme.colors.info }]} />
                  <AppText style={styles.legendText}>Info</AppText>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <AppText style={styles.emptyText}>Sin datos de volumen de incidencias</AppText>
            </View>
          )}
        </View>

        {/* GRÁFICO 2: Errores más Frecuentes (Detalle) */}
        <View style={[styles.chartPage, { width: PAGE_WIDTH }]}>
          <View style={styles.chartTitleRow}>
            <BarChart2 size={16} color={theme.colors.primary} />
            <AppText style={styles.chartTitle}>Errores Frecuentes (Top 5)</AppText>
          </View>

          {topErrorsData.length > 0 ? (
            <View style={styles.topErrorsList}>
              {topErrorsData.map((item, idx) => {
                const maxCount = Math.max(...topErrorsData.map(c => c.count), 1)
                const percent = (item.count / maxCount) * 100
                const color = item.severity.toUpperCase() === 'ERROR'
                  ? theme.colors.error
                  : item.severity.toUpperCase() === 'WARNING'
                    ? theme.colors.warning
                    : theme.colors.info

                return (
                  <TouchableOpacity
                    key={item.name}
                    style={styles.errorBarRow}
                    activeOpacity={0.7}
                    onPress={() => onPressError?.(item.name)}
                  >
                    <AppText style={styles.errorBarLabel}>{item.name}</AppText>
                    <View style={styles.barContainer}>
                      <View style={[styles.barFill, { width: `${percent}%`, backgroundColor: color }]} />
                    </View>
                    <AppText style={styles.errorBarCount}>{item.count}</AppText>
                  </TouchableOpacity>
                )
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <AppText style={styles.emptyText}>Sin incidencias en el período activo</AppText>
            </View>
          )}
        </View>

        {/* GRÁFICO 3: Distribución Temporal (Heatmap) */}
        <View style={[styles.chartPage, { width: PAGE_WIDTH }]}>
          <View style={styles.chartTitleRow}>
            <Grid size={16} color={theme.colors.primary} />
            <AppText style={styles.chartTitle}>Frecuencia de Errores por Hora y Día</AppText>
          </View>

          <View style={styles.heatmapWrapper}>
            <View style={styles.heatmapHeaderX}>
              <View style={{ width: 30 }} />
              {hourBlocksLabel.map((lbl, idx) => (
                <AppText key={idx} style={styles.heatmapHeaderText}>
                  {lbl}
                </AppText>
              ))}
            </View>

            {daysLabel.map((dayName, dayIdx) => (
              <View key={dayIdx} style={styles.heatmapRow}>
                <AppText style={styles.heatmapRowLabel}>{dayName}</AppText>
                {Array.from({ length: 6 }).map((_, blockIdx) => {
                  const count = heatmapData.grid[dayIdx][blockIdx]
                  const opacity = count > 0 ? 0.2 + (count / heatmapData.maxCount) * 0.8 : 0.05
                  const cellColor = count > 0 ? `rgba(239, 68, 68, ${opacity})` : 'rgba(255,255,255,0.03)'
                  return (
                    <View
                      key={blockIdx}
                      style={[
                        styles.heatmapCell,
                        { backgroundColor: cellColor }
                      ]}
                    >
                      {count > 0 ? (
                        <AppText style={styles.heatmapCellText}>{count}</AppText>
                      ) : null}
                    </View>
                  )
                })}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </GlassCard>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.lg,
    padding: CARD_PADDING,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: theme.fontFamily.bold,
  },
  dotContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
    width: 14,
  },
  chartPage: {
    alignItems: 'center',
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  chartTitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: theme.fontFamily.semibold,
  },
  svgContainer: {
    alignItems: 'center',
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: CHART_WIDTH - 40,
    marginTop: 4,
    marginLeft: 20,
  },
  axisText: {
    fontSize: 9,
    color: theme.colors.textDim,
    fontFamily: theme.fontFamily.medium,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontFamily: theme.fontFamily.medium,
  },
  emptyContainer: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textDim,
    fontSize: 12,
    fontFamily: theme.fontFamily.medium,
  },
  topErrorsList: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    gap: 10,
  },
  errorBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorBarLabel: {
    color: theme.colors.primary,
    fontSize: 11,
    fontFamily: theme.fontFamily.bold,
    width: 68,
    textAlign: 'right',
  },
  barContainer: {
    flex: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  errorBarCount: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontFamily: theme.fontFamily.bold,
    width: 28,
    textAlign: 'right',
  },
  heatmapWrapper: {
    alignItems: 'center',
  },
  heatmapHeaderX: {
    flexDirection: 'row',
    marginBottom: 4,
    width: CHART_WIDTH,
  },
  heatmapHeaderText: {
    flex: 1,
    fontSize: 9,
    color: theme.colors.textDim,
    textAlign: 'center',
    fontFamily: theme.fontFamily.medium,
  },
  heatmapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    width: CHART_WIDTH,
  },
  heatmapRowLabel: {
    width: 30,
    fontSize: 9,
    color: theme.colors.textDim,
    fontFamily: theme.fontFamily.medium,
  },
  heatmapCell: {
    flex: 1,
    height: 16,
    marginHorizontal: 2,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heatmapCellText: {
    fontSize: 8,
    color: '#fff',
    fontFamily: theme.fontFamily.bold,
  },
})
