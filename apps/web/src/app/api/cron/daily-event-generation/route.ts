import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { AutomatedEventService } from '@/lib/events/automated-event-service'

// TypeScript types for cron job request/response
// Note: CronAuthHeaders interface reserved for future authentication enhancements

interface CronJobResponse {
  success: boolean
  totalPets: number
  processedPets: number
  totalEventsCreated: number
  totalEventsSkipped: number
  failedPets: number
  errors: CronJobError[]
  executionTimeMs: number
  timestamp: string
}

interface CronJobError {
  petId: string
  error: string
}

interface PetProcessingResult {
  petId: string
  success: boolean
  created: number
  skipped: number
  errors: string[]
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()
  
  // Initialize response structure
  const response: CronJobResponse = {
    success: false,
    totalPets: 0,
    processedPets: 0,
    totalEventsCreated: 0,
    totalEventsSkipped: 0,
    failedPets: 0,
    errors: [],
    executionTimeMs: 0,
    timestamp
  }

  try {
    // Authentication: Verify request is from Vercel Cron
    const authResult = await authenticateCronRequest(request)
    if (!authResult.valid) {
      console.error('Cron job authentication failed:', {
        reason: authResult.reason,
        timestamp,
        headers: Object.fromEntries(request.headers.entries())
      })
      
      return NextResponse.json(
        { error: 'Unauthorized', reason: authResult.reason },
        { status: 401 }
      )
    }

    console.log('Daily event generation cron job started:', { timestamp })

    // Create Supabase client with service role for batch operations
    const supabase = createServiceClient()
    
    // Get all pets from the database
    const { data: pets, error: petsError } = await supabase
      .from('pets')
      .select('id, user_id, name, breed, date_of_birth')
      .order('created_at', { ascending: true })

    if (petsError) {
      const errorMsg = `Failed to fetch pets: ${petsError.message}`
      console.error('Database error in cron job:', {
        error: petsError,
        timestamp
      })
      
      response.errors.push({ petId: 'N/A', error: errorMsg })
      response.executionTimeMs = Date.now() - startTime
      
      return NextResponse.json(response, { status: 500 })
    }

    response.totalPets = pets?.length || 0
    
    if (!pets || pets.length === 0) {
      console.log('No pets found for event generation:', { timestamp })
      response.success = true
      response.executionTimeMs = Date.now() - startTime
      return NextResponse.json(response, { status: 200 })
    }

    console.log(`Processing ${pets.length} pets for event generation`)

    // Process each pet individually with error isolation
    const results: PetProcessingResult[] = []
    
    for (const pet of pets) {
      try {
        const petResult = await processPetEvents(pet.id)
        results.push(petResult)
        
        response.processedPets++
        response.totalEventsCreated += petResult.created
        response.totalEventsSkipped += petResult.skipped
        
        if (!petResult.success) {
          response.failedPets++
          response.errors.push({
            petId: pet.id,
            error: petResult.errors.join('; ')
          })
        }

        // Log individual pet processing result
        console.log('Pet processing result:', {
          petId: pet.id,
          petName: pet.name,
          success: petResult.success,
          created: petResult.created,
          skipped: petResult.skipped,
          errors: petResult.errors
        })

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        response.failedPets++
        response.errors.push({
          petId: pet.id,
          error: errorMsg
        })
        
        console.error('Unexpected error processing pet:', {
          petId: pet.id,
          error: errorMsg,
          timestamp
        })
      }
    }

    // Determine overall success
    response.success = response.failedPets === 0 || (response.processedPets > 0 && response.failedPets < response.totalPets)
    response.executionTimeMs = Date.now() - startTime

    // Log final results
    console.log('Daily event generation completed:', {
      success: response.success,
      totalPets: response.totalPets,
      processedPets: response.processedPets,
      totalEventsCreated: response.totalEventsCreated,
      totalEventsSkipped: response.totalEventsSkipped,
      failedPets: response.failedPets,
      executionTimeMs: response.executionTimeMs,
      timestamp
    })

    // Return appropriate status code
    const statusCode = response.success ? (response.errors.length > 0 ? 207 : 200) : 500
    return NextResponse.json(response, { status: statusCode })

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    response.errors.push({ petId: 'N/A', error: errorMsg })
    response.executionTimeMs = Date.now() - startTime
    
    console.error('Critical error in cron job:', {
      error: errorMsg,
      timestamp,
      executionTimeMs: response.executionTimeMs
    })
    
    return NextResponse.json(response, { status: 500 })
  }
}

/**
 * Authenticate cron request to ensure it's from Vercel
 */
async function authenticateCronRequest(request: NextRequest): Promise<{ valid: boolean; reason?: string }> {
  // Check for Vercel cron header
  const cronHeader = request.headers.get('x-vercel-cron')
  if (cronHeader !== '1') {
    return { valid: false, reason: 'Missing or invalid x-vercel-cron header' }
  }

  // Check for proper authorization if CRON_SECRET is set
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authorization = request.headers.get('authorization')
    if (!authorization || authorization !== `Bearer ${cronSecret}`) {
      return { valid: false, reason: 'Invalid or missing authorization token' }
    }
  }

  return { valid: true }
}

/**
 * Process event generation for a single pet with isolated error handling
 */
async function processPetEvents(petId: string): Promise<PetProcessingResult> {
  const result: PetProcessingResult = {
    petId,
    success: false,
    created: 0,
    skipped: 0,
    errors: []
  }

  try {
    // Create a new AutomatedEventService instance for this pet with service role client
    const supabase = createServiceClient()
    const eventService = new AutomatedEventService(supabase)
    
    // Generate events for this pet
    const generationResult = await eventService.generateEventsForPet(petId)
    
    result.created = generationResult.created
    result.skipped = generationResult.skipped
    result.errors = generationResult.errors
    result.success = generationResult.errors.length === 0

    return result
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    result.errors.push(errorMsg)
    return result
  }
}

// Only allow POST method
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. This endpoint only accepts POST requests.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. This endpoint only accepts POST requests.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. This endpoint only accepts POST requests.' },
    { status: 405 }
  )
}