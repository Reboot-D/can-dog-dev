// Epic 004: Event Tracking System - Individual Event API routes
// Task 004-01-03: Event CRUD API endpoints (GET/PUT/DELETE)

import { NextRequest, NextResponse } from 'next/server'
import { verifyUserPermission } from '@/lib/auth/permissions'
import { createSupabaseClient } from '@/lib/supabase/server'
import { eventUpdateSchema } from '@/lib/validations/event'

// GET /api/events/[eventId] - Get single event details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    // Verify user permission
    const { user } = await verifyUserPermission('USER', true)
    const { eventId } = await params
    const supabase = createSupabaseClient()

    // Get event with pet ownership verification
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        pets!inner (
          id,
          name,
          user_id
        )
      `)
      .eq('id', eventId)
      .eq('pets.user_id', user.id)
      .single()

    if (error || !event) {
      return NextResponse.json(
        { error: '事件不存在或无访问权限' },
        { status: 404 }
      )
    }

    return NextResponse.json(event)

  } catch (error) {
    console.error('获取事件详情失败:', error)
    
    return NextResponse.json(
      { error: '获取事件详情失败' },
      { status: 500 }
    )
  }
}

// PUT /api/events/[eventId] - Update event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    // Verify user permission
    const { user } = await verifyUserPermission('USER', true)
    const { eventId } = await params
    const supabase = createSupabaseClient()

    // Verify event ownership
    const { data: existingEvent, error: verifyError } = await supabase
      .from('events')
      .select(`
        id,
        next_due_date,
        pets!inner (
          id,
          user_id
        )
      `)
      .eq('id', eventId)
      .eq('pets.user_id', user.id)
      .single()

    if (verifyError || !existingEvent) {
      return NextResponse.json(
        { error: '事件不存在或无访问权限' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const eventData = await request.json()
    const validatedData = eventUpdateSchema.parse({
      ...eventData,
      cost: eventData.cost ? Number(eventData.cost) : undefined,
      updated_at: new Date().toISOString()
    })

    // Update event
    const { data: updatedEvent, error } = await supabase
      .from('events')
      .update(validatedData)
      .eq('id', eventId)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Update reminder if next_due_date changed
    if (validatedData.next_due_date !== undefined) {
      await updateEventReminder(
        eventId, 
        validatedData.next_due_date, 
        existingEvent.next_due_date
      )
    }

    return NextResponse.json(updatedEvent)

  } catch (error) {
    console.error('更新事件失败:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '更新事件失败' },
      { status: 500 }
    )
  }
}

// DELETE /api/events/[eventId] - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    // Verify user permission
    const { user } = await verifyUserPermission('USER', true)
    const { eventId } = await params
    const supabase = createSupabaseClient()

    // Verify event ownership
    const { data: existingEvent, error: verifyError } = await supabase
      .from('events')
      .select(`
        id,
        pets!inner (
          id,
          user_id
        )
      `)
      .eq('id', eventId)
      .eq('pets.user_id', user.id)
      .single()

    if (verifyError || !existingEvent) {
      return NextResponse.json(
        { error: '事件不存在或无访问权限' },
        { status: 404 }
      )
    }

    // Delete related reminders first
    await deleteEventReminders(eventId)

    // Delete event
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)

    if (error) {
      throw error
    }

    return NextResponse.json({ 
      message: '事件删除成功',
      success: true 
    })

  } catch (error) {
    console.error('删除事件失败:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '删除事件失败' },
      { status: 500 }
    )
  }
}

// Helper functions for reminder management
async function updateEventReminder(
  eventId: string,
  newDueDate: string | null,
  oldDueDate: string | null
): Promise<void> {
  try {
    const supabase = createSupabaseClient()

    if (!newDueDate) {
      // Remove reminder if no due date
      await deleteEventReminders(eventId)
      return
    }

    if (newDueDate === oldDueDate) {
      // No change needed
      return
    }

    // Calculate new reminder date (3 days before due date)
    const reminderDate = new Date(newDueDate)
    reminderDate.setDate(reminderDate.getDate() - 3)

    // Check if reminder already exists
    const { data: existingReminder } = await supabase
      .from('reminders')
      .select('id')
      .eq('event_id', eventId)
      .eq('reminder_type', 'DUE_DATE')
      .eq('status', 'PENDING')
      .single()

    if (existingReminder) {
      // Update existing reminder
      const { error } = await supabase
        .from('reminders')
        .update({
          reminder_date: reminderDate.toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReminder.id)

      if (error) {
        console.error('更新提醒失败:', error)
      }
    } else {
      // Create new reminder
      const { error } = await supabase
        .from('reminders')
        .insert({
          event_id: eventId,
          reminder_date: reminderDate.toISOString().split('T')[0],
          reminder_type: 'DUE_DATE',
          message: '您的宠物有一个护理事件即将到期',
          status: 'PENDING'
        })

      if (error) {
        console.error('创建提醒失败:', error)
      }
    }
  } catch (error) {
    console.error('更新事件提醒失败:', error)
  }
}

async function deleteEventReminders(eventId: string): Promise<void> {
  try {
    const supabase = createSupabaseClient()

    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('event_id', eventId)
      .eq('status', 'PENDING')

    if (error) {
      console.error('删除事件提醒失败:', error)
    }
  } catch (error) {
    console.error('删除事件提醒失败:', error)
  }
}