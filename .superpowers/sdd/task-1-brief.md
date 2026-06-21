# Task 1: Replace CRA with Vite

## Context
This is a React + Three.js 3D world project (4 source files). You are performing the first step of a 5-layer tooling upgrade. This task replaces Create React App (react-scripts) with Vite.

## Working directory
`C:\Users\bastian.diaz\Work\personal\tiann-web\.claude\worktrees\tooling-upgrade`

## Global Constraints
- Package manager is npm — do not use yarn
- Tailwind CSS stays on v3 — do NOT upgrade to v4
- No new components, abstractions, or features beyond what is described below

## Note on npm install
The current CRA setup has peer dep conflicts that require `--legacy-peer-deps`. After removing `react-scripts` in this task, this flag should no longer be needed for normal installs. Use `--legacy-peer-deps` only if a plain `npm install` fails during this task.

## Files

**Create:**
- `vite.config.ts`
- `tsconfig.node.json`
- `index.html` (project root — NOT inside `public/`)

**Modify:**
- `package.json` — replace scripts, remove react-scripts, add vite deps
- `tsconfig.json` — update for Vite module resolution
- `src/index.tsx` — update to React 19 createRoot API

**Delete:**
- `public/index.html`
- `src/react-app-env.d.ts`
- `src/reportWebVitals.ts`
- `src/setupTests.ts`
- `yarn.lock`

## Exact content for each file

### `vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

### `tsconfig.node.json`
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

### `index.html` (project root)
Vite's entry HTML lives at the project root. Static assets in `public/` are served as-is — no `%PUBLIC_URL%` prefixes needed.

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

### `tsconfig.json` (full replacement)
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

### `package.json` scripts (replace the scripts block)
```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview"
}
```

Also:
- Run `npm uninstall react-scripts`
- Run `npm install --save-dev vite @vitejs/plugin-react`

### `src/index.tsx` (full replacement)
The old `ReactDOM.render()` API is removed in React 19. Replace the entire file:

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

## Steps

1. Run `npm uninstall react-scripts`
2. Run `npm install --save-dev vite @vitejs/plugin-react`
3. Create `vite.config.ts` with content above
4. Create `tsconfig.node.json` with content above
5. Replace `tsconfig.json` with content above
6. Create `index.html` at project root with content above
7. Replace scripts block in `package.json` as shown above
8. Replace `src/index.tsx` with content above
9. Delete: `public/index.html`, `src/react-app-env.d.ts`, `src/reportWebVitals.ts`, `src/setupTests.ts`, `yarn.lock`
10. Run `npm run dev` — verify Vite starts and the 3D scene loads in a browser (or at minimum the dev server starts without errors)
11. Run `npx tsc --noEmit` — verify no type errors
12. Commit all changes: `git add -A && git commit -m "chore: replace CRA with Vite"`

## Verification
- `npm run dev` starts successfully (Vite dev server at localhost:5173)
- `npx tsc --noEmit` passes with no errors
- The 3D world loads in browser with character visible

## Report
Write your full report to: `C:\Users\bastian.diaz\Work\personal\tiann-web\.superpowers\sdd\task-1-report.md`

Include:
- What you did (files created/modified/deleted)
- Any deviations from the brief and why
- Output of `npx tsc --noEmit`
- Whether `npm run dev` started successfully
- Your self-review findings
- Any concerns

Return: status (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED), commit hash, one-line test summary.
