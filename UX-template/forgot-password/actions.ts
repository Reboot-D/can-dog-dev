"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "请输入有效的邮箱地址" }),
})

export async function sendPasswordReset(prevState: any, formData: FormData) {
  const validatedFields = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "错误：请检查邮箱地址格式",
      success: false,
    }
  }

  const { email } = validatedFields.data
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Enhanced logging: Check environment variables
  console.log('Email Environment Check:', {
    hasResendKey: !!process.env.RESEND_API_KEY,
    fromEmail: process.env.FROM_EMAIL,
    fromName: process.env.FROM_NAME,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    timestamp: new Date().toISOString(),
  })

  try {
    // 直接调用Supabase的密码重置功能
    // Supabase会自动检查用户是否存在，我们不需要在这里验证
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
    })

    if (error) {
      console.error('Password reset error:', {
        message: error.message,
        email: email,
        timestamp: new Date().toISOString(),
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
        errorCode: error.code || 'unknown',
        errorStatus: error.status || 'unknown',
        fullError: JSON.stringify(error, null, 2)
      })
      
      // 特殊处理常见错误
      if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
        return {
          message: "请求过于频繁，请稍后再试",
          success: false,
        }
      }
      
      if (error.message.includes('smtp') || error.message.includes('email') || error.message.includes('mail')) {
        console.error('SMTP configuration issue detected:', {
          message: error.message,
          possibleCauses: [
            'Domain not verified in Resend',
            'Invalid RESEND_API_KEY',
            'Supabase SMTP not configured properly',
            'FROM_EMAIL domain issues'
          ]
        })
        return {
          message: "邮件服务暂时不可用，请稍后再试",
          success: false,
        }
      }
      
      // Check for domain-related issues
      if (error.message.includes('domain') || error.message.includes('sender')) {
        console.error('Domain verification issue detected:', {
          fromEmail: process.env.FROM_EMAIL,
          message: 'The FROM_EMAIL domain may not be verified in Resend dashboard',
          solution: 'Please verify the domain in your Resend account'
        })
      }
      
      // 不向用户显示具体错误，避免信息泄露
    } else {
      console.log('Password reset email sent successfully:', {
        email: email,
        timestamp: new Date().toISOString(),
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
        fromEmailUsed: process.env.FROM_EMAIL,
        smtpConfigured: true
      })
    }

    // 总是返回成功消息，增强安全性
    // Supabase只会向存在的用户发送邮件
    return {
      message: "如果该邮箱地址存在于我们的系统中，您将收到重置密码的邮件",
      success: true,
    }

  } catch (error) {
    console.error('Password reset error:', {
      error: error,
      email: email,
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : 'Unknown error',
    })
    return {
      message: "发送重置邮件时发生错误，请稍后再试",
      success: false,
    }
  }
}