import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mic, RefreshCw, Upload } from 'lucide-react'
import { EditorialPageShell } from '@/components/EditorialPageShell'
import { GeminiCacheBadge } from '@/components/GeminiCacheBadge'
import { ImageRiskTimeline } from '@/components/ImageRiskTimeline'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { PageHeader } from '@/components/ui/page-header'
import { applyGeofenceRiskBoost, getGeofenceContext, type GeofenceContext } from '@/lib/geofencing'
import {
  analyzeImage,
  analyzeVoiceText,
  getDevFallbackAnalysis,
  peekImageAnalysis,
} from '@/services/geminiService'
import { createIssue, DuplicateIssueError, GeofenceViolationError } from '@/services/issueService'
import { incrementUserReports } from '@/services/impactScore'
import type { GeminiAnalysis } from '@/types'

type Step = 'capture' | 'review' | 'done' | 'duplicate'

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
    coords: { lat: number; lng: number }
  ) {
    const context = getGeofenceContext(coords.lat, coords.lng)
    setAnalysis(result.analysis)
    setTrustScore(applyGeofenceRiskBoost(result.trust_score, context))
    setFromCache(result.fromCache)
    setLat(coords.lat)
    setLng(coords.lng)
    setGeofenceContext(context)
    setStep('review')
  }

  async function runAnalysis(base64: string, forceRefresh = false) {
    setError(null)
    const coords = await resolveCoords()
    const context = getGeofenceContext(coords.lat, coords.lng)

    if (!context.insideJurisdiction) {
      setError('This report is outside the municipal service boundary.')
      setGeofenceContext(context)
      return
    }

    if (!forceRefresh) {
      const cached = peekImageAnalysis(base64, coords.lat, coords.lng)
      if (cached) {
        applyAnalysis({ ...cached, fromCache: true }, coords)
        return
      }
    }

    setLoading(true)
    try {
      const result = await analyzeImage(base64, coords.lat, coords.lng, { forceRefresh })
      applyAnalysis(result, coords)
    } catch {
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
        description: voiceText || analysis.description,
        trust_score: trustScore,
        confidence: analysis.confidence_score,
        spatial_risk_boost: geofenceContext?.riskBoost ?? 0,
        lat,
        lng,
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
      setError('Voice not supported in this browser')
      return
    }

    const rec = new SpeechRecognitionCtor()
    rec.lang = 'en-IN'
    rec.onresult = async (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript
      setVoiceText(transcript)

      const coords = await resolveCoords()
      const context = getGeofenceContext(coords.lat, coords.lng)
      if (!context.insideJurisdiction) {
        setError('This voice report is outside the municipal service boundary.')
        setGeofenceContext(context)
        return
      }
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
    rec.start()
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
          <Card
            flat
            className="flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-brand-hairline bg-white p-12 transition-colors hover:border-[#E11D2E]/40"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="mb-3 h-10 w-10 text-brand-muted" />
            <p className="font-black text-brand-dark">Take or upload a photo</p>
            <p className="body-copy text-sm">Gemini classifies automatically</p>
          </Card>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Button variant="secondary" className="w-full" onClick={startVoice}>
            <Mic className="mr-2 h-4 w-4" />
            Voice Report
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
          label={fromCache ? 'Loading cached analysis…' : 'Analyzing with Gemini…'}
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
          <Card flat className="border border-brand-hairline bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              {fromCache ? (
                <p className="meta-label">Cached — no API call</p>
              ) : (
                <p className="meta-label text-brand-muted">Live Gemini analysis</p>
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
          <ImageRiskTimeline
            analysis={analysis}
            trustScore={trustScore}
            lat={lat}
            lng={lng}
            fromCache={fromCache}
            compact
          />
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
