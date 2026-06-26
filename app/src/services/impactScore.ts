import type { Issue } from '@/types'

export interface ImpactMetrics {
  reportsSubmitted: number
  resolved: number
  verified: number
  impactScore: number
  peopleHelped: number
  highlights: string[]
}

/**
 * Hackathon impact formula from guide.md:
 * Resolved × 10 + Verified × 5 + Confirmations × 2
 */
export function calculateImpact(issues: Issue[], userReports = 0): ImpactMetrics {
  const resolved = issues.filter((i) => i.status === 'resolved')
  const verified = issues.filter(
    (i) => i.status === 'verified' || i.status === 'assigned' || i.status === 'in_progress'
  )

  const impactScore = resolved.length * 10 + verified.length * 5 + resolved.length * 2

  const waterLeaks = resolved.filter((i) =>
    i.issue_type.toLowerCase().includes('water')
  )
  const streetlights = resolved.filter((i) =>
    i.issue_type.toLowerCase().includes('light')
  )
  const potholes = resolved.filter((i) =>
    i.issue_type.toLowerCase().includes('pothole')
  )

  const highlights: string[] = []

  if (waterLeaks.length > 0) {
    highlights.push(
      `Your community fixed ${waterLeaks.length} leak${waterLeaks.length > 1 ? 's' : ''}, saving ~${(waterLeaks.length * 3000).toLocaleString()} liters of clean water.`
    )
  }
  if (streetlights.length > 0) {
    highlights.push(
      `Streetlight repairs illuminated pathways used by ~${streetlights.length * 400} pedestrians nightly.`
    )
  }
  if (potholes.length > 0) {
    highlights.push(
      `Early pothole reports prevented an estimated ${potholes.length * 2} potential accidents.`
    )
  }
  if (highlights.length === 0 && issues.length > 0) {
    highlights.push(
      `${issues.length} issue${issues.length > 1 ? 's' : ''} tracked in your neighborhood — keep reporting to build impact.`
    )
  }
  if (issues.length === 0) {
    highlights.push('Report your first issue to start building community impact.')
  }

  const peopleHelped = resolved.length * 210 + verified.length * 45

  return {
    reportsSubmitted: userReports || issues.length,
    resolved: resolved.length,
    verified: verified.length,
    impactScore,
    peopleHelped,
    highlights,
  }
}

const USER_REPORTS_KEY = 'civicos_user_reports'

export function incrementUserReports(): number {
  const current = parseInt(localStorage.getItem(USER_REPORTS_KEY) ?? '0', 10)
  const next = current + 1
  localStorage.setItem(USER_REPORTS_KEY, String(next))
  return next
}

export function getUserReports(): number {
  return parseInt(localStorage.getItem(USER_REPORTS_KEY) ?? '0', 10)
}
