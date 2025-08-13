'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PawPrint, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const t = useTranslations()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/zh-CN/auth/callback`,
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('密码重置链接已发送到您的邮箱，请检查您的邮件。')
      }
    } catch {
      setError('发送重置邮件时出现错误，请稍后重试。')
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
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">重置密码</h1>
            <p className="mt-2 text-gray-600">输入您的邮箱地址，我们将发送重置链接给您</p>
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
            
            {message && (
              <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                <p className="text-green-800 text-sm">{message}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">{t('forms.email')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="输入您的邮箱"
                className="bg-[#F3F4F6] h-12 rounded-full px-4"
                autoComplete="email"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 rounded-full text-base font-semibold"
            >
              {loading ? '发送中...' : '发送重置链接'}
            </Button>
          </form>
          
          <div className="text-center">
            <Link 
              href="/auth/login" 
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              返回登录
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}