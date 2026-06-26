import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Application } from '@splinetool/runtime'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  ChevronDown,
  Clock,
  Eye,
  Layers,
  ShieldCheck,
} from 'lucide-react'
import { ImageRiskTimeline } from '@/components/ImageRiskTimeline'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ABOUT_SCENE_PATH } from '@/lib/preloadAboutExperience'

const scenePath = ABOUT_SCENE_PATH

const sections = [
  {
    id: 'intro',
    eyebrow: 'INTRO // SPATIAL TRANSLATION',
    title: 'One civic signal. No municipal noise.',
    copy:
      'CivicOS turns a single image payload into structured operational telemetry, removing the brittle form fields that usually slow down local reporting.',
    icon: Eye,
  },
  {
    id: 'pipeline',
    eyebrow: 'PIPELINE // MULTIMODAL SYNTHESIS',
    title: 'Vision, location, severity, and trust converge.',
    copy:
      'The system extracts issue type, confidence, severity, and coordinate context before the report ever reaches a command desk.',
    icon: Layers,
  },
  {
    id: 'network',
    eyebrow: 'NETWORK // DUPLICATE SUPPRESSION',
    title: 'Repeated complaints become one actionable node.',
    copy:
      'Spatial filtering collapses overlapping reports into unique clusters, giving administrators a cleaner queue with stronger trust metrics.',
    icon: ShieldCheck,
  },
]

export function AboutPage() {
  return (
    <div className="min-h-screen scroll-smooth overflow-x-hidden bg-[#F2F1EE] font-sans text-[#111111] antialiased selection:bg-[#E11D2E]/20 dark:bg-[#111111] dark:text-[#F2F1EE]">
      <nav className="fixed left-0 top-0 z-50 flex w-full items-center justify-between border-b-2 border-[#111111] bg-white px-6 py-4 dark:border-[#F2F1EE] dark:bg-[#111111]">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-[15px] font-black uppercase tracking-widest text-[#111111] dark:text-[#F2F1EE]">
            CIVIC.OS
          </span>
          <span className="border border-zinc-200 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#4A4A4A] dark:border-white/20 dark:text-[#C9C2B8]">
            v1.0-2026
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-6 text-[12px] font-black uppercase tracking-widest md:flex">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="transition-colors duration-300 hover:text-[#E11D2E]"
              >
                {section.id}
              </a>
            ))}
            <a href="#console" className="transition-colors duration-300 hover:text-[#E11D2E]">
              console
            </a>
          </div>
          <div className="h-4 w-px bg-zinc-200 dark:bg-white/20" />
          <div className="hidden items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#4A4A4A] dark:text-[#C9C2B8] sm:flex">
            <Clock className="h-3 w-3 text-[#E11D2E]" />
            <span>Approach Index</span>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <main>
        <section
          id="intro"
          className="relative min-h-screen overflow-hidden border-b border-zinc-200 bg-[#F2F1EE] px-6 pt-20 dark:border-white/10 dark:bg-[#111111] md:px-16"
        >
          <SceneStage />
          <EdgeLabel label="CIVIC MODEL // IMAGE_TO_TRUST_ENGINE" />

          <div className="relative z-10 flex min-h-[calc(100vh-80px)] items-end pb-24">
            <FadeIn className="max-w-[600px] border border-zinc-200 bg-white p-10 dark:border-white/15 dark:bg-[#171717]">
              <span className="mb-3 block font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
                // Autonomous municipal intake
              </span>
              <h1 className="text-[41px] font-black leading-[0.90] tracking-normal text-[#111111] dark:text-[#F2F1EE] md:text-[51px]">
                Autonomous sorting of municipal breakdowns.
              </h1>
              <p className="mt-8 max-w-md text-left text-[16px] leading-[1.45] tracking-normal text-[#4A4A4A] dark:text-[#C9C2B8]">
                One image payload. Zero user fields. A direct engineering stream designed to
                bypass reporting friction and isolate structural duplicates before they reach the
                city desk.
              </p>
              <a
                href="#pipeline"
                className="mt-8 inline-flex items-center gap-2 border border-[#111111] bg-[#111111] px-4 py-2 text-[12px] font-black uppercase tracking-widest text-white transition-colors duration-300 hover:border-[#E11D2E] hover:bg-[#E11D2E]"
              >
                Analyze System Architecture
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </FadeIn>
          </div>

          <div className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#4A4A4A] dark:text-[#C9C2B8] md:flex">
            <span>Scroll To Continue</span>
            <ChevronDown className="h-3 w-3 text-[#E11D2E]" />
          </div>
        </section>

        <PipelineSection />
        <NetworkSection />

        <footer
          id="console"
          className="relative overflow-hidden border-t border-zinc-200 bg-[#F2F1EE] px-6 py-32 dark:border-white/10 dark:bg-[#111111] md:px-16"
        >
          <div className="relative z-10 grid items-center gap-16 lg:grid-cols-[1fr_420px]">
            <FadeIn>
              <span className="block border-l-2 border-[#E11D2E] pl-3 font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
                [ COMMAND_VIEWPORT ]
              </span>
              <h2 className="mt-8 max-w-3xl text-left text-[41px] font-black leading-[0.90] tracking-normal text-[#111111] dark:text-[#F2F1EE] md:text-[51px]">
                From public observation to verified municipal action.
              </h2>
            </FadeIn>

            <FadeIn delay={0.1} className="border border-zinc-200 bg-white p-8 text-left dark:border-white/15 dark:bg-[#171717]">
              <p className="text-[16px] leading-[1.45] tracking-normal text-[#4A4A4A] dark:text-[#C9C2B8]">
                The administration console receives structured incidents ordered by trust score,
                severity, geospatial uniqueness, and dispatch urgency. The result is not a
                comment box. It is an operational queue.
              </p>
              <Link
                to="/admin"
                className="mt-8 inline-flex border border-[#111111] bg-[#111111] px-6 py-3 text-[12px] font-black uppercase tracking-widest text-white transition-colors duration-300 hover:border-[#E11D2E] hover:bg-[#E11D2E]"
              >
                Launch Administration Console
              </Link>
            </FadeIn>
          </div>
        </footer>
      </main>
    </div>
  )
}

