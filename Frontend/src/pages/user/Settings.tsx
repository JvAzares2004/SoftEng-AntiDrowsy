import { useState, useEffect } from 'react'
import BurgerIcon from '../../component/svg/BurgerIcon'
import { useSidebar } from './MainLayout'
import authService from '../../services/authService'

const API_URL = 'http://localhost:3000';

function Settings() {
  const { toggleSidebar, handleLogout } = useSidebar()
  
  // User profile state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [password, setPassword] = useState('')
  const [passwordLength, setPasswordLength] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Modal state for confirmation
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingField, setEditingField] = useState<string>('')
  const [editingValue, setEditingValue] = useState<string>('')
  const [confirmPasswordValue, setConfirmPasswordValue] = useState<string>('')
  const [showModalPassword, setShowModalPassword] = useState(false)
  
  // Success/Error Modal state
  const [showResultModal, setShowResultModal] = useState(false)
  const [modalMessage, setModalMessage] = useState('')
  const [modalType, setModalType] = useState<'success' | 'error'>('success')

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const storedUser = localStorage.getItem('currentUser');
        const userRole = localStorage.getItem('userRole');
        
        if (!storedUser) {
          setModalType('error');
          setModalMessage('Please log in again');
          setShowResultModal(true);
          setIsLoading(false);
          return;
        }

        const user = JSON.parse(storedUser);
        const response = await fetch(`${API_URL}/auth/profile?email=${encodeURIComponent(user.email)}&role=${userRole}`);
        const data = await response.json();

        if (data.success && data.profile) {
          setFirstName(data.profile.firstname || '');
          setLastName(data.profile.lastname || '');
          setEmail(data.profile.email || '');
          setContactNumber(data.profile.contact_number || '');
          setPasswordLength(data.profile.password_length || 0);
        } else {
          setModalType('error');
          setModalMessage('Failed to load profile data');
          setShowResultModal(true);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setModalType('error');
        setModalMessage('Error loading profile');
        setShowResultModal(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Open edit modal
  const openEditModal = (fieldName: string, currentValue: string) => {
    setEditingField(fieldName)
    setEditingValue(currentValue)
    setConfirmPasswordValue('')
    setShowEditModal(true)
    setShowModalPassword(false)
  }

  // Confirm the change
  const confirmChange = async () => {
    console.log(`=== Updating ${editingField} ===`)
    console.log('New Value:', editingValue)
    
    // Validation
    if (!editingValue || editingValue.trim() === '') {
      setModalType('error')
      setModalMessage('Field cannot be empty')
      setShowEditModal(false)
      setShowResultModal(true)
      return
    }
    
    // Update the appropriate field with specific validations
    switch(editingField) {
      case 'firstName':
        if (editingValue.length < 2) {
          setShowEditModal(false)
          setModalType('error')
          setModalMessage('First name must be at least 2 characters')
          setShowResultModal(true)
          return
        }
        if (!/^[a-zA-Z\s]+$/.test(editingValue)) {
          setShowEditModal(false)
          setModalType('error')
          setModalMessage('First name can only contain letters')
          setShowResultModal(true)
          return
        }
        break
        
      case 'lastName':
        if (editingValue.length < 2) {
          setShowEditModal(false)
          setModalType('error')
          setModalMessage('Last name must be at least 2 characters')
          setShowResultModal(true)
          return
        }
        if (!/^[a-zA-Z\s]+$/.test(editingValue)) {
          setShowEditModal(false)
          setModalType('error')
          setModalMessage('Last name can only contain letters')
          setShowResultModal(true)
          return
        }
        break
        
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(editingValue)) {
          setShowEditModal(false)
          setModalType('error')
          setModalMessage('Please enter a valid email address')
          setShowResultModal(true)
          return
        }
        break
        
      case 'contactNumber':
        const phoneRegex = /^[0-9+\-\s()]+$/
        if (!phoneRegex.test(editingValue)) {
          setShowEditModal(false)
          setModalType('error')
          setModalMessage('Contact number can only contain numbers and phone characters (+, -, spaces, parentheses)')
          setShowResultModal(true)
          return
        }
        if (editingValue.replace(/[^0-9]/g, '').length < 10) {
          setShowEditModal(false)
          setModalType('error')
          setModalMessage('Contact number must contain at least 10 digits')
          setShowResultModal(true)
          return
        }
        break
        
      case 'password':
        // Check minimum length
        if (editingValue.length < 6) {
          setShowEditModal(false)
          setModalType('error')
          setModalMessage('Password must be at least 6 characters')
          setShowResultModal(true)
          return
        }
        
        // Check for uppercase letter
        if (!/[A-Z]/.test(editingValue)) {
          setShowEditModal(false)
          setModalType('error')
          setModalMessage('Password must contain at least one uppercase letter')
          setShowResultModal(true)
          return
        }
        
        // Check for lowercase letter
        if (!/[a-z]/.test(editingValue)) {
          setShowEditModal(false)
          setModalType('error')
          setModalMessage('Password must contain at least one lowercase letter')
          setShowResultModal(true)
          return
        }
        
        // Check for number
        if (!/[0-9]/.test(editingValue)) {
          setShowEditModal(false)
          setModalType('error')
          setModalMessage('Password must contain at least one number')
          setShowResultModal(true)
          return
        }
        
        // Check for special character
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(editingValue)) {
          setShowEditModal(false)
          setModalType('error')
          setModalMessage('Password must contain at least one special character')
          setShowResultModal(true)
          return
        }
        
        // Check if passwords match
        if (editingValue !== confirmPasswordValue) {
          setShowEditModal(false)
          setModalType('error')
          setModalMessage('Passwords do not match')
          setShowResultModal(true)
          return
        }
        break
    }
    
    // Save to database
    try {
      const storedUser = localStorage.getItem('currentUser');
      const userRole = localStorage.getItem('userRole');
      
      if (!storedUser) {
        setShowEditModal(false);
        setModalType('error');
        setModalMessage('Please log in again');
        setShowResultModal(true);
        return;
      }

      const user = JSON.parse(storedUser);
      const fieldMap: Record<string, string> = {
        'firstName': 'firstname',
        'lastName': 'lastname',
        'contactNumber': 'contact_number',
        'password': 'password'
      };

      const response = await fetch(`${API_URL}/auth/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          role: userRole,
          field: fieldMap[editingField] || editingField,
          value: editingValue,
          password: editingField === 'password' ? password : undefined
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        switch(editingField) {
          case 'firstName':
            setFirstName(editingValue);
            break;
          case 'lastName':
            setLastName(editingValue);
            break;
          case 'email':
            setEmail(editingValue);
            break;
          case 'contactNumber':
            setContactNumber(editingValue);
            break;
          case 'password':
            setPassword(editingValue);
            setPasswordLength(editingValue.length);
            break;
        }
        
        setShowEditModal(false);
        setModalType('success');
        setModalMessage(`${editingField.charAt(0).toUpperCase() + editingField.slice(1).replace(/([A-Z])/g, ' $1')} updated successfully!`);
        setShowResultModal(true);
      } else {
        setShowEditModal(false);
        setModalType('error');
        setModalMessage(data.message || 'Failed to update profile');
        setShowResultModal(true);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setShowEditModal(false);
      setModalType('error');
      setModalMessage('Error updating profile. Please try again.');
      setShowResultModal(true);
    }
  }

  // Cancel the change
  const cancelEdit = () => {
    setShowEditModal(false)
    setEditingField('')
    setEditingValue('')
    setConfirmPasswordValue('')
  }

  return (
    <div>
      <button 
        onClick={toggleSidebar}
        className="flex hover:scale-110 transition-transform cursor-pointer md:hidden mb-4"
      >
        <BurgerIcon className="text-[#C52233]"/>
      </button>

      <div className="flex flex-col gap-6 mt-10 p-4">
        {/* User Profile Settings */}
        <div className="flex flex-col border rounded-xl p-7 gap-5 bg-white shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Settings</h2>
          <p className="text-gray-600 text-sm mb-4">Update your personal information</p>
          
          <div className="flex flex-col gap-5">
            {/* First Name */}
            <div className="flex flex-col gap-2">
              <label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                First Name
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  readOnly
                  placeholder="Not set"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />
                <button
                  onClick={() => openEditModal('firstName', firstName)}
                  className="p-3 rounded-lg bg-[#C52233] text-white hover:bg-red-700 transition-colors cursor-pointer"
                  title="Edit First Name"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Last Name */}
            <div className="flex flex-col gap-2">
              <label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                Last Name
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  readOnly
                  placeholder="Not set"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />
                <button
                  onClick={() => openEditModal('lastName', lastName)}
                  className="p-3 rounded-lg bg-[#C52233] text-white hover:bg-red-700 transition-colors cursor-pointer"
                  title="Edit Last Name"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="email"
                  id="email"
                  value={email}
                  readOnly
                  placeholder="Not set"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />
                <button
                  onClick={() => openEditModal('email', email)}
                  className="p-3 rounded-lg bg-[#C52233] text-white hover:bg-red-700 transition-colors cursor-pointer"
                  title="Edit Email"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contact Number */}
            <div className="flex flex-col gap-2">
              <label htmlFor="contactNumber" className="text-sm font-medium text-gray-700">
                Contact Number
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="tel"
                  id="contactNumber"
                  value={contactNumber}
                  readOnly
                  placeholder="Not set"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />
                <button
                  onClick={() => openEditModal('contactNumber', contactNumber)}
                  className="p-3 rounded-lg bg-[#C52233] text-white hover:bg-red-700 transition-colors cursor-pointer"
                  title="Edit Contact Number"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="password"
                  id="password"
                  value={passwordLength ? '•'.repeat(Math.min(passwordLength, 20)) : ''}
                  readOnly
                  placeholder={passwordLength ? `${passwordLength} characters` : "Not set"}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />
                <button
                  onClick={() => openEditModal('password', password)}
                  className="p-3 rounded-lg bg-[#C52233] text-white hover:bg-red-700 transition-colors cursor-pointer"
                  title="Edit Password"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="flex justify-end pb-8">
          <button
            onClick={handleLogout}
            className="px-8 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors cursor-pointer shadow-md flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 11-2 0V4H5v12h10v-2a1 1 0 112 0v3a1 1 0 01-1 1H4a1 1 0 01-1-1V3z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M13 10a1 1 0 011-1h3.586l-1.293-1.293a1 1 0 111.414-1.414l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L17.586 11H14a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
            <div className="flex flex-col">
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                Edit {editingField.charAt(0).toUpperCase() + editingField.slice(1).replace(/([A-Z])/g, ' $1')}
              </h3>
              
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  New {editingField.charAt(0).toUpperCase() + editingField.slice(1).replace(/([A-Z])/g, ' $1')}
                </label>
                {editingField === 'password' ? (
                  <div className="flex flex-col gap-4">
                    <div className="relative">
                      <input
                        type={showModalPassword ? "text" : "password"}
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C52233] focus:border-transparent"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowModalPassword(!showModalPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 cursor-pointer"
                        aria-label={showModalPassword ? "Hide password" : "Show password"}
                      >
                        {showModalPassword ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showModalPassword ? "text" : "password"}
                          value={confirmPasswordValue}
                          onChange={(e) => setConfirmPasswordValue(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C52233] focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowModalPassword(!showModalPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 cursor-pointer"
                          aria-label={showModalPassword ? "Hide password" : "Show password"}
                        >
                          {showModalPassword ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-xs space-y-1">
                      <p className="text-gray-600 font-semibold mb-1">Password must contain:</p>
                      <p className={editingValue.length >= 6 ? 'text-green-600' : 'text-gray-500'}>
                        {editingValue.length >= 6 ? '✓' : '○'} At least 6 characters
                      </p>
                      <p className={/[A-Z]/.test(editingValue) ? 'text-green-600' : 'text-gray-500'}>
                        {/[A-Z]/.test(editingValue) ? '✓' : '○'} One uppercase letter
                      </p>
                      <p className={/[a-z]/.test(editingValue) ? 'text-green-600' : 'text-gray-500'}>
                        {/[a-z]/.test(editingValue) ? '✓' : '○'} One lowercase letter
                      </p>
                      <p className={/[0-9]/.test(editingValue) ? 'text-green-600' : 'text-gray-500'}>
                        {/[0-9]/.test(editingValue) ? '✓' : '○'} One number
                      </p>
                      <p className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(editingValue) ? 'text-green-600' : 'text-gray-500'}>
                        {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(editingValue) ? '✓' : '○'} One special character
                      </p>
                      <p className={editingValue && confirmPasswordValue && editingValue === confirmPasswordValue ? 'text-green-600' : 'text-gray-500'}>
                        {editingValue && confirmPasswordValue && editingValue === confirmPasswordValue ? '✓' : '○'} Passwords match
                      </p>
                    </div>
                  </div>
                ) : (
                  <input
                    type={editingField === 'email' ? 'email' : editingField === 'contactNumber' ? 'tel' : 'text'}
                    value={editingValue}
                    onChange={(e) => {
                      const value = e.target.value
                      // For contact number, only allow numbers and phone characters
                      if (editingField === 'contactNumber') {
                        const filtered = value.replace(/[^0-9+\-\s()]/g, '')
                        setEditingValue(filtered)
                      } else {
                        setEditingValue(value)
                      }
                    }}
                    placeholder={`Enter new ${editingField.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C52233] focus:border-transparent"
                    autoFocus
                  />
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={cancelEdit}
                  className="flex-1 px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmChange}
                  className="flex-1 px-6 py-2 rounded-lg bg-[#C52233] text-white font-medium hover:bg-red-700 transition-colors cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Modal */}
      {showResultModal && (
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
                onClick={() => setShowResultModal(false)}
                className={`px-6 py-2 rounded-lg text-white font-medium transition-colors cursor-pointer ${
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
