import type { Issue } from '@/types'

const CLUSTER_THRESHOLD = 0.001 // ~100m at mid-latitudes

export function detectCluster(issues: Issue[]): boolean {
  if (issues.length < 3) return false

  for (let i = 0; i < issues.length; i++) {
    let nearby = 0
    for (let j = 0; j < issues.length; j++) {
      if (i === j) continue
      const latDiff = Math.abs((issues[i].lat ?? 0) - (issues[j].lat ?? 0))
      const lngDiff = Math.abs((issues[i].lng ?? 0) - (issues[j].lng ?? 0))
      if (latDiff < CLUSTER_THRESHOLD && lngDiff < CLUSTER_THRESHOLD) nearby++
    }
    if (nearby >= 2) return true
  }
  return false
}

export function getClusterCenter(issues: Issue[]): { lat: number; lng: number } | null {
  if (!detectCluster(issues)) return null

  for (let i = 0; i < issues.length; i++) {
    const cluster: Issue[] = [issues[i]]
    for (let j = 0; j < issues.length; j++) {
      if (i === j) continue
      const latDiff = Math.abs((issues[i].lat ?? 0) - (issues[j].lat ?? 0))
      const lngDiff = Math.abs((issues[i].lng ?? 0) - (issues[j].lng ?? 0))
      if (latDiff < CLUSTER_THRESHOLD && lngDiff < CLUSTER_THRESHOLD) {
        cluster.push(issues[j])
      }
    }
    if (cluster.length >= 3) {
      const lat = cluster.reduce((s, c) => s + (c.lat ?? 0), 0) / cluster.length
      const lng = cluster.reduce((s, c) => s + (c.lng ?? 0), 0) / cluster.length
      return { lat, lng }
    }
  }
  return null
}
