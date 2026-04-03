import { useEffect } from 'react'
import { ToastProvider } from './contexts/ToastContext'
import { ToastContainer } from './components/Toast'
import DashboardPage from './pages/DashboardPage'
import { pingHealth } from './services/api'

const KEEP_ALIVE_INTERVAL_MS = 8 * 60 * 1000 // 8 minutos

function App() {
  useEffect(() => {
    pingHealth()
    const id = setInterval(pingHealth, KEEP_ALIVE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <ToastProvider>
      <DashboardPage />
      <ToastContainer />
    </ToastProvider>
  )
}

export default App
