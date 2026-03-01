// API Configuration
// Use environment variable for API URL, fallback to localhost for development
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper function to build API endpoints
export const getApiUrl = (path: string): string => {
  return `${API_URL}${path}`;
};

export default API_URL;
