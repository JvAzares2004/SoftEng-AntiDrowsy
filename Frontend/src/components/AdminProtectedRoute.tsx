import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import authService from '../services/authService';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for session timeout
    if (authService.checkSessionTimeout()) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    // Check local authentication state
    const authenticated = authService.isAuthenticated();
    setIsAuthenticated(authenticated);

    // Check if user is an admin
    const userRole = localStorage.getItem('userRole');
    setIsAdmin(userRole === 'admin');
    setIsLoading(false);
  }, []);

  // Update activity on user interaction
  useEffect(() => {
    const updateActivity = () => {
      authService.updateActivity();
    };

    window.addEventListener('click', updateActivity);
    window.addEventListener('keydown', updateActivity);

    return () => {
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keydown', updateActivity);
    };
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    // Redirect to user dashboard if logged in but not an admin
    return <Navigate to="/user/dashboard" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
