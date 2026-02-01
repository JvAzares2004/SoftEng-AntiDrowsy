import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './user/Login';
import SignupPage from './user/Signup';
import Dashboard from './user/Dashboard';
import MainLayout from './user/MainLayout';
import Settings from './user/Settings';
import UserManual from './user/UserManual';
import ProtectedRoute from './components/ProtectedRoute';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import './App.css';

function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* Redirect root to Login */}
          <Route path="/" element={<Navigate to="/user/login" replace />} />

          {/* Login route */}
          <Route path="/user/login" element={<Login />} />

          {/* Signup route */}
          <Route path="/user/signup" element={<SignupPage />} />

          {/* Protected Layout route with nested pages */}
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
      </Router>
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </>
  );
}

export default App;
