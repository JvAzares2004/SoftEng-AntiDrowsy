import DrowsinessLogo from '../component/img/Drowsiness-Logo.png';
import { useNavigate } from 'react-router-dom';

function TermsAndConditions() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col inter min-h-screen bg-gray-50">
            {/* Header */}
            <div className="flex flex-col items-center md:flex-row px-5 py-4 gap-2 md:gap-4 md:border-b border-b-gray-300">
                <img src={DrowsinessLogo} alt="Logo" className="w-16 h-16 md:w-16 md:h-16" />

                <div className="flex flex-col justify-center items-center">
                    <h1 className="font-semibold text-2xl md:text-3xl md:font-bold text-black inter italic">Anti Drowsy</h1>
                    <span className="text-[#DE0303] font-semibold text-xl md:text-2xl">Car Seat Sensor</span>
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-8 max-w-4xl mx-auto w-full">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 text-[#C52233] font-semibold hover:underline cursor-pointer self-start"
                >
                    
                </button>

                <h1 className="text-4xl font-bold text-gray-800 mb-6">Terms and Conditions</h1>
                
                <div className="bg-white rounded-lg shadow-md p-8">
                    <p className="text-gray-600 text-lg">
                        Terms and Conditions content will be added here.
                    </p>
                    <p className="text-gray-500 mt-4">
                        This is a placeholder for the terms and conditions. Please check back later for the complete terms and conditions.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default TermsAndConditions;
