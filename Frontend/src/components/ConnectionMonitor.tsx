import { useEffect, useState } from 'react';

const ESP32_IP = '192.168.4.1';
const CHECK_INTERVAL = 5000; // Check every 5 seconds
const TIMEOUT = 3000; // 3 second timeout for requests

const ConnectionMonitor = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
      
      const response = await fetch(`http://${ESP32_IP}/api/auth/status`, {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors',
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      // Connection failed
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkConnection();
    
    // Set up interval for periodic checks
    const intervalId = setInterval(checkConnection, CHECK_INTERVAL);
    
    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Manual retry
  const handleRetry = () => {
    checkConnection();
  };

  // Don't show modal if connected
  if (isConnected) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-lg p-8 shadow-2xl max-w-md w-full mx-4 animate-fade-in">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-red-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" 
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
          Connection Lost
        </h2>

        {/* Message */}
        <p className="text-gray-600 text-center mb-6">
          Unable to connect to the ESP32 device. Please check:
        </p>

        {/* Checklist */}
        <ul className="text-left text-sm text-gray-700 mb-6 space-y-2 bg-gray-50 p-4 rounded-lg">
          <li className="flex items-start">
            <span className="text-red-500 mr-2">•</span>
            <span>You are connected to <strong>ESP32-Network</strong> WiFi</span>
          </li>
          <li className="flex items-start">
            <span className="text-red-500 mr-2">•</span>
            <span>ESP32 device is powered on</span>
          </li>
          <li className="flex items-start">
            <span className="text-red-500 mr-2">•</span>
            <span>Device IP address is <strong>{ESP32_IP}</strong></span>
          </li>
        </ul>

        {/* Retry Button */}
        <button
          onClick={handleRetry}
          disabled={isChecking}
          className="w-full px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center"
        >
          {isChecking ? (
            <>
              <svg 
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Checking Connection...
            </>
          ) : (
            'Retry Connection'
          )}
        </button>

        {/* Additional info */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Automatically checking connection every 5 seconds...
        </p>
      </div>
    </div>
  );
};

export default ConnectionMonitor;
