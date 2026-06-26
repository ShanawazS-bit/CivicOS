import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'chip'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-colors active:scale-[0.98] disabled:opacity-50',
          variant === 'primary' &&
            'rounded-full bg-[#111111] px-6 py-3 text-sm text-white hover:bg-[#1A1A1A]',
          variant === 'accent' &&
            'rounded-full bg-[#E11D2E] px-6 py-3 text-sm text-white hover:bg-[#c91928]',
          variant === 'secondary' &&
            'rounded-none border-2 border-[#111111] bg-transparent px-6 py-3 text-xs font-black uppercase tracking-widest text-[#111111] hover:bg-[#111111] hover:text-white',
          variant === 'ghost' &&
            'rounded-full bg-transparent text-[#4A4A4A] hover:text-[#111111]',
          variant === 'chip' &&
            'rounded-full border border-brand-hairline bg-brand-gray px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#111111]',
          size === 'sm' && 'px-4 py-2 text-xs',
          size === 'lg' && 'h-14 px-8 text-base',
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
