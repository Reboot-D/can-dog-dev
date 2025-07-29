"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextRequest } from "next/server"

// GET /api/pets/[petId]/todos - Get todos for a pet with filtering
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ petId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: "未授权访问" }, { status: 401 })
    }

    const { petId } = await params
    const { searchParams } = new URL(request.url)
    
    // Verify pet ownership
    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select('user_id')
      .eq('id', petId)
      .single()

    if (petError || !pet) {
      return Response.json({ error: "宠物不存在" }, { status: 404 })
    }

    if (pet.user_id !== user.id) {
      return Response.json({ error: "无权限访问此宠物的任务" }, { status: 403 })
    }

    // Parse query parameters
    const status = searchParams.get('status') || 'PENDING'
    const priority = searchParams.get('priority')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('ai_todos')
      .select(`
        *,
        pets!inner(name, breed_primary)
      `, { count: 'exact' })
      .eq('pet_id', petId)

    // Apply filters
    if (status && status !== 'ALL') {
      query = query.eq('status', status)
    }
    if (priority) {
      query = query.eq('priority', priority)
    }
    if (category) {
      query = query.eq('category', category)
    }
    if (search) {
      query = query.ilike('task_description', `%${search}%`)
    }

    // Apply sorting
    query = query.order('priority', { ascending: false }) // HIGH -> MEDIUM -> LOW
    query = query.order('created_at', { ascending: false })

    // Apply pagination
    const start = (page - 1) * limit
    const end = start + limit - 1
    query = query.range(start, end)

    const { data: todos, count, error } = await query

    if (error) {
      console.error('Error fetching todos:', error)
      return Response.json({ error: "获取任务失败" }, { status: 500 })
    }

    return Response.json({
      todos: todos || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: (count || 0) > page * limit
      },
      filters: {
        status,
        priority,
        category,
        search
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    return Response.json({ error: "服务器内部错误" }, { status: 500 })
  }
}

// POST /api/pets/[petId]/todos - Create a new todo (manual creation)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ petId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: "未授权访问" }, { status: 401 })
    }

    const { petId } = await params
    const body = await request.json()
    const { task_description, priority = 'MEDIUM', category, due_date } = body

    // Verify pet ownership
    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select('user_id')
      .eq('id', petId)
      .single()

    if (petError || !pet) {
      return Response.json({ error: "宠物不存在" }, { status: 404 })
    }

    if (pet.user_id !== user.id) {
      return Response.json({ error: "无权限为此宠物创建任务" }, { status: 403 })
    }

    // Validate required fields
    if (!task_description || !category) {
      return Response.json({ error: "任务描述和分类是必填项" }, { status: 400 })
    }

    // Create new todo
    const { data: newTodo, error: createError } = await supabase
      .from('ai_todos')
      .insert({
        pet_id: petId,
        task_description,
        priority,
        category,
        due_date,
        status: 'PENDING'
      })
      .select(`
        *,
        pets!inner(name, breed_primary)
      `)
      .single()

    if (createError) {
      console.error('Error creating todo:', createError)
      return Response.json({ error: "创建任务失败" }, { status: 500 })
    }

    return Response.json({
      success: true,
      todo: newTodo
    })

  } catch (error) {
    console.error('API Error:', error)
    return Response.json({ error: "服务器内部错误" }, { status: 500 })
  }
}