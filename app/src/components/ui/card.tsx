import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  dark?: boolean
  flat?: boolean
}

export function Card({ children, className, dark, flat, ...props }: CardProps) {
  return (
    <div
      className={cn(
        flat ? 'rounded-none' : 'rounded-none border border-brand-hairline',
        dark ? 'bg-[#111111] text-white' : 'bg-white',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
