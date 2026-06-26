# SOUND DESIGN SYSTEM — Interaction & Audio Reference
> Low-frequency mechanical clicks and organic atmospheric pads — a soundscape focused on tactile physical feedback and spatial presence.

**Theme:** Minimalist, cinematic, low-intrusion

## 1. Core Principles & Logic
- **User-Initiated Consent**: The Web Audio API Context (`AudioContext`) *must* remain suspended until the first meaningful user gesture (e.g., clicking an "Enter Experience" button or the navbar).
- **Subtlety First**: Frequencies must occupy the lower-mid range (120Hz–400Hz) to sound "expensive" and grounding. Avoid high-frequency sitcom chirps or generic system beeps.
- **Micro-Interaction Debouncing**: Sound effects (SFX) assigned to fast UI tracking (like hover elements) must be throttled or debounced by 80ms to prevent acoustic overcrowding during fast mouse movements.

## 2. Audio Tokens & Parameters

### Oscillator-Based Sound Synthesis (No Assets Required)
For instant UI feedback, synthesize pure waveforms via the Web Audio API to guarantee zero asset loading delay:

| Name | Waveform | Base Freq | Duration | Gain (Volume) | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `click-mechanical` | `triangle` | 140Hz → 80Hz | 0.04s | 0.2 | Primary button presses, pill toggle activation |
| `hover-whisper` | `sine` | 220Hz | 0.08s | 0.05 | Hover transitions on prominent header components |
| `hairline-trigger` | `square` | 380Hz → 200Hz | 0.03s | 0.02 | Ghost input focus activation |

### Atmospheric Sound Assets (PCM/WAV)
For cinematic ambiance, load lightweight, looping buffer files:

| Token | File Path | Loop | Fade-In | Role |
| :--- | :--- | :--- | :--- | :--- |
| `--audio-bg-drone` | `/audio/ambient_void_loop.wav` | True | 2.5s | Deep, low-end background rumble (40Hz-60Hz) starting on entry |
| `--audio-cinematic-sweep` | `/audio/sub_drop_sweep.wav` | False | 0s | Scroll milestone transition effect (tied to 3D animations) |

## 3. Interaction Mechanics & Implementation Rules

### Rule 1: The UI Hover State
When an AI agent initializes a hover event listener on any button with class `.btn-pill` or `.btn-ghost`:
1. Check if `AudioContext` is running.
2. Initialize a brief `GainNode` and `OscillatorNode`.
3. Apply an exponential decay ramp down to `0.001` on the `gain.gain` parameter over `0.08s` to achieve a clean, non-abrupt mechanical decay.

### Rule 2: Scroll-Driven Spatial Audio (Cinematic Layer)
As the user triggers full-viewport section transitions (tied to the 3D scroll matrix):
- The agent must map the browser scroll velocity to a dynamic low-pass `BiquadFilterNode`.
- Fast scrolling lowers the filter cutoff frequency down to `150Hz`, making the ambient background audio sound "submerged" or deep during fast visual tracking. It crisps back up to `800Hz` when scrolling stops.

## 4. Audio Architecture Blueprint (for Agents)

```javascript
// Reference structure for the Audio Manager
class AudioManager {
  constructor() {
    this.ctx = null;
    this.primaryGain = null;
  }
  
  init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.primaryGain = this.ctx.createGain();
    this.primaryGain.gain.setValueAtTime(0.3, this.ctx.currentTime); // Master volume cap
    this.primaryGain.connect(this.ctx.destination);
  }

  playMechanicalClick() {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.04);
    
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
    
    osc.connect(gain);
    gain.connect(this.primaryGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }
}