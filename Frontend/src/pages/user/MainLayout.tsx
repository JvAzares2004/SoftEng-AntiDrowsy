import React, { useState, createContext, useContext } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

import Drowsiness_Logo from '../../component/img/Drowsiness-Logo.png';

// Create context for sidebar
interface SidebarContextType {
    toggleSidebar: () => void;
    handleLogout: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within MainLayout');
    }
    return context;
};

const MainLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
    const [feedbackResult, setFeedbackResult] = useState<{show: boolean, type: 'success' | 'error', message: string}>({show: false, type: 'success', message: ''});
    const navigate = useNavigate();
    const currentUser = authService.getCurrentUser();
    
    // Get user's first name from localStorage
    const getUserFirstName = () => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            return user.firstname || user.email || 'User';
        }
        return 'User';
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
    };

    const handleFeedbackClick = () => {
        setShowFeedbackModal(true);
        setIsSidebarOpen(false);
        setFeedbackText('');
    };

    const handleFeedbackSubmit = async () => {
        if (!feedbackText.trim()) {
            setFeedbackResult({show: true, type: 'error', message: 'Please enter your feedback'});
            return;
        }

        setFeedbackSubmitting(true);
        try {
            const storedUser = localStorage.getItem('currentUser');
            const userEmail = storedUser ? JSON.parse(storedUser).email : null;

            if (!userEmail) {
                setFeedbackResult({show: true, type: 'error', message: 'Please log in to submit feedback'});
                setFeedbackSubmitting(false);
                return;
            }

            const response = await fetch('http://localhost:3000/feedback/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: userEmail,
                    feedback_message: feedbackText,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setFeedbackResult({show: true, type: 'success', message: 'Thank you for your feedback!'});
                setShowFeedbackModal(false);
                setFeedbackText('');
            } else {
                setFeedbackResult({show: true, type: 'error', message: data.message || 'Failed to submit feedback'});
            }
        } catch (error) {
            console.error('Feedback submission error:', error);
            setFeedbackResult({show: true, type: 'error', message: 'Failed to submit feedback. Please try again.'});
        } finally {
            setFeedbackSubmitting(false);
        }
    };

    const confirmLogout = async () => {
        await authService.logout();
        setShowLogoutModal(false);
        setIsSidebarOpen(false);
        navigate('/user/login');
    };

    const cancelLogout = () => {
        setShowLogoutModal(false);
    };

    return (
        <SidebarContext.Provider value={{ toggleSidebar, handleLogout: handleLogoutClick }}>
            <div className="flex min-h-screen relative">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 md:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white text-black/70 p-4 shadow-lg z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                <div className="w-full flex justify-between items-center p-4">
                    <div className="flex items-center gap-3">
                        <img src={Drowsiness_Logo} alt="Logo" className="w-16 h-16"/>
                        <h1 className="text-xl font-bold text-gray-800">Drowsiness Detection</h1>
                    </div>
                    <button 
                        onClick={toggleSidebar}
                        className="text-gray-600 hover:text-gray-800 md:hidden"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>
                
                <div className="p-2">
                    {/* User Info Section */}
                    {currentUser && (
                        <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-[#C52233] rounded-full flex items-center justify-center text-white font-bold">
                                    {getUserFirstName().charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">{getUserFirstName()}</p>
                                    <p className="text-xs text-gray-600">Logged In</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-800">Menu</h2>
                    </div>
                    
                    <nav className="space-y-4">
                        <NavLink
                            to="dashboard"
                            onClick={() => setIsSidebarOpen(false)}
                            className={({ isActive }) =>
                                `block py-2 px-4 rounded-lg transition-colors
                                ${isActive 
                                ? "bg-gray-100 text-gray-900 font-semibold" 
                                : "text-gray-700 hover:bg-gray-100"}`
                            }
                        >
                            Dashboard
                        </NavLink>

                        <NavLink 
                            to="settings"
                            onClick={() => setIsSidebarOpen(false)}
                            className={({ isActive }) =>
                                `block py-2 px-4 rounded-lg transition-colors
                                ${isActive 
                                ? "bg-gray-100 text-gray-900 font-semibold" 
                                : "text-gray-700 hover:bg-gray-100"}`
                            }
                        >
                            Settings
                        </NavLink>
                        
                        <NavLink 
                            to="user-manual"
                            onClick={() => setIsSidebarOpen(false)}
                            className={({ isActive }) =>
                                `block py-2 px-4 rounded-lg transition-colors
                                ${isActive 
                                ? "bg-gray-100 text-gray-900 font-semibold" 
                                : "text-gray-700 hover:bg-gray-100"}`
                            }
                        >
                            User Manual
                        </NavLink>
                        
                        <button 
                            onClick={handleFeedbackClick}
                            className="block w-full text-left py-2 px-4 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 cursor-pointer"
                        >
                            Feedback
                        </button>
                        
                        <button 
                            onClick={handleLogoutClick}
                            className="block w-full text-left py-2 px-4 rounded-lg transition-colors text-red-600 hover:bg-red-50 cursor-pointer font-semibold"
                        >
                            Logout
                        </button>
                    </nav>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 bg-gray-100 md:p-6 relative">
                {/* Outlet renders the nested route here */}
                <Outlet />
            </main>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Logout</h2>
                        <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={cancelLogout}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLogout}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback Modal */}
            {showFeedbackModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg p-6 shadow-xl max-w-lg w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Share Your Feedback</h2>
                            <button
                                onClick={() => {
                                    setShowFeedbackModal(false);
                                    setFeedbackText('');
                                }}
                                className="text-gray-600 hover:text-gray-800 cursor-pointer"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                        
                        <p className="text-gray-600 mb-4">We'd love to hear your thoughts, suggestions, or concerns about the application.</p>
                        
                        <textarea
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="Type your feedback here..."
                            rows={6}
                            disabled={feedbackSubmitting}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C52233] focus:border-transparent resize-none disabled:opacity-50 disabled:bg-gray-100"
                        />
                        
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setShowFeedbackModal(false);
                                    setFeedbackText('');
                                }}
                                disabled={feedbackSubmitting}
                                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleFeedbackSubmit}
                                disabled={feedbackSubmitting || !feedbackText.trim()}
                                className="px-6 py-2 bg-[#C52233] text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback Result Modal */}
            {feedbackResult.show && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
                        <div className="flex flex-col items-center">
                            {feedbackResult.type === 'success' ? (
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                            ) : (
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </div>
                            )}
                            <h3 className={`text-xl font-bold mb-2 ${feedbackResult.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                {feedbackResult.type === 'success' ? 'Success!' : 'Error'}
                            </h3>
                            <p className="text-gray-600 text-center mb-6">{feedbackResult.message}</p>
                            <button
                                onClick={() => setFeedbackResult({show: false, type: 'success', message: ''})}
                                className={`px-6 py-2 rounded-lg text-white font-medium transition-colors cursor-pointer ${
                                    feedbackResult.type === 'success' 
                                        ? 'bg-green-600 hover:bg-green-700' 
                                        : 'bg-red-600 hover:bg-red-700'
                                }`}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </SidebarContext.Provider>
    );
};

export default MainLayout;
