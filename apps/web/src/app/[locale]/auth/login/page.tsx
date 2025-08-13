'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { LoginForm } from '@/components/auth/login-form'
import { PawPrint } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const t = useTranslations()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const message = searchParams.get('message')
    if (message === 'password-updated') {
      setSuccessMessage('密码已成功更新，请使用新密码登录')
    }
  }, [searchParams])

  const handleLogin = async (email: string, password: string) => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Handle specific error messages
        if (error.message.includes('Email not confirmed')) {
          setError(t('auth.emailNotConfirmed'))
        } else if (error.message.includes('Invalid login credentials')) {
          setError(t('auth.invalidCredentials'))
        } else {
          setError(error.message)
        }
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      <header className="flex h-20 items-center border-b px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <PawPrint className="h-6 w-6 text-primary" />
          <span className="text-lg">罐头健康管家</span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">AI驱动的宠物护理助手</h1>
            <p className="mt-2 text-gray-600">通过AI引导的待办任务，让宠物护理变得简单</p>
          </div>
          
          {successMessage && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4">
              <p className="text-green-800 text-sm font-medium">{successMessage}</p>
            </div>
          )}
          
          <LoginForm
            onSubmit={handleLogin}
            loading={loading}
            error={error}
          />
          <div className="mt-4 text-center text-sm">
            <p>
              {t('auth.noAccount')}{' '}
              <Link href="/auth/signup" className="font-medium text-primary hover:underline">
                申请加入
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}