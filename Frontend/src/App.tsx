import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Login from './user/Login'
import MainLayout from './user/MainLayout'
import Dashboard from './user/Dashboard'
import Settings from './user/Settings'
import UserManual from './user/UserManual'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/user/login" replace />} />
      <Route path="/user/login" element={<Login />} />
      <Route
        path="/user"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="settings" element={<Settings />} />
        <Route path="user-manual" element={<UserManual />} />
      </Route>
    </Routes>
  )
}

export default App
