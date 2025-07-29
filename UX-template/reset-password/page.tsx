"use client"

import { useActionState, useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { PawPrint, ArrowLeft, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resetPassword } from "./actions"

const initialState = {
  message: "",
  success: false,
}

function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(resetPassword, initialState)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetStatus, setResetStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    // Set up auth state change listener for password recovery
    const setupAuthListener = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        // Subscribe to auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth state change:', event, session?.user?.email)
          
          // Listen specifically for PASSWORD_RECOVERY event
          if (event === 'PASSWORD_RECOVERY') {
            console.log('Password recovery event detected, session established')
            // Update state to show the password reset form
            setAccessToken('session-based')
            setRefreshToken('session-based')
            setResetStatus('ready')
          }
        })
        
        // Also check current session on mount
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (user) {
          console.log('User authenticated for password reset:', user.email)
          // Set dummy tokens to enable the form (we have a valid session)
          setAccessToken('session-based')
          setRefreshToken('session-based')
          setResetStatus('ready')
        } else {
          console.log('No authenticated user found')
          
          // Fallback: try to parse tokens from URL (legacy approach)
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const hashAccessToken = hashParams.get('access_token')
          const hashRefreshToken = hashParams.get('refresh_token')
          const type = hashParams.get('type')
          
          const queryAccessToken = searchParams.get('access_token')
          const queryRefreshToken = searchParams.get('refresh_token')
          
          const finalAccessToken = hashAccessToken || queryAccessToken
          const finalRefreshToken = hashRefreshToken || queryRefreshToken
          
          if (finalAccessToken && finalRefreshToken) {
            setAccessToken(finalAccessToken)
            setRefreshToken(finalRefreshToken)
            setResetStatus('ready')
          }
          
          console.log('Auth check:', {
            user: !!user,
            hashAccessToken: !!hashAccessToken,
            queryAccessToken: !!queryAccessToken,
            type,
            error: error?.message
          })
        }
        
        // Return cleanup function
        return () => {
          subscription.unsubscribe()
        }
      } catch (err) {
        console.error('Auth setup failed:', err)
        setResetStatus('error')
      }
    }
    
    // Set up timeout to handle cases where link is truly invalid
    const timeoutId = setTimeout(() => {
      if (resetStatus === 'loading') {
        console.log('Timeout reached, setting status to error')
        setResetStatus('error')
      }
    }, 3000)
    
    // Execute setup and store cleanup function
    let cleanup: (() => void) | undefined
    setupAuthListener().then(cleanupFn => {
      cleanup = cleanupFn
    })
    
    // Cleanup on component unmount
    return () => {
      clearTimeout(timeoutId)
      if (cleanup) {
        cleanup()
      }
    }
  }, [resetStatus]) // Include resetStatus in dependency array

  return (
    <>
      {resetStatus === 'loading' ? (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="font-semibold text-blue-800 mb-2">正在验证链接</h2>
          <p className="text-blue-700 text-sm">
            请稍候，正在验证您的密码重置链接...
          </p>
        </div>
      ) : resetStatus === 'error' ? (
        <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-6 text-center">
          <h2 className="font-semibold text-yellow-800 mb-2">链接无效或已过期</h2>
          <p className="text-yellow-700 text-sm mb-4">
            重置密码链接可能已过期或无效。请重新申请重置密码。
          </p>
          <Link href="/forgot-password">
            <Button variant="outline" className="w-full">
              重新申请重置密码
            </Button>
          </Link>
        </div>
      ) : state?.success ? (
        <div className="rounded-xl bg-green-50 border border-green-200 p-6 text-center">
          <h2 className="font-semibold text-green-800 mb-2">密码重置成功！</h2>
          <p className="text-green-700 text-sm mb-4">
            您的密码已成功更新。现在可以使用新密码登录了。
          </p>
          <Link href="/login">
            <Button className="w-full">
              前往登录
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {state?.message && !state?.success && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="text-red-800 text-sm">{state.message}</p>
            </div>
          )}
          <form action={formAction} className="space-y-6">
            <input type="hidden" name="access_token" value={accessToken || ''} />
            <input type="hidden" name="refresh_token" value={refreshToken || ''} />
            
            <div className="space-y-2">
              <Label htmlFor="password">新密码</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  placeholder="输入新密码"
                  required
                  type={showPassword ? "text" : "password"}
                  className="bg-[#F3F4F6] h-12 rounded-full px-4 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {state && 'errors' in state && (state as any).errors?.password && (
                <p className="text-red-600 text-sm">{(state as any).errors.password[0]}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="再次输入新密码"
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  className="bg-[#F3F4F6] h-12 rounded-full px-4 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {state && 'errors' in state && (state as any).errors?.confirmPassword && (
                <p className="text-red-600 text-sm">{(state as any).errors.confirmPassword[0]}</p>
              )}
            </div>
            
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
              <p className="font-medium mb-1">密码要求：</p>
              <ul className="space-y-1">
                <li>• 至少8个字符</li>
                <li>• 包含至少一个大写字母</li>
                <li>• 包含至少一个小写字母</li>
                <li>• 包含至少一个数字</li>
              </ul>
            </div>
            
            <Button 
              className="w-full h-12 rounded-full text-base font-semibold" 
              type="submit" 
              disabled={isPending}
            >
              {isPending ? "更新中..." : "更新密码"}
            </Button>
          </form>
          <div className="text-center text-sm">
            <Link href="/login" className="text-gray-500 hover:underline inline-flex items-center">
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回登录
            </Link>
          </div>
        </>
      )}
    </>
  )
}

export default function ResetPasswordPage() {
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
          
          <Suspense fallback={<div className="text-center">加载中...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>
    </div>
  )
}