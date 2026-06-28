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

export function findDemoDigOnceOpportunities(issues: Issue[]): DigOnceOpportunity[] {
  const activeExcavationIssues = issues.filter(
    (issue) => issue.status !== 'resolved' && EXCAVATION_TRIGGER_TYPES.has(issue.issue_type)
  )

  return activeExcavationIssues.slice(0, 3).map((issue, index) => ({
    id: `dig-once-${issue.id}`,
    issue,
    utilityPlan: DEMO_UTILITY_PLANS[index % DEMO_UTILITY_PLANS.length],
    estimatedSavings: index === 0 ? 45000 : 28000,
    distanceMeters: index === 0 ? 12 : 18,
  }))
}
