import { useState, useEffect, useRef } from 'react'
import MotorVolumeIcon from '../../component/svg/MotorVolumeIcon'
import BuzzerIcon from '../../component/svg/BuzzerIcon'
import BurgerIcon from '../../component/svg/BurgerIcon'

import PlayIcon from '../../component/svg/PlayerIcon'
import { useSidebar } from './MainLayout'
import bluetoothService from '../../services/bluetoothService'

function Dashboard() {
    const { toggleSidebar } = useSidebar()
    
    const [volumes, setVolumes] = useState([
        { type:"motor", name: "Motor Vibration", volume: 100, icon: MotorVolumeIcon },
        { type:"buzzer", name: "Buzzer Volume", volume: 100, icon: BuzzerIcon },
    ])

    // Bluetooth state
    const [isBluetoothConnected, setIsBluetoothConnected] = useState(false)
    const [bluetoothDeviceName, setBluetoothDeviceName] = useState<string | null>(null)
    const [bluetoothError, setBluetoothError] = useState<string | null>(null)
    const [isConnecting, setIsConnecting] = useState(false)
    const [hasPromptedBluetooth, setHasPromptedBluetooth] = useState(false)

    // Track testing state and cooldown per device so each can be tested independently
    const [testingDevices, setTestingDevices] = useState<Record<number, boolean>>({})
    const [testCooldowns, setTestCooldowns] = useState<Record<number, number>>({})
    const [savingDevices, setSavingDevices] = useState<Record<number, boolean>>({})
    const countdownRefs = useRef<Record<number, ReturnType<typeof setInterval> | null>>({})
    const resetRefs = useRef<Record<number, ReturnType<typeof setTimeout> | null>>({})

    const clearDeviceTimers = (index: number) => {
        const countdown = countdownRefs.current[index];
        if (countdown) {
            clearInterval(countdown);
            countdownRefs.current[index] = null;
        }

        const reset = resetRefs.current[index];
        if (reset) {
            clearTimeout(reset);
            resetRefs.current[index] = null;
        }
    }

    const clearCountdownTimer = (index: number) => {
        const countdown = countdownRefs.current[index];
        if (countdown) {
            clearInterval(countdown);
            countdownRefs.current[index] = null;
        }
    }

    // Helper function to get dynamic color based on volume
    const getVolumeColor = (volume: number) => {
        if (volume <= 25) return '#10B981' // Green - Low
        if (volume <= 50) return '#F59E0B' // Yellow - Medium
        if (volume <= 75) return '#FB923C' // Orange - High
        return '#EF4444' // Red - Very High
    }

    // Handle slider volume change
    const handleVolumeSliderChange = (index: number, newValue: number) => {
        const newVolumes = [...volumes];
        newVolumes[index].volume = newValue;
        setVolumes(newVolumes);
    }

    // Handle volume test
    const handleVolumeTest = async (index: number) => {
        const deviceType = volumes[index].type;
        const intensity = volumes[index].volume; // Use volume directly as intensity (0-100)
        
        console.log(`Testing ${volumes[index].name}: ${intensity}% intensity (3 second duration)`);

        // Check Bluetooth connection
        if (!isBluetoothConnected) {
            setBluetoothError('Please connect to ESP32 device first');
            return;
        }

        // Prevent duplicate clicks for the same device while its own test is active
        if (testingDevices[index]) {
            console.log('Test already in progress for this device');
            return;
        }

        try {
            setBluetoothError(null);
            setTestingDevices(prev => ({ ...prev, [index]: true }));
            setTestCooldowns(prev => ({ ...prev, [index]: 3 })); // 3 second test duration
            clearDeviceTimers(index);
            
            // Start countdown timer
            const countdownInterval = setInterval(() => {
                setTestCooldowns(prev => {
                    const currentCooldown = prev[index] ?? 0;
                    if (currentCooldown <= 1) {
                        clearCountdownTimer(index);
                        setTestingDevices(currentTesting => ({ ...currentTesting, [index]: false }));
                        return { ...prev, [index]: 0 };
                    }
                    return { ...prev, [index]: currentCooldown - 1 };
                });
            }, 1000);
            countdownRefs.current[index] = countdownInterval;
            
            if (deviceType === "buzzer") {
                await bluetoothService.testBuzzer(intensity);
            } else if (deviceType === "motor") {
                await bluetoothService.testVibrator(intensity);
            }
            
            console.log(`Test completed successfully`);
            
        } catch (error: unknown) {
            console.error('Test error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setBluetoothError(`Test failed: ${errorMessage}`);
            clearDeviceTimers(index);
            setTestingDevices(prev => ({ ...prev, [index]: false }));
            setTestCooldowns(prev => ({ ...prev, [index]: 0 }));
        }
    }

    const handleStopTest = async (index: number) => {
        const deviceType = volumes[index].type;

        if (!isBluetoothConnected) {
            setBluetoothError('Please connect to ESP32 device first');
            return;
        }

        try {
            setBluetoothError(null);

            if (deviceType === "buzzer") {
                await bluetoothService.controlBuzzer(false);
            } else if (deviceType === "motor") {
                await bluetoothService.controlVibrator(false);
            }

            clearDeviceTimers(index);
            setTestingDevices(prev => ({ ...prev, [index]: false }));
            setTestCooldowns(prev => ({ ...prev, [index]: 0 }));
        } catch (error: unknown) {
            console.error('Stop test error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setBluetoothError(`Stop failed: ${errorMessage}`);
        }
    }

    const handleSaveVolume = async (index: number) => {
        const deviceType = volumes[index].type;
        const intensity = volumes[index].volume;

        if (!isBluetoothConnected) {
            setBluetoothError('Please connect to ESP32 device first');
            return;
        }

        try {
            setBluetoothError(null);
            setSavingDevices(prev => ({ ...prev, [index]: true }));

            if (deviceType === "buzzer") {
                await bluetoothService.saveBuzzerIntensity(intensity);
            } else if (deviceType === "motor") {
                await bluetoothService.saveVibratorIntensity(intensity);
            }

            console.log(`${volumes[index].name} saved at ${intensity}%`);
        } catch (error: unknown) {
            console.error('Save error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setBluetoothError(`Save failed: ${errorMessage}`);
        } finally {
            setSavingDevices(prev => ({ ...prev, [index]: false }));
        }
    }

    useEffect(() => {
        const countdownTimers = countdownRefs.current;
        const resetTimers = resetRefs.current;

        return () => {
            Object.keys(countdownTimers).forEach((key) => {
                const timer = countdownTimers[Number(key)];
                if (timer) {
                    clearInterval(timer);
                }
            });

            Object.keys(resetTimers).forEach((key) => {
                const timer = resetTimers[Number(key)];
                if (timer) {
                    clearTimeout(timer);
                }
            });
        };
    }, [])

    // Connect to Bluetooth device
    const connectBluetooth = async () => {
        try {
            setIsConnecting(true);
            setBluetoothError(null);
            
            if (!bluetoothService.isSupported()) {
                setBluetoothError('Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.');
                return;
            }

            const connected = await bluetoothService.connect();
            
            if (connected) {
                setIsBluetoothConnected(true);
                setBluetoothDeviceName(bluetoothService.getDeviceName());
                console.log('Bluetooth connected successfully');
                
                // Setup status callback
                bluetoothService.onStatusChange((status) => {
                    console.log('Device status:', status);
                });
            }
        } catch (error: unknown) {
            console.error('Bluetooth connection error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            // Don't show error if user cancelled the connection
            if (errorMessage.includes('cancelled')) {
                console.log('User cancelled Bluetooth connection');
            } else {
                setBluetoothError(errorMessage);
            }
            
            setIsBluetoothConnected(false);
        } finally {
            setIsConnecting(false);
        }
    }

    // Disconnect from Bluetooth device
    const disconnectBluetooth = async () => {
        try {
            await bluetoothService.disconnect();
            setIsBluetoothConnected(false);
            setBluetoothDeviceName(null);
            console.log('Bluetooth disconnected');
        } catch (error: unknown) {
            console.error('Disconnect error:', error);
        }
    }

    // Auto-prompt Bluetooth connection on mount if not connected
    useEffect(() => {
        const checkBluetoothConnection = async () => {
            // Don't prompt again if we already did
            if (hasPromptedBluetooth) {
                return;
            }

            // Check if Web Bluetooth is supported
            if (!bluetoothService.isSupported()) {
                console.log('Web Bluetooth not supported');
                setBluetoothError('Web Bluetooth is not supported. Please use Chrome, Edge, or Opera.');
                setHasPromptedBluetooth(true);
                return;
            }

            // Check if already connected
            if (!bluetoothService.isConnected()) {
                console.log('Not connected to Bluetooth device. Prompting user...');
                
                // Small delay to let the page load first
                setTimeout(async () => {
                    setHasPromptedBluetooth(true);
                    await connectBluetooth();
                }, 1500);
            } else {
                // Already connected, update state
                setIsBluetoothConnected(true);
                setBluetoothDeviceName(bluetoothService.getDeviceName());
                setHasPromptedBluetooth(true);
            }
        };

        checkBluetoothConnection();
    }, [hasPromptedBluetooth])

    return (
        <div>
            <button 
                onClick={toggleSidebar}
                className="flex hover:scale-110 transition-transform cursor-pointer md:hidden mb-4"
            >
                <BurgerIcon className="text-[#C52233]"/>
            </button>

            {/* Bluetooth Connection Section */}
            <div className="mb-6 p-4 border rounded-xl bg-white shadow-md">
                <h2 className="text-xl font-bold text-slate-800 mb-4">ESP32 Device Connection</h2>
                
                {!isBluetoothConnected ? (
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={connectBluetooth}
                            disabled={isConnecting}
                            className={`${
                                isConnecting 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-700'
                            } text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2`}
                        >
                            {isConnecting ? (
                                <>
                                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                    <span>Connecting...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/>
                                    </svg>
                                    <span>Connect to ESP32</span>
                                </>
                            )}
                        </button>
                        <p className="text-sm text-gray-600 text-center">
                            Click to connect to your ESP32-Drowsiness device via Bluetooth
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                <div>
                                    <p className="font-semibold text-green-800">Connected</p>
                                    <p className="text-sm text-green-600">{bluetoothDeviceName || 'ESP32 Device'}</p>
                                </div>
                            </div>
                            <button
                                onClick={disconnectBluetooth}
                                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                            >
                                Disconnect
                            </button>
                        </div>
                    </div>
                )}

                {bluetoothError && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">⚠️ {bluetoothError}</p>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-6 mt-6 p-4">
                {volumes.map((vol, index) => {
                    const Icon = vol.icon;
                    const volumeColor = getVolumeColor(vol.volume);
                    
                    return (
                        <div key={index} className="flex flex-col p-7 border rounded-xl gap-5 bg-white shadow-md hover:shadow-lg transition-shadow">
                            {/* Icon and Name */}
                            <div className="flex flex-row gap-3 items-center">
                         <div 
                            className="p-3 rounded-xl"
                     style={{ backgroundColor: volumeColor + '20', color: volumeColor }}
    >
                            <Icon className="w-6 h-6" />
                            </div>
                                <span className="text-xl font-semibold text-slate-800">{vol.name}</span>
                        </div>

                            {/* Risk Matrix Bar */}
                            <div className="flex h-12 rounded-xl overflow-hidden border-2 border-slate-300 shadow-sm">
                                <div className="flex-1 bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center border-r-2 border-white">
                                    <span className="text-xs font-bold text-white drop-shadow">LOW</span>
                                </div>
                                <div className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 flex items-center justify-center border-r-2 border-white">
                                    <span className="text-xs font-bold text-white drop-shadow">MEDIUM</span>
                                </div>
                                <div className="flex-1 bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-center border-r-2 border-white">
                                    <span className="text-xs font-bold text-white drop-shadow">HIGH</span>
                                </div>
                                <div className="flex-1 bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
                                    <span className="text-xs font-bold text-white drop-shadow">VERY HIGH</span>
                                </div>
                            </div>

                            {/* Percentage markers and slider */}
                            <div className="relative -mt-3">
                                <div className="flex justify-between text-xs text-slate-500 mb-2 px-1">
                                    <span>0%</span>
                                    <span>25%</span>
                                    <span>50%</span>
                                    <span>75%</span>
                                    <span>100%</span>
                                </div>
                                <input 
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={vol.volume}
                                    onChange={(e) => handleVolumeSliderChange(index, Number(e.target.value))}
                                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                    style={{
                                        background: 'Gray'
                                    }}
                                />
                            </div>

                            {/* Volume display and Risk level */}
                            <div className="flex flex-row gap-3 items-center justify-between">
                                <div 
                                    className="text-lg font-bold px-5 py-2 rounded-lg shadow-sm"
                                    style={{ 
                                        backgroundColor: volumeColor,
                                        color: 'white'
                                    } as React.CSSProperties}
                                >
                                    {vol.volume}%
                                </div>
                                <div 
                                    className="text-sm font-semibold px-4 py-2 rounded-lg"
                                    style={{
                                        backgroundColor: volumeColor + '15',
                                        color: volumeColor
                                    } as React.CSSProperties}
                                >
                                    {vol.volume <= 25 ? 'Low ' : 
                                     vol.volume <= 50 ? 'Medium ' : 
                                     vol.volume <= 75 ? 'High ' : 'Very High '}
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button 
                                    onClick={() => testingDevices[index] ? handleStopTest(index) : handleVolumeTest(index)}
                                    disabled={!isBluetoothConnected}
                                    className={`${
                                        !isBluetoothConnected
                                            ? 'bg-gray-400 cursor-not-allowed' 
                                            : testingDevices[index]
                                            ? 'bg-slate-700 hover:bg-slate-800 hover:scale-105 active:scale-95'
                                            : 'bg-[#C52233] hover:bg-red-700 hover:scale-105 active:scale-95'
                                    } flex-1 text-white border rounded-xl flex flex-row items-center justify-center gap-3 p-4 font-bold text-lg shadow-lg hover:shadow-xl transition-all`}
                                    title={
                                        !isBluetoothConnected 
                                            ? 'Connect to ESP32 device first' 
                                            : testingDevices[index] 
                                            ? 'Stop this device test' 
                                            : 'Test this device'
                                    }
                                >
                                    {testingDevices[index] ? (
                                        <>
                                            <span>Stop {testCooldowns[index] ?? 0}s</span>
                                        </>
                                    ) : (
                                        <>
                                            <PlayIcon className="w-5 h-5" />
                                            <span>Test</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={() => handleSaveVolume(index)}
                                    disabled={!isBluetoothConnected || !!savingDevices[index]}
                                    className={`${
                                        !isBluetoothConnected || savingDevices[index]
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-105 active:scale-95'
                                    } sm:w-40 text-white border rounded-xl flex items-center justify-center p-4 font-bold text-lg shadow-lg hover:shadow-xl transition-all`}
                                    title={
                                        !isBluetoothConnected
                                            ? 'Connect to ESP32 device first'
                                            : 'Save this value to the ESP32'
                                    }
                                >
                                    <span>{savingDevices[index] ? 'Saving...' : 'Save'}</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

export default Dashboard