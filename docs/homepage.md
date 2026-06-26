# CivicOS Studio — Style Reference Specification
> Fragmented infrastructure node in a blackout studio — real-world engineering floating in deliberate cinematic darkness, every structural signal lit from within.

**Theme:** Dark (Cinematic Editorial / Apple News+ High-Density Typographic Register)

CivicOS operates as a dark studio production — a deep, near-black canvas (`#100904`), a unified warm cream foreground (`#ffedd7`) text and border layer, and a highly targeted burnt-sienna accent (`#dc5000`) functioning strictly as a hairline signal. Typography is driven by a single high-contrast display variable face that runs dynamically from 10px utility indicators up to dense, room-filling 51px display headlines stacking with an ultra-tight line height of 0.90 for maximum editorial gravity. 

The hero environment drops all lifestyle photography and instead integrates a live, browser-native 3D Spline scene tracking a low-poly plaster street cross-section. All physical texture maps are stripped in favor of raw, chalky matte finishes that interact elegantly with soft, diffused studio lighting. Components are sparse, clean, and flat: pill-radius actions outlined in cream, structural grid lines delineated by 1px dashed rules, and zero artificial box shadows or blur drop shadows anywhere. The entire interface reads as an uninterrupted, asymmetric narrative scroll — translating raw infrastructure data into a pristine editorial signal.

---

## 1. Design System Tokens

### 1.1 Color Variable Matrix

| Name | Value | Token | Role |
|------|-------|-------|------|
| **Studio Black** | `#100904` | `--color-studio-black` | Full-page background canvas. Faint warm brown undertone that prevents the dark space from feeling cold. |
| **Warm Cream** | `#ffedd7` | `--color-warm-cream` | All primary typography, active navigation links, interface labels, and interactive borders. |
| **Signal Shadow** | `#40372e` | `--color-signal-shadow` | 1px dashed section dividers and secondary layout bounds. One step lighter than canvas for architectural separation. |
| **Asphalt Core** | `#382416` | `--color-asphalt-core` | Filled primary button surface — the only non-transparent solid fill swatch allowed in the control layout. |
| **Burnt Sienna** | `#dc5000` | `--color-burnt-sienna` | High-fidelity warning or anchor accent. Used solely for inline hairline highlights, links, and active outline indicators. |
| **Muted Clay** | `#6c5f51` | `--color-muted-clay` | Mid-tone warm gray-brown for secondary structural captions, timestamps, and metadata. |
| **Vector Grid** | `#445231` | `--color-vector-grid` | Deep olive green bounding hue reserved for live WebGL background mesh lines or active data nodes. |

### 1.2 Typographic Hierarchy Rules

The design system maps a single variable sans-serif display font family across all viewport scales. The tight line heights (`0.90` to `1.00`) at display tiers enforce a dense, editorial structure where text blocks behave like physical blocks of print layout.

*   **Primary Display Family:** `halyard-display-variable` (Alternative fallbacks: `Plus Jakarta Sans`, `Figtree`, or `DM Sans`).
*   **Motion Fallback:** `Arial` is locked strictly to **8px** for letter-spaced text-stagger reveal scripts (the sliding animation layout) and must not be used for static information layers.

#### Type Scale Blueprint

| Role | Size | Line Height | Letter Spacing | Token |
|------|------|-------------|----------------|-------|
| **Caption / Node Indicator** | 10px | 1.20 | Normal | `--text-caption` |
| **UI Functional Label** | 12px | 1.25 | Normal | `--text-nav-label` |
| **Primary Body Copy** | 14px | 1.33 | Normal | `--text-body` |
| **Context Summary** | 15px | 1.30 | Normal | `--text-summary` |
| **Subheading / Metric Label** | 18px | 1.20 | Normal | `--text-subheading` |
| **Small Heading** | 24px | 1.10 | Normal | `--text-heading-sm` |
| **Section Heading** | 29px | 1.09 | Normal | `--text-heading` |
| **Large Section Heading** | 41px | 1.00 | Normal | `--text-heading-lg` |
| **Cinematic Display Title** | 51px | 0.90 | Normal | `--text-display` |

### 1.3 Spacing & Boundary Radii

*   **Density Configuration:** Comfortable, structural, edge-to-edge.
*   **Layout Rules:** Section vertical gaps scale between `80px` and `120px`. Main card layout element padding is locked to `24px` with a default inner component gap of `18px`.
*   **Border Radius Matrix:**
    *   *System Cards / Data Panels:* `12px` (`--radius-cards`)
    *   *Input Entry Fields:* `0px` (Hard right-angle edge, bottom border only)
    *   *Flat Utility Actions:* `0px`
    *   *Outlined Ghost Actions:* `22.5px` (`--radius-buttons-rounded`)
    *   *Filled Primary Actions:* `36px` (`--radius-buttons-pill`)

---

## 2. Component & Interface Blueprint

### 2.1 Navigation Bar (Top Fixed Island)
Transparent layout backdrop over the initial WebGL frame boundary, transitioning to a solid `#100904` canvas layer on scroll. Left aligned: `CIVIC.OS` wordmark in 15px weight 500. Right aligned: four navigation triggers (`MANIFESTO`, `PIPELINE`, `CONSOLE`, `NETWORK`) rendered at 12px weight 400 in `#ffedd7`, separated by a `24px` horizontal element gap. The bottom edge is trimmed with a 1px solid `#40372e` rule. Navigation strings initialize using a staggered character reveal script on viewport load.

### 2.2 Primary Outlined Action (Ghost Pill Button)
Transparent background layer framed by a 1px solid `#ffedd7` outline. Top/bottom internal padding is locked to `7.5px` with a `16px` horizontal safety boundary; border-radius is locked to `22.5px`. Font runs `12px` weight 400. On cursor hover, the border frame color smoothly transitions to the Burnt Sienna accent (`#dc5000`) using a flat `0.3s ease` path.

### 2.3 Flat Content Separator (Dashed Divider Rule)
A full-bleed horizontal spatial divider string executing a 1px dashed configuration in `#40372e`. No padding modifiers are applied; its role is purely structural to segregate layout blocks without introducing visual weight or shadow density.

### 2.4 Ghost Input Field
Single-line technical entry interface mapped directly to the dark canvas surface. Transparent background, 0px border-radius, with structural framing limited strictly to a 1px solid bottom border (`#ffedd7`). Internal padding parameters: 1px top/bottom, 2px left, 36px right. Text parses at 15px weight 400. Placeholder data runs in `#ffedd7` locked to `40%` opacity to handle descriptive labelling inline.

---

## 3. Production Layout Code (`AboutView.tsx`)

This clean, production-ready React component integrates a native WebGL Spline container behind an asymmetrical, high-density editorial grid.

