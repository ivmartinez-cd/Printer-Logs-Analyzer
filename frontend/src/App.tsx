import { ToastProvider } from './contexts/ToastContext'
import { ToastContainer } from './components/Toast'
import DashboardPage from './pages/DashboardPage'

function App() {
  return (
    <ToastProvider>
      <DashboardPage />
      <ToastContainer />
    </ToastProvider>
  )
}

export default App
