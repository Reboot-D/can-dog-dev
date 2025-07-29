"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, { message: "密码至少需要8个字符" })
    .regex(/[A-Z]/, { message: "密码必须包含至少一个大写字母" })
    .regex(/[a-z]/, { message: "密码必须包含至少一个小写字母" })
    .regex(/[0-9]/, { message: "密码必须包含至少一个数字" }),
  confirmPassword: z.string(),
  access_token: z.string().min(1, { message: "访问令牌是必需的" }),
  refresh_token: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "密码确认不匹配",
  path: ["confirmPassword"],
})

export async function resetPassword(prevState: any, formData: FormData) {
  const validatedFields = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    access_token: formData.get("access_token"),
    refresh_token: formData.get("refresh_token"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "错误：请检查表单字段",
      success: false,
    }
  }

  const { password, access_token, refresh_token } = validatedFields.data
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  try {
    // Check if user is already authenticated (from callback flow)
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
    
    let user = currentUser
    
    // If no current user, try to set session with tokens (fallback)
    if (!user && access_token && access_token !== 'session-based') {
      console.log('No current user, attempting to set session with tokens')
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token: refresh_token || '',
      })

      if (sessionError) {
        console.error('Session error:', sessionError)
        return {
          message: "重置链接无效或已过期，请重新申请密码重置",
          success: false,
        }
      }

      user = sessionData.user
    }

    if (!user) {
      return {
        message: "无法验证用户身份，请重新申请密码重置",
        success: false,
      }
    }

    console.log('Updating password for user:', user.email)

    // 更新用户密码
    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    })

    if (updateError) {
      console.error('Password update error:', updateError)
      return {
        message: "密码更新失败，请重试",
        success: false,
      }
    }

    // 记录成功的密码重置
    console.log('Password reset successful for user:', user.email)

    return {
      message: "密码已成功更新",
      success: true,
    }

  } catch (error) {
    console.error('Password reset error:', error)
    return {
      message: "重置密码时发生错误，请稍后再试",
      success: false,
    }
  }
}