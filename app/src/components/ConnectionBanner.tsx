import { cn } from '@/lib/utils'

interface ConnectionBannerProps {
  mode: 'live' | 'demo'
  className?: string
}

export function ConnectionBanner({ mode, className }: ConnectionBannerProps) {
  if (mode === 'live') return null

  return (
    <div
      className={cn(
        'border-b border-brand-red/20 bg-brand-red/5 px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider text-brand-red',
        className
      )}
    >
      Demo mode — connect Supabase in .env for live data
    </div>
  )
}
