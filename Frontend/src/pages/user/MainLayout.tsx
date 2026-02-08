import React, { useState, createContext, useContext, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import deviceService from '../../services/deviceService';

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

interface BluetoothDeviceInfo {
    id: string;
    name: string;
    status: 'connected' | 'available';
    signal: 'strong' | 'medium' | 'weak';
    device?: BluetoothDevice;
    backendId?: number;
}

const MainLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showBluetoothModal, setShowBluetoothModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
    const [feedbackResult, setFeedbackResult] = useState<{show: boolean, type: 'success' | 'error', message: string}>({show: false, type: 'success', message: ''});
    const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
    const [bluetoothDevices, setBluetoothDevices] = useState<BluetoothDeviceInfo[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [bluetoothError, setBluetoothError] = useState<string | null>(null);
    const [bluetoothSupported, setBluetoothSupported] = useState(true);
    const [isBluetoothAvailable, setIsBluetoothAvailable] = useState<boolean | null>(null);
    const [showManualEntryModal, setShowManualEntryModal] = useState(false);
    const [manualDeviceName, setManualDeviceName] = useState('');
    const [manualDeviceType, setManualDeviceType] = useState('ESP32-BLE');
    const navigate = useNavigate();
    const currentUser = authService.getCurrentUser();
    
    // Load saved devices on mount
    useEffect(() => {
        const loadSavedDevices = async () => {
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                try {
                    const result = await deviceService.listDevices(user.email);
                    if (result.success && result.devices) {
                        const devices = result.devices.map((d: any) => ({
                            id: d.device_id.toString(),
                            name: d.device_name,
                            status: d.is_active ? 'connected' : 'available',
                            signal: 'strong',
                            device: null,
                            backendId: d.device_id
                        }));
                        setBluetoothDevices(devices);
                        
                        // Set the first active device as selected
                        const activeDevice = devices.find((d: any) => d.status === 'connected');
                        if (activeDevice) {
                            setSelectedDevice(activeDevice.name);
                        }
                    }
                } catch (error) {
                    console.error('Error loading saved devices:', error);
                }
            }
        };
        
        loadSavedDevices();
    }, []);
    
    // Get user's first name from localStorage
    const getUserFirstName = () => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            return user.firstname || user.email || 'User';
        }
        return 'User';
    };

    // Check if Web Bluetooth is supported
    const checkBluetoothSupport = () => {
        if (!navigator.bluetooth) {
            setBluetoothSupported(false);
            setBluetoothError('Web Bluetooth API is not supported in your browser. Please use Chrome, Edge, or Opera.');
            return false;
        }
        setBluetoothSupported(true);
        return true;
    };

    // Check if Bluetooth is available/enabled
    const checkBluetoothAvailability = async () => {
        if (!navigator.bluetooth) {
            setIsBluetoothAvailable(false);
            return;
        }

        try {
            if (navigator.bluetooth.getAvailability) {
                const available = await navigator.bluetooth.getAvailability();
                setIsBluetoothAvailable(available);
                console.log('Bluetooth availability:', available);
            } else {
                // If getAvailability is not supported, we can't check
                setIsBluetoothAvailable(null);
                console.log('Bluetooth getAvailability not supported');
            }
        } catch (error) {
            console.error('Error checking Bluetooth availability:', error);
            setIsBluetoothAvailable(null);
        }
    };

    // Open Bluetooth modal and check availability
    const openBluetoothModal = async () => {
        setShowLogoutModal(false);
        setShowBluetoothModal(true);
        setBluetoothError(null);
        checkBluetoothSupport();
        await checkBluetoothAvailability();
        
        // Listen for Bluetooth availability changes
        if (navigator.bluetooth && 'addEventListener' in navigator.bluetooth) {
            navigator.bluetooth.addEventListener('availabilitychanged', (event: any) => {
                console.log('Bluetooth availability changed:', event.value);
                setIsBluetoothAvailable(event.value);
            });
        }
    };

    // Add device manually
    const addManualDevice = async () => {
        if (!manualDeviceName.trim()) {
            setBluetoothError('Please enter a device name');
            return;
        }

        const storedUser = localStorage.getItem('currentUser');
        if (!storedUser) {
            setBluetoothError('Please log in to add devices');
            return;
        }

        try {
            const user = JSON.parse(storedUser);
            const result = await deviceService.pairDevice(
                user.email,
                manualDeviceName,
                manualDeviceType,
                `manual-${Date.now()}`
            );

            if (result.success) {
                const newDevice: BluetoothDeviceInfo = {
                    id: result.device.device_id.toString(),
                    name: manualDeviceName,
                    status: 'available',
                    signal: 'strong',
                    backendId: result.device.device_id
                };

                setBluetoothDevices(prev => [...prev, newDevice]);
                setShowManualEntryModal(false);
                setManualDeviceName('');
                setBluetoothError(null);
                
                // Show success message
                setFeedbackResult({
                    show: true,
                    type: 'success',
                    message: 'Device added successfully!'
                });
            } else {
                setBluetoothError(result.message || 'Failed to add device');
            }
        } catch (error: any) {
            console.error('Error adding manual device:', error);
            setBluetoothError('Failed to add device: ' + error.message);
        }
    };

    // Scan for Bluetooth devices
    const scanForDevices = async () => {
        if (!checkBluetoothSupport()) {
            return;
        }

        setIsScanning(true);
        setBluetoothError(null);

        try {
            // Check availability one more time before scanning
            await checkBluetoothAvailability();
            
            // Request Bluetooth device with filters for ESP32 and common BLE devices
            const device = await navigator.bluetooth.requestDevice({
                filters: [
                    { namePrefix: 'ESP32' },
                    { namePrefix: 'Arduino' },
                    { namePrefix: 'HC-' },
                    { namePrefix: 'Drowsiness' },
                    { services: ['battery_service'] },
                    { services: ['device_information'] }
                ],
                optionalServices: [
                    'battery_service',
                    'device_information',
                    '0000ffe0-0000-1000-8000-00805f9b34fb' // Generic UART service UUID
                ]
            });

            // If we got here, Bluetooth is available
            setIsBluetoothAvailable(true);

            if (device && device.name) {
                const newDevice: BluetoothDeviceInfo = {
                    id: device.id || `device-${Date.now()}`,
                    name: device.name,
                    status: 'available',
                    signal: 'strong',
                    device: device
                };

                // Check if device already exists in state
                setBluetoothDevices(prevDevices => {
                    const exists = prevDevices.some(d => d.id === newDevice.id);
                    if (exists) {
                        return prevDevices;
                    }
                    return [...prevDevices, newDevice];
                });
                
                // Save device to backend
                const storedUser = localStorage.getItem('currentUser');
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    try {
                        await deviceService.pairDevice(
                            user.email,
                            device.name,
                            'ESP32-BLE',
                            device.id
                        );
                        console.log('Device saved to backend');
                    } catch (error) {
                        console.error('Error saving device to backend:', error);
                    }
                }
            }
        } catch (error: any) {
            console.error('Bluetooth scan error:', error);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            
            if (error.name === 'NotFoundError') {
                setBluetoothError('No Bluetooth device selected. Please try again.');
            } else if (error.name === 'SecurityError') {
                setBluetoothError('Bluetooth access was denied. Please check your browser permissions.');
            } else if (error.message && (error.message.includes('Bluetooth adapter not available') || error.message.includes('BLUETOOTH_LOW_ENERGY_NOT_AVAILABLE'))) {
                setBluetoothError('Bluetooth is not enabled on your device. Please turn on Bluetooth in your system settings and try again.');
                setIsBluetoothAvailable(false);
            } else if (error.message && error.message.includes('User cancelled')) {
                // User cancelled the dialog, no error message needed
                setBluetoothError(null);
            } else if (error.name === 'NotAllowedError') {
                setBluetoothError('Bluetooth permission was denied. Please allow Bluetooth access.');
            } else {
                setBluetoothError(error.message || 'Failed to scan for Bluetooth devices. Make sure Bluetooth is enabled in your system settings.');
            }
        } finally {
            setIsScanning(false);
        }
    };

    // Connect to a Bluetooth device
    const connectToDevice = async (deviceInfo: BluetoothDeviceInfo) => {
        try {
            if (deviceInfo.device && deviceInfo.device.gatt) {
                await deviceInfo.device.gatt.connect();
                setSelectedDevice(deviceInfo.name);
                
                // Update device status in state
                setBluetoothDevices(prevDevices => 
                    prevDevices.map(d => 
                        d.id === deviceInfo.id 
                            ? { ...d, status: 'connected' as const }
                            : { ...d, status: 'available' as const }
                    )
                );
                
                // Update backend if device has backendId
                if (deviceInfo.backendId) {
                    const storedUser = localStorage.getItem('currentUser');
                    if (storedUser) {
                        const user = JSON.parse(storedUser);
                        try {
                            await deviceService.updateConnection(user.email, deviceInfo.backendId);
                            await deviceService.updateDevice(user.email, deviceInfo.backendId, { is_active: true });
                        } catch (error) {
                            console.error('Error updating device in backend:', error);
                        }
                    }
                }
            } else {
                setSelectedDevice(deviceInfo.name);
                setBluetoothDevices(prevDevices => 
                    prevDevices.map(d => 
                        d.id === deviceInfo.id 
                            ? { ...d, status: 'connected' as const }
                            : { ...d, status: 'available' as const }
                    )
                );
            }
            setShowBluetoothModal(false);
        } catch (error: any) {
            console.error('Connection error:', error);
            setBluetoothError('Failed to connect to device: ' + (error.message || 'Unknown error'));
        }
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleLogoutClick = () => {
        setShowBluetoothModal(false);
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

                    {/* Device Connected Section */}
                    <div 
                        onClick={(e) => {
                            e.stopPropagation();
                            openBluetoothModal();
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
                            onClick={handleFeedbackClick}
                            className="block w-full text-left py-2 px-4 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 cursor-pointer"
                        >
                            Feedback
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
                    <div className="bg-white rounded-lg p-6 shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Bluetooth Devices</h2>
                            <button
                                onClick={() => {
                                    setShowBluetoothModal(false);
                                    setBluetoothError(null);
                                }}
                                className="text-gray-600 hover:text-gray-800 cursor-pointer"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>

                        {/* Step-by-step Instructions */}
                        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-blue-900 mb-2">How to Connect Your Device</h3>
                                    <ol className="text-xs text-blue-800 space-y-2 list-decimal list-inside">
                                        <li className="font-semibold">
                                            <span className="font-normal">First, pair your ESP32/Arduino device in your computer's Bluetooth settings</span>
                                            <ul className="ml-6 mt-1 space-y-1 list-disc list-inside font-normal">
                                                <li><strong>Windows:</strong> Settings → Bluetooth & devices → Add device</li>
                                                <li><strong>Mac:</strong> System Preferences → Bluetooth → Connect</li>
                                                <li><strong>Linux:</strong> Bluetooth settings → Pair new device</li>
                                            </ul>
                                        </li>
                                        <li className="font-semibold mt-2">
                                            <span className="font-normal">Once paired in your OS, click <strong>"Recognize Connected Device"</strong> below</span>
                                        </li>
                                        <li className="font-semibold">
                                            <span className="font-normal">Select your device from the browser popup</span>
                                        </li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        {/* Bluetooth Not Enabled Warning */}
                        {isBluetoothAvailable === false && (
                            <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0">
                                        <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-amber-900 mb-1">Bluetooth May Not Be Enabled</h3>
                                        <p className="text-xs text-amber-800 mb-2">
                                            If you just enabled Bluetooth, try clicking "Scan for Devices" to connect. If scanning fails:
                                        </p>
                                        <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside mb-2">
                                            <li>Windows: Settings → Bluetooth & devices → Turn on</li>
                                            <li>Mac: System Preferences → Bluetooth → Turn On</li>
                                            <li>Chrome: Check that Bluetooth permission is allowed</li>
                                        </ul>
                                        <button
                                            onClick={checkBluetoothAvailability}
                                            className="px-3 py-1 bg-amber-600 text-white rounded text-xs font-medium hover:bg-amber-700 transition-colors"
                                        >
                                            Recheck Status
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Main Action Button */}
                        <div className="mb-4">
                            <button
                                onClick={scanForDevices}
                                disabled={isScanning || !bluetoothSupported}
                                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                            >
                                {isScanning ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span className="font-medium">Looking for device...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 2L17 7L13 11L17 15L12 20V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M7 7L12 12L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        <span className="font-semibold">Recognize Connected Device</span>
                                    </>
                                )}
                            </button>
                            <p className="text-xs text-center text-gray-500 mt-2">
                                Make sure your device is paired in your OS Bluetooth settings first
                            </p>
                        </div>

                        {/* Alternative Option */}
                        <div className="mb-4 text-center">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="bg-white px-2 text-gray-500">OR</span>
                                </div>
                            </div>
                        </div>
                        <div className="mb-4">
                            <button
                                onClick={() => {
                                    setShowManualEntryModal(true);
                                    setManualDeviceName('');
                                    setBluetoothError(null);
                                }}
                                className="w-full px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center gap-2 border-2 border-gray-300"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span className="font-medium">Enter Device Name Manually</span>
                            </button>
                            <p className="text-xs text-center text-gray-500 mt-2">
                                If you know your device name and it's already paired
                            </p>
                        </div>

                        {/* Error Message */}
                        {bluetoothError && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-semibold text-red-800 mb-1">Bluetooth Error</p>
                                        <p className="text-sm text-red-700">{bluetoothError}</p>
                                        {bluetoothError.includes('not available') || bluetoothError.includes('enable Bluetooth') ? (
                                            <p className="text-sm text-red-700 mt-2 font-medium">
                                                Please enable Bluetooth on your device and try again.
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bluetooth not supported message */}
                        {!bluetoothSupported && (
                            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-sm text-yellow-800">
                                        Web Bluetooth is not supported in your browser. Please use Chrome, Edge, or Opera on a device with Bluetooth capability.
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        {/* Device List */}
                        {bluetoothDevices.length > 0 ? (
                            <div className="space-y-3 mb-6">
                                <p className="text-sm text-gray-600 font-medium">Found Devices ({bluetoothDevices.length})</p>
                                {bluetoothDevices.map((device) => (
                                    <div
                                        key={device.id}
                                        onClick={() => connectToDevice(device)}
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
                        ) : (
                            <div className="mb-6 p-6 text-center bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border-2 border-dashed border-blue-200">
                                <div className="w-16 h-16 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                    </svg>
                                </div>
                                <p className="font-bold text-gray-800 mb-2">Ready to Connect!</p>
                                <p className="text-sm text-gray-600 mb-4">
                                    No devices connected yet. Follow these simple steps:
                                </p>
                                <div className="text-sm text-left bg-white p-4 rounded-lg border border-blue-200 mb-4 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                                        <p className="text-gray-700 flex-1">
                                            <strong className="text-blue-700">Pair in OS:</strong> Go to your computer's Bluetooth settings and pair your ESP32/Arduino device
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                                        <p className="text-gray-700 flex-1">
                                            <strong className="text-blue-700">Recognize:</strong> Click the <strong>"Recognize Connected Device"</strong> button above
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                                        <p className="text-gray-700 flex-1">
                                            <strong className="text-blue-700">Select:</strong> Choose your device from the browser popup
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                                    <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <span>Device must be powered on and within range</span>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    setShowBluetoothModal(false);
                                    setBluetoothError(null);
                                }}
                                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
                            >
                                Close
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

            {/* Manual Device Entry Modal */}
            {showManualEntryModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Add Device Manually</h2>
                            <button
                                onClick={() => {
                                    setShowManualEntryModal(false);
                                    setManualDeviceName('');
                                    setBluetoothError(null);
                                }}
                                className="text-gray-600 hover:text-gray-800 cursor-pointer"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4">
                            If your device is already paired in your computer's Bluetooth settings, you can simply enter its name here to add it to your dashboard.
                        </p>
                        
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-xs text-blue-800">
                                <strong>Tip:</strong> You can find your device name in your computer's Bluetooth settings under "Paired devices" or "Connected devices".
                            </p>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Device Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={manualDeviceName}
                                onChange={(e) => setManualDeviceName(e.target.value)}
                                placeholder="e.g., ESP32-Drowsiness-001"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Enter the exact name of your Bluetooth device as it appears in your system's Bluetooth settings.
                            </p>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Device Type
                            </label>
                            <select
                                value={manualDeviceType}
                                onChange={(e) => setManualDeviceType(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="ESP32-BLE">ESP32 (Bluetooth Low Energy)</option>
                                <option value="Arduino-BT">Arduino (Bluetooth)</option>
                                <option value="HC-05">HC-05 Module</option>
                                <option value="HC-06">HC-06 Module</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {bluetoothError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800">{bluetoothError}</p>
                            </div>
                        )}
                        
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowManualEntryModal(false);
                                    setManualDeviceName('');
                                    setBluetoothError(null);
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addManualDevice}
                                disabled={!manualDeviceName.trim()}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add Device
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
