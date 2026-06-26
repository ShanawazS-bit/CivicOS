import type { ReactNode } from 'react'

const edition = new Date().toISOString().slice(0, 10).replace(/-/g, '.')

interface EditorialPageShellProps {
  ticker: string
  children: ReactNode
  wide?: boolean
}

/** Shared newsroom frame: parchment canvas + source ticker (STYLES.md / NEWS_FORMAT). */
export function EditorialPageShell({ ticker, children, wide }: EditorialPageShellProps) {
  return (
    <div
      className={`mx-auto w-full px-4 py-6 font-sans antialiased text-[#111111] ${
        wide ? 'max-w-6xl' : 'max-w-2xl'
      }`}
    >
      <div className="mb-6 flex items-end justify-between border-b-2 border-[#111111] pb-2">
        <span className="text-xs font-black uppercase tracking-widest text-[#E11D2E]">
          {ticker}
        </span>
        <span className="font-mono text-xs font-bold text-[#4A4A4A]">EDITION {edition}</span>
      </div>
      {children}
    </div>
  )
}
