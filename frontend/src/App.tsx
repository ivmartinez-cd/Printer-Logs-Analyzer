import { useEffect, useState, Component, ReactNode } from 'react'
import { ToastProvider } from './contexts/ToastContext'
import { ToastContainer } from './components/Toast'
import DashboardPage from './pages/DashboardPage'
import { pingHealth, pingHealthTimed } from './services/api'

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
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: '16px',
          fontFamily: 'sans-serif',
          color: '#374151',
        }}>
          <p style={{ fontSize: '1.125rem', margin: 0 }}>Algo salió mal. Por favor recargá la página.</p>
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

function App() {
  const [serverWasCold, setServerWasCold] = useState(false)

  useEffect(() => {
    pingHealthTimed().then((ms) => {
      if (ms > COLD_START_THRESHOLD_MS) setServerWasCold(true)
    })
    const id = setInterval(pingHealth, KEEP_ALIVE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <ErrorBoundary>
      <ToastProvider>
        <DashboardPage serverWasCold={serverWasCold} />
        <ToastContainer />
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
