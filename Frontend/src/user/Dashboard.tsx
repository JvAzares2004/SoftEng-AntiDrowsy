import { useState, useRef, useEffect } from 'react'
import MotorVolumeIcon from '../component/svg/MotorVolumeIcon'
import BuzzerIcon from '../component/svg/BuzzerIcon'
import BurgerIcon from '../component/svg/BurgerIcon'

import PlayIcon from '../component/svg/PlayerIcon'
import FullscreenIcon from '../component/svg/FullscreenIcon'
import CameraIcon from '../component/svg/CameraIcon'
import SystemStatusIcon from '../component/svg/SystemStatusIcon'

import MicroControllerIcon from '../component/svg/MicroControllerIcon'
import AlertModuleIcon from '../component/svg/AlertModule'
import PlainCameraIcon from '../component/svg/PlainCameraIcon'
import { useSidebar } from './MainLayout'

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

    const systemStatus = [
        {type:"micro-controller", name:"Micro Controller", status: "Inactive", icon: MicroControllerIcon},
        {type:"alert-module", name:"Alert Module", status: "Active", icon: AlertModuleIcon},
        {type:"camera", name:"Camera", status: "Inactive", icon: PlainCameraIcon},
    ]

    // Helper function to get dynamic color based on volume
    const getVolumeColor = (volume: number) => {
        if (volume <= 25) return '#10B981' // Green - Low
        if (volume <= 50) return '#F59E0B' // Yellow - Medium
        if (volume <= 75) return '#FB923C' // Orange - High
        return '#EF4444' // Red - Very High
    }

    const handleVolumeChange = (index: number, newValue: number) => {
        const newVolumes = [...volumes];
        newVolumes[index].volume = newValue;
        setVolumes(newVolumes);
    }

    const handleTest = (index: number) => {
        console.log(`${volumes[index].name}: ${volumes[index].volume}%`);
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
            {/* ORIGINAL RED HEADER - KEPT AS IS */}
            <div className={`sticky top-0 z-40 bg-[#C52233] px-8 py-4 min-h-30 md:rounded-lg flex justify-between items-end`}>
                <button 
                    onClick={toggleSidebar}
                    className="flex mb-7 ml-0 hover:scale-110 transition-transform cursor-pointer md:hidden"
                >
                    <BurgerIcon className="text-white"/>
                </button>
                
                <div className="text-white inter mr-auto md:mr-0 ml-4 md:ml-0">
                    <h1 className="tracking-wide text-2xl font-semibold">Welcome, User</h1>
                    <span className="text-sm font-light tracking-wide">Stay alert, drive safe</span>
                </div>
            </div>

            <div className="flex flex-col gap-6 mt-10 p-4">
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
                                    onChange={(e) => handleVolumeChange(index, Number(e.target.value))}
                                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                    style={{
                                        background: 'transparent'
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
                                    {vol.volume <= 25 ? 'Low Risk' : 
                                     vol.volume <= 50 ? 'Medium Risk' : 
                                     vol.volume <= 75 ? 'High Risk' : 'Very High Risk'}
                                </div>
                            </div>
                            
                            {/* Test button - ORIGINAL RED COLOR */}
                            <button 
                                onClick={() => handleTest(index)}
                                className="bg-[#C52233] hover:bg-red-700 text-white border rounded-xl flex flex-row items-center justify-center gap-3 p-4 cursor-pointer font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
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

                <div className="flex flex-col border rounded-xl p-4 gap-4 bg-white shadow-md">
                    <div className="flex flex-row gap-2">
                        <SystemStatusIcon />
                        <h1 className="text-xl font-bold">System Status</h1>
                    </div>

                    {/* System Status (Micro Controller, Alert Modules and Camera) */}
                    {systemStatus.map((stat, index) => {
                        const Icon = stat.icon;

                        return (
                            <div key={index} className="flex flex-row items-center px-3 py-1 justify-between">
                                <div className="flex flex-row gap-6 text-lg">
                                    <Icon 
                                        className={`
                                            ${stat.status?.toLowerCase() === "active" ? "text-[#01D901]" : "text-[#C52233]"} w-7 h-7`
                                        }
                                    />
                                    <span>{stat.name}</span>
                                </div>

                                <span 
                                    className={
                                        `${stat.status?.toLowerCase() === "active" ? "text-[#01D901]" : "text-[#C52233]"}`
                                    }
                                >
                                    {stat.status}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default Dashboard