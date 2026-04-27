@AGENTS.md

## Design Philosophy

### Color palette
Each major route has its own identity color as a full-page background. Colors are all light/pastel — the app never feels dark or heavy.

| Route / context | Color | Value |
|---|---|---|
| Home | Blue | `#e3eef8` (body default) |
| Run overlay | Blue tint | `rgba(121,173,220,0.18)` |
| History | Warm amber | `#fef3e2` (fixed bg override) |
| Settings | Mint | `#e8faea` (suggested, not yet applied) |
| BJJ log | Coral | `#fff0e6` (suggested, not yet applied) |
| Gym workout | Mint | `#e8faea` (suggested, not yet applied) |

Section panels within a page use the same hue at low opacity:
- Gym sections: `rgba(173,247,182,0.20)`
- BJJ sections: `rgba(255,192,159,0.22)`
- Run sections: `rgba(121,173,220,0.18)`

Charcoal `#495057` is the primary text and dark-button color throughout.

### Layout principles
1. **Full-bleed colored backgrounds** — each major page sets its identity color via `fixed inset-0 -z-10` (history+) or the body default (home). White never shows as a page background.
2. **No card-on-card** — stats and data render as text directly on the background. White cards are reserved for actionable/tappable items only (things you press).
3. **HUD-style stats** — bold numbers (`text-4xl font-black`) with tiny uppercase labels (`text-[11px] uppercase tracking-wider`), no borders or backgrounds around them. Used on the home page header and run overlay.
4. **White cards for actions only** — `bg-white rounded-2xl shadow-sm border border-white/80` wraps things you tap. The card signals interactivity, not just information.
5. **Frosted glass for overlays** — `rgba(255,255,255,0.18–0.45)` + `backdropFilter: blur(12–14px)` for anything floating over a map or colored background (nav bar, run HUD buttons, run overlay nav).
6. **Universal top fade** — `rgba(255,255,255,0.55) → transparent` gradient fixed at the top; works on any background color without hard-coding a specific color.

### Navigation bar
- Background: `rgba(255,255,255,0.20)` + `backdropFilter: blur(14px)` — ultra-translucent so the page color bleeds through.
- Border: `border-t border-gray-200/50`.
- The run overlay replicates this same nav style inline (since the full-screen overlay sits above the real nav at z-60).

### Run overlay HUD
- Map always full-screen behind everything.
- Stats at top: frosted pill `rgba(255,255,255,0.45)` + blur — 3-stat row (Pace, Duration, Elevation) during active/paused; 2×2 grid (Distance, Duration, Pace, Elevation) during summary.
- Controls at bottom: separate `absolute` divs per phase, opacity-crossfaded, each with its own `bottom` offset so the ready state sits above the nav and active/paused sit at the screen edge.
- All buttons use `BTN_GLASS = rgba(255,255,255,0.72) + blur` (light) or `rgba(73,80,87,0.88) + blur` (dark/primary).
- No shared card container wrapping the buttons — they are individual glass pills.

### Dates
Display as `21 Apr 2026` (human-readable), not ISO `2026-04-21`.
