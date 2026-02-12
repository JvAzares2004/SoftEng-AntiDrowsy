interface User {
  username: string;
}

interface LoginResult {
  success: boolean;
  message?: string;
  role?: 'admin' | 'user';
  require2FA?: boolean;
}

const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

class AuthService {
  private currentUser: User | null = null;
  private lastActivity: number = Date.now();

  constructor() {
    // Check if user is logged in on initialization
    const storedUser = localStorage.getItem('currentUser');
    const storedActivity = localStorage.getItem('lastActivity');
    
    if (storedUser && storedActivity) {
      const lastActivityTime = parseInt(storedActivity);
      const now = Date.now();
      
      // Check if session is still valid
      if (now - lastActivityTime < TIMEOUT_DURATION) {
        this.currentUser = JSON.parse(storedUser);
        this.lastActivity = lastActivityTime;
      } else {
        // Session expired, clear storage
        this.logout();
      }
    }
  }

  async login(email: string, password: string): Promise<LoginResult> {
    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        this.currentUser = { username: data.user.email };
        this.lastActivity = Date.now();
        
        // Store user data and role
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('lastActivity', this.lastActivity.toString());
        
        return { success: true, role: data.role };
      } else {
        return { 
          success: false, 
          message: data.message || 'Login failed',
          require2FA: data.require2FA 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    localStorage.removeItem('lastActivity');
    localStorage.removeItem('rememberMe');
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  updateActivity(): void {
    this.lastActivity = Date.now();
    localStorage.setItem('lastActivity', this.lastActivity.toString());
  }

  checkSessionTimeout(): boolean {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivity;
    
    if (timeSinceLastActivity > TIMEOUT_DURATION) {
      this.logout();
      return true;
    }
    
    return false;
  }

  async verify2FA(email: string, code: string): Promise<LoginResult> {
    try {
      const response = await fetch('http://localhost:3000/auth/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (data.success) {
        this.currentUser = { username: data.user.email };
        this.lastActivity = Date.now();
        
        // Store user data and role
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('lastActivity', this.lastActivity.toString());
        
        return { success: true, role: data.role };
      } else {
        return { success: false, message: data.message || '2FA verification failed' };
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }
}

const authService = new AuthService();
export default authService;
