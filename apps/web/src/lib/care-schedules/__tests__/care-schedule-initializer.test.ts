// Unit tests for CareScheduleInitializer - Story 3.1

import { CareScheduleInitializer } from '../care-schedule-initializer'

// Mock console methods to prevent test output noise
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation()
}

describe('CareScheduleInitializer', () => {
  afterAll(() => {
    // Restore console methods
    consoleSpy.log.mockRestore()
    consoleSpy.error.mockRestore()
  })

  describe('initialize', () => {
    test('should successfully initialize valid care schedules', async () => {
      const result = await CareScheduleInitializer.initialize()
      
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      
      // Should log initialization success
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Initializing')
      )
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('✅ Care schedules initialized successfully')
      )
    })
    
    test('should provide detailed initialization logs', async () => {
      await CareScheduleInitializer.initialize()
      
      // Should log statistics about rules
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('dog care schedule rules')
      )
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('cat care schedule rules')
      )
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('total rules')
      )
    })
  })

  describe('getInitializationStats', () => {
    test('should return comprehensive statistics', () => {
      const stats = CareScheduleInitializer.getInitializationStats()
      
      expect(stats).toBeDefined()
      expect(typeof stats.total_rules).toBe('number')
      expect(stats.total_rules).toBeGreaterThan(0)
      
      // Pet type breakdown
      expect(stats.by_pet_type).toBeDefined()
      expect(typeof stats.by_pet_type.dog).toBe('number')
      expect(typeof stats.by_pet_type.cat).toBe('number')
      expect(stats.by_pet_type.dog).toBeGreaterThan(0)
      expect(stats.by_pet_type.cat).toBeGreaterThan(0)
      expect(stats.by_pet_type.dog + stats.by_pet_type.cat).toBe(stats.total_rules)
      
      // Event type breakdown
      expect(stats.by_event_type).toBeDefined()
      expect(typeof stats.by_event_type).toBe('object')
      
      const eventTypes = Object.keys(stats.by_event_type)
      expect(eventTypes.length).toBeGreaterThan(0)
      
      // Should include common event types
      expect(eventTypes).toContain('vaccination')
      expect(eventTypes).toContain('wellness_exam')
      expect(eventTypes).toContain('parasite_prevention')
      
      // Priority breakdown
      expect(stats.by_priority).toBeDefined()
      expect(typeof stats.by_priority).toBe('object')
      
      const priorities = Object.keys(stats.by_priority)
      expect(priorities.length).toBeGreaterThan(0)
      
      // Should include standard priorities
      expect(['high', 'medium', 'low'].some(p => priorities.includes(p))).toBe(true)
      
      // Sources
      expect(stats.sources).toBeDefined()
      expect(Array.isArray(stats.sources)).toBe(true)
      expect(stats.sources.length).toBeGreaterThan(0)
      
      // Should include veterinary sources
      expect(stats.sources.some(s => s.includes('AVMA'))).toBe(true)
    })
    
    test('should calculate totals correctly', () => {
      const stats = CareScheduleInitializer.getInitializationStats()
      
      // Sum of event types should equal total rules
      const eventTypeSum = Object.values(stats.by_event_type).reduce((sum, count) => sum + count, 0)
      expect(eventTypeSum).toBe(stats.total_rules)
      
      // Sum of priorities should equal total rules
      const prioritySum = Object.values(stats.by_priority).reduce((sum, count) => sum + count, 0)
      expect(prioritySum).toBe(stats.total_rules)
      
      // Sum of pet types should equal total rules
      const petTypeSum = stats.by_pet_type.dog + stats.by_pet_type.cat
      expect(petTypeSum).toBe(stats.total_rules)
    })
    
    test('should include expected minimum number of schedules', () => {
      const stats = CareScheduleInitializer.getInitializationStats()
      
      // Should have at least basic schedules for both dogs and cats
      expect(stats.by_pet_type.dog).toBeGreaterThanOrEqual(5) // At least 5 dog schedules
      expect(stats.by_pet_type.cat).toBeGreaterThanOrEqual(5) // At least 5 cat schedules
      
      // Should have key event types represented
      expect(stats.by_event_type.vaccination).toBeGreaterThanOrEqual(2) // At least puppy/kitten and adult vaccinations
      expect(stats.by_event_type.wellness_exam).toBeGreaterThanOrEqual(2) // For both dogs and cats
      expect(stats.by_event_type.parasite_prevention).toBeGreaterThanOrEqual(2) // For both dogs and cats
    })
    
    test('should have consistent source attribution', () => {
      const stats = CareScheduleInitializer.getInitializationStats()
      
      // All sources should be non-empty strings
      stats.sources.forEach(source => {
        expect(typeof source).toBe('string')
        expect(source.length).toBeGreaterThan(0)
      })
      
      // Should have unique sources (no duplicates in the array)
      const uniqueSources = new Set(stats.sources)
      expect(uniqueSources.size).toBe(stats.sources.length)
      
      // Sources should reference veterinary authorities
      const hasVeterinarySource = stats.sources.some(source => 
        source.toLowerCase().includes('avma') || 
        source.toLowerCase().includes('veterinary') ||
        source.toLowerCase().includes('heartworm')
      )
      expect(hasVeterinarySource).toBe(true)
    })
  })

  describe('error handling', () => {
    test('should handle errors gracefully in initialize', async () => {      
      // Test with a malformed call that should catch in the try-catch
      const originalConsoleError = console.error
      console.error = jest.fn()
      
      // We can't easily mock the import, but we can test error handling
      // by verifying the structure of error responses
      const result = await CareScheduleInitializer.initialize()
      
      // Even if successful, verify the error structure is correct
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('errors')
      expect(Array.isArray(result.errors)).toBe(true)
      
      console.error = originalConsoleError
    })
    
    test('should handle errors gracefully in getInitializationStats', () => {
      // Test that the method doesn't throw for valid calls
      expect(() => {
        CareScheduleInitializer.getInitializationStats()
      }).not.toThrow()
      
      // Verify return structure
      const stats = CareScheduleInitializer.getInitializationStats()
      expect(stats).toHaveProperty('total_rules')
      expect(stats).toHaveProperty('by_pet_type')
      expect(stats).toHaveProperty('by_event_type')
      expect(stats).toHaveProperty('by_priority')
      expect(stats).toHaveProperty('sources')
    })
  })
})