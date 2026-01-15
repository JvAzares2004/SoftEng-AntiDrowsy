// Authentication Service for ESP32 Communication

const ESP32_IP = '192.168.4.1'; // Default ESP32 AP IP address
const API_BASE_URL = `http://${ESP32_IP}`;

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
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      });

      const data: LoginResponse = await response.json();

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
    try {
      await fetch(`${API_BASE_URL}/api/logout`, {
        method: 'POST',
      });

      this.isLoggedIn = false;
      this.currentUser = null;
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('lastActivity');

      return true;
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state even if ESP32 request fails
      this.isLoggedIn = false;
      this.currentUser = null;
      localStorage.clear();
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
}

export default AuthService.getInstance();
