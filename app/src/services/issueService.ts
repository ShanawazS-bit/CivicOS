import { supabase } from '../lib/supabase'
import { DEMO_ISSUES } from '../data/demoIssues'
import {
  applyGeofenceRiskBoost,
  enrichIssueWithGeofence,
  getGeofenceContext,
} from '@/lib/geofencing'
import type { CreateIssueInput, Issue } from '../types'

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
  if (!context.insideJurisdiction) {
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

export async function updateIssueStatus(issueId: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('issues')
    .update({ status })
    .eq('id', issueId)

  if (error) throw error
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
