'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import CustomCursor from '@/components/CustomCursor';
import { Button, Card } from '@/components/ui';

export default function AdminLogin() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        username: credentials.username,
        password: credentials.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid credentials');
      } else {
        // Redirect to admin dashboard
        router.push('/admin/dashboard');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    }

    setIsLoading(false);
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <>
      <CustomCursor />
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-6 font-['Space_Grotesk']">
        
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-black opacity-5 rounded-full"></div>
          <div className="absolute -bottom-8 -left-8 w-96 h-96 bg-black opacity-3 rounded-full"></div>
        </div>

        <div className="relative max-w-md w-full">
          
          {/* Logo/Brand */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <h1 className="text-3xl font-bold text-black font-['Playfair_Display']">Admin</h1>
            </div>
            <p className="text-neutral-600">Sign in to access your dashboard</p>
          </div>

          <Card className="p-8 border-2 border-neutral-200">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm font-medium">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black transition-colors text-black placeholder-neutral-400"
                    placeholder="Enter your username"
                    value={credentials.username}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black transition-colors text-black placeholder-neutral-400"
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                variant="primary"
                className="w-full py-4 text-base font-semibold"
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Signing in...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt mr-2"></i>
                    Sign In
                  </>
                )}
              </Button>
              
            </form>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-neutral-500">
            Protected by secure authentication
          </div>
          
        </div>
      </div>
    </>
  );
}
