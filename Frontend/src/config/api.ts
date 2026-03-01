// API Configuration
// Determine API URL based on environment
const getDefaultApiUrl = () => {
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // If in production (not localhost), use the Railway backend URL
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    return 'https://softeng-antidrowsy-production.up.railway.app';
  }
  
  // Default to localhost for development
  return 'http://localhost:3000';
};

export const API_URL = getDefaultApiUrl();

// Helper function to build API endpoints
export const getApiUrl = (path: string): string => {
  return `${API_URL}${path}`;
};

export default API_URL;
