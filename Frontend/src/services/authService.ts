// Authentication Service

// Mock credentials
const MOCK_CREDENTIALS = {
  username: 'admin',
  password: 'Admin@123'
};

export interface LoginResponse {
  success: boolean;
  message: string;
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
        message: 'Login successful',
        user: username
      };
    } else {
      return {
        success: false,
        message: 'Invalid username or password.',
      };
    }
  }

  async logout(): Promise<boolean> {
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
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (currentPassword === MOCK_CREDENTIALS.password) {
      MOCK_CREDENTIALS.password = newPassword;
      localStorage.setItem('lastActivity', Date.now().toString());
      return {
        success: true,
        message: 'Password changed successfully'
      };
    } else {
      return {
        success: false,
        message: 'Current password is incorrect'
      };
    }
  }

  async changeUsername(currentPassword: string, newUsername: string): Promise<LoginResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (currentPassword === MOCK_CREDENTIALS.password) {
      MOCK_CREDENTIALS.username = newUsername;
      this.currentUser = newUsername;
      localStorage.setItem('currentUser', newUsername);
      localStorage.setItem('lastActivity', Date.now().toString());
      return {
        success: true,
        message: 'Username changed successfully',
        user: newUsername
      };
    } else {
      return {
        success: false,
        message: 'Current password is incorrect'
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
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('WiFi settings updated:', { ssid, password: '***' });
    localStorage.setItem('lastActivity', Date.now().toString());
    return {
      success: true,
      message: 'WiFi settings updated successfully'
    };
  }
}

export default AuthService.getInstance();
