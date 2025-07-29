// Epic 004: Event Tracking System - Server Actions
// Task 004-01-03: Event management server actions

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { verifyUserPermission } from '@/lib/auth/permissions'
import { createSupabaseClient } from '@/lib/supabase/server'
import { 
  EventFormData, 
  eventCreateSchema, 
  eventUpdateSchema,
  validateEventData 
} from '@/lib/validations/event'

// Create event action
export async function createEvent(
  petId: string,
  formData: EventFormData
): Promise<{ success: boolean; error?: string; eventId?: string }> {
  try {
    // Verify user permission
    const { user } = await verifyUserPermission('USER', true)
    const supabase = createSupabaseClient()

    // Verify pet ownership
    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select('id, user_id, date_of_birth')
      .eq('id', petId)
      .eq('user_id', user.id)
      .single()

    if (petError || !pet) {
      return { success: false, error: '宠物不存在或无访问权限' }
    }

    // Validate form data
    const validatedData = validateEventData(formData)

    // Create event via API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/pets/${petId}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || '创建事件失败' }
    }

    const event = await response.json()

    // Revalidate relevant pages
    revalidatePath(`/dashboard/pets/${petId}`)
    revalidatePath(`/dashboard/pets/${petId}/events`)
    revalidatePath('/dashboard')

    return { success: true, eventId: event.id }

  } catch (error) {
    console.error('创建事件失败:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '创建事件失败' 
    }
  }
}

// Update event action
export async function updateEvent(
  eventId: string,
  formData: Partial<EventFormData>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify user permission
    const { user } = await verifyUserPermission('USER', true)

    // Validate form data
    const validatedData = eventUpdateSchema.parse(formData)

    // Update event via API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || '更新事件失败' }
    }

    // Revalidate relevant pages
    revalidatePath(`/dashboard/pets`)
    revalidatePath(`/dashboard`)

    return { success: true }

  } catch (error) {
    console.error('更新事件失败:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '更新事件失败' 
    }
  }
}

// Delete event action
export async function deleteEvent(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify user permission
    const { user } = await verifyUserPermission('USER', true)

    // Delete event via API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events/${eventId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || '删除事件失败' }
    }

    // Revalidate relevant pages
    revalidatePath(`/dashboard/pets`)
    revalidatePath(`/dashboard`)

    return { success: true }

  } catch (error) {
    console.error('删除事件失败:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '删除事件失败' 
    }
  }
}

// Get events for a pet
export async function getEventsByPet(
  petId: string,
  filters?: {
    type?: string
    start_date?: string
    end_date?: string
    page?: number
    limit?: number
  }
) {
  try {
    // Verify user permission
    const { user } = await verifyUserPermission('USER', true)

    // Build query string
    const params = new URLSearchParams()
    if (filters?.type) params.append('type', filters.type)
    if (filters?.start_date) params.append('start_date', filters.start_date)
    if (filters?.end_date) params.append('end_date', filters.end_date)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    // Fetch events via API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/pets/${petId}/events?${params}`)

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || '获取事件列表失败')
    }

    return await response.json()

  } catch (error) {
    console.error('获取事件列表失败:', error)
    throw error
  }
}

// Get single event
export async function getEvent(eventId: string) {
  try {
    // Verify user permission
    const { user } = await verifyUserPermission('USER', true)

    // Fetch event via API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events/${eventId}`)

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || '获取事件详情失败')
    }

    return await response.json()

  } catch (error) {
    console.error('获取事件详情失败:', error)
    throw error
  }
}

// Complete AI todo and create event
export async function completeAITodoWithEvent(
  todoId: string,
  petId: string,
  formData: EventFormData
): Promise<{ success: boolean; error?: string; eventId?: string }> {
  try {
    // Verify user permission
    const { user } = await verifyUserPermission('USER', true)
    const supabase = createSupabaseClient()

    // Verify todo ownership and status
    const { data: todo, error: todoError } = await supabase
      .from('ai_todos')
      .select('id, pet_id, status')
      .eq('id', todoId)
      .eq('pet_id', petId)
      .single()

    if (todoError || !todo) {
      return { success: false, error: 'AI任务不存在或无访问权限' }
    }

    if (todo.status !== 'PENDING') {
      return { success: false, error: 'AI任务已完成或被忽略' }
    }

    // Create event with todo reference
    const eventData = {
      ...formData,
      created_from_todo_id: todoId
    }

    const eventResult = await createEvent(petId, eventData)
    if (!eventResult.success) {
      return eventResult
    }

    // Mark todo as completed
    const { error: updateError } = await supabase
      .from('ai_todos')
      .update({ 
        status: 'COMPLETED',
        completed_at: new Date().toISOString()
      })
      .eq('id', todoId)

    if (updateError) {
      console.error('更新AI任务状态失败:', updateError)
      // Don't fail the entire operation for this
    }

    // Revalidate relevant pages
    revalidatePath(`/dashboard`)
    revalidatePath(`/dashboard/pets/${petId}`)

    return { success: true, eventId: eventResult.eventId }

  } catch (error) {
    console.error('完成AI任务并创建事件失败:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '操作失败' 
    }
  }
}