# TypeScript — Explained for Java / Python / R Developers

---

## What is TypeScript?

TypeScript is **JavaScript with types bolted on**.

If you know Java, you already understand the core idea — Java makes you declare types everywhere, and the compiler catches mistakes before you run the code. TypeScript does the same thing for JavaScript, which by default has no types at all.

```
Python / R  →  dynamic typing, find type errors at runtime
Java        →  static typing, find type errors at compile time
JavaScript  →  dynamic typing (like Python), no enforcement
TypeScript  →  static typing (like Java), but compiles DOWN to JavaScript
```

TypeScript is never actually executed. You write TypeScript, and a compiler (`tsc`) translates it to plain JavaScript, which is what the browser and Node.js actually run. The `.ts` / `.tsx` files you see in this project get compiled away — they don't exist in production.

---

## .ts vs .tsx — What's the difference?

| Extension | Stands for | Used for |
|-----------|-----------|---------|
| `.ts` | TypeScript | Pure logic — no UI, no HTML-like syntax |
| `.tsx` | TypeScript + JSX | Files that render UI (contain HTML-like syntax) |

**JSX** is the HTML-looking syntax you'll see inside TypeScript files:

```tsx
// This is JSX — looks like HTML but it's actually TypeScript
function Button() {
  return <button className="bg-blue-500">Click me</button>
}
```

JSX only exists in `.tsx` files. If you try to write `<button>` inside a `.ts` file, the compiler throws an error.

**Rule of thumb for this project:**
- `lib/types.ts`, `lib/db.ts`, `lib/progression.ts` → `.ts` (pure logic, no UI)
- `app/page.tsx`, `components/workout/ExerciseCard.tsx` → `.tsx` (renders UI)
- `app/api/workouts/route.ts` → `.ts` (server-side, returns JSON, no UI)

---

## Types — The Core Concept

### In Python (no types)
```python
def save_session(day, feeling, notes):
    # day could be anything — "A", "B", 42, None — Python doesn't care
    pass
```

### In Java (strict types)
```java
void saveSession(String day, int feeling, String notes) {
    // day must be a String. feeling must be an int. Enforced at compile time.
}
```

### In TypeScript (same idea as Java, but more flexible)
```typescript
function saveSession(day: string, feeling: number, notes: string): void {
    // Same as Java — types declared after the variable name with a colon
}
```

The syntax difference from Java: types come **after** the name, separated by a colon.

```
Java:        String name
TypeScript:  name: string
```

```
Java:        int count
TypeScript:  count: number        ← TypeScript uses "number" not "int" or "float"
```

---

## Interfaces — Like Java Interfaces but Used for Data Shapes

In Java, interfaces define method contracts. In TypeScript, interfaces are used mainly to describe the **shape of data objects** — what fields they have and what types those fields are.

Think of them like a class with only field declarations and no methods.

```typescript
// From lib/types.ts in this project
interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;       // a custom type (see Enums below)
  defaultUnit?: WeightUnit; // the ? means this field is optional (can be undefined)
  suggestedSets: number;
  suggestedReps: string;
  notes?: string;           // optional
}
```

**Python equivalent** (closest thing is a dataclass or TypedDict):
```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class Exercise:
    id: str
    name: str
    type: str
    suggested_sets: int
    suggested_reps: str
    default_unit: Optional[str] = None
    notes: Optional[str] = None
```

**R equivalent** (no direct equivalent — R uses lists or data frames):
```r
# R doesn't have interfaces — closest is a named list
exercise <- list(id = "abc", name = "RDL", type = "weighted", suggested_sets = 3)
```

Once you define an interface, TypeScript enforces it everywhere:
```typescript
const ex: Exercise = {
  id: "123",
  name: "RDL",
  type: "weighted",
  suggestedSets: 3,
  suggestedReps: "6-8",
  // forgot defaultUnit? That's fine — it's optional (?)
  // forgot name? TypeScript ERROR — name is required
}
```

