'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { SignupForm } from '@/components/auth/signup-form'

export default function SignupPage() {
  const t = useTranslations()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRegistered, setIsRegistered] = useState(false)

  const handleSignup = async (email: string, password: string) => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        // Check if user needs email confirmation
        if (data?.user && !data?.user?.email_confirmed_at) {
          setIsRegistered(true)
        } else {
          // If email confirmation is disabled, redirect to dashboard
          router.push('/dashboard')
        }
      }
    } catch {
      setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  // Show success message if registration is complete but email needs verification
  if (isRegistered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {t('auth.signupSuccess')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('auth.emailVerificationSent')}
            </p>
            <p className="mt-4 text-sm text-gray-500">
              {t('auth.emailVerificationInstructions')}
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('auth.signupTitle')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('auth.hasAccount')}{' '}
            <a
              href="/auth/login"
              className="font-medium text-primary hover:underline"
            >
              {t('auth.loginButton')}
            </a>
          </p>
        </div>
        <SignupForm
          onSubmit={handleSignup}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  )
}