// Care Schedule Initializer for Story 3.1
// Validates and initializes care schedule configuration

import { CareScheduleService } from '../../../../../packages/services/care-schedule-service'
import { getAllCareScheduleRules } from '../../config/care-schedules'

export class CareScheduleInitializer {
  /**
   * Initialize and validate all care schedule rules
   */
  static async initialize(): Promise<{ success: boolean; errors: string[] }> {
    try {
      const allRules = getAllCareScheduleRules()
      const errors: string[] = []
      
      console.log(`Initializing ${allRules.length} care schedule rules...`)
      
      // Validate each rule
      for (const rule of allRules) {
        const validation = CareScheduleService.validateCareScheduleRule(rule)
        if (!validation.valid) {
          errors.push(`Rule ${rule.id}: ${validation.errors.join(', ')}`)
        }
      }
      
      if (errors.length > 0) {
        console.error('Care schedule validation errors:', errors)
        return { success: false, errors }
      }
      
      // Log successful initialization
      const dogRules = allRules.filter(rule => rule.pet_type === 'dog').length
      const catRules = allRules.filter(rule => rule.pet_type === 'cat').length
      
      console.log(`✅ Care schedules initialized successfully:`)
      console.log(`   - ${dogRules} dog care schedule rules`)
      console.log(`   - ${catRules} cat care schedule rules`)
      console.log(`   - ${allRules.length} total rules`)
      
      return { success: true, errors: [] }
    } catch (error) {
      const errorMessage = `Failed to initialize care schedules: ${error}`
      console.error(errorMessage)
      return { success: false, errors: [errorMessage] }
    }
  }
  
  /**
   * Get initialization statistics
   */
  static getInitializationStats() {
    try {
      const allRules = getAllCareScheduleRules()
      
      const stats = {
        total_rules: allRules.length,
        by_pet_type: {
          dog: allRules.filter(rule => rule.pet_type === 'dog').length,
          cat: allRules.filter(rule => rule.pet_type === 'cat').length
        },
        by_event_type: allRules.reduce((acc, rule) => {
          acc[rule.event_type] = (acc[rule.event_type] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        by_priority: allRules.reduce((acc, rule) => {
          acc[rule.priority] = (acc[rule.priority] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        sources: Array.from(new Set(allRules.map(rule => rule.source)))
      }
      
      return stats
    } catch (error) {
      throw new Error(`Failed to get initialization stats: ${error}`)
    }
  }
}