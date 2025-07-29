"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { verifyAdminPermission, handleAuthError } from "@/lib/auth/permissions"

const approvalSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().optional(),
})

export async function handleApplicationAction(prevState: any, formData: FormData) {
  const validatedFields = approvalSchema.safeParse({
    userId: formData.get("userId"),
    action: formData.get("action"),
    rejectionReason: formData.get("rejectionReason"),
  })

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid form data",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { userId, action, rejectionReason } = validatedFields.data

  try {
    // Verify admin permissions using the new auth system
    const { user, profile } = await verifyAdminPermission()
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Use the Edge Function for consistent application management
    const { data: result, error: edgeFunctionError } = await supabase.functions.invoke('manage-user-application', {
      body: {
        action,
        userId,
        rejectionReason
      }
    })

    if (edgeFunctionError || !result.success) {
      console.error('Edge function error:', edgeFunctionError)
      return {
        success: false,
        message: result?.error || "Failed to process application",
      }
    }

    console.log(`Application ${action}d successfully via Edge Function:`)
    console.log("User ID:", userId)
    console.log("Admin ID:", user.id)
    console.log("Admin Email:", user.email)
    if (rejectionReason) console.log("Rejection Reason:", rejectionReason)

    revalidatePath('/admin/applications')
    
    return {
      success: true,
      message: result.message || `Application ${action}d successfully`,
    }

  } catch (error) {
    console.error('Application action error:', error)
    
    // Handle auth errors using the standardized error handler
    if (error instanceof Error && 
        (error.message.includes('Authentication required') || 
         error.message.includes('Admin privileges required'))) {
      return {
        success: false,
        message: error.message,
      }
    }
    
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}

// Legacy functions for existing components
export async function approveApplication(formData: FormData) {
  const userId = formData.get("applicationId") as string
  const newFormData = new FormData()
  newFormData.append('userId', userId)
  newFormData.append('action', 'approve')
  
  return handleApplicationAction(null, newFormData)
}

export async function rejectApplication(formData: FormData) {
  const userId = formData.get("applicationId") as string
  const newFormData = new FormData()
  newFormData.append('userId', userId)
  newFormData.append('action', 'reject')
  
  return handleApplicationAction(null, newFormData)
}
