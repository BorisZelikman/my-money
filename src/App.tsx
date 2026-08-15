import { Router } from './app/Router'
import { ErrorBoundary, ToastContainer, OfflineIndicator } from '@/components/ui'
import { useToastStore } from '@/stores/toastStore'
import { LanguagePreferenceSync } from '@/components/LanguagePreferenceSync'

function App() {
  const { toasts, removeToast } = useToastStore()

  return (
    <ErrorBoundary>
      <LanguagePreferenceSync />
      <OfflineIndicator />
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
      <Router />
    </ErrorBoundary>
  )
}

export default App
