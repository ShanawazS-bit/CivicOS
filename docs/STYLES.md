# Frontend Style Guide Specification (STYLE.md)
## System Concept: CivicOS Editorial Newsroom Design
## Archetype: High-Contrast Editorial Type × Clean SaaS Hybrid
## Target Platform: Mobile Responsive Web App / Tailwind CSS Engine

---

## 1. Color Tokens & Theme Configuration

All layout implementations must strictly map to this exact design token specification. Do not introduce arbitrary hex codes outside of this designated matrix.

### 1.1 Color Palettes

| Token Role | Hex Code | Tailwind Map | Application Scope |
| :--- | :--- | :--- | :--- |
| **Brand Red** | `#E11D2E` | `bg-brand-red`, `text-brand-red` | Dominant signal color, section headers, active system tabs |
| **Dark Background** | `#111111` | `bg-brand-dark` | Deep high-contrast base layout canvases and container blocks |
| **Editorial Ink** | `#1A1A1A` | `bg-zinc-900`, `text-zinc-900` | Secondary solid backdrops, alternative dark card states |
| **Pure White** | `#FFFFFF` | `bg-white`, `text-white` | Primary background canvas for the card component layouts |
| **Editorial Neutral**| `#F2F1EE` | `bg-brand-gray` | Soft gray light surface blocks, button hover baselines, outer frames |
| **Medium Gray** | `#4A4A4A` | `text-zinc-600` | Subtitle information lines, body copy descriptions, inactive navigation shapes |

---

## 2. Typography Hierarchy

The typographic rules prioritize immediate scannability using geometric weight transitions. Always rely on a clean system sans-serif configuration.

### 2.1 Typography Blueprint Scale

*   **Headlines (Primary Component Focal Elements)**
    *   **Font:** `SF Pro Display`, `Inter`, system sans-serif
    *   **Weight:** Bold / Heavy (`font-extrabold` / `font-black`)
    *   **Size:** `28px` – `34px` (`text-3xl` to `text-4xl`)
    *   **Line Height:** Tight (`leading-none` or `leading-[1.15]`)
    *   **Color:** `#111111`

*   **Section Headers (Component Category Labels)**
    *   **Weight:** Semibold (`font-semibold`)
    *   **Size:** `20px` – `24px` (`text-xl` to `text-2xl`)
    *   **Color:** `#E11D2E` (Brand Red)

*   **Body Text (Incident Narrative Data)**
    *   **Font:** `SF Pro Text`, `Inter`, system sans-serif
    *   **Weight:** Regular (`font-normal`)
    *   **Size:** `15px` – `17px` (`text-base`)
    *   **Line Height:** Generous Editorial (`leading-relaxed` / `1.5`)
    *   **Color:** `#4A4A4A`

*   **Metadata / Source Labels**
    *   **Weight:** Medium / Bold (`font-semibold` to `font-bold`)
    *   **Size:** `11px` – `13px` (`text-xs`)
    *   **Transform:** Strict Uppercase (`uppercase tracking-wider`)
    *   **Color:** `#4A4A4A` or `#E11D2E` (context dependent)

---

## 3. Structural Layout & Spacing Rules

The spatial configuration relies entirely on an explicit **8px baseline geometric grid structure**.

### 3.1 Spacing Coefficients
*   **Base Spacing Core Unit:** `8px` (`space-1` = `4px`, `space-2` = `8px`, `space-4` = `16px`)
*   **Screen Component Margins:** `16px` – `20px` bounding container constraints (`px-4` or `px-5`)
*   **Vertical Section Spacing Separation:** `24px` – `32px` intervals (`py-6` to `py-8`)

### 3.2 Component Corner Boundaries (Border Radius)
*   **Structural Content Cards:** `12px` – `16px` (`rounded-xl` to `rounded-2xl`)
*   **Media Assets / Images (Nested inside cards):** `8px` – `12px` top-corner adjustments (`rounded-t-xl`)
*   **System Action Buttons & Chips:** Full pill layout constraint geometry (`rounded-full`)

---

## 4. Element Component Blueprints

### 4.1 Global Shadows
```css
/* Card Container Elevation Elevation Vector */
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

/* Interacting Element Button Focus Shadow Vectors */
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

/* Outer Wrapper Frame Elements Elevation Drop */
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);




4.2 Interactive Layout Elements Spec
Primary Call To Action Button
Type Strategy: Filled Pill Element (rounded-full)

Color Composition: Base background color #111111, Type color text #FFFFFF

Sizing Matrix: Height constraints 48px – 56px, horizontal pad buffer tracking 24px – 32px (px-6 py-3)

Secondary UI Action Token
Type Strategy: Minimal background shape with clean, understated shadow bounds

Color Composition: Background vector #FFFFFF, Text label element #111111

Shadow Mapping: shadow-sm (0 2px 4px rgba(0,0,0,0.1))

Persistent Bottom Workspace Navigation Engine
Height Footprint: Exactly 83px (Strictly includes the hardware OS bottom safe area padding rules)

Container Backdrop Base: High-contrast #FFFFFF solid overlay block layout

State Highlighting: Active selection nodes render in Brand Red (#E11D2E). Inactive channels default directly to Dark Gray (#4A4A4A).