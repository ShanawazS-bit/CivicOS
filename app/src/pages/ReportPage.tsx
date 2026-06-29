import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Mic, RefreshCw, Upload } from 'lucide-react'
import { EditorialPageShell } from '@/components/EditorialPageShell'
import { GeminiCacheBadge } from '@/components/GeminiCacheBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { PageHeader } from '@/components/ui/page-header'
import { applyGeofenceRiskBoost, getGeofenceContext, type GeofenceContext } from '@/lib/geofencing'
import { analyzeImageLocal, loadModel } from '@/services/mlService'
import { validateImageAuthenticity, type ImageAuthResult } from '@/services/imageValidator'
import {
  analyzeVoiceText,
  getDevFallbackAnalysis,
  peekImageAnalysis,
} from '@/services/geminiService'
import { createIssue, DuplicateIssueError, GeofenceViolationError } from '@/services/issueService'
import { incrementUserReports } from '@/services/impactScore'
import type { GeminiAnalysis } from '@/types'

type Step = 'capture' | 'review' | 'done' | 'duplicate' | 'outside_boundary'

const PUBLIC_MUNICIPALITIES = [
  'Ranchi',
  'Dhanbad',
  'Bokaro',
  'Patna',
  'Kolkata',
  'Bhubaneswar',
  'Raipur',
]

