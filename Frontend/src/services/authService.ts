// Authentication Service for ESP32 Communication

const ESP32_IP = '192.168.4.1'; // Default ESP32 AP IP address
const API_BASE_URL = `http://${ESP32_IP}`;

// Development mode - set to true to use mock authentication (for testing without ESP32)
// Set to false when connected to ESP32 WiFi network
const DEV_MODE = false;

// Mock credentials for development (matches ESP32 credentials)
const MOCK_CREDENTIALS = {
  username: 'admin',
  password: 'Admin@123'
};

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: string;
}

export interface AuthStatusResponse {
  authenticated: boolean;
  user?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

class AuthService {
  private static instance: AuthService;
  private isLoggedIn: boolean = false;
  private currentUser: string | null = null;

  private constructor() {
    // Check if user is already logged in (from localStorage)
    this.isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    this.currentUser = localStorage.getItem('currentUser');
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    // Development mode - use mock authentication
    if (DEV_MODE) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (username === MOCK_CREDENTIALS.username && password === MOCK_CREDENTIALS.password) {
        this.isLoggedIn = true;
        this.currentUser = username;
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', this.currentUser);
        localStorage.setItem('lastActivity', Date.now().toString());
        
        return {
          success: true,
          message: 'Login successful (Development Mode)',
          user: username
        };
      } else {
        return {
          success: false,
          message: 'Invalid username or password.',
        };
      }
    }

    // Production mode - connect to ESP32
    try {
      const body = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
      
      console.log('Sending login request to:', `${API_BASE_URL}/api/login`);
      console.log('Request body:', body);
      console.log('Username:', username);
      console.log('Password:', password);
      
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': body.length.toString(),
        },
        body: body,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const data: LoginResponse = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        this.isLoggedIn = true;
        this.currentUser = data.user || username;
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', this.currentUser);
        localStorage.setItem('lastActivity', Date.now().toString());
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Unable to connect to ESP32. Please check your WiFi connection.',
      };
    }
  }

  async logout(): Promise<boolean> {
    // Development mode - just clear local state
    if (DEV_MODE) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.isLoggedIn = false;
      this.currentUser = null;
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('lastActivity');
      localStorage.removeItem('rememberMe');

      return true;
    }

    // Production mode - communicate with ESP32
    try {
      await fetch(`${API_BASE_URL}/api/logout`, {
        method: 'POST',
      });

      this.isLoggedIn = false;
      this.currentUser = null;
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('lastActivity');
      localStorage.removeItem('rememberMe');

      return true;
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state even if ESP32 request fails
      this.isLoggedIn = false;
      this.currentUser = null;
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('lastActivity');
      localStorage.removeItem('rememberMe');
      return false;
    }
  }

  async checkAuthStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/status`);
      const data: AuthStatusResponse = await response.json();

      if (data.authenticated) {
        this.isLoggedIn = true;
        this.currentUser = data.user || this.currentUser;
        localStorage.setItem('isLoggedIn', 'true');
        if (data.user) {
          localStorage.setItem('currentUser', data.user);
        }
        localStorage.setItem('lastActivity', Date.now().toString());
        return true;
      } else {
        this.isLoggedIn = false;
        this.currentUser = null;
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        return false;
      }
    } catch (error) {
      console.error('Auth status check error:', error);
      return false;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<LoginResponse> {
    // Development mode
    if (DEV_MODE) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (currentPassword === MOCK_CREDENTIALS.password) {
        MOCK_CREDENTIALS.password = newPassword;
        localStorage.setItem('lastActivity', Date.now().toString());
        return {
          success: true,
          message: 'Password changed successfully (Development Mode)'
        };
      } else {
        return {
          success: false,
          message: 'Current password is incorrect'
        };
      }
    }

    // Production mode
    try {
      const response = await fetch(`${API_BASE_URL}/api/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `currentPassword=${encodeURIComponent(currentPassword)}&newPassword=${encodeURIComponent(newPassword)}`,
      });

      const data: LoginResponse = await response.json();
      
      if (data.success) {
        localStorage.setItem('lastActivity', Date.now().toString());
      }

      return data;
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: 'Unable to connect to ESP32. Please check your WiFi connection.',
      };
    }
  }

  async changeUsername(currentPassword: string, newUsername: string): Promise<LoginResponse> {
    // Development mode
    if (DEV_MODE) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (currentPassword === MOCK_CREDENTIALS.password) {
        MOCK_CREDENTIALS.username = newUsername;
        this.currentUser = newUsername;
        localStorage.setItem('currentUser', newUsername);
        localStorage.setItem('lastActivity', Date.now().toString());
        return {
          success: true,
          message: 'Username changed successfully (Development Mode)',
          user: newUsername
        };
      } else {
        return {
          success: false,
          message: 'Current password is incorrect'
        };
      }
    }

    // Production mode
    try {
      const response = await fetch(`${API_BASE_URL}/api/change-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `currentPassword=${encodeURIComponent(currentPassword)}&newUsername=${encodeURIComponent(newUsername)}`,
      });

      const data: LoginResponse = await response.json();
      
      if (data.success && data.user) {
        this.currentUser = data.user;
        localStorage.setItem('currentUser', data.user);
        localStorage.setItem('lastActivity', Date.now().toString());
      }

      return data;
    } catch (error) {
      console.error('Change username error:', error);
      return {
        success: false,
        message: 'Unable to connect to ESP32. Please check your WiFi connection.',
      };
    }
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn;
  }

  getCurrentUser(): string | null {
    return this.currentUser;
  }

  // Check for session timeout (client-side check)
  checkSessionTimeout(): boolean {
    const lastActivity = localStorage.getItem('lastActivity');
    if (!lastActivity) return false;

    const now = Date.now();
    const lastActivityTime = parseInt(lastActivity);
    const sessionTimeout = 3600000; // 1 hour in milliseconds

    if (now - lastActivityTime > sessionTimeout) {
      this.logout();
      return true;
    }

    return false;
  }

  updateActivity(): void {
    if (this.isLoggedIn) {
      localStorage.setItem('lastActivity', Date.now().toString());
    }
  }

  async updateWiFiSettings(ssid: string, password: string): Promise<LoginResponse> {
    // Development mode
    if (DEV_MODE) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('WiFi settings updated (Development Mode):', { ssid, password: '***' });
      localStorage.setItem('lastActivity', Date.now().toString());
      return {
        success: true,
        message: 'WiFi settings updated successfully (Development Mode)'
      };
    }

    // Production mode - send to ESP32
    try {
      const response = await fetch(`${API_BASE_URL}/api/wifi-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `ssid=${encodeURIComponent(ssid)}&password=${encodeURIComponent(password)}`,
      });

      const data: LoginResponse = await response.json();
      
      if (data.success) {
        localStorage.setItem('lastActivity', Date.now().toString());
      }

      return data;
    } catch (error) {
      console.error('WiFi configuration error:', error);
      return {
        success: false,
        message: 'Unable to connect to ESP32. Please check your WiFi connection.',
      };
    }
  }
}

export default AuthService.getInstance();
