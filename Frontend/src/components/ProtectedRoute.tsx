import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import authService from '../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // DEVELOPMENT MODE: Skip authentication check
      // Set to false to re-enable authentication
      const SKIP_AUTH = true;
      
      if (SKIP_AUTH) {
        setIsAuthenticated(true);
        setIsChecking(false);
        return;
      }

      // Check for session timeout
      if (authService.checkSessionTimeout()) {
        setIsAuthenticated(false);
        setIsChecking(false);
        return;
      }

      // Check local state first
      if (authService.isAuthenticated()) {
        // Verify with ESP32
        const isValid = await authService.checkAuthStatus();
        setIsAuthenticated(isValid);
      } else {
        setIsAuthenticated(false);
      }
      
      setIsChecking(false);
    };

    checkAuth();
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

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C52233] mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/user/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
