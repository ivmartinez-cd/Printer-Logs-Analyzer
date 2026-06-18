import { useEffect, useState, Component, ReactNode } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { ToastProvider } from './contexts/ToastContext'
import { ToastContainer } from './components/ui/Toast'
import DashboardPage from './pages/DashboardPage'
import { getHealth, type HealthStatus } from './services/api'

const KEEP_ALIVE_INTERVAL_MS = 8 * 60 * 1000 // 8 minutos
const COLD_START_THRESHOLD_MS = 3000

interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            gap: '16px',
            fontFamily: 'var(--font-sans)',
            color: '#374151',
          }}
        >
          <p style={{ fontSize: '1.125rem', margin: 0 }}>
            Algo salió mal. Por favor recargá la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              fontSize: '0.875rem',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Recargar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

interface LocationInfo {
  serial: string | null
  analysisId: string | null
  isSavedList: boolean
  isMonitor: boolean
  isAvisos: boolean
}

function parseLocation(): LocationInfo {
  const path = window.location.pathname.slice(1) // remove leading /
  
  // 1. Saved analysis detail: /analysis/[ID]
  if (path.startsWith('analysis/')) {
    const id = path.split('/')[1]
    return { serial: null, analysisId: id || null, isSavedList: false, isMonitor: false, isAvisos: false }
  }

  // 2. Saved list: /saved-analyses
  if (path === 'saved-analyses') {
    return { serial: null, analysisId: null, isSavedList: true, isMonitor: false, isAvisos: false }
  }

  // 3. Monitor: /monitor
  if (path === 'monitor') {
    return { serial: null, analysisId: null, isSavedList: false, isMonitor: true, isAvisos: false }
  }

  // 4. Avisos: /avisos
  if (path === 'avisos') {
    return { serial: null, analysisId: null, isSavedList: false, isMonitor: false, isAvisos: true }
  }

  // 5. Serial: /[SERIAL]
  if (path && /^[A-Z0-9]{5,20}$/i.test(path)) {
    return { serial: path.toUpperCase(), analysisId: null, isSavedList: false, isMonitor: false, isAvisos: false }
  }

  return { serial: null, analysisId: null, isSavedList: false, isMonitor: false, isAvisos: false }
}

function App() {
  const [serverWasCold, setServerWasCold] = useState(false)
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [locationInfo, setLocationInfo] = useState<LocationInfo>(parseLocation)

  useEffect(() => {
    // Escuchar cambios en la URL (Botón Atrás/Adelante y navegación interna)
    const handlePopState = () => {
      setLocationInfo(parseLocation())
    }
    window.addEventListener('popstate', handlePopState)
    window.addEventListener('hp-navigation-change', handlePopState as EventListener)

    const start = Date.now()
    getHealth().then((h) => {
      if (Date.now() - start > COLD_START_THRESHOLD_MS) setServerWasCold(true)
      setHealthStatus(h)
    })
    const id = setInterval(() => {
      getHealth().then(setHealthStatus)
    }, KEEP_ALIVE_INTERVAL_MS)

    return () => {
      clearInterval(id)
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('hp-navigation-change', handlePopState as EventListener)
    }
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [locationInfo])

  return (
    <ErrorBoundary>
      <ToastProvider>
        <DashboardPage 
          serverWasCold={serverWasCold} 
          healthStatus={healthStatus} 
          initialSerial={locationInfo.serial} 
          initialAnalysisId={locationInfo.analysisId}
          initialIsSavedList={locationInfo.isSavedList}
          initialIsMonitor={locationInfo.isMonitor}
          initialIsAvisos={locationInfo.isAvisos}
        />

        <ToastContainer />
      </ToastProvider>
      {import.meta.env.VITE_VERCEL && <Analytics />}
    </ErrorBoundary>
  )
}

export default App

