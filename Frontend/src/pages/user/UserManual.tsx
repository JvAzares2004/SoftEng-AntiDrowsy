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
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">User Manual</h1>
                    <p className="text-gray-600">User manual content will be added here.</p>
                </div>
            </div>
        </div>
    )
}

export default UserManual
