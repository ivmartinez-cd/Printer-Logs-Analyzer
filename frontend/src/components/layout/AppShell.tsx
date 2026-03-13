import { AppHeader } from './AppHeader'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-shell__content">
        <div className="app-shell__container">
          {children}
        </div>
      </main>
    </div>
  )
}
