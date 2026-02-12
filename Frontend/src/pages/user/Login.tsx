import DrowsinessLogo from '../../component/img/Drowsiness-Logo.png';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import authService from '../../services/authService';
import TwoFactorModal from '../../components/TwoFactorModal';

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

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
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
        } catch (err) {
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
        } catch (err) {
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

                        {/* Remember Me and Sign Up Link */}
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
                                onClick={() => navigate('/user/signup')}
                                className="text-white text-sm font-light hover:text-gray-200 transition-colors underline cursor-pointer"
                            >
                                Don't have an account?
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
        </div>
    );
}

export default Login;
