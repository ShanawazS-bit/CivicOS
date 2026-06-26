import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BrainCircuit,
  Clock3,
  DatabaseZap,
  FileText,
  MapPin,
  RadioTower,
  ScanEye,
  ShieldAlert,
} from 'lucide-react'
import { AdminIncidentRow } from '@/components/AdminIncidentRow'
import { detectCluster } from '@/lib/clusterDetection'
import { CIVIC_GEOFENCES, type Geofence } from '@/lib/geofencing'
import { fetchIssues, subscribeToIssues } from '@/services/issueService'
import type { Issue } from '@/types'

interface TrustMatrixItem {
  label: string
  value: number
  note: string
}

const mapLabels = ['CIVIC CORE', 'ARTERIAL', 'DRAINAGE GRID', 'MARKET EDGE', 'TRANSIT LINE']

const boundaryFence = CIVIC_GEOFENCES.find((fence) => fence.fenceType === 'boundary')
const fenceLngs = boundaryFence?.coordinates.map(([lng]) => lng) ?? [86.19, 86.22]
const fenceLats = boundaryFence?.coordinates.map(([, lat]) => lat) ?? [22.78, 22.81]
const fenceBounds = {
  lngMin: Math.min(...fenceLngs),
  lngMax: Math.max(...fenceLngs),
  latMin: Math.min(...fenceLats),
  latMax: Math.max(...fenceLats),
}

function geofenceClipPath(fence: Geofence): string {
  const points = fence.coordinates.map(([lng, lat]) => {
    const x = ((lng - fenceBounds.lngMin) / (fenceBounds.lngMax - fenceBounds.lngMin)) * 100
    const y = 100 - ((lat - fenceBounds.latMin) / (fenceBounds.latMax - fenceBounds.latMin)) * 100
    return `${x.toFixed(2)}% ${y.toFixed(2)}%`
  })
  return `polygon(${points.join(', ')})`
}

function mapMarkerCode(issue: Issue, rank: number): string {
  if (rank < 10) return String(rank).padStart(2, '0')
  return issue.issue_type.slice(0, 4).toUpperCase()
}

function severityColor(issue: Issue): string {
  const severity = issue.severity.toLowerCase()
  if (issue.trust_score >= 90 || severity === 'high') return '#E11D2E'
  if (severity === 'medium') return '#111111'
  return '#71717A'
}

function normalizeMarker(issue: Issue, index: number, issues: Issue[]) {
  const lats = issues.map((item) => item.lat).filter((lat): lat is number => typeof lat === 'number')
  const lngs = issues.map((item) => item.lng).filter((lng): lng is number => typeof lng === 'number')
  const fallback = [
    { x: 32, y: 28 },
    { x: 58, y: 42 },
    { x: 46, y: 62 },
    { x: 71, y: 24 },
    { x: 25, y: 70 },
  ][index % 5]

  if (typeof issue.lat !== 'number' || typeof issue.lng !== 'number' || lats.length < 2 || lngs.length < 2) {
    return fallback
  }

  const latMin = Math.min(...lats)
  const latMax = Math.max(...lats)
  const lngMin = Math.min(...lngs)
  const lngMax = Math.max(...lngs)
  const x = lngMax === lngMin ? fallback.x : 16 + ((issue.lng - lngMin) / (lngMax - lngMin)) * 68
  const y = latMax === latMin ? fallback.y : 82 - ((issue.lat - latMin) / (latMax - latMin)) * 64

  return { x, y }
}

function formatClock(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  }).format(date)
}

function trackingId(id: string): string {
  return `CIV-${id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}`
}

