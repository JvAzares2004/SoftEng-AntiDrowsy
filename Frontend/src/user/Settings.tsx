import { useState } from 'react'
import BurgerIcon from '../component/svg/BurgerIcon'
import { useSidebar } from './MainLayout'
import authService from '../services/authService'

// Password criteria checking function
const checkPasswordCriteria = (password: string) => {
  return {
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    // eslint-disable-next-line no-useless-escape
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  }
}

const PasswordCriteriaList = ({ criteria }: { criteria: ReturnType<typeof checkPasswordCriteria> }) => (
  <div className="mt-2 space-y-1">
    <p className={`text-xs ${criteria.hasUppercase ? 'text-green-600' : 'text-red-600'}`}>
      {criteria.hasUppercase ? '✓' : '✗'} At least one uppercase letter
    </p>
    <p className={`text-xs ${criteria.hasLowercase ? 'text-green-600' : 'text-red-600'}`}>
      {criteria.hasLowercase ? '✓' : '✗'} At least one lowercase letter
    </p>
    <p className={`text-xs ${criteria.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
      {criteria.hasNumber ? '✓' : '✗'} At least one number
    </p>
    <p className={`text-xs ${criteria.hasSpecialChar ? 'text-green-600' : 'text-red-600'}`}>
      {criteria.hasSpecialChar ? '✓' : '✗'} At least one special character
    </p>
  </div>
)

function Settings() {
  const { toggleSidebar } = useSidebar()
  
  // WiFi settings state
  const [wifiSSID, setWifiSSID] = useState('')
  const [wifiPassword, setWifiPassword] = useState('')
  const [showWifiPassword, setShowWifiPassword] = useState(false)
  const [wifiPasswordError, setWifiPasswordError] = useState('')
  
  // User account state
  const [username, setUsername] = useState('')
  const [usernamePassword, setUsernamePassword] = useState('')
  const [showUsernamePassword, setShowUsernamePassword] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [newPasswordError, setNewPasswordError] = useState('')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState('')
  const [modalType, setModalType] = useState<'success' | 'error'>('success')


  // Get criteria status for WiFi password
  const wifiCriteria = checkPasswordCriteria(wifiPassword)
  
  // Get criteria status for new password
  const newPasswordCriteria = checkPasswordCriteria(newPassword)

  // Password validation function
  const validatePassword = (password: string): { isValid: boolean; error: string } => {
    const criteria = checkPasswordCriteria(password)

    if (!criteria.hasUppercase) {
      return { isValid: false, error: 'Password must contain at least one uppercase letter' }
    }
    if (!criteria.hasLowercase) {
      return { isValid: false, error: 'Password must contain at least one lowercase letter' }
    }
    if (!criteria.hasNumber) {
      return { isValid: false, error: 'Password must contain at least one number' }
    }
    if (!criteria.hasSpecialChar) {
      return { isValid: false, error: 'Password must contain at least one special character' }
    }

    return { isValid: true, error: '' }
  }

  const handleWifiUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('=== WiFi Settings Change Request ===');
    console.log('New SSID:', wifiSSID);
    console.log('New Password:', wifiPassword);
    console.log('Password validation starting...');
    
    // Validate WiFi password
    const validation = validatePassword(wifiPassword)
    if (!validation.isValid) {
      console.log('WiFi password validation FAILED:', validation.error);
      setWifiPasswordError(validation.error)
      return
    }
    
    console.log('WiFi password validation passed');
    console.log('Sending WiFi settings to ESP32...');
    
    // Use authService to update WiFi settings on ESP32
    authService.updateWiFiSettings(wifiSSID, wifiPassword)
      .then((result) => {
        console.log('ESP32 WiFi settings response:', result);
        if (result.success) {
          setWifiPasswordError('')
          setModalType('success')
          setModalMessage('WiFi settings updated successfully! ESP32 will connect to the new network.')
          setShowModal(true)
          setWifiSSID('')
          setWifiPassword('')
        } else {
          setWifiPasswordError(result.message || 'Failed to update WiFi settings')
        }
      })
      .catch((error) => {
        console.error('Error updating WiFi settings:', error)
        setWifiPasswordError('An error occurred while updating WiFi settings')
      })
  }

  const handleUsernameChange = (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('=== Username Change Request ===');
    console.log('Current Password:', usernamePassword);
    console.log('New Username:', username);
    
    if (!username || username.trim() === '') {
      console.log('Username validation FAILED: Empty username');
      setUsernameError('Username cannot be empty')
      return
    }
    
    console.log('Username validation passed');
    console.log('Sending username change to ESP32...');
    
    // Use authService to change username
    authService.changeUsername(usernamePassword, username)
      .then((result) => {
        console.log('ESP32 username change response:', result);
        if (result.success) {
          setUsernameError('')
          setModalType('success')
          setModalMessage('Username changed successfully! Please use your new username on next login.')
          setShowModal(true)
          setUsername('')
          setUsernamePassword('')
        } else {
          setUsernameError(result.message || 'Failed to change username')
        }
      })
      .catch((error) => {
        console.error('Error changing username:', error)
        setUsernameError('An error occurred while changing username')
      })
  }

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('=== Password Change Request ===');
    console.log('Current Password:', currentPassword);
    console.log('New Password:', newPassword);
    console.log('Confirm Password:', confirmPassword);
    console.log('Password validation starting...');
    
    // Validate new password
    const validation = validatePassword(newPassword)
    if (!validation.isValid) {
      console.log('New password validation FAILED:', validation.error);
      setNewPasswordError(validation.error)
      return
    }
    
    if (newPassword !== confirmPassword) {
      console.log('Password confirmation FAILED: Passwords do not match');
      setNewPasswordError('New passwords do not match!')
      return
    }
    
    console.log('Password validation passed');
    console.log('Sending password change to ESP32...');
    
    // Use authService to change password on ESP32
    authService.changePassword(currentPassword, newPassword)
      .then((result) => {
        console.log('ESP32 password change response:', result);
        if (result.success) {
          setNewPasswordError('')
          setModalType('success')
          setModalMessage('Password changed successfully!')
          setShowModal(true)
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
        } else {
          setNewPasswordError(result.message || 'Failed to change password')
        }
      })
      .catch((error) => {
        console.error('Error changing password:', error)
        setNewPasswordError('An error occurred while changing password')
      })
  }

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
          <h1 className="tracking-wide text-2xl font-semibold">Settings</h1>
          <span className="text-sm font-light tracking-wide">Configure your preferences</span>
        </div>
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
                  onChange={(e) => {
                    setWifiPassword(e.target.value)
                    setWifiPasswordError('')
                  }}
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
              {wifiPasswordError && (
                <p className="text-red-600 text-sm mt-1">{wifiPasswordError}</p>
              )}
              {wifiPassword && <PasswordCriteriaList criteria={wifiCriteria} />}
            </div>

            <button
              type="submit"
              className="bg-[#C52233] text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Update WiFi Settings
            </button>
          </form>
        </div>

        {/* Change Username */}
        <div className="flex flex-col border rounded-xl p-7 gap-5 bg-white">
          <h2 className="text-xl font-semibold text-gray-800">Change Username</h2>
          <p className="text-gray-600 text-sm">Update your username (requires current password)</p>
          
          <form onSubmit={handleUsernameChange} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="username" className="text-sm font-medium text-gray-700">
                New Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setUsernameError('')
                }}
                placeholder="Enter new username"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C52233] focus:border-transparent"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="username-password" className="text-sm font-medium text-gray-700">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showUsernamePassword ? "text" : "password"}
                  id="username-password"
                  value={usernamePassword}
                  onChange={(e) => {
                    setUsernamePassword(e.target.value)
                    setUsernameError('')
                  }}
                  placeholder="Enter current password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C52233] focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowUsernamePassword(!showUsernamePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                >
                  {showUsernamePassword ? "Hide" : "Show"}
                </button>
              </div>
              {usernameError && (
                <p className="text-red-600 text-sm mt-1">{usernameError}</p>
              )}
            </div>

            <button
              type="submit"
              className="bg-[#C52233] text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Change Username
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="flex flex-col border rounded-xl p-7 gap-5 bg-white">
          <h2 className="text-xl font-semibold text-gray-800">Change Password</h2>
          <p className="text-gray-600 text-sm">Update your password with a strong new password</p>
          
          <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
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
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setNewPasswordError('')
                  }}
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
              {newPasswordError && (
                <p className="text-red-600 text-sm mt-1">{newPasswordError}</p>
              )}
              {newPassword && <PasswordCriteriaList criteria={newPasswordCriteria} />}
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
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setNewPasswordError('')
                  }}
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
              Change Password
            </button>
          </form>
        </div>
      </div>

      {/* Success/Error Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
            <div className="flex flex-col items-center">
              {modalType === 'success' ? (
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              ) : (
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
              )}
              <h3 className={`text-xl font-bold mb-2 ${modalType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {modalType === 'success' ? 'Success!' : 'Error'}
              </h3>
              <p className="text-gray-600 text-center mb-6">{modalMessage}</p>
              <button
                onClick={() => setShowModal(false)}
                className={`px-6 py-2 rounded-lg text-white font-medium transition-colors ${
                  modalType === 'success' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