function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.24 }}
      transition={{ delay, duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}

function SceneStage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading')

  useEffect(() => {
    let disposed = false
    let app: Application | null = null

    async function loadScene() {
      const canvas = canvasRef.current
      if (!canvas) return

      try {
        app = new Application(canvas, { renderMode: 'continuous' })
        const response = await fetch(scenePath)
        if (!response.ok) throw new Error(`Unable to load ${scenePath}`)
        const sceneBuffer = await response.arrayBuffer()
        if (disposed) return
        app.start(sceneBuffer)
        const syncBackground = () => {
          app?.setBackgroundColor(document.documentElement.classList.contains('dark') ? '#111111' : '#FFFFFF')
        }
        syncBackground()
        const observer = new MutationObserver(syncBackground)
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
        setStatus('ready')
        return () => observer.disconnect()
      } catch {
        if (!disposed) setStatus('fallback')
      }
    }

    let cleanup: (() => void) | undefined
    void loadScene().then((disposeObserver) => {
      cleanup = disposeObserver
    })

    return () => {
      disposed = true
      cleanup?.()
      app?.dispose()
    }
  }, [])

  return (
    <div className="absolute inset-0 z-0">
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#F2F1EE] font-mono text-[10px] font-bold uppercase tracking-widest text-[#4A4A4A] dark:bg-[#111111] dark:text-[#C9C2B8]">
          Initializing Civic Infrastructure Model...
        </div>
      )}

      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full origin-center translate-x-[30vw] -translate-y-[2vh] scale-[0.88] transition-opacity duration-300 lg:translate-x-[23vw] lg:scale-[0.92] ${
          status === 'ready' ? 'opacity-95' : 'opacity-0'
        }`}
      />

      {status === 'fallback' && <ModelFallback />}
    </div>
  )
}

function ModelFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative h-[360px] w-[360px] border border-zinc-200 bg-white dark:border-white/15 dark:bg-[#171717]">
        <div className="absolute left-16 top-16 h-56 w-56 border-2 border-[#111111] dark:border-[#F2F1EE]" />
        <div className="absolute left-28 top-28 h-28 w-28 border-2 border-[#E11D2E]" />
        <div className="absolute bottom-8 left-8 border border-zinc-200 bg-white px-4 py-3 dark:border-white/15 dark:bg-[#111111]">
          <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
            Local Spline Scene
          </p>
          <p className="mt-1 max-w-[220px] text-sm font-black leading-tight text-[#111111] dark:text-[#F2F1EE]">
            WebGL unavailable in this browser; rendering structural fallback.
          </p>
        </div>
      </div>
    </div>
  )
}

function PipelineSection() {
  const steps = [
    {
      icon: Eye,
      label: '01 / Ingest',
      title: 'One image becomes a structured ticket.',
      copy:
        'CivicOS removes dropdowns and text-heavy forms. A citizen image becomes an issue type, severity estimate, description, and source packet.',
    },
    {
      icon: Layers,
      label: '02 / Synthesize',
      title: 'Vision and location become trust signals.',
      copy:
        'The multimodal layer compares image confidence, coordinates, recency, and issue class so the city receives a scored signal instead of a raw complaint.',
    },
    {
      icon: ShieldCheck,
      label: '03 / Route',
      title: 'Duplicates collapse before dispatch.',
      copy:
        'Nearby repeated reports are clustered into one operational node, preserving citizen signal without flooding administrators with redundant tickets.',
    },
  ]

  return (
    <section
      id="pipeline"
      className="border-b border-zinc-200 bg-white px-6 py-32 dark:border-white/10 dark:bg-[#111111] md:px-16"
    >
      <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[380px_minmax(0,1fr)]">
        <FadeIn>
          <span className="block border-l-2 border-[#E11D2E] pl-3 font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
            [ PIPELINE // MULTIMODAL SYNTHESIS ]
          </span>
          <h2 className="mt-10 text-left text-[41px] font-black leading-[0.90] tracking-normal text-[#111111] dark:text-[#F2F1EE] md:text-[51px]">
            The reporting flow is compressed into three machine-readable moves.
          </h2>
          <p className="mt-10 max-w-sm text-[16px] leading-[1.45] text-[#4A4A4A] dark:text-[#C9C2B8]">
            The approach is intentionally narrow: capture the physical condition, classify the
            civic issue, and route only the strongest operational signal.
          </p>
        </FadeIn>

        <FadeIn delay={0.08} className="divide-y divide-zinc-200 border border-zinc-200 bg-white dark:divide-white/10 dark:border-white/15 dark:bg-[#171717]">
          {steps.map(({ icon: Icon, label, title, copy }) => (
            <article key={label} className="grid gap-7 bg-white p-8 dark:bg-[#171717] md:grid-cols-[160px_1fr]">
              <div>
                <Icon className="h-5 w-5 text-[#E11D2E]" />
                <p className="mt-4 font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
                  {label}
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-black leading-[1.05] text-[#111111] dark:text-[#F2F1EE]">{title}</h3>
                <p className="mt-5 max-w-2xl text-[16px] leading-[1.5] text-[#4A4A4A] dark:text-[#C9C2B8]">
                  {copy}
                </p>
              </div>
            </article>
          ))}
        </FadeIn>

        <FadeIn delay={0.12} className="lg:col-span-2">
          <ImageRiskTimeline />
        </FadeIn>
      </div>
    </section>
  )
}

function NetworkSection() {
  return (
    <section id="network" className="border-b border-zinc-200 bg-[#F2F1EE] px-6 py-32 dark:border-white/10 dark:bg-[#111111] md:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
          <FadeIn className="border border-[#111111] bg-[#111111] p-10 text-white dark:border-white/20">
            <span className="font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
              [ NETWORK // DUPLICATE SUPPRESSION ]
            </span>
            <h2 className="mt-8 max-w-3xl text-[41px] font-black leading-[0.90] tracking-normal md:text-[51px]">
              Repeated complaints become one accountable dispatch node.
            </h2>
            <p className="mt-8 max-w-xl text-[15px] leading-[1.45] text-white/70">
              Most civic reporting tools reward volume. CivicOS rewards uniqueness, confidence,
              and municipal actionability. That means ten photos of the same pothole become one
              high-trust node instead of ten disconnected inbox items.
            </p>
          </FadeIn>

          <FadeIn delay={0.1} className="border border-zinc-200 bg-white p-8 dark:border-white/15 dark:bg-[#171717]">
            <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
              Trust Engine Matrix
            </p>
            <div className="mt-8 space-y-5">
              {[
                ['Vision Confidence', 'Gemini classification and evidence match'],
                ['Spatial Uniqueness', 'Nearby duplicate reports collapse into a cluster'],
                ['Severity Weight', 'Risk and urgency shape the queue position'],
                ['Dispatch Readiness', 'Only actionable nodes reach the admin console'],
              ].map(([label, copy], index) => (
                <div key={label} className="border-t border-zinc-200 pt-5 dark:border-white/10">
                  <div className="flex items-start gap-4">
                    <span className="font-mono text-xl font-black text-[#E11D2E]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="text-base font-black uppercase tracking-wider text-[#111111] dark:text-[#F2F1EE]">
                        {label}
                      </h3>
                      <p className="mt-2 text-sm leading-[1.45] text-[#4A4A4A] dark:text-[#C9C2B8]">{copy}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

function EdgeLabel({ label }: { label: string }) {
  return (
    <div className="absolute right-4 top-1/2 z-10 hidden origin-right translate-x-4 -translate-y-1/2 rotate-90 lg:block">
      <span className="whitespace-nowrap font-mono text-[10px] font-bold uppercase tracking-widest text-[#4A4A4A] dark:text-[#C9C2B8]">
        {label}
      </span>
    </div>
  )
}
