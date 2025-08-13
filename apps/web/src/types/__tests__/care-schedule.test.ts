// Unit tests for care schedule types - Story 3.1

import { 
  PetType, 
  CareEventType, 
  RecurrenceUnit, 
  CareScheduleRule,
  GeneratedCareEvent 
} from '../care-schedule'

describe('Care Schedule Types', () => {
  test('PetType should allow dog and cat', () => {
    const dogType: PetType = 'dog'
    const catType: PetType = 'cat'
    
    expect(dogType).toBe('dog')
    expect(catType).toBe('cat')
  })
  
  test('CareEventType should include all expected types', () => {
    const vaccination: CareEventType = 'vaccination'
    const wellness: CareEventType = 'wellness_exam'
    const parasite: CareEventType = 'parasite_prevention'
    const dental: CareEventType = 'dental_care'
    const grooming: CareEventType = 'grooming'
    
    expect(vaccination).toBe('vaccination')
    expect(wellness).toBe('wellness_exam')
    expect(parasite).toBe('parasite_prevention')
    expect(dental).toBe('dental_care')
    expect(grooming).toBe('grooming')
  })
  
  test('RecurrenceUnit should include time units', () => {
    const days: RecurrenceUnit = 'days'
    const weeks: RecurrenceUnit = 'weeks'
    const months: RecurrenceUnit = 'months'
    const years: RecurrenceUnit = 'years'
    
    expect(days).toBe('days')
    expect(weeks).toBe('weeks')
    expect(months).toBe('months')
    expect(years).toBe('years')
  })
  
  test('CareScheduleRule should have proper structure', () => {
    const rule: CareScheduleRule = {
      id: 'test-rule',
      name: 'Test Rule',
      description: 'Test description',
      pet_type: 'dog',
      event_type: 'vaccination',
      start_condition: {
        age_months: 2
      },
      recurrence: {
        interval: 1,
        unit: 'months'
      },
      priority: 'high',
      source: 'Test source',
      created_at: '2024-07-28T00:00:00.000Z',
      updated_at: '2024-07-28T00:00:00.000Z'
    }
    
    expect(rule.id).toBe('test-rule')
    expect(rule.pet_type).toBe('dog')
    expect(rule.event_type).toBe('vaccination')
    expect(rule.recurrence.interval).toBe(1)
    expect(rule.recurrence.unit).toBe('months')
  })
  
  test('GeneratedCareEvent should have proper structure', () => {
    const event: GeneratedCareEvent = {
      title: 'Test Event',
      description: 'Test description',
      due_date: '2024-08-01T00:00:00.000Z',
      event_type: 'vaccination',
      schedule_rule_id: 'test-rule',
      pet_id: 'pet-123',
      priority: 'high'
    }
    
    expect(event.title).toBe('Test Event')
    expect(event.pet_id).toBe('pet-123')
    expect(event.event_type).toBe('vaccination')
    expect(event.priority).toBe('high')
  })
})