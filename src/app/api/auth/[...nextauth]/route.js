/**
 * @fileoverview NextAuth.js authentication configuration for admin panel access.
 * Provides secure credential-based authentication using environment variables
 * for admin username and password. Implements JWT-based sessions with role-based
 * access control for admin functionality.
 *
 * @description This module configures NextAuth.js with:
 * - Credentials provider for username/password authentication
 * - JWT-based session management for stateless authentication
 * - Role-based access control (admin role verification)
 * - Environment variable-based credential storage
 * - Comprehensive error handling and logging
 * - Secure redirect handling for authentication flows
 *
 * Security features:
 * - Credentials validated against environment variables
 * - JWT tokens include role information for authorization
 * - Secure session management with proper callbacks
 * - Comprehensive logging for security monitoring
 * - No sensitive data stored in client-side storage
 */

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
// No adapter needed for simple credential login without a database session

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const adminUsername = process.env.ADMIN_USERNAME;
          const adminPassword = process.env.ADMIN_PASSWORD;

          if (
            credentials?.username &&
            credentials?.password &&
            credentials.username === adminUsername &&
            credentials.password === adminPassword
          ) {
            return {
              id: '1',
              name: 'Admin',
              email: 'admin@example.com',
              role: 'admin',
            };
          }

          return null;
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.role = user.role;
          token.isAdmin = user.role === 'admin';
        }
        return token;
      } catch (error) {
        console.error('JWT callback error:', error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        session.user.role = token.role;
        session.user.isAdmin = token.isAdmin;
        return session;
      } catch (error) {
        console.error('Session callback error:', error);
        return session;
      }
    },
    async signIn({ user, account, profile }) {
      try {
        // Allow sign in if user is returned from authorize function
        return !!user;
      } catch (error) {
        console.error('SignIn callback error:', error);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      try {
        // Allows relative callback URLs
        if (url.startsWith('/')) {
          const redirectUrl = `${baseUrl}${url}`;
          return redirectUrl;
        }
        // Allows callback URLs on the same origin
        else if (new URL(url).origin === baseUrl) {
          return url;
        }

        return baseUrl;
      } catch (error) {
        console.error('Redirect callback error:', error);
        return baseUrl;
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
