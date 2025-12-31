import { Router } from './app/Router'
import { ErrorBoundary, ToastContainer, OfflineIndicator } from '@/components/ui'
import { useToastStore } from '@/stores/toastStore'

function App() {
  const { toasts, removeToast } = useToastStore()

  return (
    <ErrorBoundary>
      <OfflineIndicator />
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
      <Router />
    </ErrorBoundary>
  )
}

export default App