---

## Type Aliases and Union Types — Better Than Java Enums

```typescript
// From lib/types.ts
type ExerciseType = "weighted" | "bodyweight" | "timed" | "timed_carry" | "unilateral";
type WeightUnit = "kg" | "lbs";
type WorkoutDay = "A" | "B";
```

The `|` means "or" — this variable can only be one of these exact string values.

**Java equivalent:**
```java
enum ExerciseType { WEIGHTED, BODYWEIGHT, TIMED, TIMED_CARRY, UNILATERAL }
```

**Python equivalent:**
```python
from enum import Enum
class ExerciseType(Enum):
    WEIGHTED = "weighted"
    BODYWEIGHT = "bodyweight"
```

TypeScript's version is more lightweight — you just use the string values directly:
```typescript
const myType: ExerciseType = "weighted"  // fine
const myType: ExerciseType = "swimming"  // TypeScript ERROR — not in the union
```

---

## Functions — Syntax Differences

TypeScript has two ways to write functions. Both are common.

### Traditional function (like Java methods)
```typescript
function addNumbers(a: number, b: number): number {
    return a + b;
}
```

### Arrow function (like Python lambdas, but full functions)
```typescript
const addNumbers = (a: number, b: number): number => {
    return a + b;
}

// If it's one line, you can skip the braces and return keyword
const addNumbers = (a: number, b: number): number => a + b;
```

**Python equivalent:**
```python
def add_numbers(a: int, b: int) -> int:
    return a + b

# Lambda (limited to one expression in Python)
add_numbers = lambda a, b: a + b
```

In this project you'll see arrow functions everywhere, especially in React components and callbacks.

---

## Arrays and Objects

```typescript
// Array of strings — Java: String[] or List<String>
const names: string[] = ["RDL", "Pull Ups", "Bench Press"]

// Array of Exercise objects
const exercises: Exercise[] = []

// Object (dictionary) — Java: Map<String, String>, Python: dict
const unitOverrides: Record<string, WeightUnit> = {
    "exercise-id-123": "kg",
    "exercise-id-456": "lbs",
}
```

**Python equivalent:**
```python
names: list[str] = ["RDL", "Pull Ups", "Bench Press"]
unit_overrides: dict[str, str] = {"exercise-id-123": "kg"}
```

---

## Optional Chaining — Cleaner Null Handling

TypeScript has a nice shorthand for null/undefined checks:

```typescript
// Instead of:
if (session && session.sets && session.sets.length > 0) { ... }

// You can write:
if (session?.sets?.length > 0) { ... }
// If session is null/undefined, it returns undefined instead of crashing
```

**Python equivalent:**
```python
# Python doesn't have this — you'd use:
if session and session.sets and len(session.sets) > 0:
```

---

## Generics — Same as Java Generics

TypeScript generics work exactly like Java generics:

```typescript
// A function that works with any type T
function getFirst<T>(arr: T[]): T {
    return arr[0];
}

getFirst<string>(["a", "b"])  // returns string
getFirst<number>([1, 2, 3])   // returns number
```

**Java equivalent:**
```java
<T> T getFirst(List<T> list) {
    return list.get(0);
}
```

You'll see generics in this project when we fetch from the database — Supabase returns typed results.

---

## `async` / `await` — Same as Python, Different From Java

Network calls (fetching from Supabase, calling an API) take time. Rather than blocking, JavaScript uses async/await. This is identical to Python's `asyncio`.

```typescript
// This is how every API route in this project works
async function getWorkouts(): Promise<WorkoutSession[]> {
    const { data, error } = await supabase
        .from("workout_sessions")
        .select("*")

    return data ?? []  // ?? means "if null/undefined, use this instead"
}
```

**Python equivalent:**
```python
async def get_workouts() -> list[WorkoutSession]:
    data = await supabase.table("workout_sessions").select("*").execute()
    return data.data or []
```

