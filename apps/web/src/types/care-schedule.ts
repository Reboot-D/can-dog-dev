// Care Schedule Types for Story 3.1
// Defines standardized pet care schedules for generating events

export type PetType = 'dog' | 'cat'

export type CareEventType = 
  | 'vaccination'
  | 'wellness_exam'
  | 'parasite_prevention'
  | 'dental_care'
  | 'grooming'

export type RecurrenceUnit = 'days' | 'weeks' | 'months' | 'years'

export interface RecurrenceRule {
  interval: number
  unit: RecurrenceUnit
  // Optional: specific conditions for when to apply the rule
  conditions?: {
    age_min_months?: number
    age_max_months?: number
    breed_specific?: string[]
  }
}

export interface CareScheduleRule {
  id: string
  name: string
  description: string
  pet_type: PetType
  event_type: CareEventType
  
  // When to start this care schedule
  start_condition: {
    age_months?: number
    event_trigger?: 'adoption' | 'birth' | 'first_visit'
  }
  
  // How often to repeat
  recurrence: RecurrenceRule
  
  // Optional: when to stop the recurring schedule
  end_condition?: {
    age_months?: number
    max_occurrences?: number
  }
  
  // Metadata
  priority: 'high' | 'medium' | 'low'
  source: string // veterinary source
  created_at: string
  updated_at: string
}

export interface CareScheduleTemplate {
  pet_type: PetType
  schedules: CareScheduleRule[]
}

// For generating specific events from schedule rules
export interface GeneratedCareEvent {
  title: string
  description: string
  due_date: string
  event_type: CareEventType
  schedule_rule_id: string
  pet_id: string
  priority: 'high' | 'medium' | 'low'
}