```tsx
import React, { useState } from 'react';
import Spline from '@splinetool/react-spline';
import { ArrowRight, Clock, Eye, Layers, ShieldCheck } from 'lucide-react';

export default function AboutEditorialView() {
  const [glLoading, setGlLoading] = useState(true);

  return (
    <div className="w-full min-h-screen bg-[#100904] text-[#ffedd7] font-sans antialiased relative selection:bg-[#dc5000]/30 overflow-x-hidden">
      
      
      <nav className="fixed top-0 left-0 w-full z-50 bg-[#100904]/80 backdrop-blur-md border-b border-[#40372e] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-medium tracking-normal text-[#ffedd7]">CIVIC.OS</span>
          <span className="text-[10px] font-mono text-[#6c5f51] border border-[#40372e] px-1.5 py-0.5 rounded">v1.0-2026</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 text-[12px] font-normal">
            <a href="#manifesto" className="hover:text-[#dc5000] transition-colors duration-300">MANIFESTO</a>
            <a href="#pipeline" className="hover:text-[#dc5000] transition-colors duration-300">PIPELINE</a>
            <a href="#console" className="hover:text-[#dc5000] transition-colors duration-300">CONSOLE</a>
          </div>
          <div className="h-4 w-[1px] bg-[#40372e]" />
          <div className="flex items-center gap-1.5 text-[10px] text-[#6c5f51] font-mono">
            <Clock className="w-3 h-3"/>
            <span>15:30 IST</span>
          </div>
        </div>
      </nav>

      
      <section className="relative w-full h-screen flex items-end p-6 md:p-16 border-b border-[#40372e]">
        
        
        <div className="absolute inset-0 w-full h-full z-0">
          {glLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#100904] text-[10px] font-mono text-[#6c5f51]">
              INITIALIZING INTERACTIVE INFRASTRUCTURE NODE...
            </div>
          )}
          <Spline onLoad="{()"> setGlLoading(false)}
            scene="[https://prod.spline.design/66b510ab-28b5-4069-aaf3-f71e6e8284c9/scene.splinecode](https://prod.spline.design/66b510ab-28b5-4069-aaf3-f71e6e8284c9/scene.splinecode)" 
          />
        </div>

        
        <div className="relative z-10 max-w-xl bg-[#100904]/90 border border-[#40372e] rounded-[12px] p-8 space-y-6">
          <div>
            <span className="text-[10px] font-mono text-[#6c5f51] tracking-wider block mb-2 uppercase">
              // SPATIAL TRANSLATION MATRIX
            </span>
            <h1 className="text-[41px] md:text-[51px] font-medium leading-[0.90] text-[#ffedd7] tracking-normal font-sans">
              Autonomous sorting of municipal breakdowns.
            </h1>
          </div>
          
          <p className="text-[14px] leading-[1.33] text-[#6c5f51] max-w-sm">
            One image payload. Zero user fields. A direct, high-fidelity engineering stream designed to bypass reporting friction and isolate structural duplicates instantly.
          </p>

          <div className="pt-2">
            <a 
              href="#manifesto" 
              className="inline-flex items-center gap-2 text-[12px] font-normal tracking-normal text-[#ffedd7] border border-[#ffedd7] rounded-[22.5px] px-4 py-2 hover:border-[#dc5000] hover:text-[#dc5000] transition-colors duration-300 group"
            >
              Analyze System Architecture 
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform duration-300"/>
            </a>
          </div>
        </div>

        
        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:block origin-right rotate-90 translate-x-4">
          <span className="text-[10px] font-mono tracking-widest text-[#6c5f51] whitespace-nowrap">
            NODE.01 // SPATIAL_DE_DUPLICATION_ENGINE
          </span>
        </div>
      </section>

      {/* --- MANIFESTO: HIGH-CONTRAST TWO-COLUMN SCROLL --- */}
      <section id="manifesto" className="max-w-7xl mx-auto px-6 py-24 md:py-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
          <span className="text-[10px] font-mono text-[#dc5000] tracking-wider block uppercase">
            [ SECTION_01 // PROBLEM_SPACE ]
          </span>
          <h3 className="text-[18px] font-normal text-[#ffedd7] leading-[1.20]">
            The Structural Friction of Local Data
          </h3>
          <p className="text-[14px] text-[#6c5f51] leading-[1.33] max-w-xs">
            Standard city applications fail because they scale human parsing text fields, transforming citizen feedback loops into noisy, unstructured operational liabilities.
          </p>
        </div>

        {/* Right Column Dense Typography Grid */}
        <div className="lg:col-span-8 space-y-12">
          <h2 className="text-[29px] md:text-[41px] font-medium leading-[1.00] text-[#ffedd7]">
            Municipal networks do not require more manual entries. They demand high-fidelity{' '}
            <span className="border-b border-[#dc5000] pb-1 text-[#ffedd7]">
              actionable telemetry signals
            </span>
            {' '}to optimize structural triage queues.
          </h2>
          
          <div className="h-[1px] w-full bg-[#40372e] border-dashed" />
          
          <p className="text-[15px] leading-[1.30] text-[#6c5f51] max-w-xl">
            CivicOS overrides traditional municipal ticket mechanics. By routing point-of-failure photography through an automated multimodal processing layer, the platform screens duplicate instances natively within spatial coordinates, returning absolute prioritization metrics directly to operational command desks.
          </p>
        </div>
      </section>

      
      <section id="pipeline" className="w-full bg-[#100904] border-t border-b border-[#40372e] py-24">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="mb-12">
            <span className="text-[10px] font-mono text-[#6c5f51] tracking-widest uppercase block">
              // TELEMETRY_PIPELINE_FLOW
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            
            <div className="border border-[#40372e] rounded-[12px] p-6 space-y-4 hover:border-[#ffedd7] transition-colors duration-300">
              <div className="flex items-center justify-between text-[#6c5f51]">
                <Eye className="w-4 h-4"/>
                <span className="text-[10px] font-mono">FLOW_01</span>
              </div>
              <h4 className="text-[18px] font-normal text-[#ffedd7]">Zero-Friction Ingest</h4>
              <p className="text-[14px] text-[#6c5f51] leading-[1.33]">
                Citizens trigger unified image frames. Categorization structures and asset tracking indices are handled automatically at the system edge.
              </p>
            </div>

            
            <div className="border border-[#40372e] rounded-[12px] p-6 space-y-4 hover:border-[#ffedd7] transition-colors duration-300">
              <div className="flex items-center justify-between text-[#6c5f51]">
                <Layers className="w-4 h-4"/>
                <span className="text-[10px] font-mono">FLOW_02</span>
              </div>
              <h4 className="text-[18px] font-normal text-[#ffedd7]">Multimodal Synthesis</h4>
              <p className="text-[14px] text-[#6c5f51] leading-[1.33]">
                The visual array extracts operational metrics, computing immediate confidence classifications and tracking location arrays via backend models.
              </p>
            </div>

            
            <div className="border border-[#40372e] rounded-[12px] p-6 space-y-4 hover:border-[#ffedd7] transition-colors duration-300">
              <div className="flex items-center justify-between text-[#6c5f51]">
                <ShieldCheck className="w-4 h-4"/>
                <span className="text-[10px] font-mono">FLOW_03</span>
              </div>
              <h4 className="text-[18px] font-normal text-[#ffedd7]">Spatial Filtering</h4>
              <p className="text-[14px] text-[#6c5f51] leading-[1.33]">
                Isolates overlapping reports to unique geofenced clusters, flattening information redundancy before presenting triage streams.
              </p>
            </div>

          </div>
        </div>
      </section>

      
      <footer id="console" className="max-w-7xl mx-auto px-6 py-24 text-center space-y-8">
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-[24px] font-normal tracking-tight text-[#ffedd7]">Initialize Command Viewport</h3>
          <p className="text-[14px] text-[#6c5f51]">Connect system assets to resolve local reporting redundancies automatically.</p>
        </div>

        <div className="flex justify-center">
          <button className="bg-[#382416] text-[#ffedd7] border border-transparent px-6 py-3 rounded-[36px] text-[14px] font-normal tracking-normal hover:bg-[#382416]/80 transition-colors duration-300">
            Launch Administration Console
          </button>
        </div>
      </footer>

    </div>
  );
}