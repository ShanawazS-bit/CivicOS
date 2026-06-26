import {
  buildGeminiCacheKey,
  buildVoiceCacheKey,
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
 * Analyze voice transcript text (uses text fingerprint as cache key).
 */
export async function analyzeVoiceText(
  text: string,
  lat: number,
  lng: number,
  options?: GeminiCacheOptions
): Promise<AnalyzeImageResult> {
  const cacheKey = buildVoiceCacheKey(text, lat, lng)
  return withGeminiCache(
    cacheKey,
    async () => {
      const { data, error } = await supabase.functions.invoke('analyze-image', {
        body: { text, lat, lng, mode: 'voice' },
      })
      if (error) throw error
      if (!data?.analysis) throw new Error('Invalid Gemini voice response')
      return {
        analysis: data.analysis as GeminiAnalysis,
        trust_score: data.trust_score as number,
      }
    },
    options
  )
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
