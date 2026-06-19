# Tooling & Framework Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Create React App with Vite and upgrade React, TypeScript, Three.js, R3F, Drei, and simplex-noise to current versions without breaking the 3D world's functionality.

**Architecture:** Layered in-place upgrade — each layer installs new packages and verifies the app boots before moving to the next. No new components or abstractions are introduced; the existing four-file source structure is preserved.

**Tech Stack:** Vite 6, React 19, TypeScript 5, Three.js ~0.176, @react-three/fiber (latest/v9+), @react-three/drei (latest), simplex-noise 4, Tailwind CSS 3 (unchanged)

## Global Constraints

- Tailwind CSS stays on v3 — do NOT upgrade to v4
- All existing 3D functionality must work after each layer: character moves (WASD), runs (Shift+WASD), dances (E), terrain renders, nature objects scatter
- Package manager is npm — do not use yarn
- No new components, abstractions, or features beyond what the spec describes

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `package.json` | Modify | Scripts + dependencies (all tasks) |
| `vite.config.ts` | Create | Vite + React plugin config |
| `tsconfig.json` | Modify | Update for Vite module resolution |
| `tsconfig.node.json` | Create | TypeScript config scoped to vite.config.ts |
| `index.html` | Create (root) | Vite entry HTML — replaces `public/index.html` |
| `public/index.html` | Delete | CRA entry HTML |
| `src/index.tsx` | Modify | Update to React 19 `createRoot` API |
| `src/App.tsx` | Modify | Fix JSX typo, update React import |
| `src/components/Ground.tsx` | Modify | Fix `planeBufferGeometry`, fix simplex-noise v4 API |
| `src/components/Character.tsx` | Modify | Fix `activeAnimation` ref, fix `useEffect` dep array |
| `src/components/Nature.tsx` | Modify | Fix `useMemo` return value bug |
| `src/react-app-env.d.ts` | Delete | CRA type shim |
| `src/reportWebVitals.ts` | Delete | CRA perf utility |
| `src/setupTests.ts` | Delete | CRA test setup |
| `yarn.lock` | Delete | Replaced by npm (`package-lock.json`) |

---

### Task 1: Replace CRA with Vite

**Files:**
- Create: `vite.config.ts`
- Create: `tsconfig.node.json`
- Create: `index.html` (project root)
- Modify: `package.json`
- Modify: `tsconfig.json`
- Modify: `src/index.tsx`
- Delete: `public/index.html`, `src/react-app-env.d.ts`, `src/reportWebVitals.ts`, `src/setupTests.ts`, `yarn.lock`

**Interfaces:**
- Produces: `npm run dev` starts a Vite dev server at `http://localhost:5173`; `npm run build` produces a `dist/` bundle

- [ ] **Step 1: Remove CRA, install Vite**

```bash
npm uninstall react-scripts
npm install --save-dev vite @vitejs/plugin-react
```

Expected: `react-scripts` is gone from `package.json`; `vite` and `@vitejs/plugin-react` appear in `devDependencies`.

- [ ] **Step 2: Create `vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

- [ ] **Step 3: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Replace `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 5: Create `index.html` at the project root**

Vite's entry HTML lives at the project root (not inside `public/`). Static assets in `public/` are served as-is without `%PUBLIC_URL%` prefixes.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="3D world with character" />
    <link rel="apple-touch-icon" href="/logo192.png" />
    <link rel="manifest" href="/manifest.json" />
    <title>Three.js World</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Update `package.json` scripts**

Replace the entire `scripts` block:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview"
}
```

- [ ] **Step 7: Update `src/index.tsx`**

The old `ReactDOM.render()` API was removed in React 19. Replace the entire file with the `createRoot` API:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

const root = createRoot(document.getElementById("root")!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 8: Delete CRA-specific files**

```bash
rm public/index.html
rm src/react-app-env.d.ts
rm src/reportWebVitals.ts
rm src/setupTests.ts
rm yarn.lock
```

- [ ] **Step 9: Verify the app boots**

```bash
npm run dev
```

Expected output:
```
  VITE v6.x.x  ready in Xms
  ➜  Local:   http://localhost:5173/
```

Open `http://localhost:5173` in the browser. The loading bar should appear, then the 3D scene. Press W — character should walk. If the scene is blank, open DevTools → Console and share the error.

- [ ] **Step 10: Commit**

```bash
git add vite.config.ts tsconfig.json tsconfig.node.json index.html src/index.tsx package.json package-lock.json
git add -u
git commit -m "chore: replace CRA with Vite"
```

---

### Task 2: Upgrade React 19 and TypeScript 5

**Files:**
- Modify: `package.json` (via npm install)

**Interfaces:**
- Consumes: working Vite dev server from Task 1
- Produces: React 19 + TypeScript 5; `npx tsc --noEmit` passes

- [ ] **Step 1: Upgrade React and TypeScript**

```bash
npm install react@latest react-dom@latest
npm install --save-dev @types/react@latest @types/react-dom@latest typescript@latest
```

