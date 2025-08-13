import { createClient } from '@/lib/supabase/client'
import { Pet, PetInsert } from '@/types/supabase'

export class PetsService {
  private supabase = createClient()

  private async validatePetOwnership(petId: string): Promise<void> {
    const { data: { user }, error: authError } = await this.supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    const { data: pet, error: petError } = await this.supabase
      .from('pets')
      .select('user_id')
      .eq('id', petId)
      .single()

    if (petError || !pet) {
      throw new Error('Pet not found')
    }

    if (pet.user_id !== user.id) {
      throw new Error('Unauthorized: You can only modify your own pets')
    }
  }

  async getPets(): Promise<Pet[]> {
    const { data: pets, error } = await this.supabase
      .from('pets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch pets: ${error.message}`)
    }

    return pets || []
  }

  async createPet(petData: Omit<PetInsert, 'user_id'>): Promise<Pet> {
    const { data: { user }, error: authError } = await this.supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    const { data: pet, error } = await this.supabase
      .from('pets')
      .insert({
        ...petData,
        user_id: user.id
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('You already have a pet with this name')
      }
      throw new Error(`Failed to create pet: ${error.message}`)
    }

    return pet
  }

  async getPetById(petId: string): Promise<Pet | null> {
    const { data: pet, error } = await this.supabase
      .from('pets')
      .select('*')
      .eq('id', petId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Pet not found
      }
      throw new Error(`Failed to fetch pet: ${error.message}`)
    }

    return pet
  }

  async updatePet(petId: string, petData: Partial<Omit<PetInsert, 'user_id'>>): Promise<Pet> {
    // Validate ownership before update
    await this.validatePetOwnership(petId)
    
    const { data: pet, error } = await this.supabase
      .from('pets')
      .update(petData)
      .eq('id', petId)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('You already have a pet with this name')
      }
      throw new Error(`Failed to update pet: ${error.message}`)
    }

    return pet
  }

  async deletePet(petId: string): Promise<void> {
    // Validate ownership before delete
    await this.validatePetOwnership(petId)
    
    const { error } = await this.supabase
      .from('pets')
      .delete()
      .eq('id', petId)

    if (error) {
      throw new Error(`Failed to delete pet: ${error.message}`)
    }
  }
}

export const petsService = new PetsService()