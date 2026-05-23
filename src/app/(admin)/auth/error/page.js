'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, Button } from '@/components/custom-ui';

const errorMessages = {
  AccessDenied: {
    title: 'Access Denied',
    message:
      'You do not have permission to access this area. Please contact the administrator if you believe this is a mistake.',
    icon: 'lock',
  },
  CredentialsSignin: {
    title: 'Invalid Credentials',
    message: 'The username or password you entered is incorrect. Please try again.',
    icon: 'user-x',
  },
  OAuthSignin: {
    title: 'OAuth Sign-In Error',
    message: 'There was a problem signing in with your OAuth provider. Please try again.',
    icon: 'alert-circle',
  },
  OAuthCallback: {
    title: 'OAuth Callback Error',
    message: 'There was a problem processing the OAuth provider response. Please try again.',
    icon: 'alert-circle',
  },
  OAuthCreateAccount: {
    title: 'Account Creation Error',
    message: 'There was a problem creating your account with the OAuth provider. Please try again.',
    icon: 'user-plus',
  },
  EmailCreateAccount: {
    title: 'Account Creation Error',
    message: 'There was a problem creating your account. Please try again.',
    icon: 'user-plus',
  },
  Callback: {
    title: 'Callback Error',
    message: 'There was a problem during the authentication callback. Please try again.',
    icon: 'alert-circle',
  },
  OAuthAccountNotLinked: {
    title: 'Account Already Linked',
    message:
      'This email is already associated with another account. Please sign in using the original method.',
    icon: 'link',
  },
  EmailSignin: {
    title: 'Email Sign-In Error',
    message: 'There was a problem sending the sign-in email. Please try again.',
    icon: 'mail',
  },
  SessionRequired: {
    title: 'Session Required',
    message: 'You need to be signed in to access this page. Please sign in to continue.',
    icon: 'user',
  },
  Configuration: {
    title: 'Configuration Error',
    message: 'There is a problem with the server configuration. Please contact the administrator.',
    icon: 'settings',
  },
  Default: {
    title: 'Authentication Error',
    message: 'An unexpected authentication error occurred. Please try again.',
    icon: 'alert-triangle',
  },
};

const iconSVG = {
  lock: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  ),
  'user-x': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M18 9l3 3m0 0l3 3m-3-3l3-3m-3 3l-3 3"
      />
    </svg>
  ),
  'alert-circle': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  'user-plus': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v6m3-3h-6" />
    </svg>
  ),
  link: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  ),
  mail: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  ),
  user: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
  settings: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  'alert-triangle': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
      />
    </svg>
  ),
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';
  const info = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-50 rounded-lg flex items-center justify-center mb-6">
            <div className="text-red-500">{iconSVG[info.icon]}</div>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-black font-['Playfair_Display'] mb-2">
            {info.title}
          </h2>
          <p className="text-neutral-600 text-sm sm:text-base">{info.message}</p>
        </div>

        <Card className="p-8 space-y-4">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-400 mr-3 mt-0.5 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-red-800 font-medium text-sm">
                  Error code:{' '}
                  <code className="font-mono bg-red-100 px-1.5 py-0.5 rounded">{error}</code>
                </p>
                <p className="text-red-600 text-xs mt-1">
                  This error occurred during the authentication process. If the issue persists,
                  please contact support.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button href="/login" variant="primary" className="w-full py-3 px-4 font-semibold">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              Try Again
            </Button>
            <Button href="/" variant="secondary" className="w-full py-3 px-4 font-semibold">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Go to Homepage
            </Button>
          </div>
        </Card>

        <div className="text-center">
          <p className="text-neutral-500 text-xs">Secure admin access • Protected by NextAuth</p>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  );
}
