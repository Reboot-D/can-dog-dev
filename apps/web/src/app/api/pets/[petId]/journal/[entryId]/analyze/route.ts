import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { geminiService } from '@/lib/gemini/gemini-service'

interface RouteParams {
  params: { petId: string; entryId: string }
}

/**
 * Validates if a string is a valid UUID v4 format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// POST /api/pets/[petId]/journal/[entryId]/analyze - Analyze journal entry with AI
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { petId, entryId } = params
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate petId and entryId format (UUID)
    if (!petId || !isValidUUID(petId)) {
      return NextResponse.json(
        { error: 'Invalid pet ID format' },
        { status: 400 }
      )
    }
    
    if (!entryId || !isValidUUID(entryId)) {
      return NextResponse.json(
        { error: 'Invalid journal entry ID format' },
        { status: 400 }
      )
    }

    // Verify pet ownership
    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select('user_id, name, breed')
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
        { error: 'Unauthorized: You can only analyze journal entries for your own pets' },
        { status: 403 }
      )
    }

    // Verify journal entry exists and belongs to the pet
    const { data: journalEntry, error: entryError } = await supabase
      .from('journal_entries')
      .select('id, content, ai_advice, pet_id')
      .eq('id', entryId)
      .eq('pet_id', petId)
      .single()

    if (entryError || !journalEntry) {
      return NextResponse.json(
        { error: 'Journal entry not found' },
        { status: 404 }
      )
    }

    // Check if analysis already exists
    if (journalEntry.ai_advice && journalEntry.ai_advice.trim().length > 0) {
      return NextResponse.json({
        success: true,
        ai_advice: journalEntry.ai_advice,
        message: 'Analysis already exists'
      })
    }

    // Prepare data for Gemini analysis with input sanitization
    const analysisRequest = {
      content: journalEntry.content.trim(),
      petName: pet.name.trim(),
      petBreed: pet.breed?.trim() || undefined
    }

    // Call Gemini service for analysis
    const analysisResult = await geminiService.analyzeJournalEntry(analysisRequest)

    if (!analysisResult.success) {
      console.error('Gemini analysis failed:', analysisResult.error)
      return NextResponse.json(
        { 
          error: 'AI analysis failed',
          message: analysisResult.error || 'Unable to analyze journal entry at this time'
        },
        { status: 500 }
      )
    }

    // Update journal entry with AI advice
    const { error: updateError } = await supabase
      .from('journal_entries')
      .update({ ai_advice: analysisResult.analysis })
      .eq('id', entryId)

    if (updateError) {
      console.error('Error updating journal entry with AI advice:', updateError)
      return NextResponse.json(
        { error: 'Failed to save AI analysis' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      ai_advice: analysisResult.analysis,
      message: 'Journal entry analyzed successfully'
    })

  } catch (error) {
    console.error('Unexpected error in POST /api/pets/[petId]/journal/[entryId]/analyze:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}