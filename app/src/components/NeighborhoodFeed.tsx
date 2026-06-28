import { Card } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { cleanDescription } from '@/lib/formatters'
import type { Issue } from '@/types'
import { feedMessage } from '@/lib/severityColor'

interface NeighborhoodFeedProps {
  issues: Issue[]
  loading?: boolean
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function NeighborhoodFeed({ issues, loading }: NeighborhoodFeedProps) {
  const sorted = [...issues].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <Card flat className="overflow-hidden border border-brand-hairline bg-white">
      <div className="border-b-2 border-brand-dark px-4 py-3">
        <p className="section-header text-xl">Your Area Health Feed</p>
        <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">
          Hyper-local updates from your neighborhood
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading && <LoadingSpinner label="Loading feed…" />}
        {!loading && sorted.length === 0 && (
          <p className="body-copy p-4 text-sm">No issues in your area yet.</p>
        )}
        {sorted.map((issue) => (
          <div
            key={issue.id}
            className="border-b border-brand-hairline px-4 py-3 last:border-0 hover:bg-brand-gray/50"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-black leading-[1.15] text-brand-dark">
                {feedMessage(issue)}
              </p>
              <span className="meta-label shrink-0 text-[10px]">{timeAgo(issue.created_at)}</span>
            </div>
            {cleanDescription(issue.description) && (
              <p className="body-copy mt-1 line-clamp-2 text-sm">{cleanDescription(issue.description)}</p>
            )}
            <div className="mt-2 flex gap-2">
              <span className="border border-brand-hairline bg-brand-gray px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-brand-muted">
                {issue.status.replace('_', ' ')}
              </span>
              {issue.ward_name && (
                <span className="border border-brand-hairline bg-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-brand-muted">
                  {issue.ward_name}
                </span>
              )}
              {Boolean(issue.spatial_risk_boost) && (
                <span className="border border-[#E11D2E] bg-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#E11D2E]">
                  +{issue.spatial_risk_boost} geo risk
                </span>
              )}
              <span className="bg-brand-dark px-2.5 py-0.5 text-[10px] font-black text-white">
                Trust {issue.trust_score}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
