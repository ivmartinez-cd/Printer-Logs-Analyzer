export const theme = {
  colors: {
    background: '#06080c',
    surface: '#0e121a',
    surfaceLight: '#141923',
    surfaceCard: 'rgba(20, 25, 35, 0.4)',
    glass: 'rgba(14, 18, 26, 0.65)',
    border: 'rgba(255, 255, 255, 0.08)',
    borderLight: 'rgba(255, 255, 255, 0.15)',

    primary: '#00a1e0', // Azul HP Vibrante
    primaryDeep: '#0096d6',
    primaryGlow: 'rgba(0, 161, 224, 0.3)',
    accentSecondary: '#6366f1', // Indigo/Vibrant accent

    text: '#f8fafc',
    textMuted: '#94a3b8',
    textDim: '#64748b',

    // Severities
    success: '#10b981', // green
    warning: '#f59e0b', // amber
    error: '#ef4444',   // red
    info: '#3b82f6',    // blue
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  fontFamily: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
}

export type ThemeType = typeof theme