function trustMatrix(issue: Issue): TrustMatrixItem[] {
  const confidence = issue.confidence ?? Math.max(72, issue.trust_score - 5)
  return [
    {
      label: 'Gemini Vision Confidence',
      value: confidence,
      note: 'Image classification and object-state match',
    },
    {
      label: 'Geo-Spatial Plausibility',
      value: issue.lat && issue.lng ? 96 : 78,
      note: issue.ward_name
        ? `Inside ${issue.ward_name}; routed to ${issue.route_label ?? 'ward operations'}`
        : 'Coordinate integrity against municipal grid',
    },
    {
      label: 'Geofence Risk Multiplier',
      value: Math.min(100, 70 + (issue.spatial_risk_boost ?? 0) * 2),
      note: issue.spatial_risk_boost
        ? `High-risk zone boost applied: +${issue.spatial_risk_boost}`
        : 'No high-risk municipal zone overlap detected',
    },
    {
      label: 'Duplicate Suppression',
      value: Math.max(64, 100 - Math.abs(issue.trust_score - 82)),
      note: 'Nearby report collision and decay analysis',
    },
    {
      label: 'Dispatch Urgency',
      value: issue.trust_score,
      note: 'Severity, public risk, and recency weighted',
    },
  ]
}

function statusCopy(issue: Issue): string {
  if (issue.status === 'resolved') return 'Resolution packet closed and archived for ward review.'
  if (issue.status === 'in_progress') return 'Field team attached. Awaiting final remediation proof.'
  if (issue.status === 'verified') return 'Verified signal. Eligible for immediate municipal dispatch.'
  if (issue.status === 'assigned') return 'Assigned to ward operations with active response timer.'
  return 'Pending senior desk verification before dispatch release.'
}

