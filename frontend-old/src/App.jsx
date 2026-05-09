import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import MemberDashboard from './pages/MemberDashboard'
import CaptainDashboard from './pages/CaptainDashboard'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/member" element={<MemberDashboard />} />
        <Route path="/captain" element={<CaptainDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
