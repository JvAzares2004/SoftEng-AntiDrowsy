import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Login from './pages/user/Login'
import SignUp from './pages/user/SignUp'
import TermsAndConditions from './pages/user/TermsAndConditions'
import MainLayout from './pages/user/MainLayout'
import Dashboard from './pages/user/Dashboard'
import Settings from './pages/user/Settings'
import UserManual from './pages/user/UserManual'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminSettings from './pages/admin/AdminSettings'
import AdminSignUp from './pages/admin/AdminSignUp'
import AdminFeedbacks from './pages/admin/AdminFeedbacks'
import AdminLogs from './pages/admin/AdminLogs'
import AdminUsers from './pages/admin/AdminUsers'
import ProtectedRoute from './components/ProtectedRoute'
import AdminProtectedRoute from './components/AdminProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Shared Login */}
      <Route path="/login" element={<Login />} />
      
      {/* User Routes */}
      <Route path="/user/login" element={<Navigate to="/login" replace />} />
      <Route path="/user/signup" element={<SignUp />} />
      <Route path="/user/terms-and-conditions" element={<TermsAndConditions />} />
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

      {/* Admin Routes */}
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/admin/signup" element={<AdminSignUp />} />
      <Route
        path="/admin"
        element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="feedbacks" element={<AdminFeedbacks />} />
        <Route path="logs" element={<AdminLogs />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  )
}

export default App