export function ReportPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const lastImageRef = useRef<string | null>(null)
  const [step, setStep] = useState<Step>('capture')
  const [preview, setPreview] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<GeminiAnalysis | null>(null)
  const [trustScore, setTrustScore] = useState(0)
  const [fromCache, setFromCache] = useState(false)
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [duplicateId, setDuplicateId] = useState<string | null>(null)
  const [voiceText, setVoiceText] = useState('')
  const [geofenceContext, setGeofenceContext] = useState<GeofenceContext | null>(null)
  const [overrideMunicipality, setOverrideMunicipality] = useState<string>(
    PUBLIC_MUNICIPALITIES[0]
  )
  const [selectedRegion, setSelectedRegion] = useState('')
  const [manualDescription, setManualDescription] = useState('')
  const [imageAuth, setImageAuth] = useState<ImageAuthResult | null>(null)
  const [isRecording, setIsRecording] = useState(false)

  // Preload ML model in the background
  useEffect(() => {
    loadModel().catch(console.error)
  }, [])

  async function resolveCoords(): Promise<{ lat: number; lng: number; gpsPresent: boolean }> {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, gpsPresent: true }),
        () => resolve({ lat: 22.7934, lng: 86.2049, gpsPresent: false })
      )
    })
  }

  function applyAnalysis(
    result: { analysis: GeminiAnalysis; trust_score: number; fromCache: boolean },
    coords: { lat: number; lng: number },
    authResult?: ImageAuthResult | null
  ) {
    const context = getGeofenceContext(coords.lat, coords.lng)
    setAnalysis(result.analysis)
    // Apply EXIF trust penalty on top of ML score
    const penalty = authResult && !authResult.authentic ? authResult.trustPenalty : 0
    setTrustScore(Math.max(0, applyGeofenceRiskBoost(result.trust_score - penalty, context)))
    setFromCache(result.fromCache)
    setLat(coords.lat)
    setLng(coords.lng)
    setGeofenceContext(context)
    if (!context.insideJurisdiction) {
      setStep('outside_boundary')
    } else {
      setStep('review')
    }
  }

  async function runAnalysis(base64: string, forceRefresh = false) {
    setError(null)
    const coords = await resolveCoords()

    if (!forceRefresh) {
      const cached = peekImageAnalysis(base64, coords.lat, coords.lng)
      if (cached) {
        applyAnalysis({ ...cached, fromCache: true }, coords)
        return
      }
    }

    setLoading(true)
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = preview || `data:image/jpeg;base64,${base64}`
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })
      
      const result = await analyzeImageLocal(img, coords.lat, coords.lng)
      applyAnalysis({ ...result, fromCache: false }, coords, imageAuth)
    } catch (e) {
      console.error(e)
      const fallback = getDevFallbackAnalysis(
        base64,
        coords.lat,
        coords.lng,
        coords.gpsPresent
      )
      applyAnalysis(fallback, coords)
    } finally {
      setLoading(false)
    }
  }

  async function handleFile(file: File) {
    // Run EXIF validation immediately (fast, synchronous read)
    const auth = await validateImageAuthenticity(file)
    setImageAuth(auth)

    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.split(',')[1]
      lastImageRef.current = base64
      setPreview(dataUrl)
      await runAnalysis(base64)
    }
    reader.readAsDataURL(file)
  }

  async function handleForceRefresh() {
    if (!lastImageRef.current) return
    await runAnalysis(lastImageRef.current, true)
  }

  async function handleSubmit() {
    if (!analysis || lat == null || lng == null) return
    setLoading(true)
    setError(null)

    try {
      await createIssue({
        issue_type: analysis.issue_type,
        severity: analysis.severity,
        description: `${manualDescription || voiceText || analysis.description}\n\nRegion: ${selectedRegion || 'N/A'}\nMunicipality: ${overrideMunicipality}`.trim(),
        trust_score: trustScore,
        confidence: analysis.confidence_score,
        image_url: preview ?? undefined,
        spatial_risk_boost: geofenceContext?.riskBoost ?? 0,
        lat,
        lng,
        override_municipality: overrideMunicipality,
        region: selectedRegion,
      })
      incrementUserReports()
      setStep('done')
    } catch (err) {
      if (err instanceof DuplicateIssueError) {
        setDuplicateId(err.duplicateOf)
        setStep('duplicate')
      } else if (err instanceof GeofenceViolationError) {
        setError('This report is outside the municipal service boundary.')
      } else {
        setError(err instanceof Error ? err.message : 'Submission failed')
      }
    } finally {
      setLoading(false)
    }
  }

  async function startVoice() {
    const SpeechRecognitionCtor =
      window.webkitSpeechRecognition ?? window.SpeechRecognition

    if (!SpeechRecognitionCtor) {
      setError('Voice not supported in this browser. Please use Chrome/Safari.')
      return
    }

    try {
      const rec = new SpeechRecognitionCtor()
      rec.lang = 'en-IN'
      
      rec.onstart = () => {
        setIsRecording(true)
        setError(null)
      }

      rec.onresult = async (e: any) => {
        const transcript = e.results[0][0].transcript
        setVoiceText(transcript)

        const coords = await resolveCoords()
        setLoading(true)
        try {
          const result = await analyzeVoiceText(transcript, coords.lat, coords.lng)
          applyAnalysis(result, coords)
        } catch {
          setError('Voice analysis failed — try again or upload a photo')
        } finally {
          setLoading(false)
        }
      }

      rec.onerror = (e: any) => {
        setIsRecording(false)
        if (e.error === 'not-allowed') {
          setError('Microphone access denied. Please check site permissions.')
        } else {
          setError(`Voice recording failed (${e.error}). Please try again.`)
        }
      }

      rec.onend = () => {
        setIsRecording(false)
      }

      rec.start()
    } catch (err: any) {
      setError('Failed to start microphone: ' + (err.message || 'Unknown error'))
      setIsRecording(false)
    }
  }

  return (
    <EditorialPageShell ticker="01 / Ingestion // Civic Dispatch">
      <PageHeader
        label="Frictionless Ingestion"
        title="Report an Issue"
        subtitle="Take a photo — AI handles categorization, severity, and trust scoring."
      />

      <GeminiCacheBadge className="mb-4" />

      {step === 'capture' && !loading && (
        <div className="space-y-4">
          <Card flat className="border border-brand-hairline bg-white p-4 space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-brand-dark mb-1">
                Region / State
              </label>
              <input
                type="text"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                placeholder="e.g. Jharkhand"
                className="w-full border border-brand-hairline p-2 text-sm focus:border-[#111111] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-brand-dark mb-1">
                Municipality
              </label>
              <select
                className="w-full border border-brand-hairline p-2 text-sm focus:border-[#111111] focus:outline-none"
                value={overrideMunicipality}
                onChange={(e) => setOverrideMunicipality(e.target.value)}
              >
                {PUBLIC_MUNICIPALITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-brand-dark mb-1">
                Issue Description
              </label>
              <textarea
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                placeholder="Describe the issue..."
                rows={3}
                className="w-full border border-brand-hairline p-2 text-sm focus:border-[#111111] focus:outline-none"
              />
            </div>
          </Card>

          <Card
            flat
            className="flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-brand-hairline bg-white p-10 transition-colors hover:border-[#E11D2E]/40"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="mb-3 h-10 w-10 text-brand-muted" />
            <p className="font-black text-brand-dark">Take or upload a photo</p>
            <p className="body-copy text-sm text-brand-muted">MobileNet AI classifies the issue instantly</p>
          </Card>

          {/* ── How it works callout ─────────────────────────────── */}
          <div className="border border-brand-hairline bg-white">
            <div className="border-b border-brand-hairline px-4 py-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">How Verification Works</p>
            </div>
            <div className="divide-y divide-brand-hairline">
              <div className="flex items-start gap-3 px-4 py-3">
                <span className="mt-0.5 shrink-0 text-base">🤖</span>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-brand-dark">MobileNet Image Classification</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-brand-muted">
                    A <strong>14 MB on-device AI model</strong> runs entirely in your browser — no internet needed after first load. It classifies your photo into civic categories like Road Damage, Flooding, or Garbage.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 px-4 py-3">
                <span className="mt-0.5 shrink-0 text-base">🛡</span>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-brand-dark">EXIF Camera Verification</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-brand-muted">
                    Every photo carries hidden <strong>EXIF metadata</strong> — camera make, capture date, GPS. We read this to detect stock photos, edited images, or screenshots downloaded from the internet and <strong>reduce their trust score</strong>.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 px-4 py-3">
                <span className="mt-0.5 shrink-0 text-base">📍</span>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-brand-dark">GPS Cross-Check</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-brand-muted">
                    If your photo has embedded GPS, we compare it against your device location. A mismatch flags the report for <strong>manual admin review</strong>.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-zinc-50 px-4 py-2">
              <p className="text-[10px] text-brand-muted">
                <strong className="text-brand-dark">Tip:</strong> Use your phone camera directly for the highest trust score. Downloaded or edited images are penalised.
              </p>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Button 
            variant="secondary" 
            className={`w-full ${isRecording ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : ''}`} 
            onClick={startVoice}
            disabled={isRecording}
          >
            <Mic className={`mr-2 h-4 w-4 ${isRecording ? 'text-red-600' : ''}`} />
            {isRecording ? 'Listening (Speak now)...' : 'Voice Report'}
          </Button>
          {voiceText && (
            <Card flat className="border-l-4 border-[#E11D2E] bg-white p-4">
              <p className="meta-label mb-1">Voice transcript</p>
              <p className="body-copy text-sm">&ldquo;{voiceText}&rdquo;</p>
            </Card>
          )}
        </div>
      )}

      {loading && (
        <LoadingSpinner
          label={fromCache ? 'Loading cached analysis…' : 'Analyzing with MobileNet AI…'}
        />
      )}

      {step === 'review' && analysis && !loading && (
        <div className="space-y-4">
          {preview && (
            <img
              src={preview}
              alt="Issue"
              className="w-full border border-brand-hairline object-cover product-shadow"
            />
          )}

          {/* ── EXIF Authenticity Banner ───────────────────────────── */}
          {imageAuth && (
            <div
              className={`border px-4 py-3 text-xs font-bold uppercase tracking-wider ${
                imageAuth.authentic
                  ? 'border-green-300 bg-green-50 text-green-800'
                  : 'border-amber-300 bg-amber-50 text-amber-800'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span>{imageAuth.authentic ? '✓ Camera Verified' : '⚠ Authenticity Warning'}</span>
                {!imageAuth.authentic && (
                  <span className="rounded bg-amber-200 px-1 py-0.5 text-[10px]">
                    −{imageAuth.trustPenalty} Trust
                  </span>
                )}
              </div>
              {!imageAuth.authentic && (
                <p className="mb-2 text-[11px] font-medium normal-case leading-snug text-amber-700">
                  {imageAuth.reason}
                </p>
              )}
              <div className="flex flex-wrap gap-1 mt-1">
                {imageAuth.signals.map((s) => (
                  <span
                    key={s}
                    className={`rounded px-1.5 py-0.5 text-[10px] ${
                      imageAuth.authentic ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Card flat className="border border-brand-hairline bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              {fromCache ? (
                <p className="meta-label">Cached — no API call</p>
              ) : (
                <p className="meta-label text-brand-muted">Live MobileNet analysis</p>
              )}
              {import.meta.env.DEV && lastImageRef.current && (
                <button
                  type="button"
                  onClick={handleForceRefresh}
                  className="flex items-center gap-1 text-xs font-black uppercase tracking-wider text-brand-muted hover:text-[#E11D2E]"
                >
                  <RefreshCw className="h-3 w-3" />
                  Refresh
                </button>
              )}
            </div>
            <div className="mb-3 flex items-center justify-between border-b border-brand-hairline pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-brand-dark">
                {analysis.issue_type}
              </span>
              <span className="meta-label">{analysis.severity}</span>
            </div>
            <p className="body-copy mb-4">{analysis.description}</p>
            <div className="flex justify-between border-t border-brand-hairline pt-3 text-sm">
              <span className="text-brand-muted">AI Confidence: {analysis.confidence_score}%</span>
              <span className="font-black text-brand-dark">Trust: {trustScore}</span>
            </div>
            {geofenceContext && (
              <div className="mt-3 border-t border-brand-hairline pt-3">
                <p className="meta-label">Geofence routing</p>
                <p className="body-copy mt-1 text-sm">
                  {geofenceContext.wardName ?? 'Unassigned ward'} //{' '}
                  {geofenceContext.routeLabel ?? 'Manual review'}
                  {geofenceContext.riskBoost > 0
                    ? ` // +${geofenceContext.riskBoost} spatial risk`
                    : ''}
                </p>
              </div>
            )}
          </Card>
          <Button variant="accent" className="w-full" onClick={handleSubmit} disabled={loading}>
            Submit Report
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => setStep('capture')}>
            Retake
          </Button>
        </div>
      )}

      {step === 'done' && (
        <Card flat className="border border-brand-hairline bg-white p-6 text-center">
          <p className="section-header mb-2">Issue submitted</p>
          <p className="body-copy">
            Your report is now visible on the feed and municipal dashboard.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Link to="/feed">
              <Button className="w-full">View Neighborhood Feed</Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setStep('capture')
                setAnalysis(null)
                setPreview(null)
                setGeofenceContext(null)
                lastImageRef.current = null
              }}
            >
              Report Another
            </Button>
          </div>
        </Card>
      )}

      {step === 'outside_boundary' && (
        <Card flat className="border border-brand-hairline bg-white p-6">
          <p className="section-header mb-2 text-[#E11D2E]">Outside Service Boundary</p>
          <p className="body-copy mb-4">
            This location is outside our core municipal boundaries. Please select the correct municipality to submit this report to:
          </p>
          <select
            className="mb-4 w-full border border-brand-hairline p-2 text-sm focus:border-[#111111] focus:outline-none"
            value={overrideMunicipality}
            onChange={(e) => setOverrideMunicipality(e.target.value)}
          >
            {PUBLIC_MUNICIPALITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <Button variant="accent" className="w-full" onClick={() => setStep('review')}>
            Continue to Review
          </Button>
          <Button variant="ghost" className="mt-2 w-full" onClick={() => setStep('capture')}>
            Cancel
          </Button>
        </Card>
      )}

      {step === 'duplicate' && (
        <Card flat className="border-l-4 border-[#E11D2E] bg-white p-6 text-center">
          <p className="section-header">Already reported nearby</p>
          <p className="body-copy mt-2">Existing issue: {duplicateId}</p>
          <Link to="/feed" className="mt-4 inline-block">
            <Button variant="secondary">Follow on Feed</Button>
          </Link>
        </Card>
      )}

      {error && <p className="mt-4 text-sm font-semibold text-[#E11D2E]">{error}</p>}
    </EditorialPageShell>
  )
}
