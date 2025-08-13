export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export interface AuthFormData {
  email: string
  password: string
  confirmPassword?: string
}

export const validateEmail = (email: string, t: (key: string) => string): string | null => {
  if (!email) {
    return t('forms.required')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return t('forms.invalidEmail')
  }
  return null
}

export const validatePassword = (password: string, t: (key: string, params?: { min?: number }) => string): string | null => {
  if (!password) {
    return t('forms.required')
  }
  if (password.length < 8) {
    return t('forms.minLength', { min: 8 })
  }
  // Enhanced password strength validation
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return t('forms.passwordWeak')
  }
  return null
}

export const validateConfirmPassword = (password: string, confirmPassword: string, t: (key: string) => string): string | null => {
  if (!confirmPassword) {
    return t('forms.required')
  }
  if (password !== confirmPassword) {
    return t('forms.passwordMismatch')
  }
  return null
}

export const validateSignupForm = (data: AuthFormData, t: (key: string, params?: { min?: number }) => string): ValidationResult => {
  const errors: Record<string, string> = {}

  const emailError = validateEmail(data.email, t)
  if (emailError) errors.email = emailError

  const passwordError = validatePassword(data.password, t)
  if (passwordError) errors.password = passwordError

  if (data.confirmPassword !== undefined) {
    const confirmPasswordError = validateConfirmPassword(data.password, data.confirmPassword, t)
    if (confirmPasswordError) errors.confirmPassword = confirmPasswordError
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const validateLoginForm = (data: AuthFormData, t: (key: string, params?: { min?: number }) => string): ValidationResult => {
  const errors: Record<string, string> = {}

  const emailError = validateEmail(data.email, t)
  if (emailError) errors.email = emailError

  // For login, we only require password presence, not strength
  if (!data.password) {
    errors.password = t('forms.required')
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}