export function AdminPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchIssues()
        setIssues(data)
        setSelectedId((current) => current ?? data[0]?.id ?? null)
      } finally {
        setLoading(false)
      }
    }

    load()
    return subscribeToIssues(load)
  }, [])

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(clock)
  }, [])

  const sortedIssues = useMemo(
    () => [...issues].sort((a, b) => b.trust_score - a.trust_score),
    [issues]
  )
  const selectedIssue = sortedIssues.find((issue) => issue.id === selectedId) ?? sortedIssues[0]
  const clusterAlert = detectCluster(sortedIssues)
  const activeSignals = sortedIssues.filter((issue) => issue.status !== 'resolved').length

  return (
    <section className="h-screen overflow-hidden bg-[#F2F1EE] font-sans text-[#111111]">
      <header className="flex h-[60px] items-center justify-between border-b-2 border-[#111111] bg-white px-6">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="mr-2 flex h-8 items-center gap-2 border border-[#111111] bg-white px-3 text-[10px] font-black uppercase tracking-widest text-[#111111] transition-colors hover:bg-[#111111] hover:text-white"
            aria-label="Return to civic home"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Home
          </Link>
          <ShieldAlert className="h-5 w-5 text-[#E11D2E]" />
          <h1 className="text-sm font-black uppercase tracking-widest">
            CIVIC OS // MUNICIPAL INTELLIGENCE DESK
          </h1>
        </div>
        <div className="flex items-center gap-6 font-mono text-xs font-bold uppercase tracking-wider">
          <span className="text-[#E11D2E]">Live Clock // {formatClock(now)}</span>
          <span>{activeSignals} Active Signals</span>
          <span>{loading ? 'Syncing' : 'Desk Online'}</span>
        </div>
      </header>

      <DispatchTicker selectedIssue={selectedIssue} />

      <div className="grid h-[calc(100vh-82px)] grid-cols-[400px_minmax(0,1fr)_450px] overflow-hidden">
        <aside className="h-full overflow-y-auto border-r border-zinc-200 bg-white">
          <div className="sticky top-0 z-10 border-b-2 border-[#111111] bg-white px-5 py-4">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#E11D2E]">
              Live Dispatch Triage Queue
            </p>
            <div className="mt-2 flex items-end justify-between">
              <h2 className="text-3xl font-black leading-none text-zinc-900">Trust Sorted</h2>
              <span className="font-mono text-xs font-bold text-zinc-500">
                {String(sortedIssues.length).padStart(2, '0')} ITEMS
              </span>
            </div>
          </div>

          {loading ? (
            <div className="px-5 py-8 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">
              Loading municipal signal queue...
            </div>
          ) : (
            sortedIssues.map((issue, index) => (
              <AdminIncidentRow
                key={issue.id}
                issue={issue}
                active={selectedIssue?.id === issue.id}
                rank={index + 1}
                onSelect={setSelectedId}
              />
            ))
          )}
        </aside>

        <main className="relative h-full overflow-hidden bg-[#F2F1EE]">
          <div className="absolute inset-x-0 top-0 z-10 border-b border-zinc-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-[#E11D2E]">
                  Geographic Intelligence Canvas
                </p>
                <h2 className="mt-1 text-4xl font-black leading-none text-zinc-900">
                  Municipal Signal Map
                </h2>
              </div>
              <div className="flex items-center gap-3">
                {clusterAlert && (
                  <div className="flex items-center gap-2 border border-[#E11D2E] bg-white px-3 py-2 text-[#E11D2E]">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Cluster Alert
                    </span>
                  </div>
                )}
                <div className="border border-[#111111] bg-[#111111] px-4 py-2 text-white">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider">
                    EARTH 3D MOCK
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-6 bottom-6 top-[112px] overflow-hidden border border-zinc-200 bg-[#DDE3D3]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,#eef2e6_0,#eef2e6_18%,transparent_38%),radial-gradient(circle_at_78%_30%,#cfe7c6_0,#cfe7c6_20%,transparent_43%),linear-gradient(135deg,#d8decf_0%,#eef0e9_46%,#cfd8c8_100%)]" />
            <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(135deg,rgba(17,17,17,0.08)_1px,transparent_1px),linear-gradient(45deg,rgba(17,17,17,0.05)_1px,transparent_1px)] [background-size:96px_96px]" />

            {CIVIC_GEOFENCES.map((fence) => (
              <div
                key={fence.id}
                className={`absolute inset-[7%] z-[8] border ${
                  fence.fenceType === 'high_risk'
                    ? 'border-dashed border-[#E11D2E] bg-[#E11D2E]/15'
                    : fence.fenceType === 'ward'
                      ? 'border-[#111111]/30 bg-white/20'
                      : 'border-[#E11D2E] bg-transparent'
                }`}
                style={{ clipPath: geofenceClipPath(fence) }}
              />
            ))}

            <div className="absolute left-[-6%] top-[14%] h-[30%] w-[55%] -rotate-6 border border-[#B8CFAD] bg-[#CFE4C4]" />
            <div className="absolute right-[-8%] top-[7%] h-[38%] w-[48%] rotate-6 border border-[#BACFB1] bg-[#D9E9D0]" />
            <div className="absolute bottom-[4%] left-[24%] h-[26%] w-[34%] rotate-[-11deg] border border-[#BED5C8] bg-[#CDE7EA]" />
            <div className="absolute bottom-[-9%] right-[12%] h-[34%] w-[42%] rotate-[10deg] border border-[#C9D1BE] bg-[#E5E7DC]" />

            <div className="absolute left-[-7%] top-[25%] z-10 h-12 w-[114%] -rotate-[9deg] rounded-full border border-[#C9C6BB] bg-white">
              <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[#D5D2CA]" />
            </div>
            <div className="absolute left-[-4%] top-[58%] z-10 h-10 w-[108%] rotate-[8deg] rounded-full border border-[#C9C6BB] bg-white">
              <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[#D5D2CA]" />
            </div>
            <div className="absolute left-[42%] top-[-12%] z-10 h-[124%] w-10 rotate-[17deg] rounded-full border border-[#C9C6BB] bg-white">
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#D5D2CA]" />
            </div>
            <div className="absolute left-[8%] top-[42%] z-10 h-5 w-[72%] -rotate-[14deg] rounded-full border border-[#D7D3C8] bg-[#F5F3EC]" />
            <div className="absolute left-[16%] top-[76%] z-10 h-4 w-[48%] rotate-[2deg] rounded-full border border-[#D7D3C8] bg-[#F5F3EC]" />

            <div className="absolute left-[19%] top-[22%] z-20 h-20 w-16 -rotate-6 border border-[#A7A196] bg-[#F8F5ED]">
              <div className="absolute -right-2 top-2 h-full w-2 border-y border-r border-[#A7A196] bg-[#DAD6CB]" />
              <div className="absolute -bottom-2 left-2 h-2 w-full border-x border-b border-[#A7A196] bg-[#C8C3B7]" />
            </div>
            <div className="absolute left-[58%] top-[34%] z-20 h-24 w-20 rotate-3 border border-[#A7A196] bg-[#FDFBF5]">
              <div className="absolute -right-3 top-3 h-full w-3 border-y border-r border-[#A7A196] bg-[#DDD8CC]" />
              <div className="absolute -bottom-3 left-3 h-3 w-full border-x border-b border-[#A7A196] bg-[#C8C3B7]" />
            </div>
            <div className="absolute bottom-[18%] left-[36%] z-20 h-16 w-28 rotate-[-12deg] border border-[#A7A196] bg-[#F4F0E7]">
              <div className="absolute -right-2 top-2 h-full w-2 border-y border-r border-[#A7A196] bg-[#DAD6CB]" />
              <div className="absolute -bottom-2 left-2 h-2 w-full border-x border-b border-[#A7A196] bg-[#C8C3B7]" />
            </div>
            <div className="absolute right-[16%] top-[15%] z-20 h-14 w-24 rotate-6 border border-[#A7A196] bg-[#FFFDF8]">
              <div className="absolute -right-2 top-2 h-full w-2 border-y border-r border-[#A7A196] bg-[#DAD6CB]" />
              <div className="absolute -bottom-2 left-2 h-2 w-full border-x border-b border-[#A7A196] bg-[#C8C3B7]" />
            </div>

            {mapLabels.map((label, index) => (
              <span
                key={label}
                className="absolute z-30 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500"
                style={{ left: `${12 + index * 16}%`, top: `${18 + (index % 3) * 21}%` }}
              >
                {label}
              </span>
            ))}

            <div className="absolute bottom-4 right-4 z-30 border border-[#111111] bg-white px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#111111]">
              Geofence overlay // wards + high-risk zones
            </div>

            {sortedIssues.map((issue, index) => {
              const position = normalizeMarker(issue, index, sortedIssues)
              const active = selectedIssue?.id === issue.id
              return (
                <button
                  key={issue.id}
                  type="button"
                  data-testid="map-node-marker"
                  onClick={() => setSelectedId(issue.id)}
                  className={`absolute z-40 flex -translate-x-1/2 -translate-y-1/2 items-stretch border border-[#111111] bg-white font-mono text-[10px] font-black uppercase tracking-wider ring-4 ring-white/80 transition-transform hover:scale-110 ${
                    active ? 'bg-[#E11D2E] text-white' : 'text-[#111111]'
                  }`}
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                  }}
                  aria-label={`Select ${issue.issue_type}`}
                >
                  <span
                    className="w-1.5 shrink-0"
                    style={{ backgroundColor: active ? '#111111' : severityColor(issue) }}
                  />
                  <span className="flex h-7 min-w-8 items-center justify-center px-2">
                    {mapMarkerCode(issue, index + 1)}
                  </span>
                </button>
              )
            })}

            {selectedIssue && (
              <div
                data-testid="selected-map-node"
                className="absolute bottom-6 left-6 z-50 border border-[#111111] border-t-4 border-t-[#E11D2E] bg-white px-5 py-4"
              >
                <p className="text-[11px] font-black uppercase tracking-widest text-[#E11D2E]">
                  Selected Node
                </p>
                <p className="mt-1 max-w-md text-2xl font-black leading-tight text-zinc-900">
                  {selectedIssue.issue_type}
                </p>
                <p className="mt-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">
                  {trackingId(selectedIssue.id)} // {selectedIssue.trust_score} Trust
                </p>
                <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {selectedIssue.ward_name ?? 'Ward pending'} //{' '}
                  {selectedIssue.inside_jurisdiction === false ? 'Outside boundary' : 'Inside boundary'}
                </p>
              </div>
            )}
          </div>
        </main>

        <aside className="h-full overflow-y-auto border-l border-zinc-200 bg-white">
          {selectedIssue ? (
            <div>
              <div className="sticky top-0 z-10 border-b-2 border-[#111111] bg-white px-5 py-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#E11D2E]">
                  Deep Inspection Node
                </p>
                <h2 className="mt-2 text-3xl font-black leading-none text-zinc-900">
                  {selectedIssue.issue_type}
                </h2>
              </div>

              <VisualEvidence issue={selectedIssue} />

              <div className="space-y-6 px-5 py-5">
                <section className="border border-zinc-200 bg-white">
                  <div className="border-b border-zinc-200 px-4 py-3">
                    <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#E11D2E]">
                      <ScanEye className="h-4 w-4" />
                      Gemini Parsed Payload
                    </p>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-zinc-200 border-b border-zinc-200">
                    <Metric label="Trust" value={`${selectedIssue.trust_score}`} />
                    <Metric label="Confidence" value={`${selectedIssue.confidence ?? 88}%`} />
                  </div>
                  <div className="px-4 py-4">
                    <p className="text-sm leading-relaxed text-zinc-700">
                      {selectedIssue.description ??
                        'Gemini detected a municipal infrastructure anomaly requiring validation.'}
                    </p>
                    <p className="mt-4 font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      {trackingId(selectedIssue.id)} // {new Date(selectedIssue.created_at).toLocaleString()}
                    </p>
                  </div>
                </section>

                <section className="border border-zinc-200 bg-white">
                  <div className="border-b border-zinc-200 px-4 py-3">
                    <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#E11D2E]">
                      <FileText className="h-4 w-4" />
                      Complete Text Transcript
                    </p>
                  </div>
                  <p className="px-4 py-4 text-base font-medium leading-relaxed text-zinc-900">
                    {selectedIssue.description ??
                      'No citizen transcript supplied. Visual analysis remains available for dispatch verification.'}
                  </p>
                </section>

                <section className="border border-zinc-200 bg-white">
                  <div className="border-b border-zinc-200 px-4 py-3">
                    <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#E11D2E]">
                      <BrainCircuit className="h-4 w-4" />
                      Trust Engine Matrix
                    </p>
                  </div>
                  <div className="divide-y divide-zinc-200">
                    {trustMatrix(selectedIssue).map((item) => (
                      <div key={item.label} className="px-4 py-4">
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <p className="text-xs font-black uppercase tracking-wider text-zinc-900">
                            {item.label}
                          </p>
                          <span className="font-mono text-sm font-black text-[#E11D2E]">
                            {item.value}
                          </span>
                        </div>
                        <div className="h-2 bg-[#F2F1EE]">
                          <div className="h-full bg-[#111111]" style={{ width: `${item.value}%` }} />
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-zinc-500">{item.note}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="grid grid-cols-2 border border-zinc-200 bg-white">
                  <Action icon={BadgeCheck} label="Status" value={selectedIssue.status.replace('_', ' ')} />
                  <Action icon={MapPin} label="Location" value={selectedIssue.lat ? 'Pinned' : 'Estimated'} />
                  <Action icon={ShieldAlert} label="Ward" value={selectedIssue.ward_name ?? 'Manual routing'} />
                  <Action
                    icon={AlertTriangle}
                    label="Geofence Risk"
                    value={
                      selectedIssue.spatial_risk_boost
                        ? `+${selectedIssue.spatial_risk_boost} high-risk boost`
                        : 'No multiplier'
                    }
                  />
                  <Action icon={RadioTower} label="Dispatch" value={statusCopy(selectedIssue)} wide />
                  <Action icon={DatabaseZap} label="Source" value="Gemini ingestion cache" />
                  <Action icon={Clock3} label="SLA" value={selectedIssue.trust_score >= 88 ? 'Immediate' : 'Queued'} />
                </section>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center px-8 text-center">
              <div>
                <Activity className="mx-auto h-8 w-8 text-[#E11D2E]" />
                <p className="mt-4 text-sm font-black uppercase tracking-widest text-zinc-900">
                  No inspection node selected
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}

function DispatchTicker({ selectedIssue }: { selectedIssue: Issue | undefined }) {
  const selectedCode = selectedIssue ? trackingId(selectedIssue.id) : 'CIV-PENDING'
  const tickerItems = [
    '[INGESTION CACHE OPTIMIZED]',
    `[GEMINI EXTRACTED TICKET ${selectedCode} VIA EDGE LOOP]`,
    '[WARD RESPONSE LATENCY RECALCULATED]',
    '[TRUST ENGINE MATRIX NORMALIZED]',
  ]

  return (
    <div
      data-testid="dispatch-ticker"
      className="h-[22px] overflow-hidden border-b border-[#111111] bg-[#111111] font-mono text-[10px] font-bold uppercase tracking-widest text-white"
    >
      <div className="admin-dispatch-ticker flex h-full items-center whitespace-nowrap">
        {[...tickerItems, ...tickerItems].map((item, index) => (
          <span
            key={`${item}-${index}`}
            className={index % 2 === 0 ? 'mx-6 text-[#E11D2E]' : 'mx-6 text-white'}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-4">
      <p className="font-mono text-3xl font-black leading-none text-zinc-900">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</p>
    </div>
  )
}

function VisualEvidence({ issue }: { issue: Issue }) {
  if (issue.image_url) {
    return (
      <div className="border-b border-zinc-200">
        <img
          src={issue.image_url}
          alt={`${issue.issue_type} ingestion`}
          className="h-64 w-full object-cover grayscale transition-all duration-300 hover:grayscale-0"
        />
      </div>
    )
  }

  return (
    <div className="relative h-64 overflow-hidden border-b border-zinc-200 bg-[#F2F1EE]">
      <div className="absolute inset-0 [background-image:linear-gradient(#D4D4D8_1px,transparent_1px),linear-gradient(90deg,#D4D4D8_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="absolute left-8 top-8 h-36 w-56 border-2 border-[#E11D2E]" />
      <div className="absolute left-14 top-14 h-20 w-36 border border-[#111111] bg-white/70" />
      <div className="absolute right-8 top-10 border border-[#111111] bg-white px-3 py-2">
        <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
          Gemini Visual Parse
        </p>
        <p className="mt-1 text-xl font-black leading-none text-zinc-900">{issue.issue_type}</p>
      </div>
      <div className="absolute bottom-8 left-8 right-8 border border-zinc-200 bg-white px-4 py-3">
        <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          Evidence frame synthesized from live report metadata
        </p>
        <p className="mt-1 text-sm font-black uppercase tracking-wider text-zinc-900">
          {issue.severity} severity // {issue.trust_score} trust
        </p>
      </div>
    </div>
  )
}

function Action({
  icon: Icon,
  label,
  value,
  wide = false,
}: {
  icon: typeof BadgeCheck
  label: string
  value: string
  wide?: boolean
}) {
  return (
    <div className={`border-b border-r border-zinc-200 px-4 py-4 ${wide ? 'col-span-2' : ''}`}>
      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
        <Icon className="h-4 w-4" />
        {label}
      </p>
      <p className="mt-2 text-sm font-black leading-tight text-zinc-900">{value}</p>
    </div>
  )
}
