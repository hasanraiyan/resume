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
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export const authOptions = {
  providers: [
    CredentialsProvider({
      id: 'admin-login',
      name: 'Credentials',
      name: 'Admin Login',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (credentials?.username === adminUsername && credentials?.password === adminPassword) {
          return {
            id: 'admin-1',
            name: 'Admin',
            email: 'admin@example.com',
            role: 'admin',
          };
        }
        return null;
      },
    }),
    CredentialsProvider({
      id: 'user-login',
      name: 'User Login',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await dbConnect();
        const user = await User.findOne({ email: credentials.email }).lean();
        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role || 'user',
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login', // Will be the unified or user login page
  },
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id;
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
        session.user.id = token.id;
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
