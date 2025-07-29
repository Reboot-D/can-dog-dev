"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextRequest } from "next/server"
import { verifyTodoOwnership, handleAuthError } from "@/lib/auth/permissions"

// POST /api/todos/[todoId]/complete - Complete a todo task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ todoId: string }> }
) {
  try {
    // Verify todo ownership and permissions
    const { todoId } = await params
    const { user, profile } = await verifyTodoOwnership(todoId)
    
    const body = await request.json()
    const { userInput } = body

    if (!userInput || !userInput.trim()) {
      return Response.json({ error: "请填写完成情况" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Get todo data with pet information
    const { data: todoData, error: todoError } = await supabase
      .from('ai_todos')
      .select(`
        *,
        pets!inner(id, user_id, name, breed_primary, date_of_birth, city)
      `)
      .eq('id', todoId)
      .single()

    if (todoError || !todoData) {
      return Response.json({ error: "任务不存在" }, { status: 404 })
    }

    if (todoData.status !== 'PENDING') {
      return Response.json({ error: "任务已完成或已忽略" }, { status: 400 })
    }

    // Call Edge Function for AI processing and task completion
    try {
      console.log("调用AI处理和任务完成...")
      
      const { data: result, error: aiError } = await supabase.functions.invoke('update-profile-from-todo', {
        body: { 
          todoId: todoId,
          userInput: userInput.trim()
        }
      })

      if (aiError) {
        console.error('AI处理失败:', aiError)
        // Fallback: just mark as completed without AI processing
        const { data: updatedTodo, error: updateError } = await supabase
          .from('ai_todos')
          .update({
            status: 'COMPLETED',
            user_input: userInput.trim(),
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', todoId)
          .select(`
            *,
            pets!inner(name, breed_primary)
          `)
          .single()

        if (updateError) {
          console.error('Error updating todo:', updateError)
          return Response.json({ error: "完成任务失败" }, { status: 500 })
        }

        return Response.json({
          success: true,
          todo: updatedTodo,
          message: "任务完成成功！（AI处理失败，数据未自动更新）",
          updates: [],
          warning: "AI处理服务暂时不可用"
        })
      }

      console.log("AI处理完成:")
      console.log("Updates:", result.updates?.length || 0)
      console.log("Confidence:", result.parseResult?.confidence || 'N/A')

      // Build success message based on updates
      let message = "任务完成成功！"
      if (result.updates && result.updates.length > 0) {
        const eventUpdates = result.updates.filter((u: any) => u.type === 'event')
        const profileUpdates = result.updates.filter((u: any) => u.type === 'pet_profile')
        
        if (eventUpdates.length > 0) {
          message += ` 已自动创建${eventUpdates.length}条护理记录。`
        }
        if (profileUpdates.length > 0) {
          message += ` 已更新宠物档案信息。`
        }
      }

      return Response.json({
        success: true,
        todo: result.todo,
        message,
        updates: result.updates || [],
        parseResult: result.parseResult
      })

    } catch (aiError) {
      console.error('AI Edge Function调用失败:', aiError)
      
      // Fallback: just mark as completed
      const { data: updatedTodo, error: updateError } = await supabase
        .from('ai_todos')
        .update({
          status: 'COMPLETED',
          user_input: userInput.trim(),
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', todoId)
        .select(`
          *,
          pets!inner(name, breed_primary)
        `)
        .single()

      if (updateError) {
        console.error('Error updating todo:', updateError)
        return Response.json({ error: "完成任务失败" }, { status: 500 })
      }

      return Response.json({
        success: true,
        todo: updatedTodo,
        message: "任务完成成功！（AI处理服务暂时不可用）",
        updates: [],
        warning: "AI处理服务连接失败"
      })
    }

  } catch (error) {
    console.error('API Error:', error)
    return handleAuthError(error as Error)
  }
}