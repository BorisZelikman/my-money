import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { LoginPage, WelcomePage } from '@/features/auth'
import { ProfilePage } from '@/features/profile'
import { OperationsPage } from '@/features/operations'
import { MutualsPage } from '@/features/mutuals'
import { ErrorBoundary, PageTransition } from '@/components/ui'

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/login"
          element={
            <ErrorBoundary>
              <PageTransition>
                <LoginPage />
              </PageTransition>
            </ErrorBoundary>
          }
        />
        <Route
          path="/welcome"
          element={
            <ErrorBoundary>
              <PageTransition>
                <WelcomePage />
              </PageTransition>
            </ErrorBoundary>
          }
        />
        <Route
          path="/profile"
          element={
            <ErrorBoundary>
              <PageTransition>
                <ProfilePage />
              </PageTransition>
            </ErrorBoundary>
          }
        />
        <Route
          path="/operations"
          element={
            <ErrorBoundary>
              <PageTransition>
                <OperationsPage />
              </PageTransition>
            </ErrorBoundary>
          }
        />
        <Route
          path="/mutuals"
          element={
            <ErrorBoundary>
              <PageTransition>
                <MutualsPage />
              </PageTransition>
            </ErrorBoundary>
          }
        />
        <Route path="/" element={<Navigate to="/profile" replace />} />
        <Route path="*" element={<Navigate to="/profile" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export function Router() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
