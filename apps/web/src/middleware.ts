import createMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale } from './i18n';

const handleI18nRouting = createMiddleware({
  // A list of all locales that are supported
  locales,
  
  // Used when no locale matches
  defaultLocale,
  
  // The locale prefix is always shown in the URL
  localePrefix: 'always'
});

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { user }, error } = await supabase.auth.getUser()

  // Handle auth errors gracefully
  if (error) {
    console.warn('Auth error in middleware:', error.message)
  }

  const pathname = request.nextUrl.pathname

  // Check if path has locale prefix
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
  const pathWithoutLocale = pathnameHasLocale
    ? pathname.replace(/^\/[^\/]+/, '')
    : pathname

  // Define route categories using pathWithoutLocale for checking
  const isProtectedRoute = pathWithoutLocale.startsWith('/dashboard') || pathWithoutLocale.startsWith('/profile')
  const isAuthRoute = pathWithoutLocale.startsWith('/auth')
  const isPublicRoute = pathname === '/' || pathname.startsWith('/api/') || pathname.includes('.')

  // Handle internationalization first for all routes
  response = handleI18nRouting(request)
  
  // Skip auth logic for static files and API routes (except auth APIs)
  if (isPublicRoute && !pathname.startsWith('/api/auth/')) {
    return response
  }

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL(`/${defaultLocale}/auth/login`, request.url)
    // Preserve the intended destination for after login
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users away from auth pages to dashboard or intended destination
  // Exception: allow reset-password page for password reset flow
  if (isAuthRoute && user && !pathWithoutLocale.includes('/auth/reset-password')) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo')
    const redirectUrl = new URL(redirectTo || `/${defaultLocale}/dashboard`, request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};