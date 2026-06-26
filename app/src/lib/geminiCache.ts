import type { GeminiAnalysis } from '@/types'

const CACHE_PREFIX = 'civicos:gemini:'
const MAX_ENTRIES = 30
const TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface GeminiAnalyzeResult {
  analysis: GeminiAnalysis
  trust_score: number
}

interface CacheEntry {
  result: GeminiAnalyzeResult
  cachedAt: number
}

export interface GeminiCacheOptions {
  enabled?: boolean
  ttlMs?: number
  forceRefresh?: boolean
}

function isCacheEnabled(options?: GeminiCacheOptions): boolean {
  if (options?.forceRefresh) return false
  if (options?.enabled != null) return options.enabled
  // On by default in dev; disable with VITE_GEMINI_CACHE=false
  return import.meta.env.VITE_GEMINI_CACHE !== 'false'
}

/** Fingerprint image + coords — avoids storing full base64 in the key. */
export function buildGeminiCacheKey(
  imageBase64: string,
  lat: number,
  lng: number
): string {
  const sample = imageBase64.slice(0, 2048) + imageBase64.slice(-512)
  const coords = `${lat.toFixed(4)},${lng.toFixed(4)}`
  return `${hashString(sample)}:${hashString(coords)}`
}

export function buildVoiceCacheKey(text: string, lat: number, lng: number): string {
  const normalized = text.trim().toLowerCase()
  return `voice:${hashString(normalized)}:${lat.toFixed(4)},${lng.toFixed(4)}`
}

function hashString(value: string): string {
  let hash = 5381
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i)
  }
  return (hash >>> 0).toString(36)
}

function storageKey(cacheKey: string): string {
  return `${CACHE_PREFIX}${cacheKey}`
}

export function getCachedGeminiResponse(
  cacheKey: string,
  ttlMs = TTL_MS
): GeminiAnalyzeResult | null {
  try {
    const raw = localStorage.getItem(storageKey(cacheKey))
    if (!raw) return null

    const entry = JSON.parse(raw) as CacheEntry
    if (Date.now() - entry.cachedAt > ttlMs) {
      localStorage.removeItem(storageKey(cacheKey))
      return null
    }

    return entry.result
  } catch {
    return null
  }
}

export function setCachedGeminiResponse(
  cacheKey: string,
  result: GeminiAnalyzeResult
): void {
  try {
    pruneExpiredEntries()
    evictOldestIfNeeded()

    const entry: CacheEntry = { result, cachedAt: Date.now() }
    localStorage.setItem(storageKey(cacheKey), JSON.stringify(entry))
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[geminiCache] write failed (quota?):', err)
    }
  }
}

/** Store a result under image+coords key (e.g. dev fallback after network failure). */
export function putGeminiCache(
  imageBase64: string,
  lat: number,
  lng: number,
  result: GeminiAnalyzeResult
): void {
  setCachedGeminiResponse(buildGeminiCacheKey(imageBase64, lat, lng), result)
}

function listCacheEntries(): { key: string; cachedAt: number }[] {
  const entries: { key: string; cachedAt: number }[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith(CACHE_PREFIX)) continue
    try {
      const entry = JSON.parse(localStorage.getItem(key)!) as CacheEntry
      entries.push({ key, cachedAt: entry.cachedAt })
    } catch {
      localStorage.removeItem(key)
    }
  }
  return entries
}

export function getGeminiCacheStats(): { count: number; keys: string[] } {
  const entries = listCacheEntries()
  return {
    count: entries.length,
    keys: entries.map((e) => e.key.replace(CACHE_PREFIX, '')),
  }
}

function pruneExpiredEntries(): void {
  for (const { key, cachedAt } of listCacheEntries()) {
    if (Date.now() - cachedAt > TTL_MS) localStorage.removeItem(key)
  }
}

function evictOldestIfNeeded(): void {
  const entries = listCacheEntries().sort((a, b) => a.cachedAt - b.cachedAt)
  while (entries.length >= MAX_ENTRIES) {
    const oldest = entries.shift()
    if (oldest) localStorage.removeItem(oldest.key)
  }
}

/**
 * Checks localStorage first, then calls the network fetcher on cache miss.
 * Same image + coords → no Gemini API hit on refresh or HMR.
 */
export async function withGeminiCache(
  cacheKey: string,
  fetcher: () => Promise<GeminiAnalyzeResult>,
  options?: GeminiCacheOptions
): Promise<GeminiAnalyzeResult & { fromCache: boolean }> {
  const ttlMs = options?.ttlMs ?? TTL_MS

  if (isCacheEnabled(options)) {
    const cached = getCachedGeminiResponse(cacheKey, ttlMs)
    if (cached) {
      if (import.meta.env.DEV) {
        console.debug('[geminiCache] HIT — skipping network', cacheKey)
      }
      return { ...cached, fromCache: true }
    }
  }

  if (import.meta.env.DEV) {
    console.debug('[geminiCache] MISS — calling Gemini', cacheKey)
  }

  const result = await fetcher()

  if (isCacheEnabled(options)) {
    setCachedGeminiResponse(cacheKey, result)
  }

  return { ...result, fromCache: false }
}

export function clearGeminiCache(): void {
  for (const { key } of listCacheEntries()) {
    localStorage.removeItem(key)
  }
}
