import { createClient } from '@/lib/supabase/server'
import { getCareSchedulesForPetType } from '@/config/care-schedules'
import { CareScheduleRule } from '@/types/care-schedule'
import { EventCreationParams, EventGenerationResult } from '@/types/event'
import { SupabaseClient } from '@supabase/supabase-js'

interface Pet {
  id: string
  user_id: string
  breed: string | null
  date_of_birth: string | null
}

interface ExistingEvent {
  source: string
  due_date: string
}

export class AutomatedEventService {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient()
  }

  /**
   * Generates care events for a specific pet based on care schedules
   * @param petId The ID of the pet to generate events for
   * @returns Result containing created count, skipped count, and any errors
   */
  async generateEventsForPet(petId: string): Promise<EventGenerationResult> {
    const result: EventGenerationResult = {
      created: 0,
      skipped: 0,
      errors: []
    }

    try {
      // Step 1: Read pet data
      const pet = await this.getPetData(petId)
      if (!pet) {
        result.errors.push('Pet not found')
        return result
      }

      // Calculate pet age in months
      const petAgeInMonths = this.calculateAgeInMonths(pet.date_of_birth)
      if (petAgeInMonths === null) {
        result.errors.push('Unable to determine pet age')
        return result
      }

      // Step 2: Get existing events to avoid duplicates
      const existingEvents = await this.getExistingEvents(petId)

      // Step 3: Determine pet type (dog/cat) from breed
      const petType = this.determinePetType(pet.breed)
      if (!petType) {
        result.errors.push('Unable to determine pet type from breed')
        return result
      }

      // Step 4: Get care schedules for pet type
      const careSchedules = getCareSchedulesForPetType(petType)

      // Step 5: Generate events based on care schedules
      const eventsToCreate: EventCreationParams[] = []

      for (const schedule of careSchedules.schedules) {
        const generatedEvents = this.generateEventsFromSchedule(
          schedule,
          pet,
          petAgeInMonths,
          existingEvents
        )

        for (const event of generatedEvents) {
          // Check if event already exists
          const isDuplicate = existingEvents.some(
            existing => 
              existing.source === event.source && 
              existing.due_date === event.due_date
          )

          if (isDuplicate) {
            result.skipped++
          } else {
            eventsToCreate.push(event)
          }
        }
      }

      // Step 6: Create events in database
      if (eventsToCreate.length > 0) {
        const { error } = await this.supabase
          .from('events')
          .insert(
            eventsToCreate.map(event => ({
              ...event,
              user_id: pet.user_id
            }))
          )

        if (error) {
          result.errors.push(`Database error: ${error.message}`)
        } else {
          result.created = eventsToCreate.length
        }
      }

      return result
    } catch (error) {
      result.errors.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return result
    }
  }

  private async getPetData(petId: string): Promise<Pet | null> {
    const { data, error } = await this.supabase
      .from('pets')
      .select('id, user_id, breed, date_of_birth')
      .eq('id', petId)
      .single()

    if (error || !data) {
      return null
    }

    return data
  }

  private async getExistingEvents(petId: string): Promise<ExistingEvent[]> {
    const { data, error } = await this.supabase
      .from('events')
      .select('source, due_date')
      .eq('pet_id', petId)
      .not('source', 'is', null)

    if (error) {
      console.error('Error fetching existing events:', error)
      return []
    }

    return data || []
  }

  private calculateAgeInMonths(dateOfBirth: string | null): number | null {
    if (!dateOfBirth) return null

    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    
    const monthsDiff = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                      (today.getMonth() - birthDate.getMonth())

    return monthsDiff >= 0 ? monthsDiff : null
  }

  private determinePetType(breed: string | null): 'dog' | 'cat' | null {
    if (!breed) return null

    const breedLower = breed.toLowerCase()
    
    // Common cat breeds
    const catBreeds = [
      'persian', 'siamese', 'maine coon', 'ragdoll', 'british shorthair',
      'abyssinian', 'bengal', 'birman', 'russian blue', 'scottish fold',
      'sphynx', 'cat', 'kitten', 'domestic shorthair', 'domestic longhair'
    ]

    // If breed contains any cat breed keywords, it's a cat
    if (catBreeds.some(catBreed => breedLower.includes(catBreed))) {
      return 'cat'
    }

    // Otherwise assume it's a dog
    return 'dog'
  }

  private generateEventsFromSchedule(
    schedule: CareScheduleRule,
    pet: Pet,
    petAgeInMonths: number,
    existingEvents: ExistingEvent[]
  ): EventCreationParams[] {
    const events: EventCreationParams[] = []

    // Check if pet meets the age requirements
    if (schedule.start_condition.age_months && petAgeInMonths < schedule.start_condition.age_months) {
      return events // Pet is too young
    }

    if (schedule.end_condition?.age_months && petAgeInMonths > schedule.end_condition.age_months) {
      return events // Pet is too old for this schedule
    }

    // Check recurrence conditions
    if (schedule.recurrence.conditions) {
      const conditions = schedule.recurrence.conditions
      
      if (conditions.age_min_months && petAgeInMonths < conditions.age_min_months) {
        return events
      }
      
      if (conditions.age_max_months && petAgeInMonths > conditions.age_max_months) {
        return events
      }
    }

    // Calculate next due date based on recurrence
    const nextDueDate = this.calculateNextDueDate(
      schedule,
      pet,
      petAgeInMonths,
      existingEvents
    )

    if (nextDueDate) {
      events.push({
        pet_id: pet.id,
        title: schedule.name,
        due_date: nextDueDate,
        source: schedule.id,
        status: 'pending'
      })
    }

    return events
  }

  private calculateNextDueDate(
    schedule: CareScheduleRule,
    pet: Pet,
    petAgeInMonths: number,
    existingEvents: ExistingEvent[]
  ): string | null {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find the most recent event for this schedule
    const recentEvent = existingEvents
      .filter(e => e.source === schedule.id)
      .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())[0]

    let baseDate: Date

    if (recentEvent) {
      // Calculate next date from the most recent event
      baseDate = new Date(recentEvent.due_date)
    } else if (schedule.start_condition.age_months && pet.date_of_birth) {
      // Calculate first occurrence based on age
      baseDate = new Date(pet.date_of_birth)
      baseDate.setMonth(baseDate.getMonth() + schedule.start_condition.age_months)
    } else {
      // Use today as base date
      baseDate = new Date()
    }

    // Add recurrence interval
    const nextDate = this.addInterval(baseDate, schedule.recurrence.interval, schedule.recurrence.unit)

    // Only return if the next date is in the future
    if (nextDate > today) {
      return nextDate.toISOString().split('T')[0]
    }

    // If the calculated date is in the past, calculate from today
    let futureDate = new Date(today)
    while (futureDate <= today) {
      futureDate = this.addInterval(futureDate, schedule.recurrence.interval, schedule.recurrence.unit)
    }

    return futureDate.toISOString().split('T')[0]
  }

  private addInterval(date: Date, interval: number, unit: string): Date {
    const result = new Date(date)

    switch (unit) {
      case 'days':
        result.setDate(result.getDate() + interval)
        break
      case 'weeks':
        result.setDate(result.getDate() + (interval * 7))
        break
      case 'months':
        result.setMonth(result.getMonth() + interval)
        break
      case 'years':
        result.setFullYear(result.getFullYear() + interval)
        break
    }

    return result
  }
}