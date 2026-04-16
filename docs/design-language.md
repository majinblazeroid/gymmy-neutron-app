# Gymmy Neutron — Design Language

## Brand

**App name:** Gymmy Neutron  
**Tagline:** Track gym workouts and BJJ sessions  
**Character:** Friendly, energetic, clean — not clinical or corporate.

---

## Color Tokens

All five brand colors are defined as CSS custom properties in `app/globals.css`.

| Token | Hex | RGB | Usage |
|---|---|---|---|
| `--celadon` | `#adf7b6` | 173, 247, 182 | Gym / workout sections |
| `--peach-glow` | `#ffc09f` | 255, 192, 159 | BJJ sections |
| `--cool-horizon` | `#79addc` | 121, 173, 220 | Post-workout summary / info panels |
| `--light-gold` | `#ffee93` | 255, 238, 147 | Achievement / done states (future use) |
| `--lemon-chiffon` | `#fcf5c7` | 252, 245, 199 | Home page unified action card |

**Supporting neutrals:**

| Role | Value |
|---|---|
| Page background | `#f9f9f8` |
| Card background | `#ffffff` |
| Primary text | `gray-900` (#111827) |
| Secondary text | `gray-400` (#9ca3af) |
| Muted text | `gray-500` (#6b7280) |
| Primary action (buttons) | `gray-900` |
| Icon color | `gray-400` |
| Border (subtle) | `gray-100` (#f3f4f6) |

---

## Color Assignment Rules

**Color belongs at the section/panel level — never on the card itself.**

```
[Colored panel — rgba at 18–22% opacity]
  [White card]    ← the thing you tap is always white
  [White card]
[/Colored panel]
```

| Context | Color token | Opacity |
|---|---|---|
| Gym / workout panels | celadon | 18–20% |
| BJJ panels | peach-glow | 20–22% |
| Rolling details (BJJ advanced) | peach-glow | 28–30% |
| Post-workout summary stats | cool-horizon | 18% |
| Home unified action card | lemon-chiffon | 55% |
| Feeling / info white panels | white | 100% |
| Stats row chips | white | 100% — no tint |

**Icon rule:** All icons inside cards are plain `text-gray-400`. No colored icon containers.  
**Text rule:** No brand color ever appears in text — only in panel backgrounds.

---

## Typography

| Role | Class | Example |
|---|---|---|
| Page title | `text-3xl font-bold tracking-tight text-gray-900` | "Gymmy Neutron" |
| Section heading | `text-xs font-semibold uppercase tracking-widest text-gray-400` | "THIS WEEK — GYM" |
| Card title | `text-base font-semibold text-gray-900` | "Day A" |
| Card subtitle | `text-xs text-gray-400 mt-0.5` | "Ready to log" |
| Stat number | `text-2xl font-bold text-gray-900 leading-none` | "0/2" |
| Stat label | `text-xs font-medium text-gray-500 mt-1.5` | "Gym" |
| Body / notes | `text-sm text-gray-900` | form inputs |
| Placeholder | `placeholder:text-gray-300` | |

**Font:** Geist (loaded via `next/font/google` in `app/layout.tsx`)

---

## Spacing System

| Level | Value | Usage |
|---|---|---|
| Page top padding | `pt-10` | All pages |
| Between major sections | `space-y-8` | Page root container |
| Inside a panel | `space-y-3` to `space-y-5` | Between cards in a panel |
| Card padding (tall row) | `px-5 py-5` | Day rows, BJJ row |
| Card padding (form section) | `px-5 py-4` | Inputs, info panels |
| Section label to first card | `mb-3` or `space-y-3` | Under section labels |
| Divider between sub-sections | `border-t border-gray-200/70` | Inside home card |

---

## Component Patterns

### Panel → White Card (core pattern)

```tsx
<section
  className="rounded-3xl p-5 space-y-3"
  style={{ background: "rgba(173, 247, 182, 0.20)" }}  // celadon for gym
>
  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
    Section Label
  </p>

  <div className="bg-white rounded-2xl px-5 py-5 flex items-center gap-4 shadow-sm border border-white/80">
    <Icon size={18} className="text-gray-400 flex-shrink-0" />
    <div>
      <p className="font-semibold text-gray-900 text-base">Card Title</p>
      <p className="text-gray-400 text-xs mt-0.5">Subtitle</p>
    </div>
    <ChevronRight size={16} className="text-gray-300 flex-shrink-0 ml-auto" />
  </div>
</section>
```

### Stat Chip (white, no tint)

```tsx
<div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
  <p className="text-2xl font-bold text-gray-900 leading-none">0<span className="text-base text-gray-400">/2</span></p>
  <p className="text-gray-500 text-xs mt-1.5 font-medium">Gym</p>
</div>
```

### Primary Button (dark)

```tsx
<button className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-2xl py-5 font-semibold text-base transition-colors shadow-sm">
  Start Workout
</button>
```

### Secondary Button (white)

```tsx
<button className="flex-1 bg-white border border-gray-100 text-gray-500 rounded-2xl py-4 font-semibold text-sm shadow-sm">
  Skip
</button>
```

### Active / Inactive State (selection)

Selected item: `opacity: 1`  
Unselected item: `opacity: 0.5`  
Selection indicator: `<div className="ml-auto w-2 h-2 rounded-full bg-gray-900" />`

### Done State

```tsx
// Completed items fade out — same card, reduced opacity
<div className="... opacity-55">
  <CheckCircle size={18} className="text-green-500" />
  ...
  <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-semibold">Done</span>
</div>
```

### Progress Bar (exercise flow)

```tsx
<div className="h-1 bg-gray-100 rounded-full overflow-hidden">
  <div
    className="h-full bg-gray-900 rounded-full transition-all duration-300"
    style={{ width: `${progress}%` }}
  />
</div>
```

---

## Border Radius Scale

| Element | Radius |
|---|---|
| Section panels | `rounded-3xl` (24px) |
| Cards / rows | `rounded-2xl` (16px) |
| Icon containers | `rounded-xl` (12px) |
| Small badges / pills | `rounded-full` |
| Progress bar | `rounded-full` |
| Mode switcher tabs | `rounded-lg` (8px) |

---

## Navigation

Bottom tab bar — fixed, white background, `border-t border-gray-200`.

- 5 tabs: Home, Gym, BJJ, History, Settings
- Active: `text-gray-900`, `strokeWidth={2.5}`, label `font-semibold`
- Inactive: `text-gray-400`, `strokeWidth={1.5}`
- No colored active indicator — weight and darkness signal active state

---

## Page Color Map

| Page / Screen | Panel color(s) |
|---|---|
| Home | lemon-chiffon card (gym + bjj combined) |
| Pre-workout (day select) | celadon |
| Warmup checklist | celadon |
| Exercise logger | celadon |
| Post-workout summary | cool-horizon |
| BJJ form | peach-glow |
| BJJ rolling details | peach-glow (deeper) |
| History — gym sessions | celadon |
| History — bjj sessions | peach-glow |
| History — progress charts | celadon |
| Settings — config | celadon |
| Settings — data export | peach-glow |

---

## File Reference

| What | Where |
|---|---|
| CSS variables | `app/globals.css` |
| Root layout + font | `app/layout.tsx` |
| Bottom nav | `components/shared/Nav.tsx` |
| Feeling rating | `components/shared/FeelingRating.tsx` |
| Home page | `app/page.tsx` |
| Workout flow | `app/workout/page.tsx` |
| Pre-workout | `components/workout/PreWorkout.tsx` |
| Warmup | `components/workout/WarmupChecklist.tsx` |
| Exercise logger | `components/workout/ExerciseLogger.tsx` |
| Exercise card | `components/workout/ExerciseCard.tsx` |
| Set input | `components/workout/SetInput.tsx` |
| Post-workout | `components/workout/PostWorkout.tsx` |
| BJJ | `app/bjj/page.tsx` |
| History | `app/history/page.tsx` |
| Settings | `app/settings/page.tsx` |
