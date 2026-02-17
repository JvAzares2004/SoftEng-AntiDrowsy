import BurgerIcon from '../../component/svg/BurgerIcon'
import { useSidebar } from './MainLayout'

function UserManual() {
    const { toggleSidebar } = useSidebar()

    return (
        <div>
            <button 
                onClick={toggleSidebar}
                className="flex hover:scale-110 transition-transform cursor-pointer md:hidden mb-4"
            >
                <BurgerIcon className="text-[#C52233]"/>
            </button>

            <div className="flex flex-col gap-6 mt-10 p-4">
                <div className="bg-white border rounded-xl p-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6">User Manual</h1>
                    
                    {/* Introduction */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Introduction</h2>
                        <p className="text-gray-700 mb-3">
                            Hello User! Thank you for choosing the Anti Drowsy Alert System. This advanced driver safety system is designed to detect drowsiness and alert drivers before fatigue leads to dangerous situations on the road.
                        </p>
                        <p className="text-gray-700">
                            The Anti Drowsy Alert System uses cutting-edge camera technology and machine learning algorithms to monitor your facial patterns in real-time, detecting signs of drowsiness such as prolonged eye closure, excessive blinking, and head movements indicative of falling asleep.
                        </p>
                    </section>

                    {/* Hardware Components */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Hardware Components</h2>
                        <div className="space-y-4 ml-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">ESP32 Microcontroller</h3>
                                <p className="text-gray-700">Central processing unit that analyzes camera data and controls alert systems. Features built-in Bluetooth for wireless connectivity.</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Camera Module</h3>
                                <p className="text-gray-700">High-resolution camera positioned to monitor driver facial patterns, eye movements, and head position in real-time</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Buzzer</h3>
                                <p className="text-gray-700">Auditory alert device that emits sound when drowsiness is detected. Intensity adjustable from 0-100 via website.</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Vibrator Motors (6 Modules)</h3>
                                <p className="text-gray-700">Six tactile alert devices integrated into the car seat that vibrate to alert the driver. The system scales both the number of active vibrators and their intensity from 0-100 via website, providing progressive tactile feedback.</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Power Supply</h3>
                                <p className="text-gray-700">Connects directly to vehicle power supply for continuous operation while driving.</p>
                            </div>
                        </div>

                        {/* ESP32 Pin Configuration */}
                        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">ESP32 Pin Configuration</h3>
                            <p className="text-gray-700 mb-3">Connect the hardware components to the following GPIO pins on your ESP32:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="bg-white p-3 rounded border border-blue-200">
                                    <p className="font-semibold text-gray-800">Buzzer</p>
                                    <p className="text-gray-700">GPIO Pin: <span className="font-mono font-bold text-blue-600">25</span></p>
                                </div>
                                <div className="bg-white p-3 rounded border border-blue-200">
                                    <p className="font-semibold text-gray-800">Vibrator Module 1</p>
                                    <p className="text-gray-700">GPIO Pin: <span className="font-mono font-bold text-blue-600">26</span></p>
                                </div>
                                <div className="bg-white p-3 rounded border border-blue-200">
                                    <p className="font-semibold text-gray-800">Vibrator Module 2</p>
                                    <p className="text-gray-700">GPIO Pin: <span className="font-mono font-bold text-blue-600">27</span></p>
                                </div>
                                <div className="bg-white p-3 rounded border border-blue-200">
                                    <p className="font-semibold text-gray-800">Vibrator Module 3</p>
                                    <p className="text-gray-700">GPIO Pin: <span className="font-mono font-bold text-blue-600">14</span></p>
                                </div>
                                <div className="bg-white p-3 rounded border border-blue-200">
                                    <p className="font-semibold text-gray-800">Vibrator Module 4</p>
                                    <p className="text-gray-700">GPIO Pin: <span className="font-mono font-bold text-blue-600">12</span></p>
                                </div>
                                <div className="bg-white p-3 rounded border border-blue-200">
                                    <p className="font-semibold text-gray-800">Vibrator Module 5</p>
                                    <p className="text-gray-700">GPIO Pin: <span className="font-mono font-bold text-blue-600">13</span></p>
                                </div>
                                <div className="bg-white p-3 rounded border border-blue-200">
                                    <p className="font-semibold text-gray-800">Vibrator Module 6</p>
                                    <p className="text-gray-700">GPIO Pin: <span className="font-mono font-bold text-blue-600">15</span></p>
                                </div>
                                <div className="bg-white p-3 rounded border border-blue-200">
                                    <p className="font-semibold text-gray-800">Power Supply</p>
                                    <p className="text-gray-700">VIN: 12V from vehicle<br/>GND: Ground</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-3 italic">
                                Note: All GPIO pins support PWM for intensity control. Ensure proper current limiting resistors or transistors are used for high-current devices.
                            </p>
                        </div>
                    </section>

                    {/* Installation and Setup */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Installation and Setup</h2>
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                            <p className="text-red-700 font-semibold">WARNING: Installation should be performed by a qualified technician. Improper installation may result in system malfunction or vehicle electrical system damage.</p>
                        </div>

                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Pre-Installation Requirements</h3>
                        <ul className="list-disc ml-8 mb-4 text-gray-700 space-y-1">
                            <li>Vehicle with 12V power supply</li>
                            <li>Bluetooth-enabled smartphone, or tablet for initial configuration</li>
                            <li>Basic tools for mounting camera and securing components</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Installation Steps</h3>
                        <ul className="list-disc ml-8 mb-4 text-gray-700 space-y-2">
                            <li>
                                <strong>Camera Module Positioning:</strong> Mount the camera module on the dashboard or steering column where it has a clear, unobstructed view of the driver's face. Ensure proper angle for eye and head movement detection.
                            </li>
                            <li>
                                <strong>Vibration Motors Installation:</strong> Install all six vibration motors into the car seat backrest in a distributed pattern (3 on each side at upper, middle, and lower positions) for optimal alert coverage and effectiveness.
                            </li>
                            <li>
                                <strong>Buzzer Placement:</strong> Install the buzzer in a location that provides clear auditory alerts without causing distraction. Dashboard or center console recommended.
                            </li>
                            <li>
                                <strong>ESP32 Mounting:</strong> Secure the ESP32 microcontroller in a protected location away from direct sunlight and moisture.
                            </li>
                            <li>
                                <strong>Power Connection:</strong> Connect the system to the vehicle's power supply following proper electrical safety procedures. Use appropriate fuses and wire gauges.
                            </li>
                            <li>
                                <strong>Cable Management:</strong> Secure all cables using cable ties and routing clips to prevent interference with vehicle controls.
                            </li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Post-Installation Checks</h3>
                        <ul className="list-disc ml-8 mb-4 text-gray-700 space-y-1">
                            <li>Verify camera has clear view of driver position</li>
                            <li>Test buzzer audibility from driver seat</li>
                            <li>Confirm all 6 vibration motors can be felt through seat at different intensity levels</li>
                            <li>Check all electrical connections for security</li>
                        </ul>
                    </section>

                    {/* Initial Power-On */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Initial Power-On</h2>
                        <ul className="list-disc ml-8 text-gray-700 space-y-2">
                            <li>Turn on your vehicle's ignition to power the Anti-Drowsy Alert System.</li>
                            <li>The ESP32 will create a startup sound through the buzzer to indicate the system is operational and ready for connection.</li>
                            <li>This sound confirms that the hardware is functioning correctly before attempting Bluetooth pairing.</li>
                        </ul>
                    </section>

                    {/* Bluetooth Pairing Process */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Bluetooth Pairing Process</h2>
                        <ul className="list-disc ml-8 mb-4 text-gray-700 space-y-2">
                            <li>Enable Bluetooth on your smartphone, tablet, or computer.</li>
                            <li>Open the Anti-Drowsy Alert web application in your browser.</li>
                            <li>Click the 'Connect' button in the web application.</li>
                            <li>Select 'ESP32-Drowsiness' from the list of available Bluetooth devices.</li>
                            <li>Wait for the pairing confirmation. The system will indicate successful connections.</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Connection Troubleshooting</h3>
                        <div className="ml-4 space-y-2 text-gray-700">
                            <p><strong>Device Not Found:</strong> Ensure vehicle ignition is on and the system has completed startup sequence. Check if Bluetooth is enabled on your device.</p>
                            <p><strong>Connection Failed:</strong> Reset the ESP32 by turning vehicle ignition off for 30 seconds, then try again.</p>
                            <p><strong>Intermittent Connection:</strong> Ensure your device remains within 10 meters of the ESP32 during configuration.</p>
                        </div>
                    </section>

                    {/* Web Application Guide */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Web Application Guide</h2>
                        <p className="text-gray-700 mb-4">
                            The Anti-Drowsy Alert web application provides an intuitive interface for customizing alert intensity and monitoring system status.
                        </p>

                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Accessing the Web Application</h3>
                        <ul className="list-disc ml-8 mb-4 text-gray-700 space-y-1">
                            <li>Open your preferred web browser on your Bluetooth-enabled device.</li>
                            <li>Navigate to the Anti-Drowsy Alert web application URL (provided during installation).</li>
                            <li>Ensure your device is paired with the ESP32.</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Buzzer Configuration</h3>
                        <p className="text-gray-700 mb-2">The buzzer intensity can be adjusted from 0 to 100, where:</p>
                        <ul className="list-disc ml-8 mb-4 text-gray-700 space-y-1">
                            <li><strong>0-25:</strong> Low intensity - Gentle audio alert suitable for quiet environments</li>
                            <li><strong>50-75:</strong> Medium intensity - Balanced alert for normal driving conditions</li>
                            <li><strong>75-100:</strong> High intensity - Loud alert for noisy environments or highway driving</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Vibration Intensity Control</h3>
                        <p className="text-gray-700 mb-2">The system features 6 vibrator motors that provide progressive tactile alerts. The intensity slider (0-100) controls both the number of active motors and their individual output strength:</p>
                        <ul className="list-disc ml-8 mb-3 text-gray-700 space-y-1">
                            <li><strong>0%:</strong> All vibrators off</li>
                            <li><strong>1-16%:</strong> 1 vibrator active at low-moderate intensity</li>
                            <li><strong>17-33%:</strong> 2 vibrators active at low-moderate intensity</li>
                            <li><strong>34-50%:</strong> 3 vibrators active at moderate intensity</li>
                            <li><strong>51-66%:</strong> 4 vibrators active at moderate-high intensity</li>
                            <li><strong>67-83%:</strong> 5 vibrators active at high intensity</li>
                            <li><strong>84-100%:</strong> All 6 vibrators active at maximum intensity</li>
                        </ul>
                        <p className="text-gray-700 mb-2">To adjust:</p>
                        <ul className="list-disc ml-8 mb-4 text-gray-700 space-y-1">
                            <li>Locate the 'Vibration Intensity' slider in the web application.</li>
                            <li>Drag the slider to your desired intensity level (0-100).</li>
                            <li>The system will immediately apply the new setting, activating the appropriate number of motors.</li>
                            <li>Test the vibration using the 'Test' button to verify intensity and coverage.</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Camera Monitoring</h3>
                        <ul className="list-disc ml-8 text-gray-700 space-y-1">
                            <li><strong>Camera Status:</strong> Shows whether the camera is operational and detecting facial features</li>
                            <li><strong>Detection Confidence:</strong> Indicates how accurately the system is monitoring driver alertness</li>
                            <li><strong>Alert History:</strong> Logs recent drowsiness detections and alerts triggered</li>
                        </ul>
                    </section>

                    {/* Detection System */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Detection System</h2>
                        <ul className="list-disc ml-8 text-gray-700 space-y-1">
                            <li><strong>Eye Closure Duration:</strong> Tracks how long eyes remain closed</li>
                            <li><strong>Blinking Frequency:</strong> Analyzes patterns that differ from normal blinking</li>
                            <li><strong>Head Position:</strong> Detects head drooping or unusual tilting</li>
                            <li><strong>Facial Muscle Relaxation:</strong> Identifies signs of reduced muscle tone</li>
                        </ul>
                    </section>

                    {/* Power Management */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Power Management</h2>
                        <p className="text-gray-700">
                            The system is designed to operate efficiently using the vehicle's power supply. It automatically enters standby mode when the vehicle ignition is off, consuming minimal power to preserve battery life.
                        </p>
                    </section>

                    {/* Operating Instructions */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Operating Instructions</h2>
                        
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Starting System</h3>
                        <ul className="list-disc ml-8 mb-4 text-gray-700 space-y-1">
                            <li>Turn on your vehicle's ignition.</li>
                            <li>Wait for the startup sound from the buzzer, confirming system activation.</li>
                            <li>Ensure the camera has a clear view of your face before driving.</li>
                            <li>The system will begin monitoring automatically once operational.</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 mb-2">During Operation</h3>
                        <ul className="list-disc ml-8 mb-4 text-gray-700 space-y-1">
                            <li>Maintain proper driving position for optimal camera detection</li>
                            <li>Do not obstruct the camera view with hands, objects, or accessories</li>
                            <li>If wearing sunglasses, ensure they do not completely obscure your eyes</li>
                            <li>Respond immediately to any drowsiness alerts by pulling over safely</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 mb-2">System Shutdown</h3>
                        <p className="text-gray-700">
                            The system automatically powers down when the vehicle ignition is turned off. No manual shutdown procedure is required.
                        </p>
                    </section>

                    {/* Safety Warnings and Disclaimers */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Safety Warnings and Disclaimers</h2>
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
                            <p className="text-yellow-800 font-semibold mb-2">WARNING: The Anti-Drowsy Alert System is a driver assistance tool and should not be relied upon as the sole means of preventing drowsy driving.</p>
                            <ul className="list-disc ml-6 text-yellow-800 space-y-1">
                                <li>This system is designed to supplement, not replace, safe driving practices.</li>
                                <li>Drivers are solely responsible for maintaining alertness while operating a vehicle.</li>
                                <li>If you feel drowsy, pull over immediately regardless of system alerts.</li>
                                <li>Do not disable or ignore system alerts.</li>
                                <li>System effectiveness may be reduced in certain lighting conditions or with facial obstructions.</li>
                            </ul>
                        </div>

                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Installation Warnings</h3>
                        <ul className="list-disc ml-8 mb-4 text-gray-700 space-y-1">
                            <li>Improper installation may result in system malfunction or vehicle damage.</li>
                            <li>Do not attempt installation if you lack proper electrical knowledge.</li>
                            <li>Ensure all connections are properly insulated and secured.</li>
                            <li>Use appropriate fuses to protect against electrical shorts.</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Liability Disclaimer</h3>
                        <p className="text-gray-700">
                            The manufacturer and distributors of the Anti-Drowsy Alert System are not liable for any accidents, injuries, or damages resulting from the use or misuse of this product. Users assume all responsibility for safe vehicle operation. This system is provided as is without warranties of any kind, express or implied.
                        </p>
                    </section>

                    {/* Maintenance and Care */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Maintenance and Care</h2>
                        <ul className="list-disc ml-8 text-gray-700 space-y-1">
                            <li>Regularly clean the camera lens with a soft, lint-free cloth.</li>
                            <li>Inspect all connections periodically for security and corrosion.</li>
                            <li>Do not expose components to excessive moisture or extreme temperatures.</li>
                            <li>Contact technical support for any system malfunctions or errors.</li>
                        </ul>
                    </section>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                        <p className="text-gray-600 italic mb-2">For technical support, visit our website or contact customer service.</p>
                        <p className="text-gray-800 font-semibold">Thank you for choosing the Anti-Drowsy Alert System.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserManual
