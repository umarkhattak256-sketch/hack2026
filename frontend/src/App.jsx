import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import MemberDashboard from './pages/MemberDashboard'
import CaptainDashboard from './pages/CaptainDashboard'
import AdminDashboard from './pages/AdminDashboard'
import MatchPage from './pages/MatchPage'

function RequireAuth({ children }) {
  const { user } = useAuth()
  if (!user?.id) return <Navigate to="/" replace />
  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/member" element={<RequireAuth><MemberDashboard /></RequireAuth>} />
          <Route path="/match" element={<RequireAuth><MatchPage /></RequireAuth>} />
          <Route path="/captain" element={<RequireAuth><CaptainDashboard /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
