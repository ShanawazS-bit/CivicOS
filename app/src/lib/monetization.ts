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

export function generatePredictedCorridors(issues: Issue[]): UtilityPlan[] {
  const drainagePoints = issues.filter(i => i.issue_type.toLowerCase() === 'drainage' && i.lat && i.lng).map(i => ({lat: i.lat as number, lng: i.lng as number}));
  const leakagePoints = issues.filter(i => i.issue_type.toLowerCase() === 'water leakage' && i.lat && i.lng).map(i => ({lat: i.lat as number, lng: i.lng as number}));

  const lats = issues.map(i => i.lat).filter((l): l is number => typeof l === 'number');
  const lngs = issues.map(i => i.lng).filter((l): l is number => typeof l === 'number');
  
  if (lats.length < 2 || lngs.length < 2) return [];

  const bounds = {
    latMin: Math.min(...lats),
    latMax: Math.max(...lats),
    lngMin: Math.min(...lngs),
    lngMax: Math.max(...lngs)
  };

  const projectToSvg = (lat: number, lng: number) => {
    const x = bounds.lngMax === bounds.lngMin ? 50 : 16 + ((lng - bounds.lngMin) / (bounds.lngMax - bounds.lngMin)) * 68
    const y = bounds.latMax === bounds.latMin ? 50 : 82 - ((lat - bounds.latMin) / (bounds.latMax - bounds.latMin)) * 64
    return { x, y }
  }

  const calculateRoute = (points: {lat: number, lng: number}[]) => {
    if (points.length < 2) return [];

    let sumX = 0, sumY = 0;
    for (const p of points) { sumX += p.lng; sumY += p.lat; }
    const meanX = sumX / points.length;
    const meanY = sumY / points.length;

    let num = 0, den = 0;
    for (const p of points) {
      num += (p.lng - meanX) * (p.lat - meanY);
      den += (p.lng - meanX) ** 2;
    }

    if (den === 0) {
      const minLat = Math.min(...points.map(p => p.lat));
      const maxLat = Math.max(...points.map(p => p.lat));
      return [
        { lng: meanX, lat: minLat, ...projectToSvg(minLat, meanX) },
        { lng: meanX, lat: maxLat, ...projectToSvg(maxLat, meanX) }
      ];
    } else {
      const m = num / den;
      const b = meanY - m * meanX;
      const minLng = Math.min(...points.map(p => p.lng));
      const maxLng = Math.max(...points.map(p => p.lng));
      
      const padding = (maxLng - minLng) * 0.1;
      const startLng = minLng - padding;
      const endLng = maxLng + padding;
      
      return [
        { lng: startLng, lat: m * startLng + b, ...projectToSvg(m * startLng + b, startLng) },
        { lng: endLng, lat: m * endLng + b, ...projectToSvg(m * endLng + b, endLng) }
      ];
    }
  }

  const plans: UtilityPlan[] = [];

  if (drainagePoints.length >= 2) {
    plans.push({
      id: 'utility-drainage-prediction',
      companyName: 'Jio Fiber',
      utilityType: 'AI Recommended Fiber Route',
      plannedStartDate: new Date().toISOString().split('T')[0],
      color: '#2563EB',
      route: calculateRoute(drainagePoints)
    });
  }

  if (leakagePoints.length >= 2) {
    plans.push({
      id: 'utility-water-prediction',
      companyName: 'Tata Power',
      utilityType: 'AI Recommended Power Feeder',
      plannedStartDate: new Date().toISOString().split('T')[0],
      color: '#F97316',
      route: calculateRoute(leakagePoints)
    });
  }

  return plans;
}

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

export function findDigOnceOpportunities(issues: Issue[], plans: UtilityPlan[]): DigOnceOpportunity[] {
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
    if (plans.length === 0) continue

    let bestPlan = plans[0]
    let minDistance = Infinity

    for (const plan of plans) {
      if (plan.route.length < 2) continue
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
