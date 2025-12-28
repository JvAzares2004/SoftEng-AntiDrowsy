import DrowsinessLogo from '../component/img/Drowsiness-Logo.png';
import { useNavigate } from 'react-router-dom';

function Login() {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col inter min-h-screen">
            {/* Header */}
            <div className="flex flex-col items-center md:flex-row px-5 py-4 gap-4 md:border-b border-b-gray-300 mt-20 md:mt-0">
                <img src={DrowsinessLogo} alt="Logo" className="md:w-16 md:h-16 w-35 h-35" />

                <div className="flex flex-col justify-center items-center">
                    <h1 className="md:font-bold font-semibold text-5xl md:text-3xl text-black inter italic">Anti Drowsy</h1>
                    <span className="text-[#DE0303] font-semibold text-4xl md:text-2xl">Car Seat Sensor</span>
                </div>
            </div>

            {/* Centered Login Container */}
            <div className="flex flex-col justify-center items-center mt-10 md:mt-0 md:flex-1">
                <div className="flex flex-col gap-4 bg-[#C52233] px-10 py-8 md:rounded-xl w-full max-w-md shadow-lg">

                    <h1 className="text-white text-2xl font-semibold text-center">Login to your account</h1>

                    {/* Username and Password Input */}
                    <div className="flex flex-col gap-4">
                        <input
                            type="text"
                            placeholder="Username"
                            className="text-white text-md font-light border border-white rounded-lg px-4 py-3 bg-transparent placeholder-white"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className="text-white text-md font-light border border-white rounded-lg px-4 py-3 bg-transparent placeholder-white"
                        />
                    </div>

                    {/* Remember Me */}
                    <div className="flex flex-row items-center space-x-2">
                        <input type="checkbox" className="appearance-none border border-white w-5 h-5 checked:bg-white checked:border-white rounded-sm" />
                        <label className="text-white text-sm font-light tracking-wide">Remember me</label>
                    </div>

                    {/* Sign In Button */}
                    <button onClick={() => navigate("/user/dashboard")} className="bg-white text-black border font-bold text-lg w-full py-3 rounded-lg mt-2">Sign In</button>
                </div>
            </div>
        </div>
    );
}

export default Login;
