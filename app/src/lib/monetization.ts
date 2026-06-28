import type { Issue } from '@/types'

export interface UtilityPlan {
  id: string
  companyName: string
  utilityType: string
  plannedStartDate: string
  color: string
  route: Array<{ x: number; y: number; lat: number; lng: number }>
}

export interface DigOnceOpportunity {
  id: string
  issue: Issue
  utilityPlan: UtilityPlan
  estimatedSavings: number
  distanceMeters: number
}

export interface RouteFrictionSample {
  id: string
  label: string
  lat: number
  lng: number
  radiusMeters: number
  frictionIndex: number
  activeHazardsCount: number
  riskFactors: string[]
}

export const EXCAVATION_TRIGGER_TYPES = new Set(['Water Leakage', 'Drainage', 'Pothole'])

export const DEMO_UTILITY_PLANS: UtilityPlan[] = [
  {
    id: 'utility-jio-fiber-core',
    companyName: 'Jio Fiber',
    utilityType: 'Fiber Optic',
    plannedStartDate: '2026-07-08',
    color: '#2563EB',
    route: [
      { x: 8, y: 31, lat: 22.7964, lng: 86.1941 },
      { x: 27, y: 36, lat: 22.7952, lng: 86.1992 },
      { x: 48, y: 44, lat: 22.7939, lng: 86.2047 },
      { x: 68, y: 53, lat: 22.7924, lng: 86.2101 },
      { x: 92, y: 61, lat: 22.7912, lng: 86.2168 },
    ],
  },
  {
    id: 'utility-tata-power-feeder',
    companyName: 'Tata Power',
    utilityType: 'Underground Power',
    plannedStartDate: '2026-07-16',
    color: '#F97316',
    route: [
      { x: 57, y: 8, lat: 22.8081, lng: 86.2075 },
      { x: 54, y: 28, lat: 22.8008, lng: 86.2068 },
      { x: 51, y: 47, lat: 22.7935, lng: 86.2059 },
      { x: 46, y: 68, lat: 22.7864, lng: 86.2047 },
      { x: 42, y: 91, lat: 22.7812, lng: 86.2038 },
    ],
  },
]

export const TRANSIT_FRICTION_SAMPLES: RouteFrictionSample[] = [
  {
    id: 'friction-market-loop',
    label: 'Market Loop Fleet API',
    lat: 22.7934,
    lng: 86.2049,
    radiusMeters: 180,
    frictionIndex: 1.9,
    activeHazardsCount: 3,
    riskFactors: ['Pothole', 'Water Leakage', 'Broken Streetlight'],
  },
  {
    id: 'friction-arterial-bypass',
    label: 'Arterial Bypass Check',
    lat: 22.7991,
    lng: 86.212,
    radiusMeters: 220,
    frictionIndex: 1.3,
    activeHazardsCount: 1,
    riskFactors: ['Waste Accumulation'],
  },
]

function distancePointToLineSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const l2 = (bx - ax) ** 2 + (by - ay) ** 2
  if (l2 === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2)
  let t = ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / l2
  t = Math.max(0, Math.min(1, t))
  const projX = ax + t * (bx - ax)
  const projY = ay + t * (by - ay)
  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2)
}

function computeDistanceMeters(lat: number, lng: number, plan: UtilityPlan): number {
  let minDistance = Infinity
  for (let i = 0; i < plan.route.length - 1; i++) {
    const a = plan.route[i]
    const b = plan.route[i + 1]
    const distDeg = distancePointToLineSegment(lng, lat, a.lng, a.lat, b.lng, b.lat)
    if (distDeg < minDistance) minDistance = distDeg
  }
  return minDistance * 111139 // Roughly 111km per degree
}

export function findDemoDigOnceOpportunities(issues: Issue[]): DigOnceOpportunity[] {
  const activeExcavationIssues = issues.filter(
    (issue) =>
      issue.status !== 'resolved' &&
      EXCAVATION_TRIGGER_TYPES.has(issue.issue_type) &&
      typeof issue.lat === 'number' &&
      typeof issue.lng === 'number'
  )

  const opportunities: DigOnceOpportunity[] = []

  for (const issue of activeExcavationIssues) {
    if (typeof issue.lat !== 'number' || typeof issue.lng !== 'number') continue

    let bestPlan = DEMO_UTILITY_PLANS[0]
    let minDistance = Infinity

    for (const plan of DEMO_UTILITY_PLANS) {
      const dist = computeDistanceMeters(issue.lat, issue.lng, plan)
      if (dist < minDistance) {
        minDistance = dist
        bestPlan = plan
      }
    }

    // Match if within ~200 meters of the utility route
    if (minDistance < 200) {
      opportunities.push({
        id: `dig-once-${issue.id}`,
        issue,
        utilityPlan: bestPlan,
        estimatedSavings: Math.max(5000, Math.round(50000 - minDistance * 100)),
        distanceMeters: Math.round(minDistance),
      })
    }
  }

  // Sort by highest savings (closest distance) and take top 5
  return opportunities.sort((a, b) => b.estimatedSavings - a.estimatedSavings).slice(0, 5)
}
