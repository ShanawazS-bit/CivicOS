import { cn } from '@/lib/utils'

interface PageHeaderProps {
  label?: string
  title: string
  subtitle?: string
  className?: string
}

export function PageHeader({ label, title, subtitle, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-6', className)}>
      {label && <p className="meta-label mb-2">{label}</p>}
      <h1 className="headline">{title}</h1>
      {subtitle && <p className="body-copy mt-2 max-w-prose">{subtitle}</p>}
    </header>
  )
}