After install, run `npm ls react` and confirm it reports v19.x.

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. (Pre-existing `@ts-ignore` in `Ground.tsx` and `any`-typed event params in `Character.tsx` are acceptable — they will be cleaned up in later tasks.)

- [ ] **Step 3: Verify app still runs**

```bash
npm run dev
```

Open `http://localhost:5173`. Scene loads, character moves with W/A/S/D.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: upgrade React to 19 and TypeScript to 5"
```

---

### Task 3: Upgrade Three.js, R3F, Drei — Fix Three.js Deprecations

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `src/components/Ground.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: React 19 + TypeScript 5 environment from Task 2
- Produces: Three.js latest, R3F v9+, Drei latest; no deprecated geometry JSX element names; `planeGeometry` in use

- [ ] **Step 1: Remove `@types/three`, upgrade Three.js, R3F, Drei**

Three.js ships its own TypeScript types since v0.134 — `@types/three` conflicts with newer versions and must be removed.

```bash
npm uninstall @types/three
npm install three@latest @react-three/fiber@latest @react-three/drei@latest
```

After install, confirm:
- `three` is v0.16x or newer (`npm ls three`)
- `@react-three/fiber` is v9 or newer (`npm ls @react-three/fiber`)

- [ ] **Step 2: Fix `planeBufferGeometry` → `planeGeometry` in `src/components/Ground.tsx`**

`planeBufferGeometry` was renamed to `planeGeometry` in Three.js r125 and removed in later versions. In `src/components/Ground.tsx`, find:

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

The `terrain` ref type (`THREE.PlaneGeometry`) is already the correct name — no type change needed.

- [ ] **Step 3: Fix `src/App.tsx` — stray `/` typo and React import**

Line 41 has a stray `/` after the JSX tag:
```tsx
        <hemisphereLight {...hemiLight} />/
```
Remove the trailing `/`:
```tsx
        <hemisphereLight {...hemiLight} />
```

The `react-jsx` transform (active since Task 1) means JSX no longer requires React in scope. Update the import at the top of `App.tsx`:
```tsx
// Before:
import React, { Suspense } from "react";
// After:
import { Suspense } from "react";
```

- [ ] **Step 4: Verify scene renders**

```bash
npm run dev
```

Open `http://localhost:5173`. Scene loads with terrain, trees, and character. Open DevTools → Console — there should be no errors about unknown element types or removed geometry names.

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/components/Ground.tsx src/App.tsx
git commit -m "chore: upgrade Three.js, R3F, Drei; fix planeBufferGeometry deprecation"
```

---

### Task 4: Upgrade simplex-noise to v4 — Fix Ground.tsx API

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `src/components/Ground.tsx`

**Interfaces:**
- Consumes: Three.js environment from Task 3
- Produces: simplex-noise v4 functional API in use; terrain generates non-flat height variation

- [ ] **Step 1: Upgrade simplex-noise**

```bash
npm install simplex-noise@latest
```

Confirm v4.x: `npm ls simplex-noise`.

- [ ] **Step 2: Update import in `src/components/Ground.tsx`**

simplex-noise v4 dropped the class-based API in favour of factory functions. There is no longer a default export.

Find:
```tsx
import SimplexNoise from "simplex-noise";
```
Replace with:
```tsx
import { createNoise2D } from "simplex-noise";
```

- [ ] **Step 3: Update `useMemo` in `src/components/Ground.tsx`**

Find:
```tsx
  const simplex = useMemo(() => new SimplexNoise(), []);
```
Replace with:
```tsx
  const noise2D = useMemo(() => createNoise2D(), []);
```

- [ ] **Step 4: Update all noise calls in the `useLayoutEffect` in `src/components/Ground.tsx`**

`createNoise2D()` returns a function directly — call it as `noise2D(x, y)` instead of `simplex.noise2D(x, y)`.

Find the full assignment inside the nested `for` loops:
```tsx
        // @ts-ignore
        pa[3 * (j * wVerts + i) + 2] =
          (simplex.noise2D(i / 100, j / 100) +
            simplex.noise2D((i + 200) / 50, j / 50) * Math.pow(ex, 1) +
            simplex.noise2D((i + 400) / 25, j / 25) * Math.pow(ex, 2) +
            simplex.noise2D((i + 600) / 12.5, j / 12.5) * Math.pow(ex, 3) +
            +(simplex.noise2D((i + 800) / 6.25, j / 6.25) * Math.pow(ex, 4))) /
          2;
```
Replace with:
```tsx
        // @ts-ignore
        pa[3 * (j * wVerts + i) + 2] =
          (noise2D(i / 100, j / 100) +
            noise2D((i + 200) / 50, j / 50) * Math.pow(ex, 1) +
            noise2D((i + 400) / 25, j / 25) * Math.pow(ex, 2) +
            noise2D((i + 600) / 12.5, j / 12.5) * Math.pow(ex, 3) +
            +(noise2D((i + 800) / 6.25, j / 6.25) * Math.pow(ex, 4))) /
          2;
