import DrowsinessLogo from '../../component/img/Drowsiness-Logo.png';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import authService from '../../services/authService';
import TwoFactorModal from '../../components/TwoFactorModal';
import API_URL from '../../config/api';

function Login() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [twoFAError, setTwoFAError] = useState('');
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
    const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
    const [forgotPasswordError, setForgotPasswordError] = useState('');
    const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
    const [codeVerified, setCodeVerified] = useState(false);
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleForgotPassword = () => {
        setShowForgotPasswordModal(true);
        setForgotPasswordEmail('');
        setForgotPasswordError('');
        setForgotPasswordSuccess(false);
        setShowResetPasswordForm(false);
        setCodeVerified(false);
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleCloseForgotPassword = () => {
        setShowForgotPasswordModal(false);
        setForgotPasswordEmail('');
        setForgotPasswordError('');
        setForgotPasswordSuccess(false);
        setShowResetPasswordForm(false);
        setCodeVerified(false);
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleSubmitForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotPasswordError('');
        setForgotPasswordLoading(true);

        if (!forgotPasswordEmail) {
            setForgotPasswordError('Please enter your email');
            setForgotPasswordLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: forgotPasswordEmail }),
            });

            const data = await response.json();

            if (data.success) {
                setForgotPasswordSuccess(true);
                setForgotPasswordError('');
                setShowResetPasswordForm(true);
            } else {
                setForgotPasswordError(data.message || 'Failed to send verification code');
            }
        } catch {
            setForgotPasswordError('Failed to send verification code. Please try again.');
        } finally {
            setForgotPasswordLoading(false);
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotPasswordError('');
        setForgotPasswordLoading(true);

        if (!resetCode) {
            setForgotPasswordError('Please enter the verification code');
            setForgotPasswordLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/verify-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: forgotPasswordEmail,
                    code: resetCode,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setCodeVerified(true);
                setForgotPasswordError('');
            } else {
                setForgotPasswordError(data.message || 'Invalid verification code');
            }
        } catch {
            setForgotPasswordError('Failed to verify code. Please try again.');
        } finally {
            setForgotPasswordLoading(false);
        }
    };

    const handleSubmitResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotPasswordError('');
        setForgotPasswordLoading(true);

        if (!newPassword || !confirmPassword) {
            setForgotPasswordError('Please fill in all fields');
            setForgotPasswordLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setForgotPasswordError('Passwords do not match');
            setForgotPasswordLoading(false);
            return;
        }

        if (newPassword.length < 8) {
            setForgotPasswordError('Password must be at least 8 characters long');
            setForgotPasswordLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: forgotPasswordEmail,
                    code: resetCode,
                    newPassword: newPassword,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setForgotPasswordError('');
                // Show success message and close modal
                setTimeout(() => {
                    handleCloseForgotPassword();
                    // Optionally show a success toast or message
                    alert('Password reset successfully! Please log in with your new password.');
                }, 1000);
            } else {
                setForgotPasswordError(data.message || 'Failed to reset password');
            }
        } catch {
            setForgotPasswordError('Failed to reset password. Please try again.');
        } finally {
            setForgotPasswordLoading(false);
        }
    };

    const handleVerify2FA = async (code: string) => {
        setTwoFAError('');
        
        try {
            const result = await authService.verify2FA(email, code);
            
            if (result.success) {
                if (rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                }
                setShow2FAModal(false);
                navigate('/admin/dashboard');
            } else {
                setTwoFAError(result.message || 'Invalid verification code');
            }
        } catch {
            setTwoFAError('Verification failed. Please try again.');
        }
    };

    const handleClose2FAModal = () => {
        setShow2FAModal(false);
        setTwoFAError('');
        setEmail('');
        setPassword('');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!email || !password) {
            setError('Please enter both email and password');
            setIsLoading(false);
            return;
        }

        try {
            const result = await authService.login(email, password);
            
            if (result.success) {
                if (rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                }
                
                // Route based on role
                if (result.role === 'admin') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/user/dashboard');
                }
            } else if (result.require2FA) {
                // Admin login requires 2FA
                setShow2FAModal(true);
                setError('');
            } else {
                setError(result.message || 'Invalid email or password');
            }
        } catch {
            setError('Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="flex flex-col inter min-h-screen bg-gray-50">
            {/* Header */}
            <div className="flex flex-col items-center md:flex-row px-5 py-4 gap-2 md:gap-4 md:border-b border-b-gray-300">
                <img src={DrowsinessLogo} alt="Logo" className="w-16 h-16 md:w-16 md:h-16" />

                <div className="flex flex-col justify-center items-center">
                    <h1 className="font-semibold text-2xl md:text-3xl md:font-bold text-black inter italic">Anti Drowsy</h1>
                    <span className="text-[#DE0303] font-semibold text-xl md:text-2xl">Car Seat Sensor</span>
                </div>
            </div>

            {/* Centered Login Container */}
            <div className="flex flex-col justify-center items-center flex-1 p-4">
                <div className="flex flex-col gap-4 bg-[#C52233] px-8 py-8 md:px-10 rounded-xl w-full max-w-md shadow-lg">

                    <h1 className="text-white text-2xl font-semibold text-center">Login to your account</h1>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        {/* Username and Password Input */}
                        <div className="flex flex-col gap-4">
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                className="text-white text-md font-light border border-white rounded-lg px-4 py-3 bg-transparent placeholder-white disabled:opacity-50"
                            />
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    className="text-white text-md font-light border border-white rounded-lg px-4 py-3 pr-12 bg-transparent placeholder-white w-full disabled:opacity-50"
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    disabled={isLoading}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-200 transition-colors cursor-pointer disabled:opacity-50"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    ) : (
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me and Forgot Password Link */}
                        <div className="flex flex-row items-center justify-between">
                            <div className="flex flex-row items-center space-x-2">
                                <input 
                                    type="checkbox" 
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    disabled={isLoading}
                                    className="border border-white w-5 h-5 checked:bg-white checked:border-white rounded-sm text-black disabled:opacity-50" 
                                />
                                <label className="text-white text-sm font-light tracking-wide">Remember me</label>
                            </div>
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                className="text-white text-sm font-light hover:text-gray-200 transition-colors underline cursor-pointer"
                            >
                                Forgot password?
                            </button>
                        </div>

                        {/* Sign In Button */}
                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="bg-white text-black border font-bold text-lg w-full py-3 rounded-lg mt-2 cursor-pointer hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>

                        {/* Sign Up Link */}
                        <div className="text-center mt-2">
                            <span className="text-white text-sm font-light">
                                Don't have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => navigate('/user/signup')}
                                    className="text-white font-semibold hover:text-gray-200 transition-colors underline cursor-pointer"
                                >
                                    Sign up here
                                </button>
                            </span>
                        </div>

                    </form>
                </div>
            </div>

            {/* 2FA Modal */}
            <TwoFactorModal
                isOpen={show2FAModal}
                email={email}
                onVerify={handleVerify2FA}
                onClose={handleClose2FAModal}
                error={twoFAError}
            />

            {/* Forgot Password Modal */}
            {showForgotPasswordModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 animate-fadeIn">
                    <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4 transform animate-slideIn">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Reset Password</h2>
                            <button
                                onClick={handleCloseForgotPassword}
                                className="text-gray-600 hover:text-gray-800 cursor-pointer"
                                disabled={forgotPasswordLoading}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                        
                        {!showResetPasswordForm ? (
                            // Step 1: Enter email
                            <>
                                <p className="text-gray-600 mb-6">
                                    Enter your email address and we'll send you a verification code to reset your password.
                                </p>
                                
                                {forgotPasswordError && (
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                        <span className="block sm:inline">{forgotPasswordError}</span>
                                    </div>
                                )}
                                
                                <form onSubmit={handleSubmitForgotPassword}>
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        value={forgotPasswordEmail}
                                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                        disabled={forgotPasswordLoading}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C52233] focus:border-transparent mb-6 disabled:opacity-50 disabled:bg-gray-100"
                                    />
                                    
                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={handleCloseForgotPassword}
                                            disabled={forgotPasswordLoading}
                                            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={forgotPasswordLoading || !forgotPasswordEmail}
                                            className="px-6 py-2 bg-[#C52233] text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {forgotPasswordLoading ? 'Sending...' : 'Send Code'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : !codeVerified ? (
                            // Step 2: Verify code
                            <>
                                {forgotPasswordSuccess && (
                                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                                        <span className="block sm:inline">Verification code sent to {forgotPasswordEmail}</span>
                                    </div>
                                )}
                                
                                <p className="text-gray-600 mb-6">
                                    Enter the verification code sent to your email.
                                </p>
                                
                                {forgotPasswordError && (
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                        <span className="block sm:inline">{forgotPasswordError}</span>
                                    </div>
                                )}
                                
                                <form onSubmit={handleVerifyCode} className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Enter verification code"
                                        value={resetCode}
                                        onChange={(e) => setResetCode(e.target.value)}
                                        disabled={forgotPasswordLoading}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C52233] focus:border-transparent disabled:opacity-50 disabled:bg-gray-100"
                                    />
                                    
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={handleCloseForgotPassword}
                                            disabled={forgotPasswordLoading}
                                            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={forgotPasswordLoading || !resetCode}
                                            className="px-6 py-2 bg-[#C52233] text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {forgotPasswordLoading ? 'Verifying...' : 'Verify Code'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            // Step 3: Reset password
                            <>
                                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                                    <span className="block sm:inline">Code verified! Now enter your new password.</span>
                                </div>
                                
                                <p className="text-gray-600 mb-6">
                                    Enter your new password below.
                                </p>
                                
                                {forgotPasswordError && (
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                        <span className="block sm:inline">{forgotPasswordError}</span>
                                    </div>
                                )}
                                
                                <form onSubmit={handleSubmitResetPassword} className="space-y-4">
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            placeholder="New password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            disabled={forgotPasswordLoading}
                                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C52233] focus:border-transparent disabled:opacity-50 disabled:bg-gray-100"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            disabled={forgotPasswordLoading}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer disabled:opacity-50"
                                            aria-label={showNewPassword ? "Hide password" : "Show password"}
                                        >
                                            {showNewPassword ? (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            ) : (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            disabled={forgotPasswordLoading}
                                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C52233] focus:border-transparent disabled:opacity-50 disabled:bg-gray-100"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            disabled={forgotPasswordLoading}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer disabled:opacity-50"
                                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                        >
                                            {showConfirmPassword ? (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            ) : (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={handleCloseForgotPassword}
                                            disabled={forgotPasswordLoading}
                                            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={forgotPasswordLoading || !newPassword || !confirmPassword}
                                            className="px-6 py-2 bg-[#C52233] text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {forgotPasswordLoading ? 'Resetting...' : 'Reset Password'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Login;
