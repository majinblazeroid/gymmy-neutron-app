# Project Structure — What Every File Does and Why

---

## The Big Picture

This app has three distinct layers:

```
Browser (what you see)
    ↕  HTTP requests
Server (Next.js, running on your Mac / Vercel)
    ↕  SQL queries
Database (Supabase / Postgres, running in the cloud)
```

The folder structure reflects this separation. Every folder has a clear job.

---

## Why This Folder Structure?

Next.js enforces most of it. The rule is simple:

> **The folder name = the URL path**

So `app/workout/page.tsx` is automatically served at `http://localhost:3000/workout`.  
You don't configure routes anywhere — the file location *is* the route.

This is called **file-based routing**. It means:
- You always know where a page lives just by knowing its URL
- No separate router config to maintain
- Nested folders = nested URLs (e.g. `app/api/workouts/week/` → `/api/workouts/week`)

The rest of the structure (`components/`, `lib/`) is a convention — not enforced by Next.js, but standard practice for keeping things organised.

---

## Full File Map

```
gym-tracker/
├── app/                        ← Everything that becomes a URL
│   ├── page.tsx                ← The dashboard ( / )
│   ├── layout.tsx              ← Wraps every page (nav bar, body styles)
│   ├── globals.css             ← Global CSS (Tailwind + shadcn theme)
│   ├── favicon.ico             ← Browser tab icon
│   │
│   ├── workout/
│   │   └── page.tsx            ← Gym session logger ( /workout )
│   ├── bjj/
│   │   └── page.tsx            ← BJJ session logger ( /bjj )
│   ├── history/
│   │   └── page.tsx            ← Session history ( /history )
│   ├── settings/
│   │   └── page.tsx            ← Settings ( /settings )
│   │
│   └── api/                    ← Backend API endpoints (server only, never in browser)
│       ├── exercises/
│       │   └── route.ts        ← GET /api/exercises  — list all exercises
│       │                         POST /api/exercises — add a new exercise
│       ├── templates/
│       │   └── route.ts        ← GET /api/templates?day=A  — get Day A exercise order
│       │                         PUT /api/templates        — reorder exercises
│       ├── warmups/
│       │   └── route.ts        ← GET /api/warmups?day=A  — get Day A warmups
│       │                         PUT /api/warmups         — update warmups
│       ├── workouts/
│       │   ├── route.ts        ← GET /api/workouts  — full workout history
│       │   │                     POST /api/workouts — save a new gym session + sets
│       │   └── week/
│       │       └── route.ts    ← GET /api/workouts/week — which days done this week
│       ├── bjj/
│       │   └── route.ts        ← GET /api/bjj  — BJJ history
│       │                         POST /api/bjj — save a BJJ session
│       ├── progression/
│       │   └── route.ts        ← GET /api/progression?day=A — progression suggestions
│       └── import/
│           └── route.ts        ← POST /api/import — placeholder (use Python script)
│
├── components/                 ← Reusable UI building blocks
│   ├── shared/                 ← Used across multiple pages
│   │   ├── Nav.tsx             ← Bottom navigation bar (Home/Gym/BJJ/History/Settings)
│   │   └── FeelingRating.tsx   ← The 5-emoji picker (💀😐🙂💪🔥)
│   │
│   ├── workout/                ← Components only used in the workout flow
│   │   ├── PreWorkout.tsx      ← Day selector + pre-feeling + notes
│   │   ├── WarmupChecklist.tsx ← Tick-box list of warmup exercises
│   │   ├── ExerciseLogger.tsx  ← Renders all exercise cards in order
│   │   ├── ExerciseCard.tsx    ← One card per exercise (name, sets, add set button)
│   │   ├── SetInput.tsx        ← A single set row (weight/reps/duration fields)
│   │   └── PostWorkout.tsx     ← Post-feeling + session summary + save button
│   │
│   ├── bjj/                    ← (Reserved for BJJ-specific components)
│   ├── dashboard/              ← (Reserved for dashboard-specific components)
│   ├── history/                ← (Reserved for history/chart components)
│   │
│   └── ui/                     ← shadcn/ui primitives — auto-generated, don't edit
│       ├── button.tsx          ← <Button> component with variants (default, outline, etc)
│       ├── card.tsx            ← <Card>, <CardHeader>, <CardContent> layout components
│       ├── badge.tsx           ← Small label pill (e.g. "Done", "Advanced")
│       ├── input.tsx           ← Styled <input> element
│       ├── textarea.tsx        ← Styled <textarea> element
│       ├── select.tsx          ← Styled dropdown <select>
│       ├── tabs.tsx            ← Tabbed interface component
│       └── separator.tsx       ← Horizontal divider line
│
├── lib/                        ← Shared logic and utilities (not UI)
│   ├── types.ts                ← All TypeScript type definitions (the "shape" of your data)
│   ├── db.ts                   ← Supabase client — the thing that talks to the database
│   ├── presets.ts              ← Hardcoded seed data (exercises, warmups, Day A/B order)
│   ├── progression.ts          ← Progression engine (increase/hold/deload logic)
│   └── utils.ts                ← cn() helper for combining Tailwind classes
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  ← SQL that creates all the database tables.
│                                     Run this once in the Supabase SQL editor.
│
├── migration/                  ← Python one-time data import tool
│   ├── migrate.py              ← Reads Gym_Ting.xlsx, writes to Supabase
│   └── venv/                   ← Python virtual environment (openpyxl, supabase SDK)
│
├── public/                     ← Static files served as-is (no processing)
│   └── manifest.json           ← PWA manifest (app name, icons, theme colour for
│                                  "Add to Home Screen")
│
├── docs/                       ← You are here
│   ├── PROJECT_STRUCTURE.md    ← This file
│   └── TYPESCRIPT_GUIDE.md     ← TypeScript explained for Java/Python/R developers
│
├── .env.local                  ← Secret environment variables (Supabase URL + key)
│                                  NEVER commit this file to git
├── next.config.ts              ← Next.js configuration (allowedDevOrigins for iPhone)
├── tsconfig.json               ← TypeScript compiler configuration
├── package.json                ← npm dependencies and scripts (npm run dev, npm run build)
├── package-lock.json           ← Exact locked versions of every dependency
├── components.json             ← shadcn/ui config (style, paths)
└── eslint.config.mjs           ← ESLint config (code style rules)
```

