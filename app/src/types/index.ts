export type IssueStatus = 'pending' | 'verified' | 'assigned' | 'in_progress' | 'resolved'

export type IssueSeverity = 'Low' | 'Medium' | 'High' | 'low' | 'medium' | 'high'

export interface Issue {
  id: string
  created_at: string
  issue_type: string
  severity: string
  description: string | null
  status: IssueStatus
  trust_score: number
  confidence: number | null
  image_url: string | null
  lat?: number
  lng?: number
  ward_id?: string | null
  ward_name?: string | null
  route_label?: string | null
  inside_jurisdiction?: boolean | null
  spatial_risk_boost?: number | null
  high_risk_zones?: string[] | null
}

export interface GeminiAnalysis {
  issue_type: string
  severity: string
  description: string
  confidence_score: number
}

export interface CreateIssueInput {
  issue_type: string
  severity: string
  description: string
  trust_score: number
  confidence: number
  image_url?: string
  lat: number
  lng: number
  spatial_risk_boost?: number
}

export interface DuplicateIssueError {
  duplicate_of: string
  message: string
}
