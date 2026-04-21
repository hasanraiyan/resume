'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Button, Input, InputOTP } from '@/components/ui';

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLogin />
    </Suspense>
  );
}

function AdminLogin() {
  const [credentials, setCredentials] = useState({ username: '', password: '', token: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMcpFlow = searchParams.get('flow') === 'mcp';

  // Form validation
  const validateField = (name, value) => {
    const errors = { ...fieldErrors };

    switch (name) {
      case 'username':
        if (!value.trim()) {
          errors.username = 'Username is required';
        } else if (value.length < 3) {
          errors.username = 'Username must be at least 3 characters';
        } else {
          delete errors.username;
        }
        break;
      case 'password':
        if (!value) {
          errors.password = 'Password is required';
        } else if (value.length < 4) {
          errors.password = 'Password must be at least 4 characters';
        } else {
          delete errors.password;
        }
        break;
      case 'token':
        if (!value.trim()) {
          errors.token = '2FA code is required';
        } else if (!/^\d{6}$/.test(value)) {
          errors.token = '2FA code must be 6 digits';
        } else {
          delete errors.token;
        }
        break;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check form validity
  useEffect(() => {
    const isValid =
      credentials.username.length >= 3 &&
      credentials.password.length >= 4 &&
      credentials.token.length === 6 &&
      Object.keys(fieldErrors).length === 0;
    setIsFormValid(isValid);
  }, [credentials, fieldErrors]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const isUsernameValid = validateField('username', credentials.username);
    const isPasswordValid = validateField('password', credentials.password);

    if (!isUsernameValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (isMcpFlow) {
        const res = await fetch('/api/mcp/oauth/authorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: credentials.username,
            password: credentials.password,
            token: credentials.token,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error_description || data.error || 'Authorization failed');
          setIsLoading(false);
          return;
        }

        window.location.href = data.redirectTo;
      } else {
        const result = await signIn('credentials', {
          username: credentials.username,
          password: credentials.password,
          token: credentials.token,
          callbackUrl: '/admin/dashboard',
          redirect: true,
        });

        if (result?.error) {
          setError('Invalid credentials. Please check your username and password.');
          setIsLoading(false);
        }
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value,
    });

    // Real-time validation
    validateField(name, value);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-black rounded-lg flex items-center justify-center mb-8">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-black font-['Playfair_Display'] mb-2">
              {isMcpFlow ? 'Authorize MCP Access' : 'Admin Login'}
            </h2>
            <p className="text-neutral-600 text-sm sm:text-base">
              {isMcpFlow
                ? 'Authorize an AI client to manage your finances'
                : 'Sign in to access your admin dashboard'}
            </p>
          </div>

          {/* Main Card */}
          <Card className="p-8 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-red-400 mr-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-red-800 font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider"
                >
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                      className="w-5 h-5 text-neutral-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                      fieldErrors.username
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-neutral-200 focus:border-black'
                    }`}
                    placeholder="Enter your username"
                    value={credentials.username}
                    onChange={handleChange}
                  />
                  {credentials.username && !fieldErrors.username && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                {fieldErrors.username && (
                  <p className="text-red-600 text-sm font-medium">{fieldErrors.username}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                      className="w-5 h-5 text-neutral-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className={`w-full pl-12 pr-12 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 ${
                      fieldErrors.password
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-neutral-200 focus:border-black'
                    }`}
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
                  >
                    {showPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-red-600 text-sm font-medium">{fieldErrors.password}</p>
                )}
              </div>

              {/* 2FA Token Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                  2FA Code
                </label>
                <InputOTP
                  maxLength={6}
                  value={credentials.token}
                  onChange={(val) => {
                    setCredentials({ ...credentials, token: val });
                    if (val.length === 6) {
                      const errors = { ...fieldErrors };
                      delete errors.token;
                      setFieldErrors(errors);
                    }
                  }}
                />
                {fieldErrors.token && (
                  <p className="text-red-600 text-sm font-medium">{fieldErrors.token}</p>
                )}
              </div>

              {/* Remember Me */}
              {!isMcpFlow && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-black border-neutral-300 rounded focus:ring-black focus:ring-2"
                    />
                    <label
                      htmlFor="remember-me"
                      className="ml-3 text-sm text-neutral-700 font-medium"
                    >
                      Remember me
                    </label>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || !isFormValid}
                className="w-full py-3 px-4 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      />
                    </svg>
                    {isMcpFlow ? 'Authorize Access' : 'Sign in to Dashboard'}
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Footer */}
          <div className="text-center">
            <p className="text-neutral-500 text-xs">
              {isMcpFlow
                ? 'Grants read and write access to your Pocketly transactions'
                : 'Secure admin access • Protected by NextAuth'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
