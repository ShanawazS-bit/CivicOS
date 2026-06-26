import { motion, useReducedMotion, type Variants } from 'framer-motion'
import {
  BrainCircuit,
  Camera,
  MapPin,
  RadioTower,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import type { GeminiAnalysis } from '@/types'

interface ImageRiskTimelineProps {
  analysis?: GeminiAnalysis | null
  trustScore?: number
  lat?: number | null
  lng?: number | null
  fromCache?: boolean
  compact?: boolean
}

interface RiskStep {
  id: string
  time: string
  label: string
  title: string
  value: string
  note: string
  points: number
  icon: LucideIcon
}

const ease = [0.4, 0, 0.2, 1] as const

function severityWeight(severity?: string): number {
  const normalized = severity?.toLowerCase()
  if (normalized === 'high') return 1
  if (normalized === 'medium') return 0.68
  if (normalized === 'low') return 0.38
  return 0.62
}

function allocatePoints(score: number, confidence: number, severity: string | undefined, hasCoords: boolean) {
  const confidenceWeight = Math.max(0.55, Math.min(1, confidence / 100))
  const weights = [
    0.13,
    0.22 + confidenceWeight * 0.12,
    0.14 + severityWeight(severity) * 0.16,
    hasCoords ? 0.16 : 0.08,
    0.18,
  ]
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  const points = weights.map((weight) => Math.round((weight / totalWeight) * score))
  const drift = score - points.reduce((sum, point) => sum + point, 0)
  points[points.length - 1] += drift
  return points
}

function buildRiskSteps({
  analysis,
  trustScore = 82,
  lat,
  lng,
  fromCache,
}: ImageRiskTimelineProps): RiskStep[] {
  const confidence = analysis?.confidence_score ?? 88
  const severity = analysis?.severity ?? 'Medium'
  const issueType = analysis?.issue_type ?? 'Municipal anomaly'
  const hasCoords = typeof lat === 'number' && typeof lng === 'number'
  const points = allocatePoints(trustScore, confidence, severity, hasCoords)

  return [
    {
      id: 'ingest',
      time: '+0.00s',
      label: '01 / Intake',
      title: 'Image Payload',
      value: fromCache ? 'Cache hit' : 'Live frame',
      note: fromCache ? 'Reused Gemini response, no model call.' : 'Citizen image converted into evidence packet.',
      points: points[0],
      icon: Camera,
    },
    {
      id: 'vision',
      time: '+0.28s',
      label: '02 / Vision',
      title: issueType,
      value: `${confidence}% confidence`,
      note: 'Gemini extracts issue class, visible condition, and transcript.',
      points: points[1],
      icon: BrainCircuit,
    },
    {
      id: 'severity',
      time: '+0.43s',
      label: '03 / Severity',
      title: `${severity} Risk`,
      value: 'Public impact',
      note: 'Urgency and civic safety weight the queue position.',
      points: points[2],
      icon: ShieldCheck,
    },
    {
      id: 'geo',
      time: '+0.61s',
      label: '04 / Geo',
      title: hasCoords ? 'Pinned location' : 'Fallback coordinate',
      value: hasCoords ? `${lat?.toFixed(4)}, ${lng?.toFixed(4)}` : 'Ward default',
      note: 'Coordinates are checked for dispatch usefulness.',
      points: points[3],
      icon: MapPin,
    },
    {
      id: 'dispatch',
      time: '+0.84s',
      label: '05 / Dispatch',
      title: `${trustScore} Trust`,
      value: 'Admin ready',
      note: 'Duplicates, recency, and confidence collapse into one signal.',
      points: points[4],
      icon: RadioTower,
    },
  ]
}

function lineTransition(delay: number, reduced: boolean) {
  return {
    delay: reduced ? 0 : delay,
    duration: reduced ? 0.01 : 0.8,
    ease,
  }
}

function cardTransition(delay: number, reduced: boolean) {
  return {
    delay: reduced ? 0 : delay,
    duration: reduced ? 0.01 : 0.45,
    ease,
  }
}

function FlowLine({
  className,
  delay,
  vertical = false,
}: {
  className: string
  delay: number
  vertical?: boolean
}) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      className={`absolute bg-[#111111] ${className}`}
      initial={{ opacity: 0, scaleX: vertical ? 1 : 0, scaleY: vertical ? 0 : 1 }}
      whileInView={{ opacity: 1, scaleX: 1, scaleY: 1 }}
      viewport={{ once: true, amount: 0.35 }}
      style={{ originX: 0, originY: 0 }}
      transition={lineTransition(delay, Boolean(reduced))}
    />
  )
}

