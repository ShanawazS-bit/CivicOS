import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EditorialPageShell } from '@/components/EditorialPageShell'
import { ImpactScorecard } from '@/components/ImpactScorecard'
import { NeighborhoodFeed } from '@/components/NeighborhoodFeed'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { PageHeader } from '@/components/ui/page-header'
import { calculateImpact, getUserReports } from '@/services/impactScore'
import { fetchIssues, subscribeToIssues } from '@/services/issueService'
import type { Issue } from '@/types'

const IssueMap = lazy(() =>
  import('@/components/IssueMap').then((m) => ({ default: m.IssueMap }))
)

export function FeedPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [userReports, setUserReports] = useState(getUserReports())

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

  return (
    <EditorialPageShell ticker="02 / Spatial Feed // Neighborhood Dispatch">
      <div className="mb-6 flex items-end justify-between gap-4">
        <PageHeader
          label="Your Neighborhood"
          title="Area Health"
          subtitle="Live civic intelligence in your community"
          className="mb-0"
        />
        <Link to="/report" className="shrink-0">
          <Button variant="accent" size="sm">
            Report
          </Button>
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner label="Syncing neighborhood feed…" />
      ) : (
        <div className="space-y-6">
          <ImpactScorecard metrics={metrics} />

          <Card flat className="overflow-hidden border border-brand-hairline bg-white">
            <div className="border-b border-brand-hairline px-4 py-3">
              <p className="section-header text-xl">Nearby Issues</p>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                Geospatial view
              </p>
            </div>
            <Suspense fallback={<LoadingSpinner label="Loading map…" />}>
              <IssueMap issues={issues} height="280px" showCluster={false} />
            </Suspense>
          </Card>

          <NeighborhoodFeed issues={issues} loading={loading} />
        </div>
      )}
    </EditorialPageShell>
  )
}
