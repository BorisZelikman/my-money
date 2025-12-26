import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage, WelcomePage } from '@/features/auth'
import { ProfilePage } from '@/features/profile'
import { OperationsPage } from '@/features/operations'

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/operations" element={<OperationsPage />} />
        <Route path="/" element={<Navigate to="/profile" replace />} />
        <Route path="*" element={<Navigate to="/profile" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
