import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  console.log('Auth callback triggered:', {
    code: code ? 'present' : 'missing',
    error,
    errorDescription,
    fullUrl: requestUrl.toString()
  })

  if (error) {
    console.error('Auth callback error:', error, errorDescription)
    // Redirect to error page or login with error message
    return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(error)}`)
  }

  if (code) {
    const cookieStore = await cookies()
    let response = NextResponse.redirect(`${requestUrl.origin}/reset-password`)
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`)
      }

      console.log('Session created successfully for user:', data.user?.email)
      
      // Check if this is a password recovery flow
      const type = requestUrl.searchParams.get('type')
      if (type === 'recovery' || data.user?.recovery_sent_at) {
        console.log('Password recovery flow detected, redirecting to reset-password')
        response = NextResponse.redirect(`${requestUrl.origin}/reset-password`)
      } else {
        // For regular login, redirect to dashboard
        response = NextResponse.redirect(`${requestUrl.origin}/dashboard`)
      }
      
      return response
      
    } catch (error) {
      console.error('Auth callback exception:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`)
    }
  }

  // No code parameter, redirect to login
  console.warn('Auth callback called without code parameter')
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}