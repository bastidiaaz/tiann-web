# Task 4: Upgrade simplex-noise to v4 — Fix Ground.tsx API

## Context
Task 4 of 5 in a React + Three.js tooling upgrade. Tasks 1–3 are complete (Vite, React 19, Three.js/R3F/Drei all upgraded). This task upgrades simplex-noise from v3 to v4 and updates Ground.tsx to use the new functional API.

## Working directory
`C:\Users\bastian.diaz\Work\personal\tiann-web\.claude\worktrees\tooling-upgrade`

## Global Constraints
- Package manager is npm — use `--legacy-peer-deps` if plain install fails
- Tailwind CSS stays on v3 — do NOT touch it
- No new features or components

## What changed in simplex-noise v4
simplex-noise v4 dropped the class-based API entirely. There is no longer a default export. Instead it exports factory functions.

| v3 | v4 |
|----|-----|
| `import SimplexNoise from 'simplex-noise'` | `import { createNoise2D } from 'simplex-noise'` |
| `new SimplexNoise()` | `createNoise2D()` — returns a function directly |
| `simplex.noise2D(x, y)` | `noise2D(x, y)` — call the returned function directly |

## Package change

```bash
npm install simplex-noise@latest
```

Use `--legacy-peer-deps` if needed. Confirm v4.x: `npm ls simplex-noise`.

## Source file change — `src/components/Ground.tsx`

### Import
Find:
```tsx
import SimplexNoise from "simplex-noise";
```
Replace with:
```tsx
import { createNoise2D } from "simplex-noise";
```

### useMemo
Find:
```tsx
const simplex = useMemo(() => new SimplexNoise(), []);
```
Replace with:
```tsx
const noise2D = useMemo(() => createNoise2D(), []);
```

### All noise calls inside `useLayoutEffect`
There are 5 calls to `simplex.noise2D(...)` inside the nested for-loops. Replace each with `noise2D(...)` (same arguments, just call the function directly).

Find:
```tsx
(simplex.noise2D(i / 100, j / 100) +
  simplex.noise2D((i + 200) / 50, j / 50) * Math.pow(ex, 1) +
  simplex.noise2D((i + 400) / 25, j / 25) * Math.pow(ex, 2) +
  simplex.noise2D((i + 600) / 12.5, j / 12.5) * Math.pow(ex, 3) +
  +(simplex.noise2D((i + 800) / 6.25, j / 6.25) * Math.pow(ex, 4)))
```
Replace with:
```tsx
(noise2D(i / 100, j / 100) +
  noise2D((i + 200) / 50, j / 50) * Math.pow(ex, 1) +
  noise2D((i + 400) / 25, j / 25) * Math.pow(ex, 2) +
  noise2D((i + 600) / 12.5, j / 12.5) * Math.pow(ex, 3) +
  +(noise2D((i + 800) / 6.25, j / 6.25) * Math.pow(ex, 4)))
```

## Steps

1. `npm install simplex-noise@latest` (add `--legacy-peer-deps` if needed)
2. Confirm `npm ls simplex-noise` → v4.x
3. Update `src/components/Ground.tsx` as described above (import, useMemo, 5 noise calls)
4. Run `npx tsc --noEmit` — must pass with zero errors
5. Run `npm run dev` — confirm Vite starts; the terrain must be bumpy/varied, NOT flat (flat terrain = noise calls returning 0, meaning API mismatch)
6. Commit: `git add package.json package-lock.json src/components/Ground.tsx && git commit -m "chore: upgrade simplex-noise to v4, update to functional API"`

## Verification
- `npm ls simplex-noise` → v4.x
- `npx tsc --noEmit` → zero errors
- `npm run dev` starts AND terrain is visually bumpy (not flat)

## Report
Write your full report to: `C:\Users\bastian.diaz\Work\personal\tiann-web\.superpowers\sdd\task-4-report.md`

Include:
- Installed simplex-noise version
- Output of `npx tsc --noEmit`
- Whether `npm run dev` started and terrain appeared bumpy
- Any deviations

Return: status (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED), commit hash, one-line verification summary.
