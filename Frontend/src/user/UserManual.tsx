import BurgerIcon from '../component/svg/BurgerIcon'
import { useSidebar } from './MainLayout'

function UserManual() {
    const { toggleSidebar } = useSidebar()

    const userGuide = [
        {
            question: "How does this app work?",
            answer: "This app works by monitoring your eye condition, blinking rate, and head movement using a camera. When the system detects signs of drowsiness, it automatically activates alerts such as vibration and buzzer sounds to help keep you awake while driving."
        },
        {
            question: "What is the purpose of this app?",
            answer: "The purpose of this app is to help you stay alert while driving by detecting early signs of fatigue and providing real-time alerts to reduce the risk of accidents."
        },
        {
            question: "How do you start using the app?",
            answer: "You start by signing in using your username and password. Once logged in, you need to make sure that all hardware components are active before the system begins monitoring."
        },
        {
            question: "What happens after you log in?",
            answer: "After logging in, you are taken to the dashboard where you can see the status of the camera, alert module, and microcontroller. You can also adjust the alert settings from this screen."
        },
        {
            question: "Why do you need to check the component status?",
            answer: "You need to check the component status to ensure that the system can function properly. If a component is inactive, drowsiness detection will not work correctly."
        },
        {
            question: "What should you do if a component is inactive?",
            answer: "If a component is inactive, you should check the hardware connections and make sure the device is properly powered before continuing."
        },
        {
            question: "Why does the app need access to your camera?",
            answer: "The app uses your camera to detect your eyes, blinking rate, and head movement. This information helps the system determine if you are getting sleepy."
        },
        {
            question: "What if your eyes are not detected by the camera?",
            answer: "If your eyes are not detected, you should adjust your position, improve lighting conditions, and ensure that your face is clearly visible within the camera's field of view."
        },
        {
            question: "How does the app know when you are drowsy?",
            answer: "The app analyzes changes in your blinking rate, eye closure duration, and head movement. When these patterns indicate fatigue, the system triggers an alert."
        },
        {
            question: "What happens when drowsiness is detected?",
            answer: "When drowsiness is detected, the system activates vibration and buzzer alerts to immediately get your attention."
        },
        {
            question: "Can you control the alert intensity?",
            answer: "Yes. You can adjust the motor vibration and buzzer volume using the sliders on the dashboard based on your preference."
        },
        {
            question: "Can you test the alert system before driving?",
            answer: "Yes. You can use the test option to check if the vibration and buzzer are working properly before starting your drive."
        },
        {
            question: "How do you stop the alert?",
            answer: "You can stop the alert by pressing the Stop Button once you are already alert and responsive."
        },
        {
            question: "Will the alert stop automatically?",
            answer: "The alert will continue until you press the Stop Button or until the system detects that your condition has returned to normal."
        },
        {
            question: "What happens if you ignore the alert?",
            answer: "If you ignore the alert, the system will continue notifying you to help ensure your safety while driving."
        },
        {
            question: "Can you still use the app while driving at night or in low light?",
            answer: "Yes, but you need to ensure that there is enough lighting for the camera to clearly detect your eyes."
        },
        {
            question: "What is the Camera Field section for?",
            answer: "The Camera Field allows you to see what the camera is detecting and helps you adjust your position for better eye detection."
        },
        {
            question: "How do you update your profile information?",
            answer: "You can update your profile by going to the User Profile section and selecting Edit Details to change your username or password."
        },
        {
            question: "Is your personal information secure?",
            answer: "Yes. Your account is protected through authentication, and your information is handled securely within the system."
        },
        {
            question: "Can more than one user use the system?",
            answer: "Yes. You and other users can have separate accounts with personalized settings."
        }
    ]

    return (
        <div>
            <div className={`sticky top-0 z-40 bg-[#C52233] px-8 py-4 min-h-30 md:rounded-lg flex justify-between items-end`}>
                <button 
                    onClick={toggleSidebar}
                    className="flex mb-7 ml-0 hover:scale-110 transition-transform cursor-pointer md:hidden"
                >
                    <BurgerIcon className="text-white"/>
                </button>
                
                <div className="text-white inter">
                    <h1 className="tracking-wide text-2xl font-semibold">User Manual</h1>
                    <span className="text-sm font-light tracking-wide">Learn how to use the system</span>
                </div>
            </div>

            <div className="flex flex-col gap-6 mt-10 p-4">
                <div className="bg-white border rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4">Getting Started</h2>
                    <p className="text-gray-700 mb-4">
                        Welcome to the Drowsiness Detection System. This manual will guide you through the features and functionality of the system.
                    </p>
                </div>

                {/* User Guide Section - Simple List */}
                <div className="bg-white border rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-6">User Guide - Frequently Asked Questions</h2>
                    
                    <div className="space-y-6">
                        {userGuide.map((item, index) => (
                            <div key={index} className="pb-6 border-b border-slate-200 last:border-b-0 last:pb-0">
                                <div className="flex items-start gap-3 mb-2">
                                    <span className="flex-shrink-0 w-8 h-8 bg-[#C52233] text-white rounded-full flex items-center justify-center font-bold text-sm">
                                        {index + 1}
                                    </span>
                                    <h3 className="font-semibold text-slate-800 text-lg pt-1">
                                        {item.question}
                                    </h3>
                                </div>
                                <p className="text-slate-600 leading-relaxed ml-11">
                                    {item.answer}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact Support Section */}
                <div className="bg-white border rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4">Contact Support</h2>
                    
                    <div className="space-y-4">
                        <p className="text-gray-700">
                            Need help? Our support team is here to assist you with any questions or issues you may have.
                        </p>

                        <div className="grid md:grid-cols-2 gap-4 mt-6">
                            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800 mb-1">Email Support</h3>
                                    <p className="text-sm text-slate-600">support@drowsinessdetection.com</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800 mb-1">Phone Support</h3>
                                    <p className="text-sm text-slate-600">+63 9656245179</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800 mb-1">Live Chat</h3>
                                    <p className="text-sm text-slate-600">Available 24/7</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="p-3 bg-orange-100 rounded-lg">
                                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800 mb-1">Office Address</h3>
                                    <p className="text-sm text-slate-600">Biglang Awa Street, Cor 11th Ave Caloocan City</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <strong>Note:</strong> For urgent safety concerns while driving, please pull over safely and call emergency services immediately.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default UserManual