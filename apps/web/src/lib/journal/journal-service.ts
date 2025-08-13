import { createClient } from '@/lib/supabase/client'
import { JournalEntry, JournalEntryInsert } from '@/types/supabase'

export class JournalService {
  private supabase = createClient()

  private async validateUserAuthentication(): Promise<string> {
    const { data: { user }, error: authError } = await this.supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    return user.id
  }

  private async validatePetOwnership(petId: string, userId: string): Promise<void> {
    const { data: pet, error: petError } = await this.supabase
      .from('pets')
      .select('user_id')
      .eq('id', petId)
      .single()

    if (petError || !pet) {
      throw new Error('Pet not found')
    }

    if (pet.user_id !== userId) {
      throw new Error('Unauthorized: You can only access your own pets')
    }
  }

  async createJournalEntry(petId: string, content: string): Promise<JournalEntry> {
    // Validate content first (no async operations needed)
    if (!content || content.trim().length === 0) {
      throw new Error('Journal entry content cannot be empty')
    }

    if (content.length > 10000) {
      throw new Error('Journal entry content is too long (maximum 10,000 characters)')
    }

    // Validate user authentication
    const userId = await this.validateUserAuthentication()
    
    // Validate pet ownership
    await this.validatePetOwnership(petId, userId)

    // Create journal entry
    const journalEntryData: JournalEntryInsert = {
      user_id: userId,
      pet_id: petId,
      content: content.trim()
    }

    const { data: journalEntry, error } = await this.supabase
      .from('journal_entries')
      .insert(journalEntryData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create journal entry: ${error.message}`)
    }

    return journalEntry
  }

  async getJournalEntries(petId: string): Promise<JournalEntry[]> {
    // Validate user authentication
    const userId = await this.validateUserAuthentication()
    
    // Validate pet ownership
    await this.validatePetOwnership(petId, userId)

    // Get journal entries for the pet
    const { data: journalEntries, error } = await this.supabase
      .from('journal_entries')
      .select('*')
      .eq('pet_id', petId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch journal entries: ${error.message}`)
    }

    return journalEntries || []
  }

  async updateJournalEntryWithAdvice(entryId: string, aiAdvice: string): Promise<JournalEntry> {
    // Validate input
    if (!entryId || entryId.trim().length === 0) {
      throw new Error('Journal entry ID is required')
    }

    if (!aiAdvice || aiAdvice.trim().length === 0) {
      throw new Error('AI advice content cannot be empty')
    }

    // Validate user authentication
    const userId = await this.validateUserAuthentication()
    
    // Verify journal entry exists and belongs to user
    const { data: existingEntry, error: checkError } = await this.supabase
      .from('journal_entries')
      .select('id, pet_id, user_id')
      .eq('id', entryId)
      .single()

    if (checkError || !existingEntry) {
      throw new Error('Journal entry not found')
    }

    if (existingEntry.user_id !== userId) {
      throw new Error('Unauthorized: You can only update your own journal entries')
    }

    // Update journal entry with AI advice
    const { data: updatedEntry, error: updateError } = await this.supabase
      .from('journal_entries')
      .update({ ai_advice: aiAdvice.trim() })
      .eq('id', entryId)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update journal entry with AI advice: ${updateError.message}`)
    }

    return updatedEntry
  }

  async getJournalEntry(entryId: string): Promise<JournalEntry> {
    // Validate user authentication
    const userId = await this.validateUserAuthentication()
    
    // Get specific journal entry
    const { data: journalEntry, error } = await this.supabase
      .from('journal_entries')
      .select('*')
      .eq('id', entryId)
      .single()

    if (error || !journalEntry) {
      throw new Error('Journal entry not found')
    }

    // Verify ownership through pet
    await this.validatePetOwnership(journalEntry.pet_id, userId)

    return journalEntry
  }
}

export const journalService = new JournalService()