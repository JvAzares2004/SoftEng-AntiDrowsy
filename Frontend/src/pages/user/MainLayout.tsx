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
        throw new Error('useSidebar must be used within MainLayout');
    }
    return context;
};

const MainLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showBluetoothModal, setShowBluetoothModal] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<string | null>('ESP32-Drowsiness');
    const navigate = useNavigate();
    const currentUser = authService.getCurrentUser();

    // Placeholder Bluetooth devices
    const bluetoothDevices = [
        { id: 1, name: 'ESP32-Drowsiness', status: 'connected', signal: 'strong' },
        { id: 2, name: 'Arduino-Alert', status: 'available', signal: 'medium' },
        { id: 3, name: 'ESP8266-Sensor', status: 'available', signal: 'weak' },
        { id: 4, name: 'HC-05 Module', status: 'available', signal: 'strong' },
    ];

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleLogoutClick = () => {
        setShowBluetoothModal(false);
        setShowLogoutModal(true);
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
                                    {currentUser.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">{currentUser.username}</p>
                                    <p className="text-xs text-gray-600">Logged In</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Device Connected Section */}
                    <div 
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowLogoutModal(false);
                            setShowBluetoothModal(true);
                        }}
                        className="mb-6 p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L17 7L13 11L17 15L12 20V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M7 7L12 12L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-800">{selectedDevice || 'No Device'}</p>
                                <p className="text-xs text-gray-600">{selectedDevice ? 'Device Connected' : 'Not Connected'}</p>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${selectedDevice ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        </div>
                    </div>
                    
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

            {/* Bluetooth Devices Modal */}
            {showBluetoothModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg p-6 shadow-xl max-w-lg w-full mx-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Available Bluetooth Devices</h2>
                            <button
                                onClick={() => setShowBluetoothModal(false)}
                                className="text-gray-600 hover:text-gray-800 cursor-pointer"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                            {bluetoothDevices.map((device) => (
                                <div
                                    key={device.id}
                                    onClick={() => {
                                        setSelectedDevice(device.name);
                                        setShowBluetoothModal(false);
                                    }}
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-blue-400 ${
                                        selectedDevice === device.name 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-gray-200 bg-white'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                                device.status === 'connected' ? 'bg-green-500' : 'bg-gray-400'
                                            }`}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 2L17 7L13 11L17 15L12 20V2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M7 7L12 12L7 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{device.name}</p>
                                                <p className="text-sm text-gray-600 capitalize">{device.status}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1 items-end h-5">
                                                {[1, 2, 3].map((bar) => (
                                                    <div
                                                        key={bar}
                                                        className={`w-1 rounded-full ${
                                                            device.signal === 'strong' ? 'bg-green-500' :
                                                            device.signal === 'medium' && bar <= 2 ? 'bg-yellow-500' :
                                                            device.signal === 'weak' && bar === 1 ? 'bg-red-500' :
                                                            'bg-gray-300'
                                                        }`}
                                                        style={{ height: `${bar * 6}px` }}
                                                    ></div>
                                                ))}
                                            </div>
                                            {selectedDevice === device.name && (
                                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowBluetoothModal(false)}
                                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
                            >
                                Done
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
