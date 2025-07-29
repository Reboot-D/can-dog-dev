"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextRequest } from "next/server"

// PUT /api/todos/[todoId]/ignore - Ignore a todo task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ todoId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: "未授权访问" }, { status: 401 })
    }

    const { todoId } = await params

    // Verify todo ownership
    const { data: todoData, error: todoError } = await supabase
      .from('ai_todos')
      .select(`
        *,
        pets!inner(user_id, name)
      `)
      .eq('id', todoId)
      .single()

    if (todoError || !todoData) {
      return Response.json({ error: "任务不存在" }, { status: 404 })
    }

    if (todoData.pets.user_id !== user.id) {
      return Response.json({ error: "无权限访问此任务" }, { status: 403 })
    }

    if (todoData.status !== 'PENDING') {
      return Response.json({ error: "只能忽略待完成的任务" }, { status: 400 })
    }

    // Update task status to ignored
    const { data: updatedTodo, error: updateError } = await supabase
      .from('ai_todos')
      .update({
        status: 'IGNORED',
        ignored_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', todoId)
      .select(`
        *,
        pets!inner(name, breed_primary)
      `)
      .single()

    if (updateError) {
      console.error('Error ignoring todo:', updateError)
      return Response.json({ error: "忽略任务失败" }, { status: 500 })
    }

    console.log(`任务已忽略:`)
    console.log(`Task ID: ${updatedTodo.id}`)
    console.log(`Description: ${updatedTodo.task_description}`)
    console.log(`Pet: ${updatedTodo.pets.name}`)
    console.log(`User ID: ${user.id}`)

    return Response.json({
      success: true,
      todo: updatedTodo,
      message: "任务已忽略"
    })

  } catch (error) {
    console.error('API Error:', error)
    return Response.json({ error: "服务器内部错误" }, { status: 500 })
  }
}