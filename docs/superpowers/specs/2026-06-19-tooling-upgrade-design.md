# Tooling & Framework Upgrade Design

**Date:** 2026-06-19  
**Status:** Approved

## Goal

Modernize the project's build tooling and dependencies — replacing the abandoned Create React App with Vite, upgrading to React 19, TypeScript 5, Three.js latest, and React Three Fiber v9 — without breaking any existing 3D functionality.

---

## Package Manager & Project Structure

Standardize on **npm**. Delete `yarn.lock` (the repo has both `yarn.lock` and an untracked `package-lock.json`, which is inconsistent).

**Files removed** (CRA-specific, no longer needed):
- `src/react-app-env.d.ts`
- `src/reportWebVitals.ts`
- `src/setupTests.ts`

**Files added:**
- `vite.config.ts` — Vite config at project root
- `index.html` — moved from `public/` to project root (Vite convention); updated to include `<script type="module" src="/src/index.tsx">`

---

## Upgrade Layers

Each layer is applied and verified independently before moving to the next.

### Layer 1 — CRA → Vite

- Remove `react-scripts` from dependencies
- Install `vite` and `@vitejs/plugin-react`
- Update `package.json` scripts:
  - `start` → `dev` (runs `vite`)
  - `build` → `vite build`
  - `test` is dropped (no tests exist; can be re-added later with Vitest)
- Update `tsconfig.json`: set `"moduleResolution": "bundler"`, `"target": "ES2020"`, and remove CRA-specific compiler options
- Move and update `public/index.html` to project root
- **Checkpoint:** `npm run dev` serves the app

### Layer 2 — React 18 → 19

- Bump `react`, `react-dom` to `^19`
- Bump `@types/react`, `@types/react-dom` to `^19`
- React 19 uses the new JSX transform by default; `@vitejs/plugin-react` handles this automatically — no `import React from 'react'` needed in components
- **Checkpoint:** app renders without runtime errors

### Layer 3 — TypeScript 4 → 5

- Bump `typescript` to latest `^5`
- `tsconfig.json` already updated in Layer 1 with Vite-recommended settings (`"moduleResolution": "bundler"`)
- **Checkpoint:** `npx tsc --noEmit` passes with no errors

### Layer 4 — Three.js + R3F + Drei

- Bump `three` to latest (`^0.176`)
- Bump `@react-three/fiber` to `^9` (adds React 19 support)
- Bump `@react-three/drei` to latest
- Remove `@types/three` — Three.js now ships its own types
- **Checkpoint:** app renders 3D scene, character moves

### Layer 5 — simplex-noise v3 → v4

- Bump `simplex-noise` to `^4`
- Fix `Ground.tsx` (see Code Changes section)
- **Checkpoint:** terrain generates correctly

---

## Code Changes (Deprecation Fixes)

### `Ground.tsx`

- `planeBufferGeometry` → `planeGeometry` (renamed in Three.js r125; errors in newer versions)
- Update simplex-noise import and usage:
  - **Before:** `import SimplexNoise from 'simplex-noise'` / `new SimplexNoise()`
  - **After:** `import { createNoise2D } from 'simplex-noise'` / `createNoise2D()`

### `Character.tsx`

- Fix the `useEffect` missing dependency array — currently runs on every render, re-registering key listeners each frame. Add `[]` as the dep array.
- Fix `useCallback` handlers — they reference `activeAnimation` which is re-created each render. Move `activeAnimation` to a `useRef` so the reference is stable across renders.
- Verify `FBXLoader` import path is correct against newer three version (`three/examples/jsm/loaders/FBXLoader` — unchanged, still valid).

### `App.tsx`

- Verify `softShadows()` from `@react-three/drei` still works (it does, but confirm import is stable).
- Remove the stray `/` character on the `<hemisphereLight>` line (existing typo: `<hemisphereLight {...hemiLight} />/`).
- Remove `import React from 'react'` (no longer needed with new JSX transform).

### `Nature.tsx`

- Fix the `useMemo` bug: the memo callback populates `objects` via side-effect but returns `undefined`. Refactor so the memo callback returns the array directly and `objects` is assigned from `useMemo`'s return value.
- Remove `import React from 'react'` (no longer needed).

---

## What Is Not Changing

- **Tailwind CSS** stays on v3 (v4 is a breaking rewrite; not worth the disruption)
- **Three.js scene structure** — Ground, Character, Nature components keep their existing shape
- **3D assets** — all FBX files in `public/` are untouched
- **Routing** — not added now; React Router v7 is the natural addition if needed later

---

## Success Criteria

- `npm run dev` starts the app with no console errors or deprecation warnings
- `npx tsc --noEmit` passes cleanly
- Character moves (WASD), runs (Shift), dances (E)
- Terrain and nature objects render correctly
- No `planeBufferGeometry`, `BufferGeometry` rename, or simplex-noise deprecation warnings in console
