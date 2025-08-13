'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { validateLoginForm, type AuthFormData } from '@/lib/validation/auth-validation'
import Link from 'next/link'

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>
  loading: boolean
  error: string | null
}

export function LoginForm({ onSubmit, loading, error }: LoginFormProps) {
  const t = useTranslations()
  const [formData, setFormData] = useState<Pick<AuthFormData, 'email' | 'password'>>({
    email: '',
    password: ''
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validation = validateLoginForm(formData, t)
    setFormErrors(validation.errors)
    
    if (!validation.isValid) {
      return
    }

    await onSubmit(formData.email, formData.password)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [name]: removed, ...rest } = prev
        return rest
      })
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('forms.email')}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="输入您的邮箱"
            className="bg-[#F3F4F6] h-12 rounded-full px-4"
            autoComplete="email"
          />
          {formErrors.email && (
            <p className="text-red-600 text-sm">{formErrors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t('forms.password')}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="输入您的密码"
            className="bg-[#F3F4F6] h-12 rounded-full px-4"
            autoComplete="current-password"
          />
          {formErrors.password && (
            <p className="text-red-600 text-sm">{formErrors.password}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="remember-me" 
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
          />
          <Label htmlFor="remember-me" className="font-normal">
            记住我
          </Label>
        </div>
        <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
          {t('auth.forgotPassword')}
        </Link>
      </div>

      <Button 
        type="submit" 
        disabled={loading}
        className="w-full h-12 rounded-full text-base font-semibold"
      >
        {loading ? t('common.loading') : t('auth.loginButton')}
      </Button>
    </form>
  )
}