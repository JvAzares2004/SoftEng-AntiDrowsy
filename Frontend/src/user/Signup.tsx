import React, { useState, type ChangeEvent, type FormEvent } from 'react';
import Swal from 'sweetalert2';
import DrowsinessLogo from '../component/img/Drowsiness-Logo.png';
import authService from '../services/authService';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  password: string;
  confirmPassword: string;
}

interface FieldStatus {
  firstName: 'default' | 'error' | 'success';
  lastName: 'default' | 'error' | 'success';
  email: 'default' | 'error' | 'success';
  contact: 'default' | 'error' | 'success';
  password: 'default' | 'error' | 'success';
  confirmPassword: 'default' | 'error' | 'success';
}

type PasswordStrength = 'none' | 'weak' | 'medium' | 'strong';

const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    contact: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({
    firstName: '',
    lastName: '',
    email: '',
    contact: '',
    password: '',
    confirmPassword: '',
  });

  const [fieldStatus, setFieldStatus] = useState<FieldStatus>({
    firstName: 'default',
    lastName: 'default',
    email: 'default',
    contact: 'default',
    password: 'default',
    confirmPassword: 'default',
  });

  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>('none');

  // Validation Functions
  const validateName = (name: string, fieldName: string): string | null => {
    if (!name || name.trim().length === 0) {
      return `${fieldName} is required`;
    }

    if (!/^[A-Za-z]+$/.test(name)) {
      return `${fieldName} must contain only letters`;
    }

    if (name[0] !== name[0].toUpperCase()) {
      return `${fieldName} must start with an uppercase letter`;
    }

    if (name.length < 3) {
      return `${fieldName} must be at least 3 letters`;
    }

    return null;
  };

  const validateEmail = (email: string): string | null => {
    if (!email || email.trim().length === 0) {
      return 'Email is required';
    }

    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailPattern.test(email)) {
      return 'Email can only contain letters, numbers, underscores, dashes, and dots';
    }

    if (email.includes('..')) {
      return 'Email cannot contain consecutive dots';
    }

    const localPart = email.split('@')[0];
    if (/^[._-]|[._-]$/.test(localPart)) {
      return 'Email cannot start or end with special characters';
    }

    return null;
  };

  const validateContact = (contact: string): string | null => {
    if (!contact || contact.trim().length === 0) {
      return 'Contact number is required';
    }

    if (!/^\d+$/.test(contact)) {
      return 'Contact number must contain only numbers';
    }

    if (!contact.startsWith('09')) {
      return 'Contact number must start with 09';
    }

    if (contact.length !== 11) {
      return 'Contact number must be exactly 11 digits';
    }

    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password || password.trim().length === 0) {
      return 'Password is required';
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasUppercase) {
      return 'Password must contain at least one uppercase letter';
    }

    if (!hasNumber) {
      return 'Password must contain at least one number';
    }

    if (!hasSpecialChar) {
      return 'Password must contain at least one special character';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }

    return null;
  };

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    if (!password) return 'none';

    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    // eslint-disable-next-line no-useless-escape
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;

    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
  };

  // Update field status
  const updateFieldStatus = (field: keyof FormErrors, error: string | null) => {
    setFieldStatus((prev) => ({
      ...prev,
      [field]: error ? 'error' : 'success',
    }));
  };

  // Handle Input Change
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    let processedValue = value;

    // Special handling for contact - only allow numbers
    if (name === 'contact') {
      processedValue = value.replace(/\D/g, '').slice(0, 11);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    // Real-time validation
    let error: string | null = null;

    switch (name) {
      case 'firstName':
        error = validateName(processedValue, 'First name');
        setErrors((prev) => ({ ...prev, firstName: error || '' }));
        updateFieldStatus('firstName', error);
        break;

      case 'lastName':
        error = validateName(processedValue, 'Last name');
        setErrors((prev) => ({ ...prev, lastName: error || '' }));
        updateFieldStatus('lastName', error);
        break;

      case 'email':
        error = validateEmail(processedValue);
        setErrors((prev) => ({ ...prev, email: error || '' }));
        updateFieldStatus('email', error);
        break;

      case 'contact':
        error = validateContact(processedValue);
        setErrors((prev) => ({ ...prev, contact: error || '' }));
        updateFieldStatus('contact', error);
        break;

      case 'password':
        error = validatePassword(processedValue);
        setErrors((prev) => ({ ...prev, password: error || '' }));
        updateFieldStatus('password', error);
        setPasswordStrength(calculatePasswordStrength(processedValue));

        // Re-validate confirm password if it has value
        if (formData.confirmPassword) {
          const confirmError =
            formData.confirmPassword !== processedValue ? 'Passwords do not match' : null;
          setErrors((prev) => ({ ...prev, confirmPassword: confirmError || '' }));
          updateFieldStatus('confirmPassword', confirmError);
        }
        break;

      case 'confirmPassword':
        error =
          processedValue !== formData.password
            ? 'Passwords do not match'
            : processedValue.length === 0
            ? 'Please confirm your password'
            : null;
        setErrors((prev) => ({ ...prev, confirmPassword: error || '' }));
        updateFieldStatus('confirmPassword', error);
        break;
    }
  };

  // Handle Form Submit
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let isValid = true;
    const validationErrors: string[] = [];
    const newErrors: FormErrors = {
      firstName: '',
      lastName: '',
      email: '',
      contact: '',
      password: '',
      confirmPassword: '',
    };

    const newFieldStatus: FieldStatus = {
      firstName: 'default',
      lastName: 'default',
      email: 'default',
      contact: 'default',
      password: 'default',
      confirmPassword: 'default',
    };

    // Validate all fields
    const firstNameError = validateName(formData.firstName, 'First name');
    if (firstNameError) {
      newErrors.firstName = firstNameError;
      newFieldStatus.firstName = 'error';
      validationErrors.push(firstNameError);
      isValid = false;
    } else {
      newFieldStatus.firstName = 'success';
    }

    const lastNameError = validateName(formData.lastName, 'Last name');
    if (lastNameError) {
      newErrors.lastName = lastNameError;
      newFieldStatus.lastName = 'error';
      validationErrors.push(lastNameError);
      isValid = false;
    } else {
      newFieldStatus.lastName = 'success';
    }

    const emailError = validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
      newFieldStatus.email = 'error';
      validationErrors.push(emailError);
      isValid = false;
    } else {
      newFieldStatus.email = 'success';
    }

    const contactError = validateContact(formData.contact);
    if (contactError) {
      newErrors.contact = contactError;
      newFieldStatus.contact = 'error';
      validationErrors.push(contactError);
      isValid = false;
    } else {
      newFieldStatus.contact = 'success';
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      newErrors.password = passwordError;
      newFieldStatus.password = 'error';
      validationErrors.push(passwordError);
      isValid = false;
    } else {
      newFieldStatus.password = 'success';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      newFieldStatus.confirmPassword = 'error';
      validationErrors.push('Please confirm your password');
      isValid = false;
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
      newFieldStatus.confirmPassword = 'error';
      validationErrors.push('Passwords do not match');
      isValid = false;
    } else {
      newFieldStatus.confirmPassword = 'success';
    }

    setErrors(newErrors);
    setFieldStatus(newFieldStatus);

    // Show SweetAlert for validation errors
    if (!isValid) {
      await Swal.fire({
        icon: 'error',
        title: 'Validation Failed',
        html: `
          <div style="text-align: left; margin-top: 1rem;">
            <p style="margin-bottom: 0.5rem; color: rgba(255, 255, 255, 0.9);">Please fix the following errors:</p>
            <ul style="margin-left: 1.5rem; color: rgba(255, 255, 255, 0.7);">
              ${validationErrors.map((err) => `<li style="margin-bottom: 0.25rem;">${err}</li>`).join('')}
            </ul>
          </div>
        `,
        confirmButtonText: 'OK',
        background: '#1a1a1a',
        color: '#fff',
        confirmButtonColor: '#C52233',
      });
      return;
    }

    // Check password strength
    const strength = calculatePasswordStrength(formData.password);
    if (strength === 'weak') {
      const result = await Swal.fire({
        icon: 'warning',
        title: 'Weak Password',
        text: 'Your password is weak. Are you sure you want to continue with this password?',
        showCancelButton: true,
        confirmButtonText: 'Yes, continue',
        cancelButtonText: 'No, change it',
        background: '#1a1a1a',
        color: '#fff',
        confirmButtonColor: '#C52233',
        cancelButtonColor: '#6c757d',
      });

      if (!result.isConfirmed) {
        return;
      }
    }

    // Start Email Verification Flow
    Swal.fire({
      title: 'Sending Verification Code...',
      text: 'Please wait while we send a code to your email.',
      allowOutsideClick: false,
      background: '#1a1a1a',
      color: '#fff',
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await authService.sendVerificationCode(formData.email);

      if (response.success && response.code) {
        const serverCode = response.code;

        // Prompt for code
        const { value: enteredCode } = await Swal.fire({
          title: 'Email Verification',
          text: `We sent a verification code to ${formData.email}. (Check console for mock code)`,
          input: 'text',
          inputLabel: 'Verification Code',
          inputPlaceholder: 'Enter 6-digit code',
          showCancelButton: true,
          confirmButtonText: 'Verify',
          confirmButtonColor: '#C52233',
          background: '#1a1a1a',
          color: '#fff',
          inputValidator: (value) => {
            if (!value) {
              return 'You need to write something!';
            }
            if (value !== serverCode) {
              return 'Invalid verification code';
            }
            return null;
          },
        });

        if (enteredCode) {
          // Success
          await Swal.fire({
            icon: 'success',
            title: 'Account Created!',
            text: 'Your email has been verified and account created.',
            confirmButtonText: 'Continue',
            background: '#1a1a1a',
            color: '#fff',
            confirmButtonColor: '#C52233',
          });

          // Reset form
          setFormData({
            firstName: '',
            lastName: '',
            email: '',
            contact: '',
            password: '',
            confirmPassword: '',
          });

          setErrors({
            firstName: '',
            lastName: '',
            email: '',
            contact: '',
            password: '',
            confirmPassword: '',
          });

          setFieldStatus({
            firstName: 'default',
            lastName: 'default',
            email: 'default',
            contact: 'default',
            password: 'default',
            confirmPassword: 'default',
          });

          setPasswordStrength('none');
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to send verification code. Please try again.',
        background: '#1a1a1a',
        color: '#fff',
        confirmButtonColor: '#C52233',
      });
    }
  };

  // Get input border color based on status
  const getInputClass = (field: keyof FieldStatus): string => {
    const baseClass =
      'text-white text-md font-light border rounded-lg px-4 py-3 bg-transparent placeholder-white w-full focus:outline-none focus:ring-2 focus:ring-white/50 transition-all';

    if (fieldStatus[field] === 'error') {
      return `${baseClass} border-red-300 bg-red-500/10`;
    }
    if (fieldStatus[field] === 'success') {
      return `${baseClass} border-green-300 bg-green-500/10`;
    }
    return `${baseClass} border-white`;
  };

  return (
    <div className="flex flex-col inter min-h-screen bg-white">
      {/* Header - Mimicking Login Page */}
      <div className="flex flex-col items-center md:flex-row px-5 py-4 gap-2 md:gap-4 md:border-b border-b-gray-300 md:mt-0">
        <img src={DrowsinessLogo} alt="Logo" className="w-16 h-16 md:w-16 md:h-16" />
        <div className="flex flex-col justify-center items-center md:items-start">
          <h1 className="font-semibold text-2xl md:text-3xl md:font-bold text-black inter italic">Anti Drowsy</h1>
          <span className="text-[#DE0303] font-semibold text-xl md:text-2xl">Car Seat Sensor</span>
        </div>
      </div>

      {/* Centered Signup Container */}
      <div className="flex flex-col justify-center items-center flex-1 py-8">
        <div className="flex flex-col gap-4 bg-[#C52233] px-8 py-8 md:px-10 md:rounded-xl w-full max-w-md shadow-lg mx-4">
          <h1 className="text-white text-2xl font-semibold text-center mb-4">Create Account</h1>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={getInputClass('firstName')}
                  placeholder="First Name"
                  autoComplete="given-name"
                />
                {errors.firstName && (
                  <div className="text-white text-xs mt-1 font-medium">
                    {errors.firstName}
                  </div>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={getInputClass('lastName')}
                  placeholder="Last Name"
                  autoComplete="family-name"
                />
                {errors.lastName && (
                  <div className="text-white text-xs mt-1 font-medium">
                    {errors.lastName}
                  </div>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={getInputClass('email')}
                placeholder="Email Address"
                autoComplete="email"
              />
              {errors.email && (
                <div className="text-white text-xs mt-1 font-medium">
                  {errors.email}
                </div>
              )}
            </div>

            {/* Contact Field */}
            <div className="relative">
              <input
                type="tel"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                className={getInputClass('contact')}
                placeholder="Contact Number"
                maxLength={11}
                autoComplete="tel"
              />
              {errors.contact && (
                <div className="text-white text-xs mt-1 font-medium">
                  {errors.contact}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="relative">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={getInputClass('password')}
                placeholder="Password"
                autoComplete="new-password"
              />

              {/* Password Strength Indicator */}
              {passwordStrength !== 'none' && (
                <div className="mt-2">
                  <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        passwordStrength === 'weak'
                          ? 'w-1/3 bg-red-300'
                          : passwordStrength === 'medium'
                          ? 'w-2/3 bg-yellow-300'
                          : 'w-full bg-green-300'
                      }`}
                    />
                  </div>
                  <div
                    className={`text-xs mt-1 font-bold text-white`}
                  >
                    {passwordStrength === 'weak'
                      ? 'Weak password'
                      : passwordStrength === 'medium'
                      ? 'Medium strength'
                      : 'Strong password'}
                  </div>
                </div>
              )}

              {errors.password && (
                <div className="text-white text-xs mt-1 font-medium">
                  {errors.password}
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="relative">
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={getInputClass('confirmPassword')}
                placeholder="Confirm Password"
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <div className="text-white text-xs mt-1 font-medium">
                  {errors.confirmPassword}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="bg-white text-black border font-bold text-lg w-full py-3 rounded-lg mt-4 cursor-pointer hover:bg-gray-200 transition-colors shadow-md"
            >
              Sign Up
            </button>

            <div className="mt-2 text-center">
              <p className="text-white/90 text-sm">
                Already have an account?{' '}
                <a href="/user/login" className="text-white font-bold hover:underline">
                  Log in
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;