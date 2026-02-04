import { useState } from 'react'
import BurgerIcon from '../../component/svg/BurgerIcon'
import { useSidebar } from './AdminLayout'

function AdminDashboard() {
    const { toggleSidebar } = useSidebar()
    
    const [monthlyTriggerCount, setMonthlyTriggerCount] = useState(0)
    const [successfulTriggers, setSuccessfulTriggers] = useState(0)
    const [failedTriggers, setFailedTriggers] = useState(0)

    return (
        <div>
            <button 
                onClick={toggleSidebar}
                className="flex hover:scale-110 transition-transform cursor-pointer md:hidden mb-4"
            >
                <BurgerIcon className="text-[#C52233]"/>
            </button>

            {/* Trigger Counters */}
            <div className="mt-6 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Monthly Trigger Counter */}
                    <div className="flex flex-col items-center justify-center p-6 border rounded-xl bg-gradient-to-br from-[#C52233] to-red-700 shadow-lg">
                        <h2 className="text-white text-lg font-semibold mb-2">Monthly Triggers</h2>
                        <div className="text-white text-6xl font-bold mb-1">{monthlyTriggerCount}</div>
                        <p className="text-white/80 text-sm">Total this month</p>
                    </div>

                    {/* Successful Triggers */}
                    <div className="flex flex-col items-center justify-center p-6 border rounded-xl bg-gradient-to-br from-green-500 to-green-700 shadow-lg">
                        <h2 className="text-white text-lg font-semibold mb-2">Successful Triggers</h2>
                        <div className="text-white text-6xl font-bold mb-1">{successfulTriggers}</div>
                        <p className="text-white/80 text-sm">Alerts delivered</p>
                    </div>

                    {/* Failed Triggers */}
                    <div className="flex flex-col items-center justify-center p-6 border rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 shadow-lg">
                        <h2 className="text-white text-lg font-semibold mb-2">Failed/False Triggers</h2>
                        <div className="text-white text-6xl font-bold mb-1">{failedTriggers}</div>
                        <p className="text-white/80 text-sm">Alert failures</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard