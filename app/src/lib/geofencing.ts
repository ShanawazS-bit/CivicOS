import type { Issue } from '@/types'

export type GeofenceType = 'boundary' | 'ward' | 'high_risk'

export interface Geofence {
  id: string
  name: string
  fenceType: GeofenceType
  routeLabel?: string
  riskBoost?: number
  coordinates: Array<[number, number]>
}

export interface GeofenceContext {
  insideJurisdiction: boolean
  boundaryName: string | null
  wardId: string | null
  wardName: string | null
  routeLabel: string | null
  highRiskZones: string[]
  riskBoost: number
}

export const CIVIC_GEOFENCES: Geofence[] = [
  {
    id: 'boundary-jamshedpur-core',
    name: 'Jamshedpur Core Service Boundary',
    fenceType: 'boundary',
    coordinates: [
      [86.19, 22.78],
      [86.22, 22.78],
      [86.22, 22.81],
      [86.19, 22.81],
      [86.19, 22.78],
    ],
  },
  {
    id: 'ward-alpha-central',
    name: 'Ward Alpha Central',
    fenceType: 'ward',
    routeLabel: 'Central Roads Desk',
    coordinates: [
      [86.19, 22.78],
      [86.2055, 22.78],
      [86.2055, 22.81],
      [86.19, 22.81],
      [86.19, 22.78],
    ],
  },
  {
    id: 'ward-beta-market',
    name: 'Ward Beta Market Edge',
    fenceType: 'ward',
    routeLabel: 'Market Ward Operations',
    coordinates: [
      [86.2055, 22.78],
      [86.22, 22.78],
      [86.22, 22.81],
      [86.2055, 22.81],
      [86.2055, 22.78],
    ],
  },
  {
    id: 'risk-drainage-grid',
    name: 'Drainage Vulnerability Zone',
    fenceType: 'high_risk',
    riskBoost: 15,
    coordinates: [
      [86.2039, 22.7928],
      [86.2060, 22.7928],
      [86.2060, 22.7944],
      [86.2039, 22.7944],
      [86.2039, 22.7928],
    ],
  },
]

function pointInPolygon(lng: number, lat: number, polygon: Array<[number, number]>): boolean {
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    const intersects = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi

    if (intersects) inside = !inside
  }

  return inside
}

export function getGeofenceContext(lat: number, lng: number): GeofenceContext {
  const boundary = CIVIC_GEOFENCES.find(
    (fence) => fence.fenceType === 'boundary' && pointInPolygon(lng, lat, fence.coordinates)
  )
  const ward = CIVIC_GEOFENCES.find(
    (fence) => fence.fenceType === 'ward' && pointInPolygon(lng, lat, fence.coordinates)
  )
  const highRiskZones = CIVIC_GEOFENCES.filter(
    (fence) => fence.fenceType === 'high_risk' && pointInPolygon(lng, lat, fence.coordinates)
  )
  const riskBoost = highRiskZones.reduce((sum, zone) => sum + (zone.riskBoost ?? 0), 0)

  return {
    insideJurisdiction: Boolean(boundary),
    boundaryName: boundary?.name ?? null,
    wardId: ward?.id ?? null,
    wardName: ward?.name ?? null,
    routeLabel: ward?.routeLabel ?? null,
    highRiskZones: highRiskZones.map((zone) => zone.name),
    riskBoost,
  }
}

export function applyGeofenceRiskBoost(score: number, context: GeofenceContext): number {
  return Math.min(100, score + context.riskBoost)
}

export function enrichIssueWithGeofence(issue: Issue): Issue {
  if (typeof issue.lat !== 'number' || typeof issue.lng !== 'number') return issue

  const context = getGeofenceContext(issue.lat, issue.lng)
  return {
    ...issue,
    ward_id: issue.ward_id ?? context.wardId,
    ward_name: issue.ward_name ?? context.wardName,
    route_label: issue.route_label ?? context.routeLabel,
    inside_jurisdiction: issue.inside_jurisdiction ?? context.insideJurisdiction,
    spatial_risk_boost: issue.spatial_risk_boost ?? context.riskBoost,
    high_risk_zones: issue.high_risk_zones ?? context.highRiskZones,
  }
}

export function geofencesToFeatureCollection(types: GeofenceType[] = ['boundary', 'ward', 'high_risk']) {
  return {
    type: 'FeatureCollection' as const,
    features: CIVIC_GEOFENCES.filter((fence) => types.includes(fence.fenceType)).map((fence) => ({
      type: 'Feature' as const,
      properties: {
        id: fence.id,
        name: fence.name,
        fence_type: fence.fenceType,
        route_label: fence.routeLabel ?? null,
        risk_boost: fence.riskBoost ?? 0,
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [fence.coordinates],
      },
    })),
  }
}