function Junction({ className, delay }: { className: string; delay: number }) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      className={`absolute z-20 border border-[#111111] bg-white ${className}`}
      initial={{ opacity: 0, scale: 0.7 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={cardTransition(delay, Boolean(reduced))}
    >
      <div className="absolute inset-1 border border-[#E11D2E]" />
    </motion.div>
  )
}

function PayloadCard({
  step,
  className,
  delay,
}: {
  step: RiskStep
  className: string
  delay: number
}) {
  const reduced = useReducedMotion()
  const Icon = step.icon

  return (
    <motion.article
      layout
      className={`absolute z-30 border border-zinc-200 bg-white p-3 ${className}`}
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={cardTransition(delay, Boolean(reduced))}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#111111] bg-white">
          <Icon className="h-4 w-4 text-[#E11D2E]" />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[9px] font-black uppercase tracking-widest text-[#E11D2E]">
            {step.label}
          </p>
          <h4 className="mt-1 text-[16px] font-black leading-[1.02] text-[#111111]">
            {step.title}
          </h4>
          <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#4A4A4A]">
            {step.value}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-zinc-200 pt-2">
        <span className="text-[11px] leading-[1.25] text-[#4A4A4A]">{step.note}</span>
        <span className="shrink-0 border border-[#E11D2E] px-2 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-[#111111]">
          +{step.points}
        </span>
      </div>
    </motion.article>
  )
}

function OriginNode({ source, compact }: { source: RiskStep; compact?: boolean }) {
  const reduced = useReducedMotion()
  const Icon = source.icon

  return (
    <motion.div
      className={`absolute left-[4%] top-[42%] z-30 border-2 border-[#111111] bg-white ${
        compact ? 'w-[128px] p-3' : 'w-[150px] p-4'
      }`}
      initial={{ opacity: 0, scale: 0.92 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={cardTransition(0, Boolean(reduced))}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#E11D2E]" />
        <span className="font-mono text-[9px] font-black uppercase tracking-widest text-[#E11D2E]">
          {source.time}
        </span>
      </div>
      <p className="mt-2 text-[18px] font-black uppercase leading-[0.95] text-[#111111]">
        Image
        <br />
        Payload
      </p>
      <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#4A4A4A]">
        {source.value}
      </p>
    </motion.div>
  )
}

function MobileLedger({ steps }: { steps: RiskStep[] }) {
  const container: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.5,
      },
    },
  }
  const item: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
  }

  return (
    <motion.div
      className="grid gap-3 md:hidden"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
    >
      {steps.map((step) => {
        const Icon = step.icon
        return (
          <motion.article key={step.id} className="border border-zinc-200 bg-white p-4" variants={item}>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center border border-[#111111]">
                <Icon className="h-4 w-4 text-[#E11D2E]" />
              </div>
              <div>
                <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
                  {step.time} - {step.label}
                </p>
                <h4 className="mt-1 text-xl font-black leading-none text-[#111111]">{step.title}</h4>
              </div>
            </div>
            <p className="mt-3 text-sm leading-[1.35] text-[#4A4A4A]">{step.note}</p>
            <div className="mt-3 inline-flex border border-[#E11D2E] px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-[#111111]">
              +{step.points} Risk Points
            </div>
          </motion.article>
        )
      })}
    </motion.div>
  )
}

