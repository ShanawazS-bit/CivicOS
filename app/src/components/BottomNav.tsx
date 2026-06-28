import { Link, useLocation } from 'react-router-dom'
import { Building2, Camera, Home, Newspaper } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/feed', label: 'Feed', icon: Newspaper },
  { to: '/report', label: 'Report', icon: Camera },
  { to: '/admin', label: 'Admin', icon: Building2 },
]

export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-[#111111] bg-white">
      <div
        className="mx-auto flex h-[83px] max-w-lg items-center justify-around px-2"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {links.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to === '/home' && pathname === '/')
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex min-w-[64px] flex-col items-center gap-1 px-3 py-2 text-[11px] font-black uppercase tracking-wider transition-colors',
                active ? 'text-[#E11D2E]' : 'text-[#4A4A4A]'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'stroke-[2.5px]')} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
