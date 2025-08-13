// This file contains generated types from Supabase
// Updated for Story 2.1 - Journal Entry Creation & Storage

export type Database = {
  public: {
    Tables: {
      pets: {
        Row: {
          id: string
          created_at: string
          user_id: string
          name: string
          breed: string | null
          date_of_birth: string | null
          photo_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          name: string
          breed?: string | null
          date_of_birth?: string | null
          photo_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          name?: string
          breed?: string | null
          date_of_birth?: string | null
          photo_url?: string | null
        }
      }
      journal_entries: {
        Row: {
          id: string
          created_at: string
          user_id: string
          pet_id: string
          content: string
          ai_advice: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          pet_id: string
          content: string
          ai_advice?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          pet_id?: string
          content?: string
          ai_advice?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Pet = Database['public']['Tables']['pets']['Row']
export type PetInsert = Database['public']['Tables']['pets']['Insert']
export type PetUpdate = Database['public']['Tables']['pets']['Update']

export type JournalEntry = Database['public']['Tables']['journal_entries']['Row']
export type JournalEntryInsert = Database['public']['Tables']['journal_entries']['Insert']
export type JournalEntryUpdate = Database['public']['Tables']['journal_entries']['Update']