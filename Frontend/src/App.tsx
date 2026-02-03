import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Login from './user/Login'
import SignUp from './user/SignUp'
import TermsAndConditions from './user/TermsAndConditions'
import MainLayout from './user/MainLayout'
import Dashboard from './user/Dashboard'
import Settings from './user/Settings'
import UserManual from './user/UserManual'

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
