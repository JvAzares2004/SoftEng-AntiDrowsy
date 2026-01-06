import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './user/Login';
import Dashboard from './user/Dashboard';
import MainLayout from './user/MainLayout';
import Settings from './user/Settings';
import UserManual from './user/UserManual';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root to Login */}
        <Route path="/" element={<Navigate to="/user/login" replace />} />

        {/* Login route */}
        <Route path="/user/login" element={<Login />} />

        {/* Layout route with nested pages */}
        <Route path="/user" element={<MainLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="settings" element={<Settings />} />
          <Route path="user-manual" element={<UserManual />} />
          {/* Add more nested routes here, e.g., settings */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
