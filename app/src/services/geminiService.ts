import {
  buildGeminiCacheKey,
  clearGeminiCache,
  getCachedGeminiResponse,
  getGeminiCacheStats,
  putGeminiCache,
  withGeminiCache,
  type GeminiAnalyzeResult,
  type GeminiCacheOptions,
} from '@/lib/geminiCache'
import { supabase } from '@/lib/supabase'
import { calculateTrustScore } from '@/services/trustScore'
import type { GeminiAnalysis } from '@/types'

export type AnalyzeImageResult = GeminiAnalyzeResult & { fromCache: boolean }

async function invokeGeminiEdge(
  imageBase64: string,
  lat: number,
  lng: number
): Promise<GeminiAnalyzeResult> {
  const { data, error } = await supabase.functions.invoke('analyze-image', {
    body: { image: imageBase64, lat, lng },
  })

  if (error) throw error
  if (!data?.analysis) throw new Error('Invalid Gemini response')

  return {
    analysis: data.analysis as GeminiAnalysis,
    trust_score: data.trust_score as number,
  }
}

/**
 * Analyze a civic image via Gemini.
 * localStorage is checked first — repeat uploads / page refreshes skip the network.
 */
export async function analyzeImage(
  imageBase64: string,
  lat: number,
  lng: number,
  options?: GeminiCacheOptions
): Promise<AnalyzeImageResult> {
  const cacheKey = buildGeminiCacheKey(imageBase64, lat, lng)
  return withGeminiCache(cacheKey, () => invokeGeminiEdge(imageBase64, lat, lng), options)
}

/**
 * Analyze voice transcript text via keyword matching — works fully offline,
 * no Supabase edge function required.
 */
export async function analyzeVoiceText(
  text: string,
  _lat: number,
  _lng: number,
  _options?: GeminiCacheOptions
): Promise<AnalyzeImageResult> {
  const lower = text.toLowerCase()

  // Issue type detection via keywords
  let issue_type = 'General Issue'
  if (/pothole|crater|hole|road damage|broken road/.test(lower)) issue_type = 'Pothole'
  else if (/flood|water|drain|drainage|sewage|overflow/.test(lower)) issue_type = 'Flooding / Drainage'
  else if (/light|streetlight|lamp|dark|electricity|power/.test(lower)) issue_type = 'Broken Streetlight'
  else if (/garbage|trash|waste|litter|dump|rubbish/.test(lower)) issue_type = 'Garbage / Waste'
  else if (/crack|pavement|footpath|sidewalk|broken|damage/.test(lower)) issue_type = 'Road / Pavement Damage'
  else if (/tree|branch|fallen|block/.test(lower)) issue_type = 'Fallen Tree / Obstruction'
  else if (/wall|building|structure|collapse/.test(lower)) issue_type = 'Structural Damage'
  else if (/water supply|pipe|leak|burst/.test(lower)) issue_type = 'Water Supply Issue'

  // Severity detection via keywords
  let severity = 'Medium'
  if (/urgent|critical|dangerous|emergency|severe|major|bad/.test(lower)) severity = 'High'
  else if (/minor|small|little|slight|not bad/.test(lower)) severity = 'Low'

  // Confidence based on how specific the transcript is
  const wordCount = text.split(' ').filter(Boolean).length
  const confidence_score = Math.min(90, 50 + wordCount * 3)

  const analysis: GeminiAnalysis = {
    issue_type,
    severity,
    description: text.charAt(0).toUpperCase() + text.slice(1),
    confidence_score,
  }

  const trust_score = calculateTrustScore(confidence_score, true)

  return {
    analysis,
    trust_score,
    fromCache: false,
  }
}

/** Synchronous peek — use to skip loading UI when cache exists. */
export function peekImageAnalysis(
  imageBase64: string,
  lat: number,
  lng: number
): GeminiAnalyzeResult | null {
  return getCachedGeminiResponse(buildGeminiCacheKey(imageBase64, lat, lng))
}

/** Dev / offline fallback — also written to cache so re-tests are instant. */
export function getDevFallbackAnalysis(
  imageBase64: string,
  lat: number,
  lng: number,
  gpsPresent = true
): AnalyzeImageResult {
  const analysis: GeminiAnalysis = {
    issue_type: 'Pothole',
    severity: 'High',
    description: 'Large pothole occupying significant lane width.',
    confidence_score: 92,
  }
  const result: GeminiAnalyzeResult = {
    analysis,
    trust_score: calculateTrustScore(analysis.confidence_score, gpsPresent),
  }
  putGeminiCache(imageBase64, lat, lng, result)
  return { ...result, fromCache: false }
}

export { clearGeminiCache, getGeminiCacheStats, putGeminiCache }
