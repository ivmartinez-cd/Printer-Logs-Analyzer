import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '../../store/useThemeStore'

interface ThemeToggleProps {
  collapsed?: boolean
}

export function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className="navigation__item theme-toggle"
      onClick={toggleTheme}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-pressed={isDark}
    >
      {isDark ? <Moon className="navigation__item-icon" /> : <Sun className="navigation__item-icon" />}
      {!collapsed && (
        <span className="navigation__item-label">{isDark ? 'Modo oscuro' : 'Modo claro'}</span>
      )}
    </button>
  )
}
