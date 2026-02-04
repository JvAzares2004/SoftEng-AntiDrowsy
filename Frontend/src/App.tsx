import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Login from './pages/user/Login'
import SignUp from './pages/user/SignUp'
import TermsAndConditions from './pages/user/TermsAndConditions'
import MainLayout from './pages/user/MainLayout'
import Dashboard from './pages/user/Dashboard'
import Settings from './pages/user/Settings'
import UserManual from './pages/user/UserManual'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/user/login" replace />} />
      <Route path="/user/login" element={<Login />} />
      <Route path="/user/signup" element={<SignUp />} />
      <Route path="/user/terms-and-conditions" element={<TermsAndConditions />} />
      <Route
        path="/user"
        element={<MainLayout />}
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="settings" element={<Settings />} />
        <Route path="user-manual" element={<UserManual />} />
      </Route>
    </Routes>
  )
}

export default App
