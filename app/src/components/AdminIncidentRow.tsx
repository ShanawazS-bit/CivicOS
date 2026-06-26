import { AlertTriangle, CircleDot, RadioTower } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Issue } from '@/types'

interface AdminIncidentRowProps {
  issue: Issue
  active: boolean
  rank: number
  onSelect: (id: string) => void
}

function formatTrackingId(id: string): string {
  return `CIV-${id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}`
}

function severityLabel(issue: Issue): string {
  return issue.severity.toUpperCase()
}

export function AdminIncidentRow({ issue, active, rank, onSelect }: AdminIncidentRowProps) {
  const critical = issue.trust_score >= 88 || issue.severity.toLowerCase() === 'high'

  return (
    <button
      type="button"
      onClick={() => onSelect(issue.id)}
      className={cn(
        'group w-full border-b border-zinc-200 bg-white px-5 py-4 text-left transition-colors hover:bg-[#F2F1EE]',
        active && 'border-l-4 border-l-[#E11D2E] bg-[#F2F1EE]'
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          {critical ? (
            <AlertTriangle className="h-4 w-4 text-[#E11D2E]" />
          ) : (
            <CircleDot className="h-4 w-4 text-[#111111]" />
          )}
          <span className="text-[11px] font-black uppercase tracking-widest text-[#E11D2E]">
            {severityLabel(issue)} / {issue.issue_type}
          </span>
        </div>
        <span className="font-mono text-[11px] font-bold text-zinc-500">
          #{String(rank).padStart(2, '0')}
        </span>
      </div>

      <h3 className="text-xl font-black leading-tight text-zinc-900">
        {issue.description ?? `${issue.issue_type} detected by civic ingestion pipeline.`}
      </h3>

      <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-4">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            {formatTrackingId(issue.id)}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-zinc-700">
            <RadioTower className="h-3.5 w-3.5 text-[#E11D2E]" />
            {issue.status.replace('_', ' ')}
          </p>
          <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            {issue.ward_name ?? 'Ward pending'}
            {issue.spatial_risk_boost ? ` // +${issue.spatial_risk_boost} geo` : ''}
          </p>
        </div>
        <div className="border border-[#111111] bg-[#111111] px-3 py-2 text-right text-white">
          <p className="font-mono text-2xl font-black leading-none">{issue.trust_score}</p>
          <p className="text-[9px] font-black uppercase tracking-widest">Trust</p>
        </div>
      </div>
    </button>
  )
}
