import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user has admin role for admin routes
        if (req.nextUrl.pathname.startsWith('/admin')) {
          console.log('Middleware auth check:', {
            pathname: req.nextUrl.pathname,
            hasToken: !!token,
            tokenRole: token?.role,
            isAdmin: token?.role === 'admin'
          });
          return token?.role === 'admin';
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/admin/((?!api|_next/static|_next/image|favicon.ico).*)']
};
