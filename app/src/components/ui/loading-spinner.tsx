import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  label?: string
  className?: string
}

export function LoadingSpinner({ label = 'Loading…', className }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-8', className)}>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-gray border-t-[#E11D2E]" />
      <p className="text-sm text-brand-muted">{label}</p>
    </div>
  )
}
