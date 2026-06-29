import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { calculateImpact, getUserReports } from '@/services/impactScore'
import { fetchIssues, subscribeToIssues } from '@/services/issueService'
import { cleanDescription } from '@/lib/formatters'
import { feedMessage, severityColor } from '@/lib/severityColor'
import type { Issue } from '@/types'
import { cn } from '@/lib/utils'

const IssueMap = lazy(() =>
  import('@/components/IssueMap').then((m) => ({ default: m.IssueMap }))
)

type MapView = 'top10' | 'all' | 'category'
const TOP_N = 10

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function FeedPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [userReports, setUserReports] = useState(getUserReports())
  const [mapView, setMapView] = useState<MapView>('top10')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  async function load() {
    try {
      const data = await fetchIssues()
      setIssues(data)
    } finally {
      setLoading(false)
      setUserReports(getUserReports())
    }
  }

  useEffect(() => {
    load()
    return subscribeToIssues(load)
  }, [])

  const metrics = calculateImpact(issues, userReports)

  const categories = useMemo(() => {
    const seen = new Set<string>()
    issues.forEach((i) => { if (i.issue_type) seen.add(i.issue_type) })
    return Array.from(seen).sort()
  }, [issues])

  const displayedIssues = useMemo(() => {
    if (mapView === 'top10') {
      return [...issues]
        .sort((a, b) => (b.confidence ?? b.trust_score ?? 0) - (a.confidence ?? a.trust_score ?? 0))
        .slice(0, TOP_N)
    }
    if (mapView === 'category' && selectedCategory) {
      return issues.filter((i) => i.issue_type === selectedCategory)
    }
    return issues
  }, [issues, mapView, selectedCategory])

  const sortedIssues = useMemo(
    () => [...issues].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [issues]
  )

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner label="Syncing neighborhood feed…" />
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden">

      {/* ── FULL-BLEED MAP (fills entire viewport) ── */}
      <div className="absolute inset-0">
        <Suspense fallback={<LoadingSpinner label="Loading map…" />}>
          <IssueMap
            issues={displayedIssues}
            selectedId={selectedId}
            onSelectIssue={(id) => setSelectedId((prev) => (prev === id ? null : id))}
            height="100%"
            showCluster={false}
          />
        </Suspense>
      </div>

      {/* ── LEFT FLOATING PANEL (overlays the map, Google Maps style) ── */}
      <div className="absolute left-0 top-0 z-10 flex h-full w-full flex-col sm:w-[400px] sm:p-3">
        <div className="flex h-full flex-col overflow-hidden bg-white/95 shadow-2xl backdrop-blur-sm sm:rounded-xl sm:border sm:border-brand-hairline">

          {/* Panel header */}
          <div className="shrink-0 border-b-2 border-brand-dark px-4 py-3">
            <p className="font-sans text-lg font-black leading-tight text-brand-dark">Area Health</p>
            <p className="mt-0.5 text-[10px] font-black uppercase tracking-widest text-brand-red">
              {issues.length} issue{issues.length !== 1 ? 's' : ''} · {displayedIssues.length} on map
            </p>
          </div>

          {/* Impact stats bar */}
          <div className="grid shrink-0 grid-cols-4 border-b border-brand-hairline">
            {[
              { val: metrics.totalReports, label: 'Reports' },
              { val: metrics.resolvedCount, label: 'Resolved' },
              { val: `~${metrics.estimatedPeopleHelped}`, label: 'Helped' },
              { val: metrics.verifiedCount, label: 'Verified' },
            ].map(({ val, label }) => (
              <div key={label} className="border-r border-brand-hairline px-3 py-2 text-center last:border-r-0">
                <p className="font-sans text-base font-black text-brand-dark">{val}</p>
                <p className="text-[9px] font-black uppercase tracking-wider text-brand-muted">{label}</p>
              </div>
            ))}
          </div>

          {/* Map filter controls */}
          <div className="flex shrink-0 items-center border-b border-brand-hairline">
            <ViewBtn active={mapView === 'top10'} onClick={() => { setMapView('top10'); setSelectedCategory(null) }}>
              Top {TOP_N}
            </ViewBtn>
            <ViewBtn active={mapView === 'all'} onClick={() => { setMapView('all'); setSelectedCategory(null) }}>
              All
            </ViewBtn>
            <ViewBtn
              active={mapView === 'category'}
              onClick={() => {
                setMapView('category')
                if (!selectedCategory && categories.length > 0) setSelectedCategory(categories[0])
              }}
            >
              Category
            </ViewBtn>
          </div>

          {/* Category pills */}
          {mapView === 'category' && categories.length > 0 && (
            <div className="flex shrink-0 flex-wrap gap-1.5 border-b border-brand-hairline px-3 py-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider transition-colors',
                    selectedCategory === cat
                      ? 'border-brand-red bg-brand-red text-white'
                      : 'border-brand-hairline bg-brand-gray text-brand-muted hover:border-brand-red hover:text-brand-red'
                  )}
                >
                  {cat.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          )}

          {/* Scrollable issue list */}
          <div className="flex-1 divide-y divide-brand-hairline overflow-y-auto">
            {sortedIssues.length === 0 && (
              <p className="p-4 text-sm text-brand-muted">No issues in your area yet.</p>
            )}
            {sortedIssues.map((issue) => {
              const active = selectedId === issue.id
              return (
                <button
                  key={issue.id}
                  type="button"
                  onClick={() => setSelectedId(active ? null : issue.id)}
                  className={cn(
                    'group w-full px-4 py-3 text-left transition-colors hover:bg-brand-gray/60',
                    active && 'bg-brand-gray/80 border-l-[3px] border-l-brand-red'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span
                        className="mt-1 h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: severityColor(issue.severity) }}
                      />
                      <p className="text-[13px] font-bold leading-snug text-brand-dark">
                        {feedMessage(issue)}
                      </p>
                    </div>
                    <span className="shrink-0 text-[9px] font-black uppercase tracking-wider text-brand-muted">
                      {timeAgo(issue.created_at)}
                    </span>
                  </div>

                  {cleanDescription(issue.description) && (
                    <p className="ml-4 mt-0.5 line-clamp-1 text-[12px] leading-snug text-brand-muted">
                      {cleanDescription(issue.description)}
                    </p>
                  )}

                  <div className="ml-4 mt-1.5 flex flex-wrap gap-1">
                    <span className="bg-brand-dark px-1.5 py-px text-[9px] font-black text-white">
                      Trust {issue.trust_score}
                    </span>
                    <span className="border border-brand-hairline px-1.5 py-px text-[9px] font-black uppercase tracking-wider text-brand-muted">
                      {issue.status.replace('_', ' ')}
                    </span>
                    {issue.ward_name && (
                      <span className="border border-brand-hairline px-1.5 py-px text-[9px] font-black uppercase tracking-wider text-brand-muted">
                        {issue.ward_name}
                      </span>
                    )}
                    {Boolean(issue.spatial_risk_boost) && (
                      <span className="border border-brand-red px-1.5 py-px text-[9px] font-black uppercase tracking-wider text-brand-red">
                        +{issue.spatial_risk_boost}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── helpers ─────────────────────────────────────────────────────────────────

function ViewBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 py-2 text-center font-mono text-[10px] font-black uppercase tracking-widest transition-colors',
        active ? 'bg-brand-dark text-white' : 'bg-white text-brand-muted hover:text-brand-red'
      )}
    >
      {children}
    </button>
  )
}
