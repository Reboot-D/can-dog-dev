"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { verifyUserPermission } from "@/lib/auth/permissions"

const petSchema = z.object({
  name: z.string()
    .min(1, { message: "宠物姓名是必填项" })
    .max(50, { message: "姓名不能超过50个字符" }),
  breed: z.string()
    .min(2, { message: "请选择或输入品种" })
    .max(100, { message: "品种名称不能超过100个字符" }),
  birthday: z.string()
    .min(1, { message: "请选择出生日期" })
    .refine((date) => {
      const birthDate = new Date(date)
      const today = new Date()
      const minDate = new Date('1990-01-01')
      return birthDate <= today && birthDate >= minDate
    }, { message: "出生日期不能是未来日期或过于久远" }),
  city: z.string()
    .min(2, { message: "请输入所在城市" })
    .max(50, { message: "城市名称不能超过50个字符" }),
  gender: z.enum(["MALE", "FEMALE", "UNKNOWN"], { 
    required_error: "请选择性别" 
  }).optional(),
  microchip_id: z.string()
    .min(10, { message: "芯片号码至少需要10位" })
    .max(50, { message: "芯片号码不能超过50位" })
    .optional()
    .or(z.literal("")),
})

export async function createPetProfile(prevState: any, formData: FormData) {
  const validatedFields = petSchema.safeParse({
    name: formData.get("name"),
    breed: formData.get("breed"),
    birthday: formData.get("birthday"),
    city: formData.get("city") || "未知", // Default city if not provided
    gender: formData.get("gender"),
    microchip_id: formData.get("microchip_id"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "错误：请检查表单字段",
    }
  }

  try {
    // Verify user permission using the new auth system
    const { user, profile } = await verifyUserPermission('USER', true)

    const petData = validatedFields.data
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Prepare pet data for database
    const newPetData: any = {
      user_id: user.id,
      name: petData.name,
      breed_primary: petData.breed,
      date_of_birth: petData.birthday,
      city: petData.city,
    }

    // Add optional fields if provided
    if (petData.gender) {
      newPetData.gender = petData.gender
    }
    if (petData.microchip_id && petData.microchip_id.trim()) {
      newPetData.microchip_id = petData.microchip_id
    }

    // Create pet record
    const { data: newPet, error: createError } = await supabase
      .from('pets')
      .insert(newPetData)
      .select()
      .single()

    if (createError) {
      console.error('Error creating pet:', createError)
      return {
        message: "创建宠物档案失败，请重试",
        errors: { name: ["数据库错误"] },
      }
    }

    console.log("新宠物档案创建成功:")
    console.log("Pet ID:", newPet.id)
    console.log("Name:", newPet.name)
    console.log("Breed:", newPet.breed_primary)
    console.log("City:", newPet.city)
    console.log("User ID:", user.id)

    // Call Edge Function to generate initial AI tasks
    try {
      console.log("正在为宠物生成AI任务...")
      
      const { data: aiTasksResult, error: aiError } = await supabase.functions.invoke('generate-ai-tasks', {
        body: { 
          petId: newPet.id,
          trigger: 'PET_CREATED'
        }
      })

      if (aiError) {
        console.error('AI任务生成失败:', aiError)
        // Don't fail the pet creation, just log the error
      } else {
        console.log("AI任务生成成功:")
        console.log("生成任务数量:", aiTasksResult.tasks_generated)
        console.log("生成耗时:", aiTasksResult.generation_time_ms + "ms")
      }
    } catch (aiError) {
      console.error('调用AI任务生成函数失败:', aiError)
      // Continue with pet creation even if AI task generation fails
    }

    // Calculate completeness score
    let completenessScore = 40 // Base score for required fields (name, breed, birthday, city)
    if (newPet.gender) completenessScore += 10
    if (newPet.microchip_id) completenessScore += 10
    console.log("Profile completeness:", completenessScore + "%")

    // Revalidate relevant paths
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/pets')

    // Redirect to dashboard to see the new pet
    redirect('/dashboard')

  } catch (error) {
    console.error('Pet creation error:', error)
    
    // Handle auth errors specifically
    const errorMessage = error instanceof Error ? error.message : "发生意外错误，请重试"
    
    if (errorMessage.includes('Authentication required')) {
      return {
        message: "身份验证失败，请重新登录",
      }
    }
    
    if (errorMessage.includes('not approved')) {
      return {
        message: "用户未获得创建宠物档案的权限",
      }
    }
    
    return {
      message: errorMessage,
    }
  }
}
