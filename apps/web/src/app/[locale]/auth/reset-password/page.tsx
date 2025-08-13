'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PawPrint, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createClient()
        
        // Get the code from URL parameters
        const code = searchParams.get('code')
        
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            setError('密码重置链接无效或已过期，请重新申请密码重置。')
          } else {
            setVerified(true)
          }
        } else {
          // Check if there's an error in the URL (like from the original redirect)
          const urlError = searchParams.get('error')
          const errorCode = searchParams.get('error_code')
          const errorDescription = searchParams.get('error_description')
          
          if (urlError === 'access_denied' && errorCode === 'otp_expired') {
            setError('密码重置链接已过期，请重新申请密码重置。')
          } else if (errorDescription) {
            setError('密码重置链接无效，请重新申请密码重置。')
          } else {
            setError('无效的密码重置链接，请重新申请密码重置。')
          }
        }
      } catch {
        setError('验证密码重置链接时出现错误。')
      } finally {
        setVerifying(false)
      }
    }

    handleAuthCallback()
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (password.length < 6) {
      setError('密码至少需要6个字符')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setError(error.message)
      } else {
        // Password updated successfully, redirect to login
        router.push('/auth/login?message=password-updated')
      }
    } catch {
      setError('更新密码时出现错误，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
        <header className="flex h-20 items-center border-b px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <PawPrint className="h-6 w-6 text-primary" />
            <span className="text-lg">罐头健康管家</span>
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">正在验证密码重置链接...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!verified) {
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
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                密码重置失败
              </h2>
              {error && (
                <p className="mt-2 text-sm text-gray-600">
                  {error}
                </p>
              )}
            </div>
            <div className="space-y-4">
              <Link 
                href="/auth/forgot-password" 
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                重新申请密码重置
              </Link>
              <Link
                href="/auth/login"
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                返回登录
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
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
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">设置新密码</h1>
            <p className="mt-2 text-gray-600">请输入您的新密码</p>
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password">新密码</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入新密码（至少6个字符）"
                  className="bg-[#F3F4F6] h-12 rounded-full px-4 pr-12"
                  autoComplete="new-password"
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入新密码"
                  className="bg-[#F3F4F6] h-12 rounded-full px-4 pr-12"
                  autoComplete="new-password"
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading || !password || !confirmPassword}
              className="w-full h-12 rounded-full text-base font-semibold"
            >
              {loading ? '更新中...' : '更新密码'}
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