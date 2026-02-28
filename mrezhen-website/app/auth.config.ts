import type { NextAuthConfig } from "next-auth"

// Routes that don't require authentication
const publicRoutes = ['/', '/auth/login', '/auth/register', '/terms', '/contact', '/about']

export const authConfig = {
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const { pathname } = nextUrl

      // Allow public routes, API routes, and static assets
      const isPublicRoute = publicRoutes.includes(pathname)
      const isApiRoute = pathname.startsWith('/api')
      const isAuthRoute = pathname.startsWith('/auth')
      const isStaticAsset = pathname.startsWith('/_next') || pathname === '/favicon.ico'

      // If on a public / static / api route, allow
      if (isPublicRoute || isApiRoute || isStaticAsset) {
        // If logged in and on landing page, redirect to /community
        if (isLoggedIn && pathname === '/') {
          return Response.redirect(new URL('/community', nextUrl))
        }
        // If logged in and on login/register, redirect to /community
        if (isLoggedIn && isAuthRoute) {
          return Response.redirect(new URL('/community', nextUrl))
        }
        return true
      }

      // Everything else requires login
      if (!isLoggedIn) return false

      return true
    },
  },
  providers: [],
} satisfies NextAuthConfig