`Promise<WorkoutSession[]>` means "this function returns a promise that will eventually resolve to an array of WorkoutSession". It's the TypeScript equivalent of Python's `Awaitable[list[WorkoutSession]]`.

---

## `export` and `import` — Like Python Modules

```typescript
// lib/types.ts — exporting
export interface Exercise { ... }
export type WeightUnit = "kg" | "lbs"

// app/workout/page.tsx — importing
import { Exercise, WeightUnit } from "@/lib/types"
// @/ is an alias for the project root (configured in tsconfig.json)
```

**Python equivalent:**
```python
# types.py
class Exercise: ...

# workout.py
from lib.types import Exercise, WeightUnit
```

`export default` means "this is the main thing this file exports":
```typescript
// components/shared/Nav.tsx
export default function Nav() { ... }

// Imported without curly braces
import Nav from "@/components/shared/Nav"
```

---

## React-Specific: `useState` — Like a Variable That Triggers a Re-render

React components re-render when their **state** changes. `useState` is how you declare state.

```typescript
// In a React component
const [step, setStep] = useState<"pre" | "warmup" | "exercises">("pre")
//     ↑ current value  ↑ function to update it    ↑ initial value

// To update:
setStep("warmup")  // triggers re-render with new value
```

**Python analogy:** Imagine a Jupyter notebook cell that automatically re-runs every time a variable changes. `useState` is that variable. `setStep()` is what changes it and triggers the re-run.

---

## React-Specific: `useEffect` — Run Code When Something Changes

```typescript
useEffect(() => {
    // This runs after the component renders, or when `session.day` changes
    fetchExercises(session.day)
}, [session.day])  // ← dependency array: re-run when these values change
```

**Python analogy:** Like an `@property` setter that fires side effects, or an `observe()` callback in a notebook widget. The dependency array `[session.day]` means "watch this variable and re-run when it changes."

---

## The `"use client"` Directive

You'll see this at the top of most component files:

```typescript
"use client"
```

This tells Next.js: "Run this code in the browser, not on the server."

Without it, Next.js runs the component on the server to generate HTML — great for performance, but server-side code can't use `useState`, `useEffect`, event listeners, or anything browser-specific.

**Analogy:** Think of the server as a headless Python script that generates HTML strings. `"use client"` switches it to run as interactive browser JavaScript instead.

| | Server component (no directive) | Client component ("use client") |
|---|---|---|
| Can use `useState` | No | Yes |
| Can use `useEffect` | No | Yes |
| Can access browser APIs | No | Yes |
| Runs at build time / request time | Yes | No |
| Can directly query DB | Yes | No (use API routes) |

API routes (`route.ts` files) are always server-side — they never have `"use client"`.

---

## Quick Reference — Syntax Cheat Sheet

| Concept | Java | Python | TypeScript |
|---------|------|--------|------------|
| Variable | `int x = 5` | `x: int = 5` | `const x: number = 5` |
| Constant | `final int x = 5` | (convention: `X = 5`) | `const x = 5` |
| Mutable var | `int x = 5; x = 6` | `x = 5; x = 6` | `let x = 5; x = 6` |
| Function | `int add(int a, int b)` | `def add(a: int, b: int) -> int` | `function add(a: number, b: number): number` |
| Optional field | (use `Optional<T>`) | `Optional[str]` | `field?: string` |
| Null check | `x != null` | `x is not None` | `x !== null` (or `x != null`) |
| Null default | `x != null ? x : y` | `x or y` | `x ?? y` |
| Array type | `String[]` | `list[str]` | `string[]` |
| Dictionary | `Map<String, String>` | `dict[str, str]` | `Record<string, string>` |
| Async return | `CompletableFuture<T>` | `Awaitable[T]` | `Promise<T>` |
| Print | `System.out.println(x)` | `print(x)` | `console.log(x)` |