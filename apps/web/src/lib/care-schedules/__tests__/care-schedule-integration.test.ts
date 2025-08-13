// Integration tests for Care Schedule system - Story 3.1
// Tests the full workflow from configuration to event generation

import { CareScheduleService } from '../../../../../../packages/services/care-schedule-service'
import { CareScheduleInitializer } from '../care-schedule-initializer'
import { getCareSchedulesForPetType } from '../../../config/care-schedules'

describe('Care Schedule Integration Tests', () => {
  beforeAll(async () => {
    // Initialize care schedules before running integration tests
    const result = await CareScheduleInitializer.initialize()
    if (!result.success) {
      throw new Error(`Failed to initialize care schedules: ${result.errors.join(', ')}`)
    }
  })

  describe('Configuration to Service Integration', () => {
    test('should load dog care schedules from configuration through service', () => {
      // Test that configuration data flows correctly through service layer
      const configSchedules = getCareSchedulesForPetType('dog').schedules
      const serviceSchedules = CareScheduleService.getCareSchedulesByPetType('dog')
      
      expect(configSchedules.length).toBe(serviceSchedules.length)
      
      // Verify each schedule from config is available through service
      configSchedules.forEach((configSchedule) => {
        const serviceSchedule = CareScheduleService.getCareScheduleById(configSchedule.id)
        expect(serviceSchedule).toBeDefined()
        expect(serviceSchedule?.id).toBe(configSchedule.id)
        expect(serviceSchedule?.name).toBe(configSchedule.name)
        expect(serviceSchedule?.pet_type).toBe(configSchedule.pet_type)
      })
    })
    
    test('should load cat care schedules from configuration through service', () => {
      const configSchedules = getCareSchedulesForPetType('cat').schedules
      const serviceSchedules = CareScheduleService.getCareSchedulesByPetType('cat')
      
      expect(configSchedules.length).toBe(serviceSchedules.length)
      
      configSchedules.forEach((configSchedule) => {
        const serviceSchedule = CareScheduleService.getCareScheduleById(configSchedule.id)
        expect(serviceSchedule).toBeDefined()
        expect(serviceSchedule?.pet_type).toBe('cat')
      })
    })
  })

  describe('Full Pet Care Event Generation Workflow', () => {
    const testPetId = 'integration-test-pet-001'
    
    test('should generate complete care schedule for new puppy', () => {
      const puppyBirthDate = new Date('2024-05-01') // 2-3 months old
      
      // Generate care events
      const careEvents = CareScheduleService.generateCareEventsForPet(
        testPetId,
        'dog',
        puppyBirthDate
      )
      
      expect(careEvents).toBeDefined()
      expect(Array.isArray(careEvents)).toBe(true)
      expect(careEvents.length).toBeGreaterThan(0)
      
      // Should include puppy-specific schedules
      const vaccinations = careEvents.filter(e => e.event_type === 'vaccination')
      const parasitePrevention = careEvents.filter(e => e.event_type === 'parasite_prevention')
      
      expect(vaccinations.length).toBeGreaterThan(0)
      expect(parasitePrevention.length).toBeGreaterThan(0)
      
      // Should NOT include adult-only schedules for young puppy
      const dentalCare = careEvents.filter(e => e.event_type === 'dental_care')
      expect(dentalCare.length).toBe(0) // Dental care starts at 24 months
      
      // Verify event structure
      careEvents.forEach(event => {
        expect(event.pet_id).toBe(testPetId)
        expect(event.title).toBeTruthy()
        expect(event.description).toBeTruthy()
        expect(new Date(event.due_date)).toBeInstanceOf(Date)
        expect(['vaccination', 'wellness_exam', 'parasite_prevention', 'dental_care', 'grooming']).toContain(event.event_type)
        expect(['high', 'medium', 'low']).toContain(event.priority)
        expect(event.schedule_rule_id).toBeTruthy()
      })
    })
    
    test('should generate appropriate care schedule for adult dog', () => {
      const adultDogBirthDate = new Date('2021-01-01') // 3+ years old
      
      const careEvents = CareScheduleService.generateCareEventsForPet(
        testPetId,
        'dog',
        adultDogBirthDate
      )
      
      expect(careEvents.length).toBeGreaterThan(0)
      
      // Should include adult dog schedules
      const annualVaccinations = careEvents.filter(e => 
        e.event_type === 'vaccination' && e.title.includes('Annual'))
      const wellnessExams = careEvents.filter(e => e.event_type === 'wellness_exam')
      const dentalCare = careEvents.filter(e => e.event_type === 'dental_care')
      
      expect(annualVaccinations.length).toBeGreaterThan(0)
      expect(wellnessExams.length).toBeGreaterThan(0)
      expect(dentalCare.length).toBeGreaterThan(0)
      
      // Should NOT include puppy-specific schedules
      const puppyVaccinations = careEvents.filter(e => 
        e.title.includes('Puppy') || e.title.includes('Series'))
      expect(puppyVaccinations.length).toBe(0)
    })
    
    test('should generate appropriate care schedule for kitten', () => {
      const kittenBirthDate = new Date('2024-06-01') // 1-2 months old
      
      const careEvents = CareScheduleService.generateCareEventsForPet(
        testPetId,
        'cat',
        kittenBirthDate
      )
      
      expect(careEvents.length).toBeGreaterThan(0)
      
      // Should include kitten-appropriate schedules
      const vaccinations = careEvents.filter(e => e.event_type === 'vaccination')
      const parasitePrevention = careEvents.filter(e => e.event_type === 'parasite_prevention')
      
      expect(vaccinations.length).toBeGreaterThan(0)
      expect(parasitePrevention.length).toBeGreaterThan(0)
      
      // Verify cat-specific vaccines (FVRCP)
      const fvrcpVaccinations = careEvents.filter(e => 
        e.title.includes('FVRCP') || e.description.includes('FVRCP'))
      expect(fvrcpVaccinations.length).toBeGreaterThan(0)
    })
  })

  describe('Age-Based Schedule Filtering', () => {
    test('should properly filter schedules based on pet age progression', () => {
      const petBirthDate = new Date('2024-01-01')
      
      // Test different age stages
      const ageStages = [
        { months: 1, description: 'newborn' },
        { months: 2, description: 'young puppy/kitten' },
        { months: 6, description: 'older puppy/kitten' },
        { months: 12, description: 'young adult' },
        { months: 24, description: 'adult' },
        { months: 36, description: 'mature adult' }
      ]
      
      ageStages.forEach(stage => {
        const mockDate = new Date(petBirthDate)
        mockDate.setMonth(mockDate.getMonth() + stage.months)
        
        // Calculate current age for the stage
        const currentAge = stage.months
        
        const applicableSchedules = CareScheduleService.getApplicableCareSchedules('dog', currentAge)
        
        expect(applicableSchedules).toBeDefined()
        expect(Array.isArray(applicableSchedules)).toBe(true)
        
        // Verify age restrictions are properly applied
        applicableSchedules.forEach(schedule => {
          const minAge = schedule.start_condition.age_months || 0
          expect(currentAge).toBeGreaterThanOrEqual(minAge)
          
          if (schedule.end_condition?.age_months) {
            expect(currentAge).toBeLessThanOrEqual(schedule.end_condition.age_months)
          }
          
          if (schedule.recurrence.conditions?.age_min_months) {
            expect(currentAge).toBeGreaterThanOrEqual(schedule.recurrence.conditions.age_min_months)
          }
          
          if (schedule.recurrence.conditions?.age_max_months) {
            expect(currentAge).toBeLessThanOrEqual(schedule.recurrence.conditions.age_max_months)
          }
        })
      })
    })
  })

  describe('Event Due Date Calculations', () => {
    test('should calculate realistic due dates across different schedules', () => {
      const petBirthDate = new Date('2024-01-01')
      const testPetId = 'integration-test-pet-due-dates'
      
      const careEvents = CareScheduleService.generateCareEventsForPet(
        testPetId,
        'dog',
        petBirthDate
      )
      
      const now = new Date()
      
      careEvents.forEach(event => {
        const dueDate = new Date(event.due_date)
        
        // Due dates should be valid dates
        expect(dueDate).toBeInstanceOf(Date)
        expect(isNaN(dueDate.getTime())).toBe(false)
        
        // Due dates should be reasonable (not too far in the past or future)
        const yearsBetween = Math.abs(dueDate.getFullYear() - now.getFullYear())
        expect(yearsBetween).toBeLessThan(20) // Reasonable range
        
        // For current test (pet born in 2024), due dates should make sense
        if (event.event_type === 'vaccination' && event.title.includes('Puppy')) {
          // Puppy vaccines should be due relatively soon after birth
          const monthsFromBirth = (dueDate.getTime() - petBirthDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
          expect(monthsFromBirth).toBeGreaterThanOrEqual(2) // Start at 2 months
          expect(monthsFromBirth).toBeLessThan(12) // Complete before 1 year
        }
        
        if (event.event_type === 'wellness_exam') {
          // Wellness exams should be due after 12 months
          const monthsFromBirth = (dueDate.getTime() - petBirthDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
          expect(monthsFromBirth).toBeGreaterThanOrEqual(12)
        }
      })
    })
    
    test('should respect last event dates in due date calculations', () => {
      const petBirthDate = new Date('2023-01-01')
      const testPetId = 'integration-test-pet-last-events'
      
      // Simulate previous events
      const lastEventDates = {
        'dog-heartworm-monthly': new Date('2024-06-15'),
        'dog-dhpp-annual': new Date('2024-01-15')
      }
      
      const careEvents = CareScheduleService.generateCareEventsForPet(
        testPetId,
        'dog',
        petBirthDate,
        lastEventDates
      )
      
      // Find the heartworm prevention event
      const heartwormEvent = careEvents.find(e => e.schedule_rule_id === 'dog-heartworm-monthly')
      if (heartwormEvent) {
        const dueDate = new Date(heartwormEvent.due_date)
        const lastHeartworDate = lastEventDates['dog-heartworm-monthly']
        
        // Due date should be approximately 1 month after last event
        const expectedDueDate = new Date(lastHeartworDate)
        expectedDueDate.setMonth(expectedDueDate.getMonth() + 1)
        
        expect(dueDate.getMonth()).toBe(expectedDueDate.getMonth())
        expect(dueDate.getFullYear()).toBe(expectedDueDate.getFullYear())
      }
      
      // Find the annual DHPP event
      const dhppEvent = careEvents.find(e => e.schedule_rule_id === 'dog-dhpp-annual')
      if (dhppEvent) {
        const dueDate = new Date(dhppEvent.due_date)
        const lastDhppDate = lastEventDates['dog-dhpp-annual']
        
        // Due date should be approximately 1 year after last event
        const expectedDueDate = new Date(lastDhppDate)
        expectedDueDate.setFullYear(expectedDueDate.getFullYear() + 1)
        
        expect(dueDate.getFullYear()).toBe(expectedDueDate.getFullYear())
        expect(dueDate.getMonth()).toBe(expectedDueDate.getMonth())
      }
    })
  })

  describe('Cross-Pet Type Consistency', () => {
    test('should maintain consistency between dogs and cats for similar schedules', () => {
      const dogSchedules = CareScheduleService.getCareSchedulesByPetType('dog')
      const catSchedules = CareScheduleService.getCareSchedulesByPetType('cat')
      
      // Both should have wellness exams
      const dogWellness = dogSchedules.filter(s => s.event_type === 'wellness_exam')
      const catWellness = catSchedules.filter(s => s.event_type === 'wellness_exam')
      
      expect(dogWellness.length).toBeGreaterThan(0)
      expect(catWellness.length).toBeGreaterThan(0)
      
      // Both should start wellness exams at similar ages
      expect(dogWellness[0].start_condition.age_months).toBe(catWellness[0].start_condition.age_months)
      
      // Both should have annual wellness exams
      expect(dogWellness[0].recurrence.interval).toBe(1)
      expect(dogWellness[0].recurrence.unit).toBe('years')
      expect(catWellness[0].recurrence.interval).toBe(1)
      expect(catWellness[0].recurrence.unit).toBe('years')
      
      // Both should have dental care
      const dogDental = dogSchedules.filter(s => s.event_type === 'dental_care')
      const catDental = catSchedules.filter(s => s.event_type === 'dental_care')
      
      expect(dogDental.length).toBeGreaterThan(0)
      expect(catDental.length).toBeGreaterThan(0)
      
      // Both should start dental care at same age
      expect(dogDental[0].start_condition.age_months).toBe(catDental[0].start_condition.age_months)
    })
  })
})