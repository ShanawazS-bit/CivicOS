import { useEffect, useState } from 'react'
import { clearGeminiCache, getGeminiCacheStats } from '@/services/geminiService'
import { cn } from '@/lib/utils'

/** Dev-only badge showing ML localStorage cache status. */
export function GeminiCacheBadge({ className }: { className?: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    setCount(getGeminiCacheStats().count)
  }, [])

  if (!import.meta.env.DEV) return null

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 border border-brand-hairline bg-white px-3 py-1.5',
        className
      )}
    >
      <span className="meta-label text-brand-muted">ML cache: {count} stored</span>
      {count > 0 && (
        <button
          type="button"
          onClick={() => {
            clearGeminiCache()
            setCount(0)
          }}
          className="text-xs font-black uppercase tracking-wider text-[#E11D2E]"
        >
          Clear
        </button>
      )}
    </div>
  )
}