export function ImageRiskTimeline(props: ImageRiskTimelineProps) {
  const steps = buildRiskSteps(props)
  const trustScore = props.trustScore ?? 82
  const [source, vision, severity, geo, dispatch] = steps

  return (
    <section className="overflow-hidden border border-zinc-200 bg-white">
      <div className="grid gap-4 border-b-2 border-[#111111] px-5 py-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
            Image Risk Pipeline // Routed Audit Map
          </p>
          <h3 className="mt-2 text-2xl font-black leading-none tracking-tight text-[#111111]">
            One image branches into confidence, location, severity, and dispatch risk.
          </h3>
        </div>
        <div className="border border-[#111111] bg-[#111111] px-4 py-2 text-white">
          <span className="font-mono text-[11px] font-black uppercase tracking-widest">
            {trustScore} Trust
          </span>
        </div>
      </div>

      <div
        className={`relative bg-[#F2F1EE] ${props.compact ? 'hidden xl:block' : 'hidden md:block'} ${
          props.compact ? 'h-[470px]' : 'h-[560px]'
        }`}
      >
        <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(#E0E0E0_1px,transparent_1px),linear-gradient(90deg,#E0E0E0_1px,transparent_1px)] [background-size:72px_72px]" />

        <OriginNode source={source} compact={props.compact} />

        <FlowLine className="left-[17%] top-[50%] h-4 w-[30%]" delay={0.4} />
        <Junction className="left-[46%] top-[47.5%] h-12 w-12" delay={0.95} />

        <FlowLine className="left-[49.5%] top-[32%] h-[18%] w-4" delay={1.15} vertical />
        <FlowLine className="left-[49.5%] top-[32%] h-4 w-[22%]" delay={1.3} />
        <Junction className="left-[70%] top-[29.5%] h-10 w-10" delay={1.75} />
        <PayloadCard step={vision} className="right-[4%] top-[17%] w-[280px]" delay={1.95} />

        <FlowLine className="left-[50%] top-[50%] h-4 w-[18%]" delay={1.55} />
        <Junction className="left-[67%] top-[47.5%] h-12 w-12" delay={2.05} />
        <FlowLine className="left-[70.5%] top-[50%] h-4 w-[10%]" delay={2.2} />
        <PayloadCard step={severity} className="right-[7%] top-[42%] w-[260px]" delay={2.45} />

        <FlowLine className="left-[49.5%] top-[52%] h-[16%] w-4" delay={1.85} vertical />
        <FlowLine className="left-[39%] top-[66%] h-4 w-[12%]" delay={2.1} />
        <Junction className="left-[36.8%] top-[63.5%] h-10 w-10" delay={2.55} />
        <PayloadCard step={geo} className="left-[21%] top-[67%] w-[260px]" delay={2.75} />

        <FlowLine className="left-[51%] top-[66%] h-4 w-[17%]" delay={2.35} />
        <FlowLine className="left-[67%] top-[66%] h-[14%] w-4" delay={2.65} vertical />
        <FlowLine className="left-[67%] top-[78%] h-4 w-[13%]" delay={2.85} />
        <PayloadCard step={dispatch} className="right-[6%] bottom-[7%] w-[300px]" delay={3.05} />

        <motion.div
          className="absolute bottom-4 left-5 z-30 border border-zinc-200 bg-white px-4 py-2 font-mono text-[10px] font-black uppercase tracking-widest text-[#4A4A4A]"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ delay: 3.35, duration: 0.45, ease }}
        >
          Staggered audit route // lines scale from originX: 0
        </motion.div>
      </div>

      <div className={`bg-[#F2F1EE] p-4 ${props.compact ? 'xl:hidden' : 'md:hidden'}`}>
        <MobileLedger steps={steps} />
      </div>

      <div className="grid border-t border-zinc-200 bg-white md:grid-cols-5 md:divide-x md:divide-zinc-200">
        {steps.map((step) => (
          <div key={step.id} className="border-b border-zinc-200 p-3 last:border-b-0 md:border-b-0">
            <p className="font-mono text-[9px] font-black uppercase tracking-widest text-[#E11D2E]">
              {step.time}
            </p>
            <p className="mt-1 text-[13px] font-black leading-tight text-[#111111]">{step.label}</p>
            <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#4A4A4A]">
              +{step.points} risk
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
