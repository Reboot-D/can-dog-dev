"use server"

import { z } from "zod"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const applySchema = z.object({
  name: z.string().min(2, { message: "姓名至少需要2个字符。" }),
  email: z.string().email({ message: "请输入有效的邮箱地址。" }),
  password: z.string().min(6, { message: "密码至少需要6个字符。" }),
  reason: z.string().min(10, { message: "请多介绍一些您的情况（至少10个字符）。" }),
})

export async function submitApplication(prevState: any, formData: FormData) {
  const validatedFields = applySchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    reason: formData.get("reason"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "错误：请检查表单字段。",
    }
  }

  const { name, email, password, reason } = validatedFields.data
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const adminSupabase = createServiceClient() // For admin operations

  try {
    console.log('Starting user registration:', {
      email: email,
      timestamp: new Date().toISOString()
    })

    // 1. Register user with Supabase Auth Admin API (bypasses email confirmation)
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: name,
        application_reason: reason,
      },
    })

    if (authError) {
      console.error('Auth registration error:', {
        message: authError.message,
        email: email,
        timestamp: new Date().toISOString(),
        errorDetails: authError
      })
      return {
        message: `注册失败：${authError.message}`,
        errors: { email: [authError.message] },
      }
    }

    if (!authData.user) {
      console.error('Auth registration: No user returned')
      return {
        message: "注册失败：用户创建失败",
      }
    }

    console.log('User registration successful:', {
      userId: authData.user.id,
      email: authData.user.email,
      timestamp: new Date().toISOString()
    })

    // 2. Check if user profile was created (should be automatic via trigger)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, status, role')
      .eq('user_id', authData.user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile creation error:', {
        profileError: profileError,
        userId: authData.user.id,
        email: authData.user.email,
        timestamp: new Date().toISOString()
      })
      
      // Fallback: Create profile manually if trigger didn't work
      const { error: createProfileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          status: email === 'cardiffcr1@gmail.com' ? 'APPROVED' : 'PENDING',
          role: email === 'cardiffcr1@gmail.com' ? 'ADMIN' : 'USER',
        })

      if (createProfileError) {
        console.error('Manual profile creation failed:', {
          error: createProfileError,
          userId: authData.user.id,
          email: authData.user.email,
          timestamp: new Date().toISOString()
        })
        return {
          message: `注册失败：保存新用户时数据库错误 - ${createProfileError.message}`,
        }
      }
      
      console.log('Profile created manually:', {
        userId: authData.user.id,
        email: authData.user.email,
        isAdmin: email === 'cardiffcr1@gmail.com'
      })
    } else {
      console.log('Profile created automatically by trigger:', {
        userId: authData.user.id,
        email: authData.user.email,
        status: profile.status,
        role: profile.role
      })
    }

    // 3. Success logging
    console.log("New Application Completed Successfully:")
    console.log("Name:", name)
    console.log("Email:", email)
    console.log("Reason:", reason)
    console.log("User ID:", authData.user.id)
    console.log("Admin Status:", email === 'cardiffcr1@gmail.com')

    // 4. Redirect based on user type
    if (email === 'cardiffcr1@gmail.com') {
      console.log('Redirecting admin to admin dashboard')
      redirect('/admin')
    } else {
      console.log('Redirecting user to pending review page')
      redirect('/pending-review')
    }

  } catch (error) {
    console.error('Application submission error:', {
      error: error,
      email: email,
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : 'Unknown error'
    })
    return {
      message: "发生了意外错误，请重试。",
    }
  }
}