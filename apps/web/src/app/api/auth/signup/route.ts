import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface SignupRequest {
  email: string
  password: string
}

const sanitizeInput = (input: string): string => {
  return input.trim().toLowerCase()
}

const validateSignupInput = (data: unknown): data is SignupRequest => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as SignupRequest).email === 'string' &&
    typeof (data as SignupRequest).password === 'string' &&
    (data as SignupRequest).email.length > 0 &&
    (data as SignupRequest).password.length > 0
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!validateSignupInput(body)) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      )
    }

    const email = sanitizeInput(body.email)
    const password = body.password // Don't sanitize password

    // Additional server-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      // Log error for debugging but don't expose to client
      console.error('Signup error:', error)
      return NextResponse.json(
        { error: 'Registration failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
    })
  } catch (error) {
    console.error('Signup API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}