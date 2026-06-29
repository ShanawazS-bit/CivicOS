import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Application } from '@splinetool/runtime'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  ChevronDown,
  DollarSign,
  Eye,
  FileSearch,
  Layers,
  MapPinned,
  Network,
  RadioTower,
  Route,
  ShieldCheck,
} from 'lucide-react'
import { ImageRiskTimeline } from '@/components/ImageRiskTimeline'
import { CIVIC_GEOFENCES } from '@/lib/geofencing'
import { DEMO_UTILITY_PLANS, TRANSIT_FRICTION_SAMPLES } from '@/lib/monetization'
import { ABOUT_SCENE_PATH } from '@/lib/preloadAboutExperience'

const scenePath = ABOUT_SCENE_PATH

export function AboutPage() {
  return (
    <div className="min-h-screen scroll-smooth overflow-x-hidden bg-[#F2F1EE] font-sans text-[#111111] antialiased selection:bg-[#E11D2E]/20 dark:bg-[#111111] dark:text-[#F2F1EE]">
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
                SIGNAL OVER NOISE
              </h1>
              <p className="mt-8 max-w-md text-left text-[16px] leading-[1.45] tracking-normal text-[#4A4A4A] dark:text-[#C9C2B8]">
                It’s one stone, two birds. The user product stays beautifully simple: report a problem with a photo. But the real engine is the commercial layer behind the city desk — matching verified repair demand with utility work, route-risk buyers, and coordination APIs.
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
        <GeofenceSection />
        <NetworkSection />
        <MonetizationSection />

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
                 Nothing Changes if Nothing changes. Take Action today.
              </h2>
            </FadeIn>

            <FadeIn delay={0.1} className="border border-zinc-200 bg-white p-8 text-left dark:border-white/15 dark:bg-[#171717]">

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
      title: 'A photo or voice note replaces the form.',
      copy: (
        <>
          Citizens skip messy forms — one image or a quick <strong>Voice Report</strong> auto-generates the <strong>issue type</strong>, <strong>severity score</strong>, and <strong>description</strong> using an on-device <strong>MobileNet AI</strong>. Need specific routing? Users can always manually override their <strong>Region and Municipality</strong> right from the upload screen.
        </>
      ),
    },
    {
      icon: FileSearch,
      label: '02 / EXIF Check',
      title: 'Is this photo real — and taken here?',
      copy: (
        <>
          Every image carries hidden <strong>EXIF metadata</strong>: the exact <strong>timestamp</strong>, <strong>GPS coordinates</strong>, and <strong>device</strong> it was shot on. If any of that conflicts with the report, the system flags it — because a misplaced report wastes dispatch time.
        </>
      ),
    },
    {
      icon: Layers,
      label: '03 / Synthesize',
      title: 'Raw upload becomes a scored signal.',
      copy: (
        <>
          The <strong>ML layer</strong> weighs image confidence, location, recency, and issue class together — so administrators get an <strong>actionable score</strong>, not just a raw photo.
        </>
      ),
    },
    {
      icon: ShieldCheck,
      label: '04 / Deduplicate',
      title: 'Ten reports of the same pothole → one ticket.',
      copy: (
        <>
          <strong>PostGIS spatial clustering</strong> merges nearby reports into a single <strong>dispatch node</strong>. City inboxes stay clean; the signal stays strong.
        </>
      ),
    },
    {
      icon: MapPinned,
      label: '05 / Geofence & Route',
      title: 'Right ward. Right desk. Right now.',
      copy: (
        <>
          Automated <strong>geofencing</strong> routes issues to the correct municipality. But the real magic is the <strong>"Dig Once" approach</strong>: our system cross-references these issues with planned utility work (like laying fiber or fixing pipes). If a pothole sits above a planned water main repair, we flag them to be fixed together — saving the city money and reducing construction traffic.
        </>
      ),
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
            [ PIPELINE ]
          </span>
          <h2 className="mt-10 text-left text-[41px] font-black leading-[0.90] tracking-normal text-[#111111] dark:text-[#F2F1EE] md:text-[51px]">
            The Admin Queue
          </h2>
          <p className="mt-10 max-w-sm text-[16px] leading-[1.45] text-[#4A4A4A] dark:text-[#C9C2B8]">
            The administration console doesn't give city workers a messy comment box to read. Instead, it uses our <strong>MobileNet AI model</strong> to instantly classify the issue type from the photo. It then sorts every report into an operational queue, ordered by <strong>Trust Score</strong> (using EXIF metadata verification), <strong>Severity</strong>, and <strong>Geospatial uniqueness</strong> (using PostGIS clustering).
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

function GeofenceSection() {
  const boundary = CIVIC_GEOFENCES.find((fence) => fence.fenceType === 'boundary')
  const wards = CIVIC_GEOFENCES.filter((fence) => fence.fenceType === 'ward')
  const riskZones = CIVIC_GEOFENCES.filter((fence) => fence.fenceType === 'high_risk')
  const spatialRules = [
    {
      icon: ShieldCheck,
      label: '01 / Boundary Gate',
      title: 'Outside reports are stopped before they enter the queue.',
      copy:
        'The upload point is checked against the municipal service boundary first, so CivicOS does not create operational noise for locations the city cannot dispatch against.',
    },
    {
      icon: RadioTower,
      label: '02 / Ward Router',
      title: 'Valid reports inherit the desk responsible for that polygon.',
      copy:
        'A coordinate becomes a ward assignment, route label, and administrative owner without asking residents to understand city department boundaries.',
    },
    {
      icon: MapPinned,
      label: '03 / Risk Multiplier',
      title: 'Known vulnerable zones add urgency to the trust score.',
      copy:
        'Flood-prone, drainage-sensitive, or repeat-failure areas can add a bounded spatial boost so the same image carries more operational weight in the right place.',
    },
  ]

  return (
    <section
      id="geofence"
      className="border-b border-zinc-200 bg-[#F2F1EE] px-6 py-36 dark:border-white/10 dark:bg-[#111111] md:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-16 lg:grid-cols-[420px_minmax(0,1fr)]">
          <FadeIn>
            <span className="block border-l-2 border-[#E11D2E] pl-3 font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
              [ GEOFENCE // WARD ROUTING ]
            </span>
            <h2 className="mt-10 text-left text-[41px] font-black leading-[0.90] tracking-normal text-[#111111] dark:text-[#F2F1EE] md:text-[51px]">
            because CIVIC.OS is not a Whatsapp Announcement Channel.
            </h2>
            <p className="mt-10 max-w-sm text-[16px] leading-[1.45] text-[#4A4A4A] dark:text-[#C9C2B8]">
              Before a report reaches administrators, CivicOS asks three questions: is it inside
              the city boundary, which ward owns it, and does its location sit inside a known risk
              zone?
            </p>
          </FadeIn>

          <FadeIn
            delay={0.08}
            className="border border-zinc-200 bg-white dark:border-white/15 dark:bg-[#171717]"
          >
            <div className="border-b border-zinc-200 p-6 dark:border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
                    Service Boundary Model
                  </p>
                  <h3 className="mt-2 text-2xl font-black leading-[1.05] text-[#111111] dark:text-[#F2F1EE]">
                    {boundary?.name ?? 'Municipal Service Boundary'}
                  </h3>
                </div>
                <div className="border border-[#111111] bg-[#111111] px-4 py-3 text-white dark:border-[#F2F1EE]">
                  <p className="font-mono text-[10px] font-black uppercase tracking-widest">
                    {wards.length.toString().padStart(2, '0')} Wards
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="relative min-h-[430px] overflow-hidden border-b border-zinc-200 bg-[#F2F1EE] dark:border-white/10 dark:bg-[#111111] lg:border-b-0 lg:border-r">
                <div className="absolute inset-8 border-2 border-[#111111] dark:border-[#F2F1EE]" />
                <div className="absolute left-[12%] top-[18%] h-[62%] w-[39%] border border-dashed border-[#111111] bg-white/55 dark:border-white/35 dark:bg-white/5" />
                <div className="absolute right-[12%] top-[18%] h-[62%] w-[36%] border border-dashed border-[#111111] bg-white/55 dark:border-white/35 dark:bg-white/5" />
                <div className="absolute left-[45%] top-[45%] h-16 w-28 border-2 border-[#E11D2E] bg-[#E11D2E]/10" />
                <div className="absolute left-[31%] top-[35%] h-4 w-4 border-2 border-[#111111] bg-white dark:border-[#F2F1EE] dark:bg-[#171717]" />
                <div className="absolute left-[57%] top-[56%] h-4 w-4 border-2 border-[#E11D2E] bg-white dark:bg-[#171717]" />
                <div className="absolute bottom-8 left-8 border border-[#111111] bg-white px-4 py-3 dark:border-white/20 dark:bg-[#171717]">
                  <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
                    +15 Spatial Risk
                  </p>
                  <p className="mt-1 max-w-[220px] text-sm font-black leading-tight text-[#111111] dark:text-[#F2F1EE]">
                    Drainage vulnerability zone intersects incoming point.
                  </p>
                </div>
                <div className="absolute right-8 top-8 border border-zinc-200 bg-white px-4 py-3 dark:border-white/15 dark:bg-[#171717]">
                  <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#4A4A4A] dark:text-[#C9C2B8]">
                    CivicOS Geofence Mock
                  </p>
                </div>
              </div>

              <div className="divide-y divide-zinc-200 dark:divide-white/10">
                {CIVIC_GEOFENCES.map((fence) => (
                  <article key={fence.id} className="p-5">
                    <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
                      {fence.fenceType.replace('_', ' ')}
                    </p>
                    <h4 className="mt-2 text-base font-black leading-tight text-[#111111] dark:text-[#F2F1EE]">
                      {fence.name}
                    </h4>
                    <p className="mt-3 text-sm leading-[1.4] text-[#4A4A4A] dark:text-[#C9C2B8]">
                      {fence.routeLabel ??
                        (fence.riskBoost
                          ? `Adds +${fence.riskBoost} risk points when matched.`
                          : 'Defines valid municipal intake coverage.')}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {spatialRules.map(({ icon: Icon, label, title, copy }, index) => (
            <FadeIn
              key={label}
              delay={0.06 * index}
              className="border border-zinc-200 bg-white p-7 dark:border-white/15 dark:bg-[#171717]"
            >
              <Icon className="h-5 w-5 text-[#E11D2E]" />
              <p className="mt-5 font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
                {label}
              </p>
              <h3 className="mt-4 text-xl font-black leading-[1.05] text-[#111111] dark:text-[#F2F1EE]">
                {title}
              </h3>
              <p className="mt-5 text-sm leading-[1.5] text-[#4A4A4A] dark:text-[#C9C2B8]">
                {copy}
              </p>
            </FadeIn>
          ))}
        </div>

        {riskZones.length > 0 && (
          <FadeIn className="mt-4 border border-[#E11D2E] bg-white p-5 dark:bg-[#171717]">
            <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
              Active Risk Zone // {riskZones[0].name} // +{riskZones[0].riskBoost} points
            </p>
          </FadeIn>
        )}
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
              Because when problem arises, it is felt by everyone, and we hear it.          </h2>
            <p className="mt-8 max-w-xl text-[15px] leading-[1.45] text-white/70">
              We use sophisticated <strong>clustering algorithms</strong> and <strong>PostGIS spatial queries</strong> to automatically group related reports. Powered by an intelligent <strong>Trust Engine</strong>, ten distinct photos of the same pothole instantly merge into a single, highly actionable <strong>dispatch node</strong>. This eliminates redundant inbox noise and translates raw data into real-world human impact faster.
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

function MonetizationSection() {
  const frictionSample = TRANSIT_FRICTION_SAMPLES[0]
  const revenueSurfaces = [
    {
      icon: Network,
      label: '01 / Dig-Once Coordination',
      title: 'Bundle civic repairs with planned utility work.',
      copy: (
        <>
          It's maddening for citizens when a newly paved road is torn up by a utility company a week later. By running <strong>PostGIS spatial intersections</strong> against upcoming utility schedules, CivicOS catches these collisions early. We identify a shared coordination window so both teams can fix the pothole and lay the fiber simultaneously, saving everyone time and money.
        </>
      ),
      stat: '$45K',
      statLabel: 'Example avoided rework',
    },
    {
      icon: Route,
      label: '02 / Road-Friction API',
      title: 'Package municipal hazard metadata for routing systems.',
      copy: (
        <>
          Commercial fleets and insurers lose millions annually to vehicle damage and delays from unknown street hazards. Instead of letting this data sit idle, we use <strong>ML models</strong> to convert raw reports into a structured, real-time <strong>Road-Friction API</strong>. This allows logistics teams to dynamically route around disruptions, monetizing civic data to help fund the city's repairs.
        </>
      ),
      stat: `${frictionSample.frictionIndex.toFixed(1)}x`,
      statLabel: 'Sample friction index',
    },
  ]

  return (
    <section
      id="monetization"
      className="border-b border-zinc-200 bg-white px-6 py-36 dark:border-white/10 dark:bg-[#111111] md:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-16 lg:grid-cols-[420px_minmax(0,1fr)]">
          <FadeIn>
            <span className="block border-l-2 border-[#E11D2E] pl-3 font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
              [ MONETIZATION // INFRASTRUCTURE COORDINATION ]
            </span>
            <h2 className="mt-10 text-left text-[41px] font-black leading-[0.90] tracking-normal text-[#111111] dark:text-[#F2F1EE] md:text-[51px]">
                From "Citizen" to "Cities": 2 birds with one stone.

            </h2>
            <p className="mt-10 max-w-sm text-[16px] leading-[1.45] text-[#4A4A4A] dark:text-[#C9C2B8]">
              it's not just citizens, cities need smart infrastructure funding. we built the "DIG Once" approach—if the city has to tear up a street to fix a pothole, they might as well fix the pipes underneath so the road isn't dug up twice. Powered by <strong>predictive ML models</strong> and real-time <strong>coordination APIs</strong>, it automatically matches verified repair demand with utility work schedules and route-risk buyers, solving two massive problems simultaneously.
            </p>
          </FadeIn>

          <FadeIn
            delay={0.08}
            className="border border-zinc-200 bg-[#F2F1EE] dark:border-white/15 dark:bg-[#171717]"
          >
            <div className="grid border-b border-zinc-200 bg-white dark:border-white/10 dark:bg-[#171717] md:grid-cols-3">
              <div className="border-b border-zinc-200 p-6 dark:border-white/10 md:border-b-0 md:border-r">
                <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
                  Utility Routes
                </p>
                <p className="mt-2 text-4xl font-black leading-none text-[#111111] dark:text-[#F2F1EE]">
                  {String(DEMO_UTILITY_PLANS.length).padStart(2, '0')}
                </p>
              </div>
              <div className="border-b border-zinc-200 p-6 dark:border-white/10 md:border-b-0 md:border-r">
                <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
                  Hazards Priced
                </p>
                <p className="mt-2 text-4xl font-black leading-none text-[#111111] dark:text-[#F2F1EE]">
                  {frictionSample.activeHazardsCount}
                </p>
              </div>
              <div className="p-6">
                <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
                  API Radius
                </p>
                <p className="mt-2 text-4xl font-black leading-none text-[#111111] dark:text-[#F2F1EE]">
                  {frictionSample.radiusMeters}m
                </p>
              </div>
            </div>

            <div className="relative min-h-[460px] overflow-hidden bg-[#F2F1EE] dark:bg-[#111111]">
              <div className="absolute inset-0 opacity-55 [background-image:linear-gradient(#D4D4D8_1px,transparent_1px),linear-gradient(90deg,#D4D4D8_1px,transparent_1px)] [background-size:54px_54px] dark:opacity-20" />

              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M 5 56 C 24 48, 40 53, 52 47 S 80 31, 96 38"
                  fill="none"
                  stroke="#111111"
                  strokeWidth="0.8"
                  strokeOpacity="0.45"
                />
                <path
                  d="M 20 8 C 34 24, 39 42, 46 58 S 61 82, 78 92"
                  fill="none"
                  stroke="#E11D2E"
                  strokeWidth="0.8"
                  strokeOpacity="0.75"
                  strokeDasharray="2 1.5"
                />
                <path
                  d="M 31 51 L 51 51 L 71 51"
                  fill="none"
                  stroke="#111111"
                  strokeWidth="0.35"
                  strokeOpacity="0.75"
                />
                <path
                  d="M 51 51 L 51 72"
                  fill="none"
                  stroke="#111111"
                  strokeWidth="0.35"
                  strokeOpacity="0.75"
                />
              </svg>

              <div className="absolute left-8 top-8 border border-[#111111] bg-white px-4 py-3 dark:border-white/20 dark:bg-[#171717]">
                <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#111111] dark:text-[#F2F1EE]">
                  Coordination Graph
                </p>
                <p className="mt-1 max-w-[230px] text-xs font-bold leading-snug text-[#4A4A4A] dark:text-[#C9C2B8]">
                  Verified city repairs are matched against private utility routes and route-risk
                  buyers.
                </p>
              </div>

              <div className="absolute right-8 top-8 z-10 border border-zinc-200 bg-white px-4 py-3 dark:border-white/15 dark:bg-[#171717]">
                <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#111111] dark:text-[#F2F1EE]">
                  Utility Corridor Inputs
                </p>
                <div className="mt-3 space-y-2">
                  {DEMO_UTILITY_PLANS.map((plan, index) => (
                    <div key={plan.id} className="flex items-center gap-2">
                      <span
                        className={`h-1.5 w-8 ${index === 1 ? 'border-t border-dashed border-[#E11D2E] bg-transparent' : 'bg-[#111111]'}`}
                      />
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#4A4A4A] dark:text-[#C9C2B8]">
                        {plan.companyName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute left-[10%] top-[45%] border border-[#111111] bg-white px-4 py-3 dark:border-white/20 dark:bg-[#171717]">
                <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
                  01 / Verified Repair
                </p>
                <p className="mt-2 text-xl font-black leading-none text-[#111111] dark:text-[#F2F1EE]">
                  Pothole Node
                </p>
                <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#4A4A4A] dark:text-[#C9C2B8]">
                  92 trust // ward alpha
                </p>
              </div>

              <div className="absolute left-[39%] top-[38%] border-2 border-[#E11D2E] bg-white px-4 py-3 dark:bg-[#171717]">
                <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
                  02 / Match Window
                </p>
                <p className="mt-2 text-3xl font-black leading-none text-[#111111] dark:text-[#F2F1EE]">
                  12m
                </p>
                <p className="mt-2 max-w-[180px] text-xs font-bold leading-snug text-[#4A4A4A] dark:text-[#C9C2B8]">
                  Planned fiber corridor intersects repair radius.
                </p>
              </div>

              <div className="absolute right-[8%] top-[30%] border border-[#111111] bg-white px-4 py-3 dark:border-white/20 dark:bg-[#171717]">
                <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
                  03A / Utility Buyer
                </p>
                <p className="mt-2 text-lg font-black leading-none text-[#111111] dark:text-[#F2F1EE]">
                  Jio Fiber + City Works
                </p>
                <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#4A4A4A] dark:text-[#C9C2B8]">
                  Avoid duplicate excavation
                </p>
              </div>

              <div className="absolute right-[8%] bottom-[13%] border border-[#111111] bg-white px-4 py-3 dark:border-white/20 dark:bg-[#171717]">
                <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
                  03B / API Buyer
                </p>
                <p className="mt-2 text-lg font-black leading-none text-[#111111] dark:text-[#F2F1EE]">
                  Route Friction Feed
                </p>
                <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#4A4A4A] dark:text-[#C9C2B8]">
                  {frictionSample.activeHazardsCount} hazards // {frictionSample.radiusMeters}m radius
                </p>
              </div>

              <div className="absolute bottom-6 left-8 border border-[#111111] border-t-4 border-t-[#E11D2E] bg-white px-5 py-4 dark:border-white/20 dark:bg-[#171717]">
                <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
                  Revenue Event
                </p>
                <p className="mt-1 text-3xl font-black leading-none text-[#111111] dark:text-[#F2F1EE]">
                  $45,000
                </p>
                <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-widest text-[#4A4A4A] dark:text-[#C9C2B8]">
                  Avoided rework from coordinated repair
                </p>
              </div>
            </div>
          </FadeIn>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {revenueSurfaces.map(({ icon: Icon, label, title, copy, stat, statLabel }, index) => (
            <FadeIn
              key={label}
              delay={0.06 * index}
              className="border border-zinc-200 bg-white p-8 dark:border-white/15 dark:bg-[#171717]"
            >
              <div className="flex items-start justify-between gap-8">
                <div>
                  <Icon className="h-5 w-5 text-[#E11D2E]" />
                  <p className="mt-5 font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
                    {label}
                  </p>
                </div>
                <div className="border border-[#111111] bg-[#111111] px-4 py-3 text-right text-white dark:border-white/30">
                  <p className="font-mono text-2xl font-black leading-none">{stat}</p>
                  <p className="mt-1 text-[9px] font-black uppercase tracking-widest">{statLabel}</p>
                </div>
              </div>
              <h3 className="mt-8 text-2xl font-black leading-[1.05] text-[#111111] dark:text-[#F2F1EE]">
                {title}
              </h3>
              <p className="mt-5 text-[15px] leading-[1.5] text-[#4A4A4A] dark:text-[#C9C2B8]">
                {copy}
              </p>
            </FadeIn>
          ))}
        </div>

        <FadeIn className="mt-4 grid border border-zinc-200 bg-white dark:border-white/15 dark:bg-[#171717] md:grid-cols-4">
          {[
            ['Input', 'Verified repair node'],
            ['Spatial Join', 'Utility corridor within 12m'],
            ['Commercial Match', 'City + utility dig-once window'],
            ['Output', 'Coordination fee + route-risk API'],
          ].map(([label, value], index) => (
            <div
              key={label}
              className="border-b border-zinc-200 p-5 dark:border-white/10 md:border-b-0 md:border-r md:last:border-r-0"
            >
              <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
                {String(index + 1).padStart(2, '0')} / {label}
              </p>
              <p className="mt-3 text-sm font-black leading-tight text-[#111111] dark:text-[#F2F1EE]">
                {value}
              </p>
            </div>
          ))}
        </FadeIn>

        <FadeIn className="mt-4 border border-[#E11D2E] bg-white p-5 dark:bg-[#171717]">
          <p className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
            <DollarSign className="h-3.5 w-3.5" />
            Revenue does not change the citizen workflow: one image still becomes one verified
            municipal signal.
          </p>
        </FadeIn>
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
