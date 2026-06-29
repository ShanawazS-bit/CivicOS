import { supabase } from '../lib/supabase'
import { DEMO_ISSUES } from '../data/demoIssues'
import {
  applyGeofenceRiskBoost,
  enrichIssueWithGeofence,
  getGeofenceContext,
} from '@/lib/geofencing'
import type { CreateIssueInput, Issue, IssueStatus, AuditLog } from '../types'

// Store mock audit logs in memory for demo mode
const DEMO_AUDIT_LOGS: AuditLog[] = []

export type DataSource = 'live' | 'demo'

let lastDataSource: DataSource = 'demo'

export function getLastDataSource(): DataSource {
  return lastDataSource
}

export async function checkSupabaseConnection(): Promise<DataSource> {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key || url.includes('placeholder')) {
    lastDataSource = 'demo'
    return 'demo'
  }

  const { error } = await supabase.from('issues').select('id').limit(1)
  lastDataSource = error ? 'demo' : 'live'
  return lastDataSource
}

export async function fetchIssues(): Promise<Issue[]> {
  await checkSupabaseConnection()

  const { data, error } = await supabase.rpc('get_issues_with_coords')

  if (error) {
    const { data: fallback, error: fallbackError } = await supabase
      .from('issues')
      .select('*')
      .order('trust_score', { ascending: false })

    if (fallbackError) {
      lastDataSource = 'demo'
      return DEMO_ISSUES.map(enrichIssueWithGeofence)
    }
    lastDataSource = 'live'
    return ((fallback ?? []) as Issue[]).map(enrichIssueWithGeofence)
  }

  lastDataSource = 'live'
  if (!data || data.length === 0) return DEMO_ISSUES.map(enrichIssueWithGeofence)
  return (data as Issue[]).map(enrichIssueWithGeofence)
}

export async function createIssue(input: CreateIssueInput): Promise<string> {
  const context = getGeofenceContext(input.lat, input.lng)
  if (!context.insideJurisdiction && !input.override_municipality) {
    throw new GeofenceViolationError()
  }

  const trustScore =
    typeof input.spatial_risk_boost === 'number'
      ? input.trust_score
      : applyGeofenceRiskBoost(input.trust_score, context)
  if ((await checkSupabaseConnection()) === 'demo') {
    const id = `local-${Date.now()}`
    DEMO_ISSUES.unshift(
      enrichIssueWithGeofence({
        id,
        created_at: new Date().toISOString(),
        issue_type: input.issue_type,
        severity: input.severity,
        description: input.description,
        status: 'pending',
        trust_score: trustScore,
        confidence: input.confidence,
        image_url: input.image_url ?? null,
        lat: input.lat,
        lng: input.lng,
        override_municipality: input.override_municipality,
        ward_name: input.override_municipality ? input.override_municipality : undefined,
      })
    )
    return id
  }

  const { data, error } = await supabase.rpc('create_issue', {
    p_issue_type: input.issue_type,
    p_severity: input.severity,
    p_description: input.description,
    p_trust_score: trustScore,
    p_confidence: input.confidence,
    p_image_url: input.image_url ?? '',
    p_lat: input.lat,
    p_lng: input.lng,
  })

  if (error) {
    const dupMatch = error.message.match(/DUPLICATE_ISSUE:([a-f0-9-]+)/)
    if (dupMatch) {
      throw new DuplicateIssueError(dupMatch[1])
    }
    if (error.message.includes('OUTSIDE_SERVICE_AREA')) {
      throw new GeofenceViolationError()
    }
    throw error
  }

  return data as string
}

export async function updateIssueStatus(
  issueId: string, 
  status: IssueStatus,
  adminContext?: { id: string; email: string }
): Promise<void> {
  const isDemo = (await checkSupabaseConnection()) === 'demo'
  
  if (isDemo) {
    const issue = DEMO_ISSUES.find((i) => i.id === issueId)
    if (issue) issue.status = status
    
    if (adminContext && (status === 'resolved' || status === 'dismissed')) {
      DEMO_AUDIT_LOGS.push({
        id: `audit-${Date.now()}`,
        issue_id: issueId,
        admin_id: adminContext.id,
        admin_email: adminContext.email,
        action: status,
        created_at: new Date().toISOString()
      })
    }
    return
  }

  const { error } = await supabase
    .from('issues')
    .update({ status })
    .eq('id', issueId)

  if (error) throw error

  if (adminContext && (status === 'resolved' || status === 'dismissed')) {
    await supabase.from('audit_logs').insert({
      issue_id: issueId,
      admin_id: adminContext.id,
      admin_email: adminContext.email,
      action: status
    })
  }
}

export async function fetchAuditLogs(issueId: string): Promise<AuditLog[]> {
  if ((await checkSupabaseConnection()) === 'demo') {
    return DEMO_AUDIT_LOGS.filter(log => log.issue_id === issueId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as AuditLog[]
}

export class DuplicateIssueError extends Error {
  duplicateOf: string

  constructor(duplicateOf: string) {
    super('Issue already reported nearby')
    this.duplicateOf = duplicateOf
    this.name = 'DuplicateIssueError'
  }
}

export class GeofenceViolationError extends Error {
  constructor() {
    super('Report is outside the municipal service boundary')
    this.name = 'GeofenceViolationError'
  }
}

export function subscribeToIssues(onChange: () => void) {
  const channel = supabase
    .channel('issues-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'issues' },
      () => onChange()
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
