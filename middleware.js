/**
 * @fileoverview Authentication middleware for protecting admin routes.
 * Uses NextAuth to verify user authentication and authorization.
 */

import { withAuth } from 'next-auth/middleware';

/**
 * Middleware function for handling authentication.
 * Currently placeholder for additional middleware logic.
 *
 * @function middleware
 * @param {Object} req - Next.js request object
 */
export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here if needed
  },
  {
    callbacks: {
      /**
       * Authorization callback to determine if a user can access a route.
       * Checks for admin role when accessing admin routes.
       *
       * @function authorized
       * @param {Object} params - Authorization parameters
       * @param {Object} params.token - JWT token containing user information
       * @param {Object} params.req - Next.js request object
       * @returns {boolean} True if user is authorized, false otherwise
       */
      authorized: ({ token, req }) => {
        // Check if user has admin role for admin routes
        if (req.nextUrl.pathname.startsWith('/admin')) {
          console.log('Middleware auth check:', {
            pathname: req.nextUrl.pathname,
            hasToken: !!token,
            tokenRole: token?.role,
            isAdmin: token?.role === 'admin',
          });
          return token?.role === 'admin';
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/admin/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