---

## What `app/` vs `components/` vs `lib/` means

Think of it like this:

| Folder | Analogy | Contains |
|--------|---------|----------|
| `app/` | Your main scripts / notebooks | Pages and API endpoints — things that are URLs |
| `components/` | Functions you call from your main script | UI building blocks — things that render on screen |
| `lib/` | Utility modules / helper files | Pure logic — types, DB client, algorithms |

**Rule of thumb:**
- If it's a URL someone navigates to → `app/`
- If it's a piece of UI used in multiple places → `components/`
- If it's logic with no UI → `lib/`

---

## Why are API routes inside `app/api/`?

In traditional web development you'd have a separate backend server (e.g. a Python Flask app or a Java Spring app) running on a different port. Next.js collapses this — your frontend and backend live in the same project.

Files named `route.ts` inside `app/api/` are server-only. They never run in the browser. They're the equivalent of your Flask routes or Spring controllers — they receive HTTP requests and return JSON.

The browser calls them with `fetch("/api/workouts")` just like it would call any external API.

---

## The `.next/` and `node_modules/` folders (ignore these)

| Folder | What it is |
|--------|-----------|
| `.next/` | Build output — generated automatically by `npm run dev` or `npm run build`. Delete it freely, it regenerates. |
| `node_modules/` | All installed npm packages. Equivalent to a Python `venv`. Never edit manually. Delete and run `npm install` to restore. |

---

## What's still left to build

| Feature | Status | Where it lives |
|---------|--------|----------------|
| Supabase connection | **Needs your credentials** | `.env.local` |
| Database tables | **Needs SQL run** | `supabase/migrations/001_initial_schema.sql` |
| Exercises/warmups in DB | **Needs seed** | `migration/migrate.py --seed-only` |
| Historical data import | Not started | `migration/migrate.py --file Gym_Ting.xlsx` |
| Progression badges on exercise cards | Not built | `components/workout/ExerciseCard.tsx` |
| Progress charts in History | Not built | `app/history/page.tsx` |
| Settings — edit exercises/warmups | Not built | `app/settings/page.tsx` |
| PWA offline support | Not built | Service worker |