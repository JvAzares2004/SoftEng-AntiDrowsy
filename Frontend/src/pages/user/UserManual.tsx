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

                    <p className="text-gray-700 mb-6">
                        Follow each part in order. Expand a section below to view the complete instructions.
                    </p>

                    <div className="space-y-4">
                        <details className="group border border-gray-200 rounded-xl bg-gray-50" open>
                            <summary className="cursor-pointer select-none px-5 py-4 text-lg font-semibold text-gray-800">
                                Part 1: Setup
                            </summary>
                            <div className="px-5 pb-5 pt-1 text-gray-700 space-y-4">
                                <ol className="list-decimal ml-6 space-y-2">
                                    <li>
                                        Place the car seat cover on the driver side of the vehicle.
                                    </li>
                                    <li>
                                        Place the box connected to the car seat cover in a secure location where it will not interfere with the driver&apos;s ability to operate the vehicle.
                                    </li>
                                    <li>
                                        Place the black box on the dashboard of the vehicle and make sure it does not interfere with the driver&apos;s vision.
                                    </li>
                                </ol>

                                <div className="border-t border-gray-200 pt-4">
                                    <h3 className="font-semibold text-gray-800 mb-2">Connecting Components</h3>
                                    <ol className="list-decimal ml-6 space-y-2">
                                        <li>
                                            Connect the dashcam so it faces the driver&apos;s face.
                                        </li>
                                        <li>
                                            Adjust the camera view until it captures the driver&apos;s full face.
                                        </li>
                                    </ol>
                                </div>
                            </div>
                        </details>

                        <details className="group border border-gray-200 rounded-xl bg-gray-50">
                            <summary className="cursor-pointer select-none px-5 py-4 text-lg font-semibold text-gray-800">
                                Part 2: Powering
                            </summary>
                            <div className="px-5 pb-5 pt-1 text-gray-700">
                                <ol className="list-decimal ml-6 space-y-2">
                                    <li>
                                        To power the system, use USB-C for both boxes.
                                    </li>
                                    <li>
                                        Confirm both boxes are powered on before starting the test.
                                    </li>
                                </ol>
                            </div>
                        </details>

                        <details className="group border border-gray-200 rounded-xl bg-gray-50">
                            <summary className="cursor-pointer select-none px-5 py-4 text-lg font-semibold text-gray-800">
                                Part 3: Web App Usage
                            </summary>
                            <div className="px-5 pb-5 pt-1 text-gray-700 space-y-4">
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-2">Purpose of the Web App</h3>
                                    <p>
                                        The web app is the control center of the Anti-Drowsy system. It allows the user to connect to the device, configure alert behavior, test hardware modules, and monitor system status in one place.
                                    </p>
                                </div>

                                <div className="border-t border-gray-200 pt-4">
                                    <h3 className="font-semibold text-gray-800 mb-2">Main Features</h3>
                                    <ul className="list-disc ml-6 space-y-2">
                                        <li>
                                            Device connection management for pairing and reconnecting with the Anti-Drowsy unit.
                                        </li>
                                        <li>
                                            Buzzer intensity control to adjust audio alert strength based on user preference.
                                        </li>
                                        <li>
                                            Vibration intensity control to set the strength of seat vibration alerts.
                                        </li>
                                        <li>
                                            Hardware test buttons for buzzer and vibration to verify that alerts are working correctly.
                                        </li>
                                        <li>
                                            Save settings function so preferred buzzer and vibration intensity values are retained.
                                        </li>
                                        <li>
                                            System status monitoring to check connection state and active alert behavior.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </details>

                        <details className="group border border-gray-200 rounded-xl bg-gray-50">
                            <summary className="cursor-pointer select-none px-5 py-4 text-lg font-semibold text-gray-800">
                                Part 4: Proper Device Shutdown
                            </summary>
                            <div className="px-5 pb-5 pt-1 text-gray-700">
                                <ol className="list-decimal ml-6 space-y-2">
                                    <li>
                                        Press and hold the button on the black box for 3-5 seconds.
                                    </li>
                                    <li>
                                        Keep holding until the LED color turns red.
                                    </li>
                                    <li>
                                        Once the LED is red, you can safely turn off the vehicle.
                                    </li>
                                </ol>
                            </div>
                        </details>

                        <details className="group border border-gray-200 rounded-xl bg-gray-50">
                            <summary className="cursor-pointer select-none px-5 py-4 text-lg font-semibold text-gray-800">
                                Part 5: Safety Warning and Driving Responsibility
                            </summary>
                            <div className="px-5 pb-5 pt-1 text-gray-700 space-y-3">
                                <p>
                                    Driving while drowsy is dangerous and can lead to serious accidents, injuries, and loss of life.
                                </p>
                                <p>
                                    This device is only an aid to help keep the driver alert. It does not replace proper rest, careful judgment, or safe driving behavior.
                                </p>
                                <p>
                                    If you feel too drowsy to continue driving, stop the vehicle in a safe location and rest before driving again.
                                </p>
                                <p>
                                    The device is designed to assist without interfering with normal vehicle operation while it is being used.
                                </p>
                                <p className="font-semibold text-gray-800">
                                    Drive safe at all times.
                                </p>
                            </div>
                        </details>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserManual
