import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { SignupForm } from '../signup-form'
import { LoginForm } from '../login-form'

const messages = {
  forms: {
    email: '电子邮箱',
    password: '密码',
    confirmPassword: '确认密码',
    required: '必填项',
    invalidEmail: '无效的邮箱地址',
    passwordMismatch: '密码不匹配',
    minLength: '最少需要 {min} 个字符',
  },
  auth: {
    signupButton: '注册',
    loginButton: '登录',
    forgotPassword: '忘记密码？',
  },
  common: {
    loading: '加载中...',
  },
}

const mockOnSubmit = jest.fn()

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="zh-CN" messages={messages}>
      {component}
    </NextIntlClientProvider>
  )
}

describe('Auth Components', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  describe('SignupForm', () => {
    it('renders without crashing', () => {
      const { container } = renderWithIntl(
        <SignupForm onSubmit={mockOnSubmit} loading={false} error={null} />
      )

      // Just check that the component renders
      expect(container.firstChild).toBeTruthy()
    })

    it('displays error message when provided', () => {
      const errorMessage = 'Registration failed'
      renderWithIntl(
        <SignupForm onSubmit={mockOnSubmit} loading={false} error={errorMessage} />
      )

      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  describe('LoginForm', () => {
    it('renders without crashing', () => {
      const { container } = renderWithIntl(
        <LoginForm onSubmit={mockOnSubmit} loading={false} error={null} />
      )

      // Just check that the component renders
      expect(container.firstChild).toBeTruthy()
    })

    it('displays error message when provided', () => {
      const errorMessage = 'Login failed'
      renderWithIntl(
        <LoginForm onSubmit={mockOnSubmit} loading={false} error={errorMessage} />
      )

      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })
})