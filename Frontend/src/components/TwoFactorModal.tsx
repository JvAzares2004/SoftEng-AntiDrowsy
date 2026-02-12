import { useState } from 'react';

interface TwoFactorModalProps {
  isOpen: boolean;
  email: string;
  onVerify: (code: string) => Promise<void>;
  onClose: () => void;
  error?: string;
}

function TwoFactorModal({ isOpen, email, onVerify, onClose, error }: TwoFactorModalProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || code.length !== 6) {
      return;
    }

    setIsLoading(true);
    try {
      await onVerify(code);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  return (
    <div className="fixed inset-0 bg-gray bg-opacity-80 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-slideIn">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Two-Factor Authentication</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold disabled:opacity-50"
          >
            &times;
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            A 6-digit verification code has been sent to:
          </p>
          <p className="font-semibold text-gray-800">{email}</p>
          <p className="text-sm text-gray-500 mt-2">
            The code will expire in 10 minutes.
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Enter Verification Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="000000"
              disabled={isLoading}
              className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100"
              maxLength={6}
              autoComplete="off"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1 text-center">
              Enter the 6-digit code from your email
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Didn't receive the code?{' '}
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-blue-600 hover:text-blue-700 font-semibold disabled:opacity-50"
            >
              Try logging in again
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default TwoFactorModal;
