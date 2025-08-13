'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { validateSignupForm, type AuthFormData } from '@/lib/validation/auth-validation'

interface SignupFormProps {
  onSubmit: (email: string, password: string) => Promise<void>
  loading: boolean
  error: string | null
}

export function SignupForm({ onSubmit, loading, error }: SignupFormProps) {
  const t = useTranslations()
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validation = validateSignupForm(formData, t)
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
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {error}
              </h3>
            </div>
          </div>
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
            autoComplete="email"
          />
          {formErrors.email && (
            <p className="text-sm text-red-600">{formErrors.email}</p>
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
            autoComplete="new-password"
          />
          <p className="text-sm text-gray-500">{t('forms.passwordHelp')}</p>
          {formErrors.password && (
            <p className="text-sm text-red-600">{formErrors.password}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t('forms.confirmPassword')}</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            value={formData.confirmPassword || ''}
            onChange={handleChange}
            placeholder="确认您的密码"
            autoComplete="new-password"
          />
          {formErrors.confirmPassword && (
            <p className="text-sm text-red-600">{formErrors.confirmPassword}</p>
          )}
        </div>
      </div>

      <div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? t('common.loading') : t('auth.signupButton')}
        </Button>
      </div>
    </form>
  )
}