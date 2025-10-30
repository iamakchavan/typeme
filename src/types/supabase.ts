export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      typing_results: {
        Row: {
          id: string
          user_id: string | null
          wpm: number
          accuracy: number
          test_duration: number
          characters_typed: number
          correct_characters: number
          words_typed: number
          test_type: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          wpm: number
          accuracy: number
          test_duration: number
          characters_typed: number
          correct_characters: number
          words_typed: number
          test_type: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          wpm?: number
          accuracy?: number
          test_duration?: number
          characters_typed?: number
          correct_characters?: number
          words_typed?: number
          test_type?: string
          created_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          email: string | null
          total_tests: number | null
          best_wpm: number | null
          average_wpm: number | null
          total_time_typed: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          username?: string | null
          email?: string | null
          total_tests?: number | null
          best_wpm?: number | null
          average_wpm?: number | null
          total_time_typed?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          email?: string | null
          total_tests?: number | null
          best_wpm?: number | null
          average_wpm?: number | null
          total_time_typed?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}