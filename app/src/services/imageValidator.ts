/**
 * imageValidator.ts
 *
 * Validates image authenticity using EXIF metadata.
 * Detects images downloaded from the internet vs genuine camera captures.
 *
 * Signals of a REAL camera photo:
 *   ✓ Camera Make + Model present      (e.g. "Apple", "iPhone 14 Pro")
 *   ✓ DateTimeOriginal present          (when the shutter actually fired)
 *   ✓ Software is a camera OS / app    (e.g. "iOS 17.0", "Camera")
 *   ✓ GPS coordinates embedded          (phone cameras always tag location)
 *
 * Signals of an INTERNET / FAKE image:
 *   ✗ No EXIF at all                   (screenshots, web downloads strip EXIF)
 *   ✗ Software is a desktop editor     (Photoshop, GIMP, Lightroom)
 *   ✗ Camera make/model missing        (edited, re-saved, or AI-generated)
 *   ✗ DateTimeOriginal missing         (generated or re-processed image)
 *   ✗ Very old capture date            (stock photo)
 */

import exifr from 'exifr'

export type ImageAuthResult =
  | { authentic: true; signals: string[]; trustPenalty: 0 }
  | { authentic: false; reason: string; signals: string[]; trustPenalty: number }

const EDITING_SOFTWARE_KEYWORDS = [
  'photoshop', 'lightroom', 'gimp', 'affinity', 'capture one',
  'darktable', 'rawtherapee', 'snapseed', 'paint.net', 'canva',
  'adobe', 'corel', 'picasa', 'luminar', 'pixlr'
]

const KNOWN_CAMERA_SOFTWARE = [
  'ios', 'android', 'camera', 'samsung', 'xiaomi', 'pixel',
  'oneplus', 'motorola', 'huawei', 'nokia', 'oppo', 'vivo'
]

export async function validateImageAuthenticity(
  file: File
): Promise<ImageAuthResult> {
  const signals: string[] = []

  let exif: Record<string, unknown> | null = null
  try {
    exif = await exifr.parse(file, {
      pick: ['Make', 'Model', 'Software', 'DateTimeOriginal', 'GPSLatitude', 'GPSLongitude', 'CreateDate'],
    })
  } catch {
    // EXIF parse failure itself is a signal
    exif = null
  }

  // ── No EXIF at all ──────────────────────────────────────────────────────
  if (!exif || Object.keys(exif).length === 0) {
    signals.push('No EXIF metadata found')
    return {
      authentic: false,
      reason: 'This image has no camera metadata. It may be a screenshot or downloaded from the internet.',
      signals,
      trustPenalty: 35,
    }
  }

  const make = (exif.Make as string | undefined)?.toLowerCase() ?? ''
  const model = (exif.Model as string | undefined)?.toLowerCase() ?? ''
  const software = (exif.Software as string | undefined)?.toLowerCase() ?? ''
  const dateOriginal = exif.DateTimeOriginal ?? exif.CreateDate
  const hasGPS = exif.GPSLatitude != null && exif.GPSLongitude != null

  // ── Check for photo editing software ────────────────────────────────────
  if (software && EDITING_SOFTWARE_KEYWORDS.some((kw) => software.includes(kw))) {
    signals.push(`Edited with: ${exif.Software}`)
    return {
      authentic: false,
      reason: `Image appears to have been processed in ${exif.Software as string}. Please submit an unedited camera photo.`,
      signals,
      trustPenalty: 40,
    }
  }

  // ── No camera make/model ─────────────────────────────────────────────────
  const hasCameraId = make.length > 0 || model.length > 0
  if (!hasCameraId) {
    signals.push('No camera make/model in metadata')
    // Don't hard-reject — some phones strip make/model — penalise instead
    signals.push('Low confidence: metadata incomplete')
    return {
      authentic: false,
      reason: `Camera information is missing from this image's metadata. This may indicate an edited or downloaded photo.`,
      signals,
      trustPenalty: 25,
    }
  }

  // ── No capture date ──────────────────────────────────────────────────────
  if (!dateOriginal) {
    signals.push(`Camera: ${exif.Make ?? ''} ${exif.Model ?? ''}`.trim())
    signals.push('Missing original capture timestamp')
    return {
      authentic: false,
      reason: 'The original capture date is missing. The image may have been re-saved or sourced online.',
      signals,
      trustPenalty: 20,
    }
  }

  // ── Very old photo (>5 years) — possible stock image ────────────────────
  const captureDate = new Date(dateOriginal as string)
  const fiveYearsAgo = new Date()
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)
  if (captureDate < fiveYearsAgo) {
    signals.push(`Old capture date: ${captureDate.toLocaleDateString()}`)
    signals.push(`Camera: ${exif.Make ?? ''} ${exif.Model ?? ''}`.trim())
    return {
      authentic: false,
      reason: `This photo was taken on ${captureDate.toLocaleDateString()} — over 5 years ago. Please submit a recent photo of the issue.`,
      signals,
      trustPenalty: 20,
    }
  }

  // ── All checks passed ────────────────────────────────────────────────────
  signals.push(`Camera: ${exif.Make ?? ''} ${exif.Model ?? ''}`.trim())
  signals.push(`Captured: ${captureDate.toLocaleDateString()}`)
  if (hasGPS) signals.push('GPS coordinates embedded')
  if (software && KNOWN_CAMERA_SOFTWARE.some((kw) => software.includes(kw))) {
    signals.push(`Software: ${exif.Software as string}`)
  }

  return { authentic: true, signals, trustPenalty: 0 }
}
