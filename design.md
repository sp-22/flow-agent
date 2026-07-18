# WorkflowPilot — Visual Design Specification
*(Clean Monochrome Theme — Dark & Light Modes)*
This design system is a pure, layout-first "instrument panel" design. There are no brand accent colors, no gradients, no glow shadows, and no glassmorphism. Color is only used for semantic status (recording/error, success, warning). Primary actions are simply high-contrast (white-on-dark in Dark Mode, black-on-light in Light Mode).
---
## 1. Typography
- **Display Headings**: `Space Grotesk` (Geometric sans with a technical, high-craft character)
- **Body & Controls**: `IBM Plex Sans` (Humanist/Technical sans, highly legible at small sizes)
- **Code & Metadata**: `IBM Plex Mono` (Clean developer monospace)
---
## 2. Color Palettes
### A. Dark Theme (Default)
Applied via `:root` or `[data-theme="dark"]`.
```css
:root, [data-theme="dark"] {
  --bg-base:      #09090b; /* Void - Deepest workspace layer */
  --bg-surface:   #131316; /* Carbon - Card/panel backgrounds */
  --bg-elevated:  #1c1c21; /* Steel - Selected items, hovers, inputs */
  
  --border-wire:  #27272e; /* Wire - Rules and outlines */
  --border-hover: #33333d; /* Hovered outlines */
  
  --text-muted:   #5f5f70; /* Zinc - Captions, disabled labels */
  --text-body:    #a1a1af; /* Silver - General content readability */
  --text-heading: #ececef; /* Snow - Heading emphasis */
  --text-high:    #ffffff; /* Clear - Maximum contrast text & primary buttons */
  /* Semantic Signal Backgrounds (Dimmed overlays) */
  --signal-bg:    rgba(229, 83, 75, 0.08);
  --go-bg:        rgba(63, 185, 80, 0.08);
  --hold-bg:      rgba(210, 153, 34, 0.08);
}
```
### B. Light Theme
Applied via `[data-theme="light"]`. Modeled after the clean, neutral interfaces of advanced developer tools (e.g. Cursor Light).
```css
[data-theme="light"] {
  --bg-base:      #f9f9fb; /* Clear off-white canvas */
  --bg-surface:   #f0f0f3; /* Light gray panel background */
  --bg-elevated:  #e4e4e9; /* Slate - Selected elements, hovers */
  
  --border-wire:  #d7d7df; /* Gray rules and outlines */
  --border-hover: #bebec8; /* Hovered outlines */
  
  --text-muted:   #888896; /* Slate gray - captions, descriptors */
  --text-body:    #4b4b55; /* Charcoal - body readability */
  --text-heading: #1d1d22; /* Soft black - heading emphasis */
  --text-high:    #09090b; /* Deep black - Maximum contrast text & primary buttons */
  /* Semantic Signal Backgrounds (Dimmed overlays) */
  --signal-bg:    rgba(229, 83, 75, 0.06);
  --go-bg:        rgba(63, 185, 80, 0.06);
  --hold-bg:      rgba(210, 153, 34, 0.06);
}
```
### C. Shared Semantic Signals (Color is Earned)
These colors are stable across both modes:
- `--signal`: `#e5534b` (Signal Red — recording / failed run)
- `--go`: `#3fb950` (Go Green — completed / healthy)
- `--hold`: `#d29922` (Hold Amber — warning / stale)
---
## 3. Component Details & UX Rules
### Buttons
- **Primary (`.btn-primary`)**: Utilizes `--text-high` as background, inverse text.
- **Secondary (`.btn-secondary`)**: Transparent background, 1px solid `--border-wire` border, `--text-body` text. Hover shifts border to `--border-hover` and text to `--text-heading`.
- **Ghost (`.btn-ghost`)**: Transparent background, `--text-muted` text. Hover lightens text to `--text-body` and background to `--bg-elevated`.
- **Danger (`.btn-danger`)**: `--signal-bg` background with `--signal` colored text.
### Cards
- Background: `--bg-surface`.
- Border: 1px solid `--border-wire`.
- Hover: border shifts to `--border-hover`.
- No shadows, no gradients, and no transform shifts. Flat, solid containers.
### Signature Element (Recording Dot)
- A single 6px red dot with a slow 3-second breathing cycle (`opacity: 1` to `opacity: 0.15`). It is the only warm color on screen, creating an immediate visual focal point.
