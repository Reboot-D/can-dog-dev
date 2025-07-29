// Epic 004: Event Tracking System - Events API routes
// Task 004-01-03: Event API endpoints implementation

import { NextRequest, NextResponse } from 'next/server'
import { verifyUserPermission } from '@/lib/auth/permissions'
import { createSupabaseClient } from '@/lib/supabase/server'
import { 
  eventCreateSchema, 
  eventFiltersSchema, 
  validateEventFilters 
} from '@/lib/validations/event'
import { calculateAgeInMonths } from '@/lib/utils/pet-utils'

// GET /api/pets/[petId]/events - Fetch pet events with filters
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ petId: string }> }
) {
  try {
    // Verify user permission
    const { user } = await verifyUserPermission('USER', true)
    const { petId } = await params
    const supabase = createSupabaseClient()

    // Verify pet ownership
    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select('id, user_id')
      .eq('id', petId)
      .eq('user_id', user.id)
      .single()

    if (petError || !pet) {
      return NextResponse.json(
        { error: '宠物不存在或无访问权限' },
        { status: 404 }
      )
    }

    // Parse query parameters
    const url = new URL(request.url)
    const queryParams = {
      type: url.searchParams.get('type') || undefined,
      start_date: url.searchParams.get('start_date') || undefined,
      end_date: url.searchParams.get('end_date') || undefined,
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: parseInt(url.searchParams.get('limit') || '20')
    }

    // Validate filters
    const filters = validateEventFilters(queryParams)

    // Build query
    let query = supabase
      .from('events')
      .select('*', { count: 'exact' })
      .eq('pet_id', petId)
      .order('date_completed', { ascending: false })

    // Apply filters
    if (filters.type) {
      query = query.eq('event_type', filters.type)
    }
    if (filters.start_date) {
      query = query.gte('date_completed', filters.start_date)
    }
    if (filters.end_date) {
      query = query.lte('date_completed', filters.end_date)
    }

    // Apply pagination
    const start = (filters.page - 1) * filters.limit
    const end = start + filters.limit - 1
    query = query.range(start, end)

    const { data: events, count, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      events: events || [],
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / filters.limit)
      }
    })

  } catch (error) {
    console.error('获取事件列表失败:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '获取事件列表失败' },
      { status: 500 }
    )
  }
}

// POST /api/pets/[petId]/events - Create new event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ petId: string }> }
) {
  try {
    // Verify user permission
    const { user } = await verifyUserPermission('USER', true)
    const { petId } = await params
    const supabase = createSupabaseClient()

    // Verify pet ownership and get pet data
    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select('id, user_id, date_of_birth')
      .eq('id', petId)
      .eq('user_id', user.id)
      .single()

    if (petError || !pet) {
      return NextResponse.json(
        { error: '宠物不存在或无访问权限' },
        { status: 404 }
      )
    }

    // Parse request body
    const eventData = await request.json()

    // Validate event data
    const validatedData = eventCreateSchema.parse({
      ...eventData,
      pet_id: petId,
      // Convert cost to number if provided as string
      cost: eventData.cost ? Number(eventData.cost) : undefined,
      // Clean up optional fields
      next_due_date: eventData.next_due_date || undefined,
      service_provider: eventData.service_provider || undefined,
      location: eventData.location || undefined,
      notes: eventData.notes || undefined,
    })

    // If no next_due_date provided, calculate suggestion based on event type and pet age
    let finalNextDueDate = validatedData.next_due_date
    if (!finalNextDueDate && shouldAutoCalculateReminder(validatedData.event_type)) {
      const petAgeInMonths = calculateAgeInMonths(pet.date_of_birth)
      finalNextDueDate = calculateNextReminderDate(
        validatedData.event_type,
        petAgeInMonths,
        validatedData.date_completed
      )
    }

    // Create event record
    const { data: event, error } = await supabase
      .from('events')
      .insert({
        pet_id: validatedData.pet_id,
        created_from_todo_id: validatedData.created_from_todo_id,
        event_type: validatedData.event_type,
        event_name: validatedData.event_name,
        date_completed: validatedData.date_completed,
        next_due_date: finalNextDueDate,
        service_provider: validatedData.service_provider,
        location: validatedData.location,
        cost: validatedData.cost,
        notes: validatedData.notes,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Create reminder if next_due_date is set
    if (event.next_due_date) {
      await createEventReminder(event.id, event.next_due_date, event.event_type)
    }

    return NextResponse.json(event, { status: 201 })

  } catch (error) {
    console.error('创建事件失败:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '创建事件失败' },
      { status: 500 }
    )
  }
}

// Helper functions
function shouldAutoCalculateReminder(eventType: string): boolean {
  // Auto-calculate for medical events, not for grooming or other
  return ['VACCINATION', 'DEWORMING', 'CHECKUP'].includes(eventType)
}

function calculateNextReminderDate(
  eventType: string,
  petAgeInMonths: number,
  lastEventDate: string
): string {
  const lastDate = new Date(lastEventDate)
  let intervalDays: number

  switch (eventType) {
    case 'VACCINATION':
      if (petAgeInMonths < 6) {
        intervalDays = 30 // Monthly for puppies/kittens
      } else if (petAgeInMonths < 12) {
        intervalDays = 90 // Quarterly for young pets
      } else {
        intervalDays = 365 // Annually for adult pets
      }
      break

    case 'DEWORMING':
      intervalDays = petAgeInMonths < 6 ? 30 : 90 // Monthly for young, quarterly for adult
      break

    case 'CHECKUP':
      intervalDays = petAgeInMonths < 12 ? 180 : 365 // Semi-annually for young, annually for adult
      break

    default:
      intervalDays = 90 // Default quarterly
  }

  const nextDate = new Date(lastDate)
  nextDate.setDate(nextDate.getDate() + intervalDays)
  
  return nextDate.toISOString().split('T')[0]
}

async function createEventReminder(
  eventId: string,
  dueDate: string,
  eventType: string
): Promise<void> {
  try {
    const supabase = createSupabaseClient()
    
    // Calculate reminder date (3 days before due date)
    const reminderDate = new Date(dueDate)
    reminderDate.setDate(reminderDate.getDate() - 3)

    const { error } = await supabase
      .from('reminders')
      .insert({
        event_id: eventId,
        reminder_date: reminderDate.toISOString().split('T')[0],
        reminder_type: 'DUE_DATE',
        message: `您的宠物有一个${getEventTypeLabel(eventType)}即将到期`,
        status: 'PENDING'
      })

    if (error) {
      console.error('创建提醒失败:', error)
      // Don't throw here - event creation should still succeed even if reminder fails
    }
  } catch (error) {
    console.error('创建提醒失败:', error)
  }
}

function getEventTypeLabel(eventType: string): string {
  const labels: Record<string, string> = {
    'VACCINATION': '疫苗接种',
    'DEWORMING': '驱虫',
    'GROOMING': '美容洗护',
    'CHECKUP': '健康检查',
    'OTHER': '护理事件'
  }
  return labels[eventType] || '护理事件'
}