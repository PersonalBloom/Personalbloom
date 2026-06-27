export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          name: string | null
          auth_mode: 'email' | 'guest'
          school_system: string | null
          subjects: string[]
          plan: 'free' | 'trial' | 'soulplus'
          trial_started_at: string | null
          trial_days: number
          growth_points: number
          streak: number
          last_active: string | null
          total_sessions: number
          heatmap: Json
          achievements: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          name?: string | null
          auth_mode?: 'email' | 'guest'
          school_system?: string | null
          subjects?: string[]
          plan?: 'free' | 'trial' | 'soulplus'
          trial_started_at?: string | null
          trial_days?: number
          growth_points?: number
          streak?: number
          last_active?: string | null
          total_sessions?: number
          heatmap?: Json
          achievements?: string[]
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      quiz_results: {
        Row: {
          id: string
          user_id: string
          subject: string
          correct: number
          total: number
          created_at: string
        }
        Insert: { user_id: string; subject: string; correct: number; total: number }
        Update: never
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          duration_minutes: number
          type: 'pomodoro' | 'focus' | 'quiz' | 'flashcard' | 'game'
          subject: string | null
          created_at: string
        }
        Insert: { user_id: string; duration_minutes: number; type: string; subject?: string | null }
        Update: never
      }
      flashcard_decks: {
        Row: { id: string; user_id: string; title: string; subject: string; created_at: string }
        Insert: { user_id: string; title: string; subject: string }
        Update: { title?: string; subject?: string }
      }
      flashcards: {
        Row: { id: string; deck_id: string; front: string; back: string; created_at: string }
        Insert: { deck_id: string; front: string; back: string }
        Update: { front?: string; back?: string }
      }
    }
  }
}
