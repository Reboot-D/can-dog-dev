import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DashboardClient from "./dashboard-client"

async function getDashboardData() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  // Get user's pets
  const { data: pets, error: petsError } = await supabase
    .from('pets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (petsError) {
    console.error('Error fetching pets:', petsError)
    return { pets: [], todos: [], user }
  }

  // Get AI todos for all user's pets
  let todos: any[] = []
  if (pets && pets.length > 0) {
    const petIds = pets.map(pet => pet.id)
    const { data: aiTodos, error: todosError } = await supabase
      .from('ai_todos')
      .select(`
        *,
        pets!inner(name, breed_primary)
      `)
      .in('pet_id', petIds)
      .eq('status', 'PENDING')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })

    if (!todosError && aiTodos) {
      todos = aiTodos
    }
  }

  return { pets: pets || [], todos, user }
}

export default async function DashboardPage() {
  const { pets, todos, user } = await getDashboardData()

  return (
    <DashboardClient 
      pets={pets} 
      todos={todos} 
      userName={user.user_metadata?.full_name || user.email?.split('@')[0] || '用户'} 
    />
  )
}
