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
      issues: {
        Row: {
          id: string
          created_at: string
          issue_type: string
          severity: string
          description: string | null
          status: string
          trust_score: number
          confidence: number | null
          image_url: string | null
          location: unknown
          ward_id: string | null
          inside_jurisdiction: boolean | null
          spatial_risk_boost: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          issue_type: string
          severity: string
          description?: string | null
          status?: string
          trust_score?: number
          confidence?: number | null
          image_url?: string | null
          location: unknown
          ward_id?: string | null
          inside_jurisdiction?: boolean | null
          spatial_risk_boost?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          issue_type?: string
          severity?: string
          description?: string | null
          status?: string
          trust_score?: number
          confidence?: number | null
          image_url?: string | null
          location?: unknown
          ward_id?: string | null
          inside_jurisdiction?: boolean | null
          spatial_risk_boost?: number | null
        }
      }
      geofences: {
        Row: {
          id: string
          name: string
          fence_type: string
          metadata: Json
          polygon: unknown
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          fence_type: string
          metadata?: Json
          polygon: unknown
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          fence_type?: string
          metadata?: Json
          polygon?: unknown
          created_at?: string
        }
      }
    }
    Functions: {
      check_duplicate_issue: {
        Args: {
          incoming_type: string
          incoming_lng: number
          incoming_lat: number
        }
        Returns: string | null
      }
      create_issue: {
        Args: {
          p_issue_type: string
          p_severity: string
          p_description: string
          p_trust_score: number
          p_confidence: number
          p_image_url: string
          p_lat: number
          p_lng: number
        }
        Returns: string
      }
      is_within_service_area: {
        Args: {
          lat: number
          lng: number
        }
        Returns: boolean
      }
    }
  }
}
