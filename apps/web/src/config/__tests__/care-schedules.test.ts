// Unit tests for care schedules configuration - Story 3.1

import { 
  CARE_SCHEDULE_TEMPLATES, 
  getCareSchedulesForPetType,
  getAllCareScheduleRules 
} from '../care-schedules'

describe('Care Schedules Configuration', () => {
  test('CARE_SCHEDULE_TEMPLATES should have dog and cat templates', () => {
    expect(CARE_SCHEDULE_TEMPLATES).toBeDefined()
    expect(CARE_SCHEDULE_TEMPLATES.dog).toBeDefined()
    expect(CARE_SCHEDULE_TEMPLATES.cat).toBeDefined()
    
    expect(CARE_SCHEDULE_TEMPLATES.dog.pet_type).toBe('dog')
    expect(CARE_SCHEDULE_TEMPLATES.cat.pet_type).toBe('cat')
  })
  
  test('Dog schedules should include essential care items', () => {
    const dogSchedules = CARE_SCHEDULE_TEMPLATES.dog.schedules
    
    expect(dogSchedules.length).toBeGreaterThan(0)
    
    // Should have vaccination schedules
    const vaccinations = dogSchedules.filter(s => s.event_type === 'vaccination')
    expect(vaccinations.length).toBeGreaterThan(0)
    
    // Should have wellness exam
    const wellness = dogSchedules.filter(s => s.event_type === 'wellness_exam')
    expect(wellness.length).toBeGreaterThan(0)
    
    // Should have parasite prevention
    const parasite = dogSchedules.filter(s => s.event_type === 'parasite_prevention')
    expect(parasite.length).toBeGreaterThan(0)
    
    // Should have dental care
    const dental = dogSchedules.filter(s => s.event_type === 'dental_care')
    expect(dental.length).toBeGreaterThan(0)
  })
  
  test('Cat schedules should include essential care items', () => {
    const catSchedules = CARE_SCHEDULE_TEMPLATES.cat.schedules
    
    expect(catSchedules.length).toBeGreaterThan(0)
    
    // Should have vaccination schedules
    const vaccinations = catSchedules.filter(s => s.event_type === 'vaccination')
    expect(vaccinations.length).toBeGreaterThan(0)
    
    // Should have wellness exam
    const wellness = catSchedules.filter(s => s.event_type === 'wellness_exam')
    expect(wellness.length).toBeGreaterThan(0)
    
    // Should have parasite prevention
    const parasite = catSchedules.filter(s => s.event_type === 'parasite_prevention')
    expect(parasite.length).toBeGreaterThan(0)
    
    // Should have dental care
    const dental = catSchedules.filter(s => s.event_type === 'dental_care')
    expect(dental.length).toBeGreaterThan(0)
  })
  
  test('getCareSchedulesForPetType should return correct schedules', () => {
    const dogSchedules = getCareSchedulesForPetType('dog')
    const catSchedules = getCareSchedulesForPetType('cat')
    
    expect(dogSchedules.pet_type).toBe('dog')
    expect(catSchedules.pet_type).toBe('cat')
    
    expect(dogSchedules.schedules.length).toBeGreaterThan(0)
    expect(catSchedules.schedules.length).toBeGreaterThan(0)
    
    // All dog schedules should be for dogs
    dogSchedules.schedules.forEach(schedule => {
      expect(schedule.pet_type).toBe('dog')
    })
    
    // All cat schedules should be for cats
    catSchedules.schedules.forEach(schedule => {
      expect(schedule.pet_type).toBe('cat')
    })
  })
  
  test('getAllCareScheduleRules should return all rules', () => {
    const allRules = getAllCareScheduleRules()
    
    expect(Array.isArray(allRules)).toBe(true)
    expect(allRules.length).toBeGreaterThan(0)
    
    // Should include both dog and cat rules
    const dogRules = allRules.filter(rule => rule.pet_type === 'dog')
    const catRules = allRules.filter(rule => rule.pet_type === 'cat')
    
    expect(dogRules.length).toBeGreaterThan(0)
    expect(catRules.length).toBeGreaterThan(0)
    expect(dogRules.length + catRules.length).toBe(allRules.length)
  })
  
  test('All schedule rules should have valid structure', () => {
    const allRules = getAllCareScheduleRules()
    
    allRules.forEach(rule => {
      // Required fields
      expect(rule.id).toBeTruthy()
      expect(rule.name).toBeTruthy()
      expect(rule.description).toBeTruthy()
      expect(['dog', 'cat']).toContain(rule.pet_type)
      expect(['vaccination', 'wellness_exam', 'parasite_prevention', 'dental_care', 'grooming']).toContain(rule.event_type)
      
      // Start condition
      expect(rule.start_condition).toBeDefined()
      
      // Recurrence
      expect(rule.recurrence).toBeDefined()
      expect(rule.recurrence.interval).toBeGreaterThan(0)
      expect(['days', 'weeks', 'months', 'years']).toContain(rule.recurrence.unit)
      
      // Priority
      expect(['high', 'medium', 'low']).toContain(rule.priority)
      
      // Source
      expect(rule.source).toBeTruthy()
      
      // Timestamps
      expect(rule.created_at).toBeTruthy()
      expect(rule.updated_at).toBeTruthy()
    })
  })
  
  test('Schedule IDs should be unique', () => {
    const allRules = getAllCareScheduleRules()
    const ids = allRules.map(rule => rule.id)
    const uniqueIds = new Set(ids)
    
    expect(uniqueIds.size).toBe(ids.length)
  })
  
  test('Should have veterinary source attribution', () => {
    const allRules = getAllCareScheduleRules()
    
    // All rules should have a source
    allRules.forEach(rule => {
      expect(rule.source).toBeTruthy()
      expect(typeof rule.source).toBe('string')
      expect(rule.source.length).toBeGreaterThan(0)
    })
    
    // Should include recognized veterinary sources
    const sources = Array.from(new Set(allRules.map(rule => rule.source)))
    const hasVeterinarySource = sources.some(source => 
      source.includes('AVMA') || 
      source.includes('veterinary') ||
      source.includes('Heartworm')
    )
    
    expect(hasVeterinarySource).toBe(true)
  })
})