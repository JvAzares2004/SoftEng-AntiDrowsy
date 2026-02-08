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
    const [sortField, setSortField] = useState<string>('')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    useEffect(() => {
        fetchUserStatistics()
    }, [])

    const exportToCSV = () => {
        if (filteredUsers.length === 0) {
            alert('No user statistics to export')
            return
        }

        // CSV headers
        const headers = ['Name', 'Email', 'Contact', 'Monthly Triggers', 'Successful', 'Failed', 'Date Created']
        
        // CSV rows
        const rows = filteredUsers.map(user => [
            `${user.firstname} ${user.lastname}`,
            user.email,
            user.contact_number || '',
            user.monthly_triggers,
            user.successful_triggers,
            user.failed_triggers,
            formatDate(user.date_created)
        ])

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n')

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `user_statistics_export_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string
                const lines = text.split('\n')
                
                // Skip header row
                const dataLines = lines.slice(1).filter(line => line.trim())
                
                console.log(`CSV Import: Found ${dataLines.length} rows`)
                alert(`Successfully read ${dataLines.length} rows from CSV. Import functionality would process these statistics.`)
                
                // Reset file input
                event.target.value = ''
            } catch (error) {
                console.error('Error parsing CSV:', error)
                alert('Error parsing CSV file. Please check the format.')
            }
        }
        reader.readAsText(file)
    }

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

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    const SortIcon = ({ field }: { field: string }) => {
        if (sortField !== field) {
            return (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            )
        }
        return sortDirection === 'asc' ? (
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        ) : (
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        )
    }

    const filteredUsers = users
        .filter(
            (user) =>
                user.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            if (!sortField) return 0
            
            let aValue: any
            let bValue: any
            
            switch (sortField) {
                case 'name':
                    aValue = `${a.firstname} ${a.lastname}`.toLowerCase()
                    bValue = `${b.firstname} ${b.lastname}`.toLowerCase()
                    break
                case 'email':
                    aValue = a.email.toLowerCase()
                    bValue = b.email.toLowerCase()
                    break
                case 'monthly_triggers':
                    aValue = a.monthly_triggers || 0
                    bValue = b.monthly_triggers || 0
                    break
                case 'successful_triggers':
                    aValue = a.successful_triggers || 0
                    bValue = b.successful_triggers || 0
                    break
                case 'failed_triggers':
                    aValue = a.failed_triggers || 0
                    bValue = b.failed_triggers || 0
                    break
                case 'date_created':
                    aValue = new Date(a.date_created).getTime()
                    bValue = new Date(b.date_created).getTime()
                    break
                default:
                    return 0
            }
            
            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
            return 0
        })

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
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">User Statistics</h2>
                        
                        <div className="flex gap-2">
                            <button
                                onClick={fetchUserStatistics}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refresh
                            </button>

                            <button
                                onClick={exportToCSV}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Export CSV
                            </button>

                            <label className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 cursor-pointer">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                Import CSV
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleImportCSV}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>
                    
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
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('name')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    User
                                                    <SortIcon field="name" />
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('email')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Email
                                                    <SortIcon field="email" />
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('monthly_triggers')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Monthly Triggers
                                                    <SortIcon field="monthly_triggers" />
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('successful_triggers')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Successful
                                                    <SortIcon field="successful_triggers" />
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('failed_triggers')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Failed
                                                    <SortIcon field="failed_triggers" />
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('date_created')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Joined
                                                    <SortIcon field="date_created" />
                                                </div>
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