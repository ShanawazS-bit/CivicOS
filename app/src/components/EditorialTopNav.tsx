import { Link, useLocation } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { cn } from '@/lib/utils'

const sectionLinks = [
  { href: '/#intro', label: 'Intro' },
  { href: '/#pipeline', label: 'Pipeline' },
  { href: '/#geofence', label: 'Geofence' },
  { href: '/#network', label: 'Network' },
  { href: '/#monetization', label: 'Revenue' },
]

const routeLinks = [
  { to: '/', label: 'Landing' },
  { to: '/home', label: 'Home' },
  { to: '/feed', label: 'Feed' },
  { to: '/report', label: 'Report' },
  { to: '/admin', label: 'Admin' },
]

export function EditorialTopNav() {
  const { pathname } = useLocation()

  return (
    <nav className="sticky left-0 top-0 z-50 flex w-full items-center justify-between border-b-2 border-[#111111] bg-white px-4 py-4 font-sans text-[#111111] dark:border-[#F2F1EE] dark:bg-[#111111] dark:text-[#F2F1EE] sm:px-6">
      <Link to="/" className="flex shrink-0 items-center gap-2">
        <span className="text-[15px] font-black uppercase tracking-widest">CIVIC.OS</span>
        <span className="hidden border border-zinc-200 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#4A4A4A] dark:border-white/20 dark:text-[#C9C2B8] sm:inline">
          v1.0-2026
        </span>
      </Link>

      <div className="flex items-center gap-3 lg:gap-6">
        <div className="hidden items-center gap-5 text-[12px] font-black uppercase tracking-widest xl:flex">
          {sectionLinks.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className="transition-colors duration-300 hover:text-[#E11D2E]"
            >
              {section.label}
            </a>
          ))}
          <a href="/#console" className="transition-colors duration-300 hover:text-[#E11D2E]">
            Console
          </a>
        </div>

        <div className="hidden h-4 w-px bg-zinc-200 dark:bg-white/20 md:block" />

        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest sm:gap-4 sm:text-[11px]">
          {routeLinks.map((route) => {
            const active =
              pathname === route.to ||
              (route.to === '/' && pathname === '/about') ||
              (route.to === '/home' && pathname === '/home')

            return (
              <Link
                key={route.to}
                to={route.to}
                className={cn(
                  'transition-colors hover:text-[#E11D2E]',
                  active && 'text-[#E11D2E]'
                )}
              >
                {route.label}
              </Link>
            )
          })}
        </div>

        <div className="hidden h-4 w-px bg-zinc-200 dark:bg-white/20 sm:block" />
        <div className="hidden items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#4A4A4A] dark:text-[#C9C2B8] lg:flex">
          <Clock className="h-3 w-3 text-[#E11D2E]" />
          <span>Approach Index</span>
        </div>
        <ThemeToggle />
      </div>
    </nav>
  )
}
