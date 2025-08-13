export interface Event {
  id: string
  created_at: string
  user_id: string
  pet_id: string
  title: string
  due_date: string
  status: 'pending' | 'completed' | 'cancelled'
  source?: string
}

export interface EventCreationParams {
  pet_id: string
  title: string
  due_date: string
  source: string
  status?: 'pending' | 'completed' | 'cancelled'
}

export interface EventGenerationResult {
  created: number
  skipped: number
  errors: string[]
}