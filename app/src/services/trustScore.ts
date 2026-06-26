/**
 * Hackathon trust score — full geometric mean deferred to post-MVP.
 * See guide.md Layer 2 for production formula.
 */
export function calculateTrustScore(confidence: number, gpsPresent: boolean): number {
  const visual = confidence * 0.7
  const location = gpsPresent ? 20 : 0
  return Math.min(100, Math.round(visual + location))
}

/**
 * Production formula (when reputation + verification ship):
 * S_f = (C_visual × C_location × R_user × V_community) ^ (1/4)
 */
export function calculateFullTrustScore(
  cVisual: number,
  cLocation: number,
  rUser: number,
  vCommunity: number
): number {
  const score = Math.pow(cVisual * cLocation * rUser * vCommunity, 0.25)
  return Math.min(100, Math.round(score * 100))
}
