import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BrainCircuit,
  Camera,
  FileImage,
  MapPin,
  Route,
  ShieldCheck,
} from 'lucide-react'
import { preloadAboutExperience } from '@/lib/preloadAboutExperience'

const edition = new Date().toISOString().slice(0, 10).replace(/-/g, '.')

export function AppleNewsHeroFeed() {
  return (
    <div className="mx-auto w-full max-w-7xl bg-brand-gray px-4 py-8 font-sans antialiased text-brand-dark md:px-8">
      {/* Top Source Ticker Header */}
      <div className="mb-6 flex items-end justify-between border-b-2 border-brand-dark pb-2">
        <span className="text-xs font-black uppercase tracking-widest text-[#E11D2E]">
          Civic Intelligence Network // Live Dispatch
        </span>
        <div className="flex items-center gap-4">
          <Link
            to="/about"
            onMouseEnter={preloadAboutExperience}
            onFocus={preloadAboutExperience}
            className="text-xs font-black uppercase tracking-widest text-[#111111] transition-colors hover:text-[#E11D2E]"
          >
            About
          </Link>
          <span className="font-mono text-xs font-bold text-brand-muted">
            EDITION {edition}
          </span>
        </div>
      </div>

      <section className="mb-6 grid gap-8 border border-brand-hairline bg-white p-5 md:grid-cols-[minmax(0,1fr)_440px] md:p-8 lg:p-10">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="border border-[#E11D2E] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">
              Civic Intake
            </span>
            <span className="border border-brand-hairline bg-brand-gray px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted">
              AI + Ward Ops
            </span>
          </div>
          <h1 className="max-w-3xl text-[42px] font-black leading-[0.92] tracking-tight text-brand-dark md:text-[64px]">
            One photo.<br />Instant civic action.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-brand-muted">
            Snap a photo of a broken road, flooded drain, or busted streetlight. 
            <strong> MobileNet</strong> classifies the problem on your device. <strong>EXIF data</strong> pins the exact location. 
            Your report lands in the right ward's queue — sorted, scored, and ready to act on — in seconds.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/report"
              className="border border-[#111111] bg-[#111111] px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-[#E11D2E]"
            >
              Start Report
            </Link>
            <Link
              to="/about"
              onMouseEnter={preloadAboutExperience}
              onFocus={preloadAboutExperience}
              className="border border-[#111111] bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-[#111111] transition-colors hover:border-[#E11D2E] hover:text-[#E11D2E]"
            >
              See Approach
            </Link>
          </div>
        </div>

        <div className="border border-brand-hairline bg-brand-gray p-3">
          <div className="mb-3 border-b border-brand-hairline pb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted">
            Intake Path // Signal Routing
          </div>
          <div className="space-y-3">
            <FlowNode icon={FileImage} label="Photo or Voice" detail="Citizen capture" />
            <div className="ml-6 h-6 border-l border-[#111111]" />
            <FlowNode icon={BrainCircuit} label="MobileNet" detail="On-device classification" />
            <div className="ml-6 h-6 border-l border-[#111111]" />
            <FlowNode icon={Route} label="Ward Dispatch" detail="Trust-sorted queue" />
          </div>
        </div>
      </section>

      {/* Main Magazine Layout Grid */}
      <div className="grid grid-cols-1 border border-brand-hairline bg-white md:grid-cols-3 md:divide-x md:divide-brand-hairline">
        {/* Column 1: Feature Breaking Report */}
        <Link
          to="/report"
          className="group flex cursor-pointer flex-col justify-between bg-white p-6 transition-colors hover:bg-brand-gray"
        >
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center border border-[#E11D2E] bg-white">
                <Camera className="h-4 w-4 text-[#E11D2E]" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#E11D2E]">
                01 / Ingestion
              </span>
            </div>
            <h3 className="mb-3 text-3xl font-black leading-none tracking-tight text-brand-dark">
              One photo.
              <br />
              Done.
            </h3>
            <p className="text-sm leading-relaxed text-brand-muted">
              Take a photo or record a voice note. <strong>MobileNet</strong> runs on your device and tags the issue type and severity without any form to fill in.
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-brand-hairline pt-4 text-xs font-bold">
            <span className="uppercase tracking-wider">Launch Camera</span>
            <ArrowRight className="h-4 w-4 text-[#E11D2E] transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Column 2: Secondary Editorial Feature */}
        <Link
          to="/feed"
          className="group flex cursor-pointer flex-col justify-between bg-white p-6 transition-colors hover:bg-brand-gray"
        >
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center border border-[#E11D2E] bg-white">
                <MapPin className="h-4 w-4 text-[#E11D2E]" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#E11D2E]">
                02 / Spatial Feed
              </span>
            </div>
            <h3 className="mb-3 text-3xl font-black leading-none tracking-tight text-brand-dark">
              Pinned to
              <br />
              the right ward.
            </h3>
            <p className="text-sm leading-relaxed text-brand-muted">
              <strong>EXIF metadata</strong> and <strong>PostGIS geofencing</strong> match every report to the correct ward boundary — no manual address entry needed.
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-brand-hairline pt-4 text-xs font-bold">
            <span className="uppercase tracking-wider">Explore Feed</span>
            <ArrowRight className="h-4 w-4 text-[#E11D2E] transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Column 3: The Anchor Statement Panel */}
        <Link
          to="/admin"
          className="group flex flex-col justify-between bg-brand-dark p-6 text-white transition-colors hover:bg-[#E11D2E]"
        >
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center border border-white bg-brand-dark">
                <ShieldCheck className="h-4 w-4 text-white" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-white">
                03 / The Criteria
              </span>
            </div>
            <h3 className="mb-3 text-3xl font-black leading-none tracking-tight text-white">
              Only real reports get through.
            </h3>
            <p className="text-sm leading-relaxed text-white/60">
              Every submission runs a <strong>Trust Score</strong> — built from photo EXIF validity, GPS accuracy, and a <strong>Canvas Pixel Heuristic</strong> check — so spam never reaches the desk.
            </p>
          </div>
          <div className="mt-6 border-t border-white/15 pt-4 font-mono text-xs text-white/50">
            SYSTEM STATUS: OPERATIONAL // {new Date().getFullYear()}
          </div>
        </Link>
      </div>

      {/* Asymmetric Bottom Call-to-Action Bar */}
      <div className="mt-6 grid grid-cols-1 border border-brand-dark md:grid-cols-3 md:divide-x md:divide-brand-dark">
        <Link
          to="/report"
          className="w-full bg-[#111111] py-4 text-center text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-[#E11D2E]"
        >
          Report An Issue
        </Link>
        <Link
          to="/feed"
          className="w-full bg-white py-4 text-center text-xs font-black uppercase tracking-widest text-[#111111] transition-colors hover:bg-brand-gray"
        >
          View Neighborhood Feed
        </Link>
        <Link
          to="/about"
          onMouseEnter={preloadAboutExperience}
          onFocus={preloadAboutExperience}
          onTouchStart={preloadAboutExperience}
          className="w-full bg-white py-4 text-center text-xs font-black uppercase tracking-widest text-[#111111] transition-colors hover:bg-brand-gray"
        >
          Read Our Approach
        </Link>
      </div>
    </div>
  )
}

function FlowNode({
  icon: Icon,
  label,
  detail,
}: {
  icon: typeof FileImage
  label: string
  detail: string
}) {
  return (
    <div className="flex items-center gap-3 border border-brand-hairline bg-white p-3">
      <div className="flex h-10 w-10 items-center justify-center border border-[#111111] bg-white">
        <Icon className="h-5 w-5 text-[#111111]" />
      </div>
      <div>
        <p className="text-sm font-black leading-tight text-[#111111]">{label}</p>
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted">
          {detail}
        </p>
      </div>
    </div>
  )
}
