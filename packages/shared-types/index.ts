// Shared TypeScript interfaces and types

// Pet-related types
export interface Pet {
  id: string
  created_at: string
  user_id: string
  name: string
  breed: string
  date_of_birth: string
  photo_url?: string
}

// Journal Entry types
export interface JournalEntry {
  id: string
  created_at: string
  user_id: string
  pet_id: string
  content: string
  ai_advice?: string
}

// Event types
export interface Event {
  id: string
  created_at: string
  user_id: string
  pet_id: string
  title: string
  due_date: string
  status: 'pending' | 'completed' | 'missed'
  source: 'manual' | 'automated'
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Health check types
export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'configuration_missing'
  supabase: 'connected' | 'disconnected' | 'not_configured'
  timestamp: string
  error?: string
}

// Care Schedule Types
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