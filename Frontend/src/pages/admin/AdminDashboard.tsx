import { useState, useEffect } from 'react'
import BurgerIcon from '../../component/svg/BurgerIcon'
import { useSidebar } from './AdminLayout'

interface UserStatistics {
  customer_id: string;
  firstname: string;
  lastname: string;
  email: string;
  contact_number: string;
  monthly_triggers: number;
  successful_triggers: number;
  failed_triggers: number;
  date_created: string;
  total_trigger_records: number;
}

function AdminDashboard() {
    const { toggleSidebar } = useSidebar()
    
    const [users, setUsers] = useState<UserStatistics[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [monthlyTriggerCount, setMonthlyTriggerCount] = useState(0)
    const [successfulTriggers, setSuccessfulTriggers] = useState(0)
    const [failedTriggers, setFailedTriggers] = useState(0)

    useEffect(() => {
        fetchUserStatistics()
    }, [])

    const fetchUserStatistics = async () => {
        setIsLoading(true)
        setError('')

        try {
            const response = await fetch('http://localhost:3000/auth/users/statistics')
            const data = await response.json()

            if (data.success) {
                setUsers(data.users)
                
                // Calculate totals
                const totals = data.users.reduce(
                    (acc: any, user: UserStatistics) => ({
                        monthly: acc.monthly + (user.monthly_triggers || 0),
                        successful: acc.successful + (user.successful_triggers || 0),
                        failed: acc.failed + (user.failed_triggers || 0),
                    }),
                    { monthly: 0, successful: 0, failed: 0 }
                )
                
                setMonthlyTriggerCount(totals.monthly)
                setSuccessfulTriggers(totals.successful)
                setFailedTriggers(totals.failed)
            } else {
                setError(data.message || 'Failed to load user statistics')
            }
        } catch (err) {
            console.error('Error fetching user statistics:', err)
            setError('Failed to load user statistics. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    const filteredUsers = users.filter(
        (user) =>
            user.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

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

            {/* Users Statistics Table */}
            <div className="p-4 mt-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">User Statistics</h2>
                    
                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <svg
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <p className="mt-4 text-gray-600">Loading user statistics...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-12">
                            <svg
                                className="mx-auto h-12 w-12 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                            </svg>
                            <p className="mt-4 text-gray-600">
                                {searchTerm ? 'No users match your search' : 'No users found'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Stats */}
                            <div className="mb-4 text-sm text-gray-600">
                                Showing {filteredUsers.length} of {users.length} users
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Monthly Triggers
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Successful
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Failed
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Joined
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredUsers.map((user) => (
                                            <tr key={user.customer_id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 bg-[#C52233] rounded-full flex items-center justify-center text-white font-bold">
                                                            {user.firstname.charAt(0).toUpperCase()}{user.lastname.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {user.firstname} {user.lastname}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {user.email}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-900">{user.monthly_triggers || 0}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        {user.successful_triggers || 0}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                                                        {user.failed_triggers || 0}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(user.date_created)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard