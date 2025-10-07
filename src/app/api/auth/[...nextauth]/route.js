// src/app/api/auth/[...nextauth]/route.js
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

          // Debug logging (remove in production)
          console.log('Auth attempt:', {
            providedUsername: credentials?.username,
            expectedUsername: adminUsername,
            hasPassword: !!credentials?.password,
            hasExpectedPassword: !!adminPassword,
          });

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
        console.log('NextAuth redirect callback:', { url, baseUrl });

        // Allows relative callback URLs
        if (url.startsWith('/')) {
          const redirectUrl = `${baseUrl}${url}`;
          console.log('Redirecting to:', redirectUrl);
          return redirectUrl;
        }
        // Allows callback URLs on the same origin
        else if (new URL(url).origin === baseUrl) {
          console.log('Redirecting to same origin:', url);
          return url;
        }

        console.log('Falling back to baseUrl:', baseUrl);
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
