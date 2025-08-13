import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AutomatedEventService } from '@/lib/events/automated-event-service'
import { rateLimit, JOURNAL_RATE_LIMIT_CONFIG } from '@/lib/rate-limit'

interface RouteParams {
  params: {
    petId: string
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Rate limiting
    const identifier = request.ip ?? request.headers.get('x-forwarded-for') ?? 'anonymous'
    const rateLimitResult = rateLimit(`event-generation:${identifier}`, JOURNAL_RATE_LIMIT_CONFIG)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    // Authentication check
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate pet ID format
    const petId = params.petId
    if (!petId || !isValidUUID(petId)) {
      return NextResponse.json(
        { error: 'Invalid pet ID format' },
        { status: 400 }
      )
    }

    // Verify user owns the pet
    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select('id')
      .eq('id', petId)
      .eq('user_id', user.id)
      .single()

    if (petError || !pet) {
      return NextResponse.json(
        { error: 'Pet not found or access denied' },
        { status: 404 }
      )
    }

    // Generate events using the service
    const eventService = new AutomatedEventService()
    const result = await eventService.generateEventsForPet(petId)

    // Log any errors for monitoring
    if (result.errors.length > 0) {
      console.error('Event generation errors:', {
        petId,
        userId: user.id,
        errors: result.errors
      })
    }

    // Return appropriate status based on result
    const status = result.errors.length > 0 ? 207 : 201 // 207 Multi-Status for partial success

    return NextResponse.json(
      {
        success: result.created > 0 || (result.errors.length === 0 && result.skipped > 0),
        created: result.created,
        skipped: result.skipped,
        errors: result.errors
      },
      { status }
    )

  } catch (error) {
    console.error('Unexpected error in event generation:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}