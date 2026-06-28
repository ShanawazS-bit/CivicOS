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

export function generatePredictedCorridors(issues: Issue[], referenceIssues?: Issue[]): UtilityPlan[] {
  const refIssues = referenceIssues && referenceIssues.length > 0 ? referenceIssues : issues;
  const lats = refIssues.map(i => i.lat).filter((l): l is number => typeof l === 'number');
  const lngs = refIssues.map(i => i.lng).filter((l): l is number => typeof l === 'number');
  
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

  const findDensestCluster = (points: {lat: number, lng: number}[], radiusDeg = 0.006) => {
    if (points.length < 3) return points;
    let bestCluster: {lat: number, lng: number}[] = [];
    
    for (let i = 0; i < points.length; i++) {
      const center = points[i];
      const cluster = [center];
      for (let j = 0; j < points.length; j++) {
        if (i === j) continue;
        const p = points[j];
        const dist = Math.sqrt((p.lat - center.lat)**2 + (p.lng - center.lng)**2);
        if (dist <= radiusDeg) {
          cluster.push(p);
        }
      }
      if (cluster.length > bestCluster.length) {
        bestCluster = cluster;
      }
    }
    return bestCluster.length >= 3 ? bestCluster : points;
  }

  const calculateRoute = (allPoints: {lat: number, lng: number}[]) => {
    const points = findDensestCluster(allPoints, 0.008); // roughly 900m radius
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
      
      const padding = (maxLng - minLng) * 0.15;
      const startLng = minLng - padding;
      const endLng = maxLng + padding;
      
      return [
        { lng: startLng, lat: m * startLng + b, ...projectToSvg(m * startLng + b, startLng) },
        { lng: endLng, lat: m * endLng + b, ...projectToSvg(m * endLng + b, endLng) }
      ];
    }
  }

  const groups = new Map<string, {lat: number, lng: number}[]>();
  for (const issue of issues) {
    if (typeof issue.lat === 'number' && typeof issue.lng === 'number') {
      const type = issue.issue_type;
      if (!groups.has(type)) groups.set(type, []);
      groups.get(type)!.push({ lat: issue.lat, lng: issue.lng });
    }
  }

  const sortedGroups = Array.from(groups.entries())
    .filter(([_, points]) => points.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3); // Max 3 corridors

  const plans: UtilityPlan[] = [];
  const colors = ['#2563EB', '#F97316', '#10B981']; // Blue, Orange, Green

  const getCompanyName = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('water') || t.includes('drain')) return 'City Water Board';
    if (t.includes('light') || t.includes('power') || t.includes('electric')) return 'Tata Power';
    if (t.includes('pothole') || t.includes('road') || t.includes('street')) return 'Dept of Transport';
    if (t.includes('waste') || t.includes('dump') || t.includes('trash')) return 'Sanitation Dept';
    return 'Municipal Works';
  };

  for (let i = 0; i < sortedGroups.length; i++) {
    const [type, points] = sortedGroups[i];
    const route = calculateRoute(points);
    if (route.length > 0) {
      plans.push({
        id: `utility-prediction-${type.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        companyName: getCompanyName(type),
        utilityType: `AI Predicted ${type} Corridor`,
        plannedStartDate: new Date().toISOString().split('T')[0],
        color: colors[i % colors.length],
        route
      });
    }
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
