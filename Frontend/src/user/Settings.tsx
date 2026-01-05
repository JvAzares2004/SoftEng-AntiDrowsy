import { useState } from 'react'
import BurgerIcon from '../component/svg/BurgerIcon'
import { useSidebar } from './MainLayout'

function Settings() {
  const { toggleSidebar } = useSidebar()
  
  // WiFi settings state
  const [wifiSSID, setWifiSSID] = useState('')
  const [wifiPassword, setWifiPassword] = useState('')
  const [showWifiPassword, setShowWifiPassword] = useState(false)
  
  // User account state
  const [username, setUsername] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleWifiUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('WiFi Settings Updated:', { wifiSSID, wifiPassword })
    // Add your WiFi update logic here
    alert('WiFi settings updated successfully!')
  }

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match!')
      return
    }
    console.log('Password Changed:', { username, currentPassword, newPassword })
    // Add your password change logic here
    alert('Password changed successfully!')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <div>
      <div className={`sticky top-0 z-40 bg-[#C52233] px-8 py-4 min-h-30 md:rounded-lg flex justify-between items-end`}>
        <div className="text-white inter">
          <h1 className="tracking-wide text-2xl font-semibold">Settings</h1>
          <span className="text-sm font-light tracking-wide">Configure your preferences</span>
        </div>
        
        <button 
          onClick={toggleSidebar}
          className="flex mb-7 mr-5 hover:scale-110 transition-transform cursor-pointer md:hidden"
        >
          <BurgerIcon className="text-white"/>
        </button>
      </div>

      <div className="flex flex-col gap-6 mt-10 p-4">
        {/* WiFi Network Settings */}
        <div className="flex flex-col border rounded-xl p-7 gap-5 bg-white">
          <h2 className="text-xl font-semibold text-gray-800">WiFi Network Settings</h2>
          <p className="text-gray-600 text-sm">Configure your WiFi network connection</p>
          
          <form onSubmit={handleWifiUpdate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="ssid" className="text-sm font-medium text-gray-700">
                Network Name (SSID)
              </label>
              <input
                type="text"
                id="ssid"
                value={wifiSSID}
                onChange={(e) => setWifiSSID(e.target.value)}
                placeholder="Enter WiFi SSID"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C52233] focus:border-transparent"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="wifi-password" className="text-sm font-medium text-gray-700">
                WiFi Password
              </label>
              <div className="relative">
                <input
                  type={showWifiPassword ? "text" : "password"}
                  id="wifi-password"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  placeholder="Enter WiFi password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C52233] focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowWifiPassword(!showWifiPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                >
                  {showWifiPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="bg-[#C52233] text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Update WiFi Settings
            </button>
          </form>
        </div>

        {/* User Account Settings */}
        <div className="flex flex-col border rounded-xl p-7 gap-5 bg-white">
          <h2 className="text-xl font-semibold text-gray-800">User Account Settings</h2>
          <p className="text-gray-600 text-sm">Update your username and password</p>
          
          <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="username" className="text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter new username"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C52233] focus:border-transparent"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="current-password" className="text-sm font-medium text-gray-700">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  id="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C52233] focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                >
                  {showCurrentPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="new-password" className="text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C52233] focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C52233] focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="bg-[#C52233] text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Update Account Settings
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Settings
