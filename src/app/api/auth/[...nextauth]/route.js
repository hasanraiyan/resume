// src/app/api/auth/[...nextauth]/route.js
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
// No adapter needed for simple credential login without a database session

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;

        // Debug logging (remove in production)
        console.log('Auth attempt:', {
          providedUsername: credentials?.username,
          expectedUsername: adminUsername,
          hasPassword: !!credentials?.password,
          hasExpectedPassword: !!adminPassword
        });

        if (
          credentials?.username && 
          credentials?.password && 
          credentials.username === adminUsername && 
          credentials.password === adminPassword
        ) {
          return { 
            id: "1", 
            name: "Admin", 
            email: "admin@example.com", 
            role: "admin" 
          };
        }
        
        return null;
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
      if (user) {
        token.role = user.role;
        token.isAdmin = user.role === 'admin';
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.isAdmin = token.isAdmin;
      return session;
    },
    async signIn({ user, account, profile }) {
      // Allow sign in if user is returned from authorize function
      return !!user;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
