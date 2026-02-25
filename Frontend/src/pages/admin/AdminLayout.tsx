import React, { useState, createContext, useContext } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

import Drowsiness_Logo from '../../component/img/Drowsiness-Logo.png';

// Create context for sidebar
interface SidebarContextType {
    toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within AdminLayout');
    }
    return context;
};

const AdminLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const navigate = useNavigate();
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    
    // Get admin's first name from localStorage
    const getAdminFirstName = () => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            return user.firstname || user.username || 'Admin';
        }
        return adminUser.firstname || adminUser.username || 'Admin';
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = async () => {
        await authService.logout();
        localStorage.removeItem('adminUser');
        setShowLogoutModal(false);
        setIsSidebarOpen(false);
        navigate('/login');
    };

    const cancelLogout = () => {
        setShowLogoutModal(false);
    };

    return (
        <SidebarContext.Provider value={{ toggleSidebar }}>
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
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <img src={Drowsiness_Logo} alt="Logo" className="w-12 h-12 flex-shrink-0"/>
                        <h1 className="text-lg font-bold text-gray-800 truncate">Admin Panel</h1>
                    </div>
                    <button 
                        onClick={toggleSidebar}
                        className="text-gray-600 hover:text-gray-800 md:hidden flex-shrink-0 ml-2"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>
                
                <div className="p-2">
                    {/* Admin Info Section */}
                    {adminUser.username && (
                        <div className="mb-6 p-3 bg-gray-100 rounded-lg">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-[#C52233] rounded-full flex items-center justify-center text-white font-bold">
                                    {getAdminFirstName().charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">{getAdminFirstName()}</p>
                                    <p className="text-xs text-gray-600">Admin</p>
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
                            to="feedbacks"
                            onClick={() => setIsSidebarOpen(false)}
                            className={({ isActive }) =>
                                `block py-2 px-4 rounded-lg transition-colors
                                ${isActive 
                                ? "bg-gray-100 text-gray-900 font-semibold" 
                                : "text-gray-700 hover:bg-gray-100"}`
                            }
                        >
                            Feedbacks
                        </NavLink>

                        <NavLink
                            to="logs"
                            onClick={() => setIsSidebarOpen(false)}
                            className={({ isActive }) =>
                                `block py-2 px-4 rounded-lg transition-colors
                                ${isActive 
                                ? "bg-gray-100 text-gray-900 font-semibold" 
                                : "text-gray-700 hover:bg-gray-100"}`
                            }
                        >
                            Logs
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
                        
                        <button 
                            onClick={handleLogoutClick} 
                            className="block w-full text-left py-2 px-4 text-gray-700 hover:bg-red-500 hover:text-white rounded-lg transition-colors cursor-pointer"
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
        </div>
        </SidebarContext.Provider>
    );
};

export default AdminLayout;