```

- [ ] **Step 5: Verify terrain generates**

```bash
npm run dev
```

Open `http://localhost:5173`. The green terrain must be bumpy and varied — **not flat**. A completely flat terrain means the noise calls are returning 0 (API mismatch). Check the DevTools console for errors if terrain is flat.

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/components/Ground.tsx
git commit -m "chore: upgrade simplex-noise to v4, update to functional API"
```

---

### Task 5: Fix Code Correctness Bugs — Character and Nature

**Files:**
- Modify: `src/components/Character.tsx`
- Modify: `src/components/Nature.tsx`

**Interfaces:**
- Consumes: fully upgraded package environment from Tasks 1–4
- Produces: `activeAnimation` is a stable `useRef`; key listeners registered exactly once on mount; `useMemo` in `Nature` returns its array

- [ ] **Step 1: Fix `src/components/Character.tsx` — stable `activeAnimation` ref**

`activeAnimation` is currently a plain object re-created on every render. The `useCallback` handlers capture it by closure; if a re-render ever happened, the handlers would reference a stale object. Move it to a `useRef`.

Find (lines 19–35):
```tsx
  const activeAnimation: {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    run: boolean;
    dance: boolean;
  } = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    run: false,
    dance: false,
  };
```
Replace with:
```tsx
  const activeAnimation = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    run: false,
    dance: false,
  });
```

- [ ] **Step 2: Update all `activeAnimation.*` accesses to `activeAnimation.current.*`**

There are accesses in `handleKeyPress`, `handleKeyUp`, `characterState`, and `useFrame`. Find and replace every `activeAnimation.forward`, `activeAnimation.backward`, `activeAnimation.left`, `activeAnimation.right`, `activeAnimation.run`, `activeAnimation.dance` with `activeAnimation.current.forward` etc.

For reference, the updated `handleKeyPress`:
```tsx
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    switch (event.keyCode) {
      case 87: activeAnimation.current.forward = true; break;
      case 65: activeAnimation.current.left = true; break;
      case 83: activeAnimation.current.backward = true; break;
      case 68: activeAnimation.current.right = true; break;
      case 69: activeAnimation.current.dance = true; break;
      case 16: activeAnimation.current.run = true; break;
    }
  }, []);
```

The updated `handleKeyUp`:
```tsx
  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    switch (event.keyCode) {
      case 87: activeAnimation.current.forward = false; break;
      case 65: activeAnimation.current.left = false; break;
      case 83: activeAnimation.current.backward = false; break;
      case 68: activeAnimation.current.right = false; break;
      case 69: activeAnimation.current.dance = false; break;
      case 16: activeAnimation.current.run = false; break;
    }
  }, []);
```

- [ ] **Step 3: Fix `useEffect` dependency array in `src/components/Character.tsx`**

The `useEffect` currently has no dependency array, which causes it to run after every render — re-registering the key listeners on every frame. Add `[]` to run it only on mount/unmount.

Find:
```tsx
  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);

    document.addEventListener("keyup", handleKeyUp);
    currAction.play();
    return () => {
      document.removeEventListener("keydown", handleKeyPress);

      document.removeEventListener("keyup", handleKeyUp);
    };
  });
```
Replace with:
```tsx
  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    document.addEventListener("keyup", handleKeyUp);
    currAction.play();
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);
```

- [ ] **Step 4: Fix `src/components/Nature.tsx` — `useMemo` return value bug**

Currently `useMemo` populates the outer `objects` array as a side effect and returns `undefined`. This means `objects` is only populated on the first render; subsequent renders (if any) would use an empty array. Fix it so `useMemo` owns and returns the array directly.

Find:
```tsx
  const objects: JSX.Element[] = [];

  const createTrees = useMemo(() => {
    for (let i = 0; i < 100; i++) {
```
And the closing of that `useMemo`:
```tsx
    }
  }, []);
```

Replace the entire `objects` declaration + `useMemo` block with:
```tsx
  const objects = useMemo(() => {
    const items: JSX.Element[] = [];
    for (let i = 0; i < 100; i++) {
```
And change `objects.push(obj)` inside the loop to `items.push(obj)`, then close with:
```tsx
    }
    return items;
  }, [birch3, birch4, berry1, ctree3, ctree5, grass2, grass, rock1, rock5, willow2, willow5, log]);
```

The JSX return in `Nature` stays unchanged — `objects.map(...)` still works because `objects` is now the array directly.

- [ ] **Step 5: Verify full functionality**

```bash
npm run dev
```

Open `http://localhost:5173` and run through every action:

| Action | Expected |
|--------|----------|
| Page load | Loading bar, then 3D scene |
| Idle | Character stands with idle animation |
| W | Character walks forward |
| Shift + W | Character runs |
| A / D | Character turns left / right |
| S | Character walks backward |
| E | Character dances |
| Scene | Trees, rocks, grass scattered around bumpy terrain |
| Console | No errors or deprecation warnings |

- [ ] **Step 6: Final type-check**

```bash
npx tsc --noEmit
```

Expected: clean pass with no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/Character.tsx src/components/Nature.tsx
git commit -m "fix: stable activeAnimation ref in Character, fix useMemo return in Nature"
```
