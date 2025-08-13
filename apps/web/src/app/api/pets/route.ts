import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PetInsert } from '@/types/supabase'
import { z } from 'zod'

// Validation schema for pet creation
const createPetSchema = z.object({
  name: z.string().min(1, 'Pet name is required').max(100, 'Pet name too long'),
  breed: z.string().max(100, 'Breed name too long').optional(),
  date_of_birth: z.string().optional(),
  photo_url: z.string().url('Invalid photo URL').optional()
})

// GET /api/pets - Retrieve all pets for authenticated user
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user's pets
    const { data: pets, error: petsError } = await supabase
      .from('pets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (petsError) {
      console.error('Error fetching pets:', petsError)
      return NextResponse.json(
        { error: 'Failed to fetch pets' },
        { status: 500 }
      )
    }

    return NextResponse.json({ pets })
  } catch (error) {
    console.error('Unexpected error in GET /api/pets:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/pets - Create new pet record linked to authenticated user
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = createPetSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const petData: PetInsert = {
      ...validationResult.data,
      user_id: user.id
    }

    // Create the pet
    const { data: newPet, error: createError } = await supabase
      .from('pets')
      .insert(petData)
      .select()
      .single()

    if (createError) {
      console.error('Error creating pet:', createError)
      
      // Handle unique constraint violation (duplicate pet name for user)
      if (createError.code === '23505') {
        return NextResponse.json(
          { error: 'You already have a pet with this name' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create pet' },
        { status: 500 }
      )
    }

    return NextResponse.json({ pet: newPet }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/pets:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}