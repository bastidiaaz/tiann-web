# Task 3: Upgrade Three.js, R3F, Drei — Fix Three.js Deprecations

## Context
Task 3 of 5 in a React + Three.js tooling upgrade. Tasks 1 and 2 are complete (Vite installed, React 19 installed). This task upgrades Three.js, @react-three/fiber, and @react-three/drei to their latest versions, then fixes Three.js deprecations in source files.

## Working directory
`C:\Users\bastian.diaz\Work\personal\tiann-web\.claude\worktrees\tooling-upgrade`

## Global Constraints
- Package manager is npm — use `--legacy-peer-deps` if plain install fails
- Tailwind CSS stays on v3 — do NOT touch it
- No new components or features

## Background — what Task 2 left behind
Task 2 upgraded React to 19. Because the current R3F version is an old beta (`v8.0.0-beta.9`) that doesn't support React 19 natively, Task 2 added temporary workarounds:
- `src/react-three-fiber.d.ts` — a type augmentation shim
- `as any` casts on THREE.js object spreads in `src/App.tsx` (lines with `hemiLight`, `light`, `camera`)
- `ref={terrain as any}` in `src/components/Ground.tsx`

**This task must remove all of those workarounds** after upgrading R3F to v9+ (which supports React 19 natively).

## Package changes

```bash
npm uninstall @types/three
npm install three@latest @react-three/fiber@latest @react-three/drei@latest
```

Use `--legacy-peer-deps` if needed. After install, confirm:
- `three` is v0.16x or newer (`npm ls three`)
- `@react-three/fiber` is v9 or newer (`npm ls @react-three/fiber`)

`@types/three` is removed because Three.js ships its own TypeScript types since v0.134.

## Source file changes

### `src/App.tsx`

Two changes:

**1. Update React import** — with the new JSX transform active (`"jsx": "react-jsx"` in tsconfig), `React` no longer needs to be in scope for JSX. `App` does not use `React.FC` or any other React namespace member, so the React default import is unnecessary.

Change:
```tsx
import React, { Suspense } from "react";
```
To:
```tsx
import { Suspense } from "react";
```

**2. Remove `as any` casts** — R3F v9 has React 19-compatible types; the casts are no longer needed.

Change the three JSX lines in the return statement from their current form:
```tsx
<hemisphereLight {...(hemiLight as any)} />
<directionalLight {...(light as any)} />
<perspectiveCamera {...(camera as any)} />
```
Back to clean spreads:
```tsx
<hemisphereLight {...hemiLight} />
<directionalLight {...light} />
<perspectiveCamera {...camera} />
```

### `src/components/Ground.tsx`

Two changes:

**1. Fix `planeBufferGeometry` → `planeGeometry`** — `planeBufferGeometry` was renamed in Three.js r125 and hard-errors in current versions.

Find:
```tsx
      <planeBufferGeometry
        attach="geometry"
        args={[1000, 1000, 250, 250]}
        ref={terrain}
      />
```
Replace with:
```tsx
      <planeGeometry
        attach="geometry"
        args={[1000, 1000, 250, 250]}
        ref={terrain}
      />
```

**2. Remove `as any` ref cast** — The ref is currently `ref={terrain as any}` (added in Task 2). With R3F v9 and proper Three.js types, the ref type should resolve cleanly. Remove the cast so it reads `ref={terrain}`. If TypeScript still complains about the ref type after removing the cast, adjust the ref's type annotation at the top of the component (currently `useRef<THREE.PlaneGeometry>`) to match what R3F v9 expects for geometry refs.

### `src/react-three-fiber.d.ts`

**Delete this file entirely.** It was a temporary shim for the React 19 + old R3F type incompatibility. With R3F v9 it is no longer needed and may conflict with R3F's own type definitions.

## Steps

1. `npm uninstall @types/three` (add `--legacy-peer-deps` if needed)
2. `npm install three@latest @react-three/fiber@latest @react-three/drei@latest` (add `--legacy-peer-deps` if needed)
3. Confirm `npm ls three` shows v0.16x+ and `npm ls @react-three/fiber` shows v9+
4. Delete `src/react-three-fiber.d.ts`
5. Update `src/App.tsx`: change React import, remove `as any` casts
6. Update `src/components/Ground.tsx`: fix `planeBufferGeometry` → `planeGeometry`, remove `ref as any`
7. Run `npx tsc --noEmit` — fix any remaining type errors caused by the R3F upgrade
8. Run `npm run dev` — verify Vite starts and the 3D scene loads
9. Commit: `git add -A && git commit -m "chore: upgrade Three.js, R3F, Drei; fix planeBufferGeometry deprecation"`

## Verification
- `npm ls three` → v0.16x or newer
- `npm ls @react-three/fiber` → v9 or newer
- `npx tsc --noEmit` → zero errors
- `npm run dev` → Vite starts, 3D scene visible in browser
- No `as any` casts remaining in App.tsx or Ground.tsx (beyond any that were pre-existing before Task 2)
- `src/react-three-fiber.d.ts` deleted

## If R3F v9 doesn't exist yet
If `@react-three/fiber@latest` installs a version lower than v9, check if there's a React 19-compatible release under a different tag (e.g., `@react-three/fiber@rc` or a specific version). Use whatever version properly supports React 19. Document this in your report.

## Report
Write your full report to: `C:\Users\bastian.diaz\Work\personal\tiann-web\.superpowers\sdd\task-3-report.md`

Include:
- Installed versions of three, @react-three/fiber, @react-three/drei
- Output of `npx tsc --noEmit`
- Whether `npm run dev` started successfully
- Any deviations from the brief and why
- Your self-review findings

Return: status (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED), commit hash, one-line verification summary.
