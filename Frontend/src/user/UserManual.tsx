import BurgerIcon from '../component/svg/BurgerIcon'
import { useSidebar } from './MainLayout'

function UserManual() {
    const { toggleSidebar } = useSidebar()

    return (
        <div>
            <div className={`sticky top-0 z-40 bg-[#C52233] px-8 py-4 min-h-30 md:rounded-lg flex justify-between items-end`}>
                <div className="text-white inter">
                    <h1 className="tracking-wide text-2xl font-semibold">User Manual</h1>
                    <span className="text-sm font-light tracking-wide">Learn how to use the system</span>
                </div>
                
                <button 
                    onClick={toggleSidebar}
                    className="flex mb-7 mr-5 hover:scale-110 transition-transform cursor-pointer md:hidden"
                >
                    <BurgerIcon className="text-white"/>
                </button>
            </div>

            <div className="flex flex-col gap-6 mt-10 p-4">
                <div className="bg-white border rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4">Getting Started</h2>
                    <p className="text-gray-700 mb-4">
                        Welcome to the Drowsiness Detection System. This manual will guide you through the features and functionality of the system.
                    </p>
                </div>


            </div>
        </div>
    )
}

export default UserManual
