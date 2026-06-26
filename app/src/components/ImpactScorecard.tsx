import { Droplets, Heart, TrendingUp, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { ImpactMetrics } from '@/services/impactScore'

interface ImpactScorecardProps {
  metrics: ImpactMetrics
}

export function ImpactScorecard({ metrics }: ImpactScorecardProps) {
  return (
    <Card flat className="overflow-hidden border border-brand-hairline bg-white">
      <div className="bg-brand-dark px-5 py-4">
        <p className="meta-label text-white/70">Emotional Impact Scorecard</p>
        <p className="mt-1 text-4xl font-black leading-[1.1] text-white">{metrics.impactScore}</p>
        <p className="text-sm text-white/70">Community impact score</p>
      </div>

      <div className="grid grid-cols-2 gap-px bg-brand-hairline sm:grid-cols-4">
        {[
          { icon: TrendingUp, label: 'Reports', value: metrics.reportsSubmitted },
          { icon: Heart, label: 'Resolved', value: metrics.resolved },
          {
            icon: Users,
            label: 'People Helped',
            value: `~${metrics.peopleHelped.toLocaleString()}`,
          },
          { icon: Droplets, label: 'Verified', value: metrics.verified },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white px-3 py-4 text-center">
            <Icon className="mx-auto mb-2 h-4 w-4 text-[#E11D2E]" />
            <p className="text-lg font-black leading-[1.1] text-brand-dark">{value}</p>
            <p className="meta-label mt-1 text-[10px]">{label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2 border-t border-brand-hairline p-4">
        {metrics.highlights.map((text, i) => (
          <p
            key={i}
            className="border-l-4 border-[#E11D2E] bg-brand-gray px-3 py-2 text-sm leading-relaxed text-brand-muted"
          >
            {text}
          </p>
        ))}
      </div>
    </Card>
  )
}
