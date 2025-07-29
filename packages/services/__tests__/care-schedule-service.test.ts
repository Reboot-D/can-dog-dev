// Unit tests for CareScheduleService - Story 3.1

import { CareScheduleService } from '../care-schedule-service'
import { PetType, CareEventType } from '../../apps/web/src/types/care-schedule'

describe('CareScheduleService', () => {
  describe('getCareSchedulesByPetType', () => {
    test('should return dog care schedules', () => {
      const dogSchedules = CareScheduleService.getCareSchedulesByPetType('dog')
      
      expect(dogSchedules).toBeDefined()
      expect(Array.isArray(dogSchedules)).toBe(true)
      expect(dogSchedules.length).toBeGreaterThan(0)
      
      // All returned schedules should be for dogs
      dogSchedules.forEach(schedule => {
        expect(schedule.pet_type).toBe('dog')
      })
    })
    
    test('should return cat care schedules', () => {
      const catSchedules = CareScheduleService.getCareSchedulesByPetType('cat')
      
      expect(catSchedules).toBeDefined()
      expect(Array.isArray(catSchedules)).toBe(true)
      expect(catSchedules.length).toBeGreaterThan(0)
      
      // All returned schedules should be for cats
      catSchedules.forEach(schedule => {
        expect(schedule.pet_type).toBe('cat')
      })
    })
    
    test('should throw error for invalid pet type', () => {
      expect(() => {
        CareScheduleService.getCareSchedulesByPetType('invalid' as PetType)
      }).toThrow()
    })
  })

  describe('getCareSchedulesByEventType', () => {
    test('should return vaccination schedules for dogs', () => {
      const vaccinationSchedules = CareScheduleService.getCareSchedulesByEventType('dog', 'vaccination')
      
      expect(vaccinationSchedules).toBeDefined()
      expect(Array.isArray(vaccinationSchedules)).toBe(true)
      
      vaccinationSchedules.forEach(schedule => {
        expect(schedule.pet_type).toBe('dog')
        expect(schedule.event_type).toBe('vaccination')
      })
    })
    
    test('should return wellness exam schedules for cats', () => {
      const wellnessSchedules = CareScheduleService.getCareSchedulesByEventType('cat', 'wellness_exam')
      
      expect(wellnessSchedules).toBeDefined()
      expect(Array.isArray(wellnessSchedules)).toBe(true)
      
      wellnessSchedules.forEach(schedule => {
        expect(schedule.pet_type).toBe('cat')
        expect(schedule.event_type).toBe('wellness_exam')
      })
    })
    
    test('should return empty array for non-existent event type combinations', () => {
      const schedules = CareScheduleService.getCareSchedulesByEventType('dog', 'grooming')
      expect(Array.isArray(schedules)).toBe(true)
    })
  })

  describe('getCareScheduleById', () => {
    test('should return specific care schedule by ID', () => {
      const schedule = CareScheduleService.getCareScheduleById('dog-dhpp-puppy')
      
      expect(schedule).toBeDefined()
      expect(schedule?.id).toBe('dog-dhpp-puppy')
      expect(schedule?.pet_type).toBe('dog')
      expect(schedule?.event_type).toBe('vaccination')
    })
    
    test('should return null for non-existent ID', () => {
      const schedule = CareScheduleService.getCareScheduleById('non-existent-id')
      expect(schedule).toBeNull()
    })
  })

  describe('getApplicableCareSchedules', () => {
    test('should return schedules for 2-month-old puppy', () => {
      const schedules = CareScheduleService.getApplicableCareSchedules('dog', 2)
      
      expect(schedules).toBeDefined()
      expect(Array.isArray(schedules)).toBe(true)
      expect(schedules.length).toBeGreaterThan(0)
      
      // Should include puppy vaccinations and monthly prevention
      const hasVaccination = schedules.some(s => s.event_type === 'vaccination')
      const hasParasitePrevention = schedules.some(s => s.event_type === 'parasite_prevention')
      
      expect(hasVaccination).toBe(true)
      expect(hasParasitePrevention).toBe(true)
    })
    
    test('should return schedules for adult 24-month-old dog', () => {
      const schedules = CareScheduleService.getApplicableCareSchedules('dog', 24)
      
      expect(schedules).toBeDefined()
      expect(Array.isArray(schedules)).toBe(true)
      
      // Should include annual boosters, wellness exams, and dental care
      const hasAnnualVaccination = schedules.some(s => 
        s.event_type === 'vaccination' && s.recurrence.unit === 'years')
      const hasWellnessExam = schedules.some(s => s.event_type === 'wellness_exam')
      const hasDentalCare = schedules.some(s => s.event_type === 'dental_care')
      
      expect(hasAnnualVaccination).toBe(true)
      expect(hasWellnessExam).toBe(true)
      expect(hasDentalCare).toBe(true)
    })
    
    test('should filter out schedules with age restrictions', () => {
      const schedules = CareScheduleService.getApplicableCareSchedules('dog', 1)
      
      // Should not include schedules that require older pets
      const hasWellnessExam = schedules.some(s => s.event_type === 'wellness_exam')
      const hasDentalCare = schedules.some(s => s.event_type === 'dental_care')
      
      expect(hasWellnessExam).toBe(false) // Wellness exams start at 12 months
      expect(hasDentalCare).toBe(false) // Dental care starts at 24 months
    })
  })

  describe('calculateNextDueDate', () => {
    const petDateOfBirth = new Date('2023-01-01')
    
    test('should calculate initial due date for puppy vaccination', () => {
      const schedule = CareScheduleService.getCareScheduleById('dog-dhpp-puppy')
      expect(schedule).toBeDefined()
      
      if (schedule) {
        const dueDate = CareScheduleService.calculateNextDueDate(schedule, petDateOfBirth)
        
        expect(dueDate).toBeInstanceOf(Date)
        
        // Should be around 2 months after birth (when puppy vaccines start)
        const expectedDate = new Date(petDateOfBirth)
        expectedDate.setMonth(expectedDate.getMonth() + 2)
        
        expect(dueDate.getFullYear()).toBe(expectedDate.getFullYear())
        expect(dueDate.getMonth()).toBe(expectedDate.getMonth())
      }
    })
    
    test('should calculate next due date after previous event', () => {
      const schedule = CareScheduleService.getCareScheduleById('dog-heartworm-monthly')
      expect(schedule).toBeDefined()
      
      if (schedule) {
        const lastEventDate = new Date('2024-06-01')
        const dueDate = CareScheduleService.calculateNextDueDate(schedule, petDateOfBirth, lastEventDate)
        
        expect(dueDate).toBeInstanceOf(Date)
        
        // Should be 1 month after last event
        const expectedDate = new Date(lastEventDate)
        expectedDate.setMonth(expectedDate.getMonth() + 1)
        
        expect(dueDate.getTime()).toBe(expectedDate.getTime())
      }
    })
    
    test('should handle yearly recurrence', () => {
      const schedule = CareScheduleService.getCareScheduleById('dog-dhpp-annual')
      expect(schedule).toBeDefined()
      
      if (schedule) {
        const lastEventDate = new Date('2023-12-01')
        const dueDate = CareScheduleService.calculateNextDueDate(schedule, petDateOfBirth, lastEventDate)
        
        expect(dueDate).toBeInstanceOf(Date)
        expect(dueDate.getFullYear()).toBe(2024)
        expect(dueDate.getMonth()).toBe(11) // December (0-indexed)
      }
    })
  })

  describe('generateCareEventsForPet', () => {
    const petId = 'test-pet-123'
    const petDateOfBirth = new Date('2023-06-01')
    
    test('should generate events for young puppy', () => {
      const events = CareScheduleService.generateCareEventsForPet(
        petId, 
        'dog', 
        petDateOfBirth
      )
      
      expect(events).toBeDefined()
      expect(Array.isArray(events)).toBe(true)
      expect(events.length).toBeGreaterThan(0)
      
      events.forEach(event => {
        expect(event.pet_id).toBe(petId)
        expect(event.title).toBeDefined()
        expect(event.description).toBeDefined()
        expect(event.due_date).toBeDefined()
        expect(event.event_type).toBeDefined()
        expect(event.schedule_rule_id).toBeDefined()
        expect(event.priority).toBeDefined()
        
        // Due date should be a valid ISO string
        expect(() => new Date(event.due_date)).not.toThrow()
      })
    })
    
    test('should generate events for adult cat', () => {
      const adultCatBirth = new Date('2022-01-01') // 2+ years old
      const events = CareScheduleService.generateCareEventsForPet(
        petId, 
        'cat', 
        adultCatBirth
      )
      
      expect(events).toBeDefined()
      expect(Array.isArray(events)).toBe(true)
      expect(events.length).toBeGreaterThan(0)
      
      // Should include adult cat schedules
      const hasAnnualVaccination = events.some(e => 
        e.event_type === 'vaccination' && e.title.includes('Annual'))
      const hasWellnessExam = events.some(e => e.event_type === 'wellness_exam')
      
      expect(hasAnnualVaccination).toBe(true)
      expect(hasWellnessExam).toBe(true)
    })
    
    test('should respect last event dates when provided', () => {
      const lastEventDates = {
        'dog-heartworm-monthly': new Date('2024-07-01')
      }
      
      const events = CareScheduleService.generateCareEventsForPet(
        petId, 
        'dog', 
        petDateOfBirth,
        lastEventDates
      )
      
      const heartwormEvent = events.find(e => e.schedule_rule_id === 'dog-heartworm-monthly')
      expect(heartwormEvent).toBeDefined()
      
      if (heartwormEvent) {
        const dueDate = new Date(heartwormEvent.due_date)
        expect(dueDate.getMonth()).toBe(7) // August (0-indexed), 1 month after July
      }
    })
  })

  describe('validateCareScheduleRule', () => {
    test('should validate a correct care schedule rule', () => {
      const validRule = CareScheduleService.getCareScheduleById('dog-dhpp-puppy')
      expect(validRule).toBeDefined()
      
      if (validRule) {
        const validation = CareScheduleService.validateCareScheduleRule(validRule)
        expect(validation.valid).toBe(true)
        expect(validation.errors).toHaveLength(0)
      }
    })
    
    test('should invalidate rule with missing required fields', () => {
      const invalidRule = {
        id: '',
        name: '',
        description: 'Test description',
        pet_type: 'dog' as PetType,
        event_type: 'vaccination' as CareEventType,
        start_condition: { age_months: 2 },
        recurrence: { interval: 1, unit: 'months' as const },
        priority: 'high' as const,
        source: 'Test source',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const validation = CareScheduleService.validateCareScheduleRule(invalidRule)
      expect(validation.valid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
      expect(validation.errors.some(e => e.includes('ID'))).toBe(true)
      expect(validation.errors.some(e => e.includes('name'))).toBe(true)
    })
    
    test('should invalidate rule with invalid recurrence', () => {
      const invalidRule = {
        id: 'test-rule',
        name: 'Test Rule',
        description: 'Test description',
        pet_type: 'dog' as PetType,
        event_type: 'vaccination' as CareEventType,
        start_condition: { age_months: 2 },
        recurrence: { interval: 0, unit: 'invalid' as any },
        priority: 'high' as const,
        source: 'Test source',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const validation = CareScheduleService.validateCareScheduleRule(invalidRule)
      expect(validation.valid).toBe(false)
      expect(validation.errors.some(e => e.includes('interval'))).toBe(true)
      expect(validation.errors.some(e => e.includes('unit'))).toBe(true)
    })
  })
})