import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { JournalEntryInsert } from '@/types/supabase'
import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'
import { rateLimit, JOURNAL_RATE_LIMIT_CONFIG } from '@/lib/rate-limit'

// Validation schema for journal entry creation
const createJournalEntrySchema = z.object({
  content: z.string()
    .min(1, 'Journal entry content is required')
    .max(10000, 'Journal entry content is too long (maximum 10,000 characters)')
    .transform(str => str.trim())
})

interface RouteParams {
  params: { petId: string }
}

// POST /api/pets/[petId]/journal - Create new journal entry for pet
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { petId } = params
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Apply rate limiting for journal creation
    const rateLimitKey = `journal:${user.id}`
    const rateLimitResult = rateLimit(rateLimitKey, JOURNAL_RATE_LIMIT_CONFIG)
    
    if (!rateLimitResult.allowed) {
      const resetDate = new Date(rateLimitResult.resetTime || Date.now())
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: 'Too many journal entries created. Please try again later.',
          resetTime: resetDate.toISOString()
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': JOURNAL_RATE_LIMIT_CONFIG.maxRequests.toString(),
            'X-RateLimit-Remaining': (rateLimitResult.remainingRequests || 0).toString(),
            'X-RateLimit-Reset': resetDate.toISOString(),
            'Retry-After': Math.ceil(((rateLimitResult.resetTime || Date.now()) - Date.now()) / 1000).toString()
          }
        }
      )
    }

    // Validate petId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(petId)) {
      return NextResponse.json(
        { error: 'Invalid pet ID format' },
        { status: 400 }
      )
    }

    // Verify pet ownership
    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select('user_id')
      .eq('id', petId)
      .single()

    if (petError || !pet) {
      return NextResponse.json(
        { error: 'Pet not found' },
        { status: 404 }
      )
    }

    if (pet.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only create journal entries for your own pets' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = createJournalEntrySchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    // Sanitize content to prevent XSS attacks
    const sanitizedContent = DOMPurify.sanitize(validationResult.data.content, {
      ALLOWED_TAGS: [], // Strip all HTML tags
      ALLOWED_ATTR: [], // Strip all attributes
      KEEP_CONTENT: true // Keep text content
    })

    const journalEntryData: JournalEntryInsert = {
      user_id: user.id,
      pet_id: petId,
      content: sanitizedContent
    }

    // Create the journal entry
    const { data: newJournalEntry, error: createError } = await supabase
      .from('journal_entries')
      .insert(journalEntryData)
      .select()
      .single()

    if (createError) {
      console.error('Error creating journal entry:', createError)
      return NextResponse.json(
        { error: 'Failed to create journal entry' },
        { status: 500 }
      )
    }

    return NextResponse.json({ journalEntry: newJournalEntry }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/pets/[petId]/journal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/pets/[petId]/journal - Retrieve journal entries for pet
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { petId } = params
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate petId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(petId)) {
      return NextResponse.json(
        { error: 'Invalid pet ID format' },
        { status: 400 }
      )
    }

    // Verify pet ownership
    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select('user_id')
      .eq('id', petId)
      .single()

    if (petError || !pet) {
      return NextResponse.json(
        { error: 'Pet not found' },
        { status: 404 }
      )
    }

    if (pet.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only access journal entries for your own pets' },
        { status: 403 }
      )
    }

    // Fetch journal entries for the pet
    const { data: journalEntries, error: fetchError } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('pet_id', petId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching journal entries:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch journal entries' },
        { status: 500 }
      )
    }

    return NextResponse.json({ journalEntries })
  } catch (error) {
    console.error('Unexpected error in GET /api/pets/[petId]/journal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}