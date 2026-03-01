import { useState, useEffect } from 'react'
import BurgerIcon from '../../component/svg/BurgerIcon'
import { useSidebar } from './AdminLayout'
import { API_URL } from '../../config/api'

interface User {
  customer_id: string;
  firstname: string;
  lastname: string;
  email: string;
  contact_number: string;
  date_created: string;
}

function AdminDashboard() {
    const { toggleSidebar } = useSidebar()
    
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [sortField, setSortField] = useState<keyof User>('date_created')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
    const usersPerPage = 20
    
    // CSV Import Modal state
    const [showImportModal, setShowImportModal] = useState(false)
    const [importModalType, setImportModalType] = useState<'error' | 'success' | 'warning'>('error')
    const [importModalTitle, setImportModalTitle] = useState('')
    const [importModalMessage, setImportModalMessage] = useState('')
    const [importDuplicates, setImportDuplicates] = useState<string[]>([])
    
    // Counter states
    const [totalActiveUsers, setTotalActiveUsers] = useState(0)
    const [onlineUsers, setOnlineUsers] = useState(0)
    const [monthlySignups, setMonthlySignups] = useState(0)

    useEffect(() => {
        fetchUsers()
    }, [])

    const exportToCSV = () => {
        if (filteredAndSortedUsers.length === 0) {
            setImportModalType('warning')
            setImportModalTitle('No Data to Export')
            setImportModalMessage('There are no users to export.')
            setImportDuplicates([])
            setShowImportModal(true)
            return
        }

        // CSV headers
        const headers = ['First Name', 'Last Name', 'Email', 'Contact Number', 'Date Created']
        
        // CSV rows
        const rows = filteredAndSortedUsers.map(user => [
            user.firstname,
            user.lastname,
            user.email,
            user.contact_number || '',
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
        link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`)
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
                
                if (dataLines.length === 0) {
                    setImportModalType('error')
                    setImportModalTitle('Empty CSV File')
                    setImportModalMessage('CSV file is empty or contains only headers.')
                    setImportDuplicates([])
                    setShowImportModal(true)
                    event.target.value = ''
                    return
                }
                
                // Parse CSV data
                const importedUsers = dataLines.map(line => {
                    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
                    return {
                        firstname: values[0] || '',
                        lastname: values[1] || '',
                        email: values[2] || '',
                        contact_number: values[3] || '',
                    }
                }).filter(user => user.email) // Only include rows with email
                
                // Check for duplicates by comparing emails
                const existingEmails = new Set(users.map(u => u.email.toLowerCase()))
                const duplicates: string[] = []
                const newUsers = importedUsers.filter(user => {
                    const emailLower = user.email.toLowerCase()
                    if (existingEmails.has(emailLower)) {
                        duplicates.push(user.email)
                        return false
                    }
                    return true
                })
                
                // Build detailed message and show modal
                let message = `Total rows found: ${importedUsers.length}\nNew users that can be imported: ${newUsers.length}\nDuplicates (already exist): ${duplicates.length}`
                
                if (duplicates.length > 0) {
                    setImportModalType('error')
                    setImportModalTitle('Duplicate Users Found')
                    message += '\n\nThe following users already exist in the system and cannot be imported:'
                    setImportModalMessage(message)
                    setImportDuplicates(duplicates)
                } else if (newUsers.length === 0) {
                    setImportModalType('warning')
                    setImportModalTitle('No New Users')
                    setImportModalMessage('No new users to import. All users already exist in the system.')
                    setImportDuplicates([])
                } else {
                    setImportModalType('success')
                    setImportModalTitle('Import Preview')
                    message += '\n\nNote: This is a preview. Actual import functionality needs to be implemented.'
                    setImportModalMessage(message)
                    setImportDuplicates([])
                }
                
                setShowImportModal(true)
                console.log('Duplicate emails:', duplicates)
                console.log('New users to import:', newUsers)
                
                // Reset file input
                event.target.value = ''
            } catch (error) {
                console.error('Error parsing CSV:', error)
                setImportModalType('error')
                setImportModalTitle('CSV Parse Error')
                setImportModalMessage('Error parsing CSV file. Please check the format.\n\nExpected format: First Name, Last Name, Email, Contact Number')
                setImportDuplicates([])
                setShowImportModal(true)
            }
        }
        reader.readAsText(file)
    }

    const fetchUsers = async () => {
        setIsLoading(true)
        setError('')

        try {
            const response = await fetch(`${API_URL}/auth/users/statistics`)
            const data = await response.json()

            if (data.success) {
                setUsers(data.users)
                
                // Calculate statistics
                const total = data.users.length
                setTotalActiveUsers(total)
                
                // Calculate monthly signups (current month)
                const now = new Date()
                const currentMonth = now.getMonth()
                const currentYear = now.getFullYear()
                
                const monthlyUsers = data.users.filter((user: User) => {
                    const userDate = new Date(user.date_created)
                    return userDate.getMonth() === currentMonth && userDate.getFullYear() === currentYear
                })
                setMonthlySignups(monthlyUsers.length)
                
                // For online users, check if data provides it, otherwise set to 0
                // This would typically come from backend tracking active sessions
                setOnlineUsers(data.onlineUsers || 0)
            } else {
                setError(data.message || 'Failed to load users')
            }
        } catch (err) {
            console.error('Error fetching users:', err)
            setError('Failed to load users. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp)
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const handleSort = (field: keyof User) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    const SortIcon = ({ field }: { field: keyof User }) => {
        if (sortField !== field) {
            return (
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
                </svg>
            )
        }

        return sortDirection === 'asc' ? (
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
            </svg>
        ) : (
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z" />
            </svg>
        )
    }

    // Filter and sort users
    const filteredAndSortedUsers = users
        .filter(
            (user) =>
                user.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.contact_number.includes(searchTerm)
        )
        .sort((a, b) => {
            const aValue = a[sortField]
            const bValue = b[sortField]

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue)
            }

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
            }

            return 0
        })

    // Pagination
    const indexOfLastUser = currentPage * usersPerPage
    const indexOfFirstUser = indexOfLastUser - usersPerPage
    const currentUsers = filteredAndSortedUsers.slice(indexOfFirstUser, indexOfLastUser)
    const totalPages = Math.ceil(filteredAndSortedUsers.length / usersPerPage)

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber)
    }

    return (
        <>
        <div className="min-h-screen bg-gray-100">
            {/* Mobile Menu Button */}
            <div className="p-4 md:p-6">
                <button
                    onClick={toggleSidebar}
                    className="md:hidden mb-4 p-2 rounded-lg hover:bg-gray-100 bg-white shadow-sm"
                >
                    <BurgerIcon />
                </button>

                {/* Statistics Counters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Total Active Users */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium mb-1">Total Active Users</p>
                                <p className="text-white text-4xl font-bold">{totalActiveUsers}</p>
                            </div>
                            <div className="bg-white/20 rounded-full p-3">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Currently Online Users */}
                    <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg shadow-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm font-medium mb-1">Currently Online</p>
                                <p className="text-white text-4xl font-bold">{onlineUsers}</p>
                            </div>
                            <div className="bg-white/20 rounded-full p-3">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Signups */}
                    <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg shadow-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm font-medium mb-1">Monthly Signups</p>
                                <p className="text-white text-4xl font-bold">{monthlySignups}</p>
                                <p className="text-purple-100 text-xs mt-1">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                            </div>
                            <div className="bg-white/20 rounded-full p-3">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Users</h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Total: {filteredAndSortedUsers.length} user{filteredAndSortedUsers.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        
                        <div className="flex gap-2">
                            <button
                                onClick={fetchUsers}
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
                                placeholder="Search by name, email, or contact number..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setCurrentPage(1) // Reset to first page on search
                                }}
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
                            <p className="mt-4 text-gray-600">Loading users...</p>
                        </div>
                    ) : currentUsers.length === 0 ? (
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
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchTerm ? 'Try adjusting your search' : 'No registered users yet'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Users Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('firstname')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Name
                                                    <SortIcon field="firstname" />
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
                                                onClick={() => handleSort('contact_number')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Contact
                                                    <SortIcon field="contact_number" />
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort('date_created')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Created
                                                    <SortIcon field="date_created" />
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentUsers.map((user) => (
                                            <tr key={user.customer_id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                                            {user.firstname.charAt(0).toUpperCase()}
                                                            {user.lastname.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {user.firstname} {user.lastname}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{user.email}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{user.contact_number || '-'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{formatDate(user.date_created)}</div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-6 flex justify-center items-center space-x-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`px-4 py-2 rounded-lg ${
                                            currentPage === 1
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                        }`}
                                    >
                                        Previous
                                    </button>

                                    <div className="flex space-x-2">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNumber
                                            if (totalPages <= 5) {
                                                pageNumber = i + 1
                                            } else if (currentPage <= 3) {
                                                pageNumber = i + 1
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNumber = totalPages - 4 + i
                                            } else {
                                                pageNumber = currentPage - 2 + i
                                            }

                                            return (
                                                <button
                                                    key={pageNumber}
                                                    onClick={() => handlePageChange(pageNumber)}
                                                    className={`px-4 py-2 rounded-lg ${
                                                        currentPage === pageNumber
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                                    }`}
                                                >
                                                    {pageNumber}
                                                </button>
                                            )
                                        })}
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`px-4 py-2 rounded-lg ${
                                            currentPage === totalPages
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                        }`}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
        
        {/* CSV Import Modal */}
        {showImportModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-lg p-6 shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                    <h2 className={`text-xl font-bold mb-4 ${
                        importModalType === 'error' ? 'text-red-600' : 
                        importModalType === 'warning' ? 'text-yellow-600' : 
                        'text-green-600'
                    }`}>
                        {importModalTitle}
                    </h2>
                    <div className="text-gray-700 mb-4 whitespace-pre-line">
                        {importModalMessage}
                    </div>
                    
                    {importDuplicates.length > 0 && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg max-h-60 overflow-y-auto">
                            <h3 className="font-semibold text-red-800 mb-2">Duplicate Emails:</h3>
                            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                                {importDuplicates.slice(0, 20).map((email, index) => (
                                    <li key={index}>{email}</li>
                                ))}
                                {importDuplicates.length > 20 && (
                                    <li className="font-semibold">... and {importDuplicates.length - 20} more</li>
                                )}
                            </ul>
                        </div>
                    )}
                    
                    <div className="flex justify-end mt-6">
                        <button
                            onClick={() => setShowImportModal(false)}
                            className={`px-6 py-2 rounded-lg transition-colors cursor-pointer ${
                                importModalType === 'error' ? 'bg-red-500 hover:bg-red-600 text-white' :
                                importModalType === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' :
                                'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    )
}

export default AdminDashboard