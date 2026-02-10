import { useState, useRef, useEffect } from 'react'
import MotorVolumeIcon from '../../component/svg/MotorVolumeIcon'
import BuzzerIcon from '../../component/svg/BuzzerIcon'
import BurgerIcon from '../../component/svg/BurgerIcon'

import PlayIcon from '../../component/svg/PlayerIcon'
import FullscreenIcon from '../../component/svg/FullscreenIcon'
import CameraIcon from '../../component/svg/CameraIcon'
import { useSidebar } from './MainLayout'
import bluetoothService from '../../services/bluetoothService'

function Dashboard() {
    const { toggleSidebar } = useSidebar()
    
    const [volumes, setVolumes] = useState([
        { type:"motor", name: "Motor Vibration", volume: 100, icon: MotorVolumeIcon },
        { type:"buzzer", name: "Buzzer Volume", volume: 100, icon: BuzzerIcon },
    ])
    
    const videoRef = useRef<HTMLVideoElement>(null)
    const cameraContainerRef = useRef<HTMLDivElement>(null)
    const [isCameraActive, setIsCameraActive] = useState(false)
    const [cameraError, setCameraError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Bluetooth state
    const [isBluetoothConnected, setIsBluetoothConnected] = useState(false)
    const [bluetoothDeviceName, setBluetoothDeviceName] = useState<string | null>(null)
    const [bluetoothError, setBluetoothError] = useState<string | null>(null)
    const [isConnecting, setIsConnecting] = useState(false)
    const [hasPromptedBluetooth, setHasPromptedBluetooth] = useState(false)

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
        const duration = Math.round((volumes[index].volume / 100) * 3000); // Scale to 0-3 seconds
        
        console.log(`Testing ${volumes[index].name}: ${volumes[index].volume}% (${duration}ms)`);

        // Check Bluetooth connection
        if (!isBluetoothConnected) {
            setBluetoothError('Please connect to ESP32 device first');
            return;
        }

        try {
            setBluetoothError(null);
            
            if (deviceType === "buzzer") {
                await bluetoothService.testBuzzer(duration);
            } else if (deviceType === "motor") {
                await bluetoothService.testVibrator(duration);
            }
            
            console.log(`Test completed successfully`);
        } catch (error: any) {
            console.error('Test error:', error);
            setBluetoothError(`Test failed: ${error.message}`);
        }
    }

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
        } catch (error: any) {
            console.error('Bluetooth connection error:', error);
            
            // Don't show error if user cancelled the connection
            if (error.message && error.message.includes('cancelled')) {
                console.log('User cancelled Bluetooth connection');
            } else {
                setBluetoothError(error.message);
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
        } catch (error: any) {
            console.error('Disconnect error:', error);
        }
    }

    // Initialize camera on component mount
    useEffect(() => {
        let mounted = true
        
        const initCamera = async () => {
            if (mounted) {
                await startCamera()
            }
        }
        
        initCamera()
        
        return () => {
            mounted = false
            stopCamera()
        }
    }, [])

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
    }, [])

    const startCamera = async () => {
        setIsLoading(true)
        console.log("🎥 Requesting camera access...")
        
        try {
            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Camera API not supported in this browser")
            }

            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true,
                audio: false
            })
            
            console.log("Camera access granted")
            console.log("Stream tracks:", stream.getTracks().length)
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                
                // Wait for video to be ready
                videoRef.current.onloadedmetadata = () => {
                    console.log("Video metadata loaded")
                    console.log("Video dimensions:", videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight)
                    videoRef.current?.play().then(() => {
                        console.log("✅ Video playing")
                        setIsCameraActive(true)
                        setCameraError(null)
                        setIsLoading(false)
                    }).catch(err => {
                        console.error("❌ Play error:", err)
                        setIsCameraActive(false)
                        setCameraError("Failed to play video: " + err.message)
                        setIsLoading(false)
                    })
                }
            }
        } catch (err: any) {
            console.error("❌ Camera error:", err)
            setIsCameraActive(false)
            setIsLoading(false)
            
            if (err.name === 'NotAllowedError') {
                setCameraError("Camera access denied. Please allow camera permissions.")
            } else if (err.name === 'NotFoundError') {
                setCameraError("No camera found on this device.")
            } else if (err.name === 'NotReadableError') {
                setCameraError("Camera is already in use by another application.")
            } else {
                setCameraError(err.message || "Unable to access camera")
            }
        }
    }

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream
            stream.getTracks().forEach(track => {
                track.stop()
                console.log("Stopped camera track")
            })
            videoRef.current.srcObject = null
            setIsCameraActive(false)
        }
    }

    const handleFullscreen = () => {
        if (cameraContainerRef.current) {
            if (!document.fullscreenElement) {
                cameraContainerRef.current.requestFullscreen().catch(err => {
                    console.error("Error attempting to enable fullscreen:", err)
                })
            } else {
                document.exitFullscreen()
            }
        }
    }

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
                            
                            {/* Test button - ORIGINAL RED COLOR */}
                            <button 
                                onClick={() => handleVolumeTest(index)}
                                disabled={!isBluetoothConnected}
                                className={`${
                                    !isBluetoothConnected 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-[#C52233] hover:bg-red-700 hover:scale-105 active:scale-95'
                                } text-white border rounded-xl flex flex-row items-center justify-center gap-3 p-4 font-bold text-lg shadow-lg hover:shadow-xl transition-all`}
                                title={!isBluetoothConnected ? 'Connect to ESP32 device first' : 'Test this device'}
                            >
                                <PlayIcon className="w-5 h-5" />
                                <span>Test</span>
                            </button>
                        </div>
                    );
                })}
                    
                <div 
                    ref={cameraContainerRef}
                    className="camera-container flex flex-col border rounded-xl overflow-hidden bg-black relative shadow-md"
                >
                    <div className="camera-controls flex flex-row w-full justify-between p-3 bg-gray-900">
                        <h1 className="font-semibold text-white">Camera Field</h1>
                        <button 
                            onClick={handleFullscreen}
                            className="hover:scale-110 transition-transform cursor-pointer"
                            aria-label="Toggle fullscreen"
                        >
                            <FullscreenIcon className="text-white" />
                        </button>
                    </div>
                    <button 
                        onClick={handleFullscreen}
                        className="fullscreen-button hover:scale-110 transition-transform cursor-pointer"
                        aria-label="Exit fullscreen"
                    >
                        <FullscreenIcon className="text-white" />
                    </button>
                    <div className="relative w-full bg-black" style={{ minHeight: '400px' }}>
                        <video 
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{
                                display: isCameraActive ? 'block' : 'none',
                                width: '100%',
                                height: '100%',
                                minHeight: '400px',
                                objectFit: 'contain'
                            }}
                        />
                        {!isCameraActive && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-10">
                                {isLoading ? (
                                    <>
                                        <CameraIcon className="text-gray-400 animate-pulse w-12 h-12" />
                                        <p className="text-white text-center">Initializing camera...</p>
                                    </>
                                ) : cameraError ? (
                                    <>
                                        <CameraIcon className="text-red-500 w-12 h-12" />
                                        <p className="text-white text-center text-sm max-w-md">{cameraError}</p>
                                        <button 
                                            onClick={startCamera}
                                            className="bg-[#C52233] text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                                        >
                                            Retry
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <CameraIcon className="text-gray-400 w-12 h-12" />
                                        <p className="text-white text-center">Camera not active</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard