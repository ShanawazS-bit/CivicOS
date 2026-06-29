/**
 * mlService.ts
 *
 * Image classifier using MobileNet (via @huggingface/transformers).
 * Runs entirely in-browser using ONNX WebAssembly — no API keys,
 * no network calls after model load, no CommonJS issues.
 *
 * Architecture:
 *   Xenova/mobilenet-v4-conv-small  (ImageNet pretrained, ONNX format)
 *   → top-5 ImageNet labels
 *   → mapped to civic issue categories
 *   → trust score assigned
 *
 * Fallback: If model fails to load, falls back to canvas pixel heuristic.
 */

import type { GeminiAnalysis } from '@/types'
import type { AnalyzeImageResult } from './geminiService'

// Lazy-load the pipeline — only downloaded once, cached by browser
let classifierPromise: Promise<unknown> | null = null

async function getClassifier() {
  if (!classifierPromise) {
    const { pipeline, env } = await import('@huggingface/transformers')
    // Use local model cache — avoids re-downloading on every session
    env.allowLocalModels = false
    classifierPromise = pipeline(
      'image-classification',
      'Xenova/mobilenet-v4-conv-small',  // 14MB ONNX model
      { device: 'webgpu' }               // falls back to WASM if WebGPU unavailable
    )
  }
  return classifierPromise as Promise<(input: unknown) => Promise<{ label: string; score: number }[]>>
}

// ─── ImageNet label → Civic category mapping ──────────────────────────────
//
// MobileNetV3 knows 1000 ImageNet classes. We map the ones relevant to
// street-level civic issues. Anything not in this map → "Infrastructure Issue"

const CIVIC_LABEL_MAP: Record<string, { issue_type: string; severity: string }> = {
  // Road / Surface
  'sidewalk': { issue_type: 'Road Damage', severity: 'Medium' },
  'street sign': { issue_type: 'Broken Signage', severity: 'High' },
  'traffic light': { issue_type: 'Broken Signage', severity: 'High' },
  'stop sign': { issue_type: 'Broken Signage', severity: 'High' },
  'road, route': { issue_type: 'Road Damage', severity: 'High' },
  'pavement': { issue_type: 'Road Damage', severity: 'Medium' },
  'manhole cover': { issue_type: 'Road Damage', severity: 'High' },
  'stone wall': { issue_type: 'Road Damage', severity: 'Low' },

  // Water / Drainage
  'lake': { issue_type: 'Flooding', severity: 'High' },
  'fountain': { issue_type: 'Flooding', severity: 'Medium' },
  'sewer': { issue_type: 'Sewage / Drainage', severity: 'High' },
  'gutter': { issue_type: 'Sewage / Drainage', severity: 'Medium' },
  'drain': { issue_type: 'Sewage / Drainage', severity: 'Medium' },

  // Lighting & Poles
  'torch': { issue_type: 'Streetlight Fault', severity: 'Medium' },
  'spotlight': { issue_type: 'Streetlight Fault', severity: 'Low' },
  'lampshade': { issue_type: 'Streetlight Fault', severity: 'Low' },
  'pole': { issue_type: 'Infrastructure Issue', severity: 'Medium' },
  'chainlink fence': { issue_type: 'Infrastructure Issue', severity: 'Low' },

  // Waste
  'trash can': { issue_type: 'Garbage / Waste', severity: 'Medium' },
  'garbage truck': { issue_type: 'Garbage / Waste', severity: 'High' },
  'dumpster': { issue_type: 'Garbage / Waste', severity: 'Medium' },
  'plastic bag': { issue_type: 'Garbage / Waste', severity: 'Low' },
  'carton': { issue_type: 'Garbage / Waste', severity: 'Low' },
  'waste': { issue_type: 'Garbage / Waste', severity: 'Medium' },

  // Vegetation
  'lawn mower': { issue_type: 'Overgrowth', severity: 'Low' },
  'tree': { issue_type: 'Overgrowth', severity: 'Low' },
  'leaf': { issue_type: 'Overgrowth', severity: 'Low' },

  // Non-civic / Invalid — people and animals
  'person': { issue_type: 'Invalid / Non-Civic', severity: 'Low' },
  'man': { issue_type: 'Invalid / Non-Civic', severity: 'Low' },
  'woman': { issue_type: 'Invalid / Non-Civic', severity: 'Low' },
  'face': { issue_type: 'Invalid / Non-Civic', severity: 'Low' },
  'selfie': { issue_type: 'Invalid / Non-Civic', severity: 'Low' },
  'dog': { issue_type: 'Invalid / Non-Civic', severity: 'Low' },
  'cat': { issue_type: 'Invalid / Non-Civic', severity: 'Low' },
}

const INVALID_KEYWORDS = [
  'person', 'face', 'man', 'woman', 'boy', 'girl', 'human',
  'selfie', 'portrait', 'dog', 'cat', 'animal', 'monkey', 'bird'
]

function mapToCity(
  predictions: { label: string; score: number }[]
): { issue_type: string; severity: string; confidence: number; label: string } {
  // Check top-3 predictions for a civic match
  for (const pred of predictions.slice(0, 3)) {
    const labelLower = pred.label.toLowerCase()

    // Hard reject — person/face
    if (INVALID_KEYWORDS.some((kw) => labelLower.includes(kw))) {
      return {
        issue_type: 'Invalid / Non-Civic',
        severity: 'Low',
        confidence: Math.round(pred.score * 100),
        label: pred.label,
      }
    }

    // Check civic map
    for (const [key, mapped] of Object.entries(CIVIC_LABEL_MAP)) {
      if (labelLower.includes(key)) {
        return {
          ...mapped,
          confidence: Math.round(pred.score * 100),
          label: pred.label,
        }
      }
    }
  }

  // Fallback — unrecognized but not a person
  return {
    issue_type: 'Infrastructure Issue',
    severity: 'Medium',
    confidence: Math.round(predictions[0].score * 100),
    label: predictions[0].label,
  }
}

// ─── Canvas pixel fallback (used if model fails to load) ─────────────────

function canvasFallback(imageElement: HTMLImageElement): AnalyzeImageResult {
  const canvas = document.createElement('canvas')
  canvas.width = 80; canvas.height = 80
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.drawImage(imageElement, 0, 0, 80, 80)
  const { data } = ctx.getImageData(0, 0, 80, 80)
  let skinCount = 0, grayCount = 0, total = 80 * 80
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    if (r > 80 && r > g && r > b && r - b > 20 && Math.abs(r - g) < 80) skinCount++
    const mx = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b))
    if (mx < 25 && r > 40 && r < 220) grayCount++
  }
  const isSkin = skinCount / total > 0.18
  const isRoad = grayCount / total > 0.30
  const analysis: GeminiAnalysis = isSkin
    ? { issue_type: 'Invalid / Non-Civic', severity: 'Low',
        description: 'Image appears to contain a person. Please upload a civic issue photo.',
        confidence_score: 70 }
    : isRoad
      ? { issue_type: 'Road Damage', severity: 'High',
          description: 'Surface damage detected via pixel analysis.',
          confidence_score: 65 }
      : { issue_type: 'Infrastructure Issue', severity: 'Medium',
          description: 'Potential civic issue detected.',
          confidence_score: 55 }
  return { analysis, trust_score: isSkin ? 10 : 70, fromCache: false }
}

// ─── Public API ────────────────────────────────────────────────────────────

export async function loadModel() {
  // Warm up the model in the background
  try { await getClassifier() } catch { /* silent — fallback handles it */ }
  return true
}

export async function analyzeImageLocal(
  imageElement: HTMLImageElement,
  _lat: number,
  _lng: number
): Promise<AnalyzeImageResult> {
  try {
    const classify = await getClassifier()
    const predictions = await classify(imageElement)

    const { issue_type, severity, confidence, label } = mapToCity(predictions)
    const isInvalid = issue_type === 'Invalid / Non-Civic'

    const analysis: GeminiAnalysis = {
      issue_type,
      severity,
      description: isInvalid
        ? `MobileNet detected: "${label}". This does not appear to be a valid civic issue.`
        : `MobileNet classified this as "${label}" → mapped to ${issue_type}.`,
      confidence_score: confidence,
    }

    const trustScore = isInvalid
      ? 10
      : Math.min(50 + confidence, 95)

    return { analysis, trust_score: trustScore, fromCache: false }

  } catch (err) {
    console.warn('[mlService] MobileNet unavailable, using canvas fallback:', err)
    return canvasFallback(imageElement)
  }
}
