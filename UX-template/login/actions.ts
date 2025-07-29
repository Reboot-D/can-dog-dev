"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const loginSchema = z.object({
  email: z.string().email({ message: "请输入有效的邮箱地址。" }),
  password: z.string().min(1, { message: "密码不能为空。" }),
})

export async function loginUser(prevState: any, formData: FormData) {
  const validatedFields = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "错误：请检查表单字段。",
    }
  }

  const { email, password } = validatedFields.data
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  try {
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return {
        message: "登录失败：邮箱或密码错误",
        errors: { email: ["登录凭据无效"] },
      }
    }

    if (!authData.user) {
      return {
        message: "登录失败：身份验证失败",
      }
    }

    // Check user profile status
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('status, role')
      .eq('user_id', authData.user.id)
      .single()

    if (profileError || !profile) {
      return {
        message: "登录失败：未找到用户资料，请先申请注册。",
      }
    }

    console.log("User logged in:")
    console.log("Email:", email)
    console.log("User ID:", authData.user.id)
    console.log("Status:", profile.status)
    console.log("Role:", profile.role)

    // Redirect based on user status and role
    if (profile.status === 'PENDING') {
      redirect('/pending-review')
    } else if (profile.status === 'REJECTED') {
      redirect('/apply?message=Your application was rejected. Please apply again.')
    } else if (profile.status === 'APPROVED') {
      if (profile.role === 'ADMIN') {
        redirect('/admin')
      } else {
        redirect('/dashboard')
      }
    }

  } catch (error) {
    console.error('Login error:', error)
    return {
      message: "发生了意外错误，请重试。",
    }
  }
}

export async function logoutUser() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  try {
    await supabase.auth.signOut()
    redirect('/login')
  } catch (error) {
    console.error('Logout error:', error)
    redirect('/login')
  }
}