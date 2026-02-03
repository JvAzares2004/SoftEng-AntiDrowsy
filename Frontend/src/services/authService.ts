interface User {
  username: string;
}

interface LoginResult {
  success: boolean;
  message?: string;
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

  async login(username: string, password: string): Promise<LoginResult> {
    // Auto-login: accept any credentials
    const user = username || 'guest';
    this.currentUser = { username: user };
    this.lastActivity = Date.now();
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    localStorage.setItem('lastActivity', this.lastActivity.toString());
    return { success: true };
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
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
}

const authService = new AuthService();
export default authService;
