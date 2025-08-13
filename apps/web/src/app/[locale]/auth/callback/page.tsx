'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const t = useTranslations()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createClient()
        
        // Check for different types of auth flows
        const urlHash = window.location.hash
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const type = urlParams.get('type')
        
        // Handle password reset flow (usually comes with hash fragments)
        if (urlHash.includes('type=recovery') || type === 'recovery') {
          // Get the next redirect URL
          const nextUrl = urlParams.get('next') || '/zh-CN/auth/reset-password'
          
          // For password reset, try to exchange the session from hash or code
          if (urlHash && urlHash.includes('access_token')) {
            // Hash-based flow (legacy)
            const { error } = await supabase.auth.getSession()
            if (error) {
              setError('密码重置链接无效或已过期，请重新申请密码重置。')
            } else {
              router.push(nextUrl)
            }
          } else if (code) {
            // PKCE flow
            const { error } = await supabase.auth.exchangeCodeForSession(code)
            if (error) {
              setError('密码重置链接无效或已过期，请重新申请密码重置。')
            } else {
              router.push(nextUrl)
            }
          } else {
            setError('无效的密码重置链接，请重新申请密码重置。')
          }
        } 
        // Handle email verification flow
        else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            setError(error.message)
          } else {
            // Email verification successful, redirect to dashboard
            router.push('/dashboard')
          }
        } 
        // No valid auth data
        else {
          setError(t('auth.emailVerificationFailed'))
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        setError(t('common.error'))
      } finally {
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [searchParams, router, t])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('auth.verifyingEmail')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {t('auth.emailVerificationFailed')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {error}
            </p>
          </div>
          <div className="mt-6">
            <a
              href="/auth/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {t('auth.goToLogin')}
            </a>
          </div>
        </div>
      </div>
    )
  }

  return null
}