import DrowsinessLogo from '../../component/img/Drowsiness-Logo.png';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import API_URL from '../../config/api';

function SignUp() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        contactNumber: '',
        password: '',
        confirmPassword: ''
    });
    const [fieldErrors, setFieldErrors] = useState({
        firstName: '',
        lastName: '',
        email: '',
        contactNumber: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [isVerifyingCode, setIsVerifyingCode] = useState(false);
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [isCheckingContact, setIsCheckingContact] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [countdown, setCountdown] = useState(5);

    // Real-time validation with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.firstName && formData.firstName.length > 0) {
                const nameRegex = /^[A-Za-z\s]+$/;
                if (!nameRegex.test(formData.firstName)) {
                    setFieldErrors(prev => ({ ...prev, firstName: 'First name should only contain letters' }));
                } else {
                    setFieldErrors(prev => ({ ...prev, firstName: '' }));
                }
            } else {
                setFieldErrors(prev => ({ ...prev, firstName: '' }));
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.firstName]);

    // Auto-redirect countdown timer
    useEffect(() => {
        if (showSuccessModal && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (showSuccessModal && countdown === 0) {
            navigate('/user/login');
        }
    }, [showSuccessModal, countdown, navigate]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.lastName && formData.lastName.length > 0) {
                const nameRegex = /^[A-Za-z\s]+$/;
                if (!nameRegex.test(formData.lastName)) {
                    setFieldErrors(prev => ({ ...prev, lastName: 'Last name should only contain letters' }));
                } else {
                    setFieldErrors(prev => ({ ...prev, lastName: '' }));
                }
            } else {
                setFieldErrors(prev => ({ ...prev, lastName: '' }));
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.lastName]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (formData.email && formData.email.length > 0) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(formData.email)) {
                    setFieldErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
                    setIsCheckingEmail(false);
                } else {
                    // Email format is valid, now check availability
                    setIsCheckingEmail(true);
                    setFieldErrors(prev => ({ ...prev, email: '' }));
                    
                    try {
                        const response = await fetch(`${API_URL}/auth/check-email`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ email: formData.email }),
                        });

                        const data = await response.json();

                        if (data.success && !data.isAvailable) {
                            setFieldErrors(prev => ({ ...prev, email: 'This email is already registered' }));
                        } else if (data.success && data.isAvailable) {
                            setFieldErrors(prev => ({ ...prev, email: '' }));
                        }
                    } catch (err) {
                        console.error('Error checking email availability:', err);
                        // Don't show error to user, just log it
                    } finally {
                        setIsCheckingEmail(false);
                    }
                }
            } else {
                setFieldErrors(prev => ({ ...prev, email: '' }));
                setIsCheckingEmail(false);
            }
        }, 500);

        return () => {
            clearTimeout(timer);
            setIsCheckingEmail(false);
        };
    }, [formData.email]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (formData.contactNumber && formData.contactNumber.length > 0) {
                const phoneRegex = /^[0-9+\-\s()]+$/;
                if (!phoneRegex.test(formData.contactNumber)) {
                    setFieldErrors(prev => ({ ...prev, contactNumber: 'Please enter a valid contact number' }));
                    setIsCheckingContact(false);
                } else if (formData.contactNumber.replace(/[^0-9]/g, '').length < 10) {
                    setFieldErrors(prev => ({ ...prev, contactNumber: 'Contact number must be at least 10 digits' }));
                    setIsCheckingContact(false);
                } else {
                    // Contact number format is valid, now check availability
                    setIsCheckingContact(true);
                    setFieldErrors(prev => ({ ...prev, contactNumber: '' }));
                    
                    try {
                        const response = await fetch(`${API_URL}/auth/check-contact`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ contact_number: formData.contactNumber }),
                        });

                        const data = await response.json();

                        if (data.success && !data.isAvailable) {
                            setFieldErrors(prev => ({ ...prev, contactNumber: 'This contact number is already registered' }));
                        } else if (data.success && data.isAvailable) {
                            setFieldErrors(prev => ({ ...prev, contactNumber: '' }));
                        }
                    } catch (err) {
                        console.error('Error checking contact number availability:', err);
                        // Don't show error to user, just log it
                    } finally {
                        setIsCheckingContact(false);
                    }
                }
            } else {
                setFieldErrors(prev => ({ ...prev, contactNumber: '' }));
                setIsCheckingContact(false);
            }
        }, 500);

        return () => {
            clearTimeout(timer);
            setIsCheckingContact(false);
        };
    }, [formData.contactNumber]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.password && formData.password.length > 0) {
                if (formData.password.length < 6) {
                    setFieldErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters' }));
                } else if (!/[A-Z]/.test(formData.password)) {
                    setFieldErrors(prev => ({ ...prev, password: 'Password must contain at least one uppercase letter' }));
                } else if (!/[a-z]/.test(formData.password)) {
                    setFieldErrors(prev => ({ ...prev, password: 'Password must contain at least one lowercase letter' }));
                } else if (!/[0-9]/.test(formData.password)) {
                    setFieldErrors(prev => ({ ...prev, password: 'Password must contain at least one number' }));
                } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
                    setFieldErrors(prev => ({ ...prev, password: 'Password must contain at least one special character' }));
                } else {
                    setFieldErrors(prev => ({ ...prev, password: '' }));
                }
            } else {
                setFieldErrors(prev => ({ ...prev, password: '' }));
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.password]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.confirmPassword && formData.confirmPassword.length > 0) {
                if (formData.password !== formData.confirmPassword) {
                    setFieldErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
                } else {
                    setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
                }
            } else {
                setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.confirmPassword, formData.password]);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleVerifyEmail = async () => {
        if (!formData.email) {
            setError('Please enter an email address first');
            return;
        }
        if (fieldErrors.email) {
            setError('Please enter a valid email address');
            return;
        }
        
        setError('');
        setIsSendingCode(true);
        
        try {
            const response = await fetch(`${API_URL}/auth/send-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: formData.email }),
            });

            const data = await response.json();

            if (data.success) {
                setShowVerifyModal(true);
            } else {
                setError(data.message || 'Failed to send verification code');
            }
        } catch (err) {
            setError('Failed to send verification code. Please try again.');
            console.error('Error sending verification:', err);
        } finally {
            setIsSendingCode(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!verificationCode) {
            return;
        }

        setIsVerifyingCode(true);

        try {
            const response = await fetch(`${API_URL}/auth/verify-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email: formData.email, 
                    code: verificationCode 
                }),
            });

            const data = await response.json();

            if (data.success) {
                setIsEmailVerified(true);
                setShowVerifyModal(false);
                setVerificationCode('');
                setError('');
            } else {
                setError(data.message || 'Invalid verification code');
            }
        } catch (err) {
            setError('Failed to verify code. Please try again.');
            console.error('Error verifying code:', err);
        } finally {
            setIsVerifyingCode(false);
        }
    };

    const handleCloseModal = () => {
        setShowVerifyModal(false);
        setVerificationCode('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        // For contact number, only allow numbers and phone-related characters
        if (name === 'contactNumber') {
            const filteredValue = value.replace(/[^0-9+\-\s()]/g, '').slice(0, 15);
            setFormData(prev => ({
                ...prev,
                [name]: filteredValue
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Check if there are any field errors
        const hasFieldErrors = Object.values(fieldErrors).some(error => error !== '');
        if (hasFieldErrors) {
            setError('Please fix the errors in the form');
            setIsLoading(false);
            return;
        }

        // Validation
        if (!formData.firstName || !formData.lastName || !formData.email || 
            !formData.contactNumber || !formData.password || !formData.confirmPassword) {
            setError('Please fill in all fields');
            setIsLoading(false);
            return;
        }

        // Check if email is verified
        if (!isEmailVerified) {
            setError('Please verify your email before signing up');
            setIsLoading(false);
            return;
        }

        // Check if passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstname: formData.firstName,
                    lastname: formData.lastName,
                    email: formData.email,
                    contact_number: formData.contactNumber,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Show success modal instead of navigating immediately
                setShowSuccessModal(true);
                setCountdown(5); // Reset countdown
            } else {
                setError(data.message || 'Failed to create account');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
            console.error('Error during signup:', err);
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

            {/* Centered SignUp Container */}
            <div className="flex flex-col justify-center items-center flex-1 p-4 py-8">
                <div className="flex flex-col gap-4 bg-[#C52233] px-8 py-8 md:px-10 rounded-xl w-full max-w-md shadow-lg">

                    <h1 className="text-white text-2xl font-semibold text-center">Create your account</h1>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    {/* SignUp Form */}
                    <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                        {/* Name Fields */}
                        <div className="flex flex-col gap-4">
                            <div>
                                <input
                                    type="text"
                                    name="firstName"
                                    placeholder="First Name"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    disabled={isLoading}
                                    className="text-white text-md font-light border border-white rounded-lg px-4 py-3 bg-transparent placeholder-white disabled:opacity-50 w-full"
                                />
                                {fieldErrors.firstName && (
                                    <p className="text-red-200 text-xs mt-1">{fieldErrors.firstName}</p>
                                )}
                            </div>
                            <div>
                                <input
                                    type="text"
                                    name="lastName"
                                    placeholder="Last Name"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    disabled={isLoading}
                                    className="text-white text-md font-light border border-white rounded-lg px-4 py-3 bg-transparent placeholder-white disabled:opacity-50 w-full"
                                />
                                {fieldErrors.lastName && (
                                    <p className="text-red-200 text-xs mt-1">{fieldErrors.lastName}</p>
                                )}
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        disabled={isLoading || isEmailVerified}
                                        className="text-white text-md font-light border border-white rounded-lg px-4 py-3 bg-transparent placeholder-white disabled:opacity-50 w-full"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleVerifyEmail}
                                    disabled={isLoading || isEmailVerified || isSendingCode || !!fieldErrors.email || isCheckingEmail}
                                    className={`px-4 py-3 rounded-lg font-semibold text-sm whitespace-nowrap transition-colors ${
                                        isEmailVerified 
                                            ? 'bg-green-500 text-white cursor-default' 
                                            : 'bg-white text-black hover:bg-gray-200 cursor-pointer'
                                    } disabled:opacity-50`}
                                >
                                    {isSendingCode ? 'Sending...' : isEmailVerified ? 'Verified' : 'Verify'}
                                </button>
                            </div>
                            {isCheckingEmail && !fieldErrors.email && (
                                <p className="text-yellow-200 text-xs mt-1">Checking email availability...</p>
                            )}
                            {fieldErrors.email && (
                                <p className="text-red-200 text-xs mt-1">{fieldErrors.email}</p>
                            )}
                            {!isCheckingEmail && !fieldErrors.email && formData.email && formData.email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                                <p className="text-green-200 text-xs mt-1">Email is available</p>
                            )}
                        </div>

                        {/* Contact Number */}
                        <div>
                            <input
                                type="tel"
                                name="contactNumber"
                                placeholder="Contact Number"
                                value={formData.contactNumber}
                                onChange={handleInputChange}
                                disabled={isLoading}
                                maxLength={15}
                                className="text-white text-md font-light border border-white rounded-lg px-4 py-3 bg-transparent placeholder-white disabled:opacity-50 w-full"
                            />
                            {isCheckingContact && !fieldErrors.contactNumber && (
                                <p className="text-yellow-200 text-xs mt-1">Checking contact number availability...</p>
                            )}
                            {fieldErrors.contactNumber && (
                                <p className="text-red-200 text-xs mt-1">{fieldErrors.contactNumber}</p>
                            )}
                            {!isCheckingContact && !fieldErrors.contactNumber && formData.contactNumber && formData.contactNumber.replace(/[^0-9]/g, '').length >= 10 && (
                                <p className="text-green-200 text-xs mt-1">Contact number is available</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={handleInputChange}
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
                        {fieldErrors.password && (
                            <p className="text-red-200 text-xs mt-1">{fieldErrors.password}</p>
                        )}
                    </div>

                        {/* Confirm Password */}
                        <div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    placeholder="Confirm Password"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
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
                            {fieldErrors.confirmPassword && (
                                <p className="text-red-200 text-xs mt-1">{fieldErrors.confirmPassword}</p>
                            )}
                        </div>

                        {/* Terms and Conditions */}
                        <div className="flex flex-row items-center space-x-2">
                            <input 
                                type="checkbox" 
                                checked={acceptedTerms}
                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                                disabled={isLoading}
                                className="border border-white w-5 h-5 checked:bg-white checked:border-white rounded-sm text-black disabled:opacity-50 cursor-pointer" 
                            />
                            <label className="text-white text-sm font-light tracking-wide">
                                I have read the{' '}
                                <a 
                                    href="/user/terms-and-conditions" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="underline hover:text-gray-200 transition-colors cursor-pointer"
                                >
                                    Terms and Conditions
                                </a>
                            </label>
                        </div>

                        {/* Sign Up Button */}
                        <button 
                            type="submit"
                            disabled={isLoading || !acceptedTerms}
                            className="bg-white text-black border font-bold text-lg w-full py-3 rounded-lg mt-2 cursor-pointer hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Creating Account...' : 'Sign Up'}
                        </button>

                        {/* Login Link */}
                        <div className="text-white text-sm text-center mt-2">
                            <p>
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => navigate('/user/login')}
                                    className="font-semibold underline hover:text-gray-200 transition-colors cursor-pointer"
                                >
                                    Login here
                                </button>
                            </p>
                        </div>
                    </form>
                </div>
            </div>

            {/* Email Verification Modal */}
            {showVerifyModal && (
                <div className="fixed inset-0  bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl p-6 max-w-md w-full shadow-2xl animate-scaleIn">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Verify Your Email</h2>
                        <p className="text-gray-600 mb-4">
                            A verification code has been sent to <span className="font-semibold">{formData.email}</span>. Please enter the code below.
                        </p>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Enter verification code"
                            value={verificationCode}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                setVerificationCode(value);
                            }}
                            maxLength={6}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#C52233] text-center text-2xl tracking-widest"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={handleCloseModal}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleVerifyCode}
                                disabled={!verificationCode || isVerifyingCode}
                                className="flex-1 px-4 py-3 bg-[#C52233] text-white rounded-lg font-semibold hover:bg-[#a01c2a] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isVerifyingCode ? 'Verifying...' : 'Verify'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl p-8 max-w-md w-full shadow-2xl animate-scaleIn text-center">
                        {/* Success Icon */}
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                                <svg 
                                    className="w-10 h-10 text-white" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2} 
                                        d="M5 13l4 4L19 7" 
                                    />
                                </svg>
                            </div>
                        </div>
                        
                        <h2 className="text-3xl font-bold text-gray-800 mb-3">Sign Up Successful!</h2>
                        <p className="text-gray-600 mb-6">
                            Your account has been created successfully. You will be redirected to the login page in <span className="font-bold text-[#C52233]">{countdown}</span> seconds.
                        </p>
                        
                        <button
                            onClick={() => navigate('/user/login')}
                            className="w-full px-6 py-3 bg-[#C52233] text-white rounded-lg font-semibold hover:bg-[#a01c2a] transition-colors cursor-pointer shadow-lg"
                        >
                            Go to Login Now
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SignUp;
