# Task 5: Fix Code Correctness Bugs — Character and Nature

## Context
Task 5 of 5 (final task) in a React + Three.js tooling upgrade. Tasks 1–4 are complete. This task fixes two pre-existing correctness bugs that were not introduced by the upgrade but should be corrected as part of this cleanup pass.

## Working directory
`C:\Users\bastian.diaz\Work\personal\tiann-web\.claude\worktrees\tooling-upgrade`

## Global Constraints
- Package manager is npm — no yarn
- Tailwind CSS stays on v3 — do NOT touch it
- No new components or features
- Do NOT change any other source files beyond Character.tsx and Nature.tsx

---

## Fix 1: `src/components/Character.tsx`

### Bug A — `activeAnimation` as plain object (not a ref)

`activeAnimation` is currently declared as a plain object inside the component body, re-created fresh on every render:

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

The `useCallback` handlers for `handleKeyPress` / `handleKeyUp` capture this object by reference with empty dependency arrays (`[]`). If the component ever re-renders, the handlers would reference a stale `activeAnimation` while the render body creates a new one — and the key state mutations would be lost.

**Fix:** Move it to a `useRef`:

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

Then update every access site from `activeAnimation.forward` to `activeAnimation.current.forward` (and likewise for `.backward`, `.left`, `.right`, `.run`, `.dance`). Accesses appear in: `handleKeyPress`, `handleKeyUp`, `characterState`, and `useFrame`.

### Bug B — `useEffect` missing dependency array

The `useEffect` at the bottom of the component has no dependency array, causing it to run after every render — re-registering the key listeners every time:

```tsx
useEffect(() => {
  document.addEventListener("keydown", handleKeyPress);
  document.addEventListener("keyup", handleKeyUp);
  currAction.play();
  return () => {
    document.removeEventListener("keydown", handleKeyPress);
    document.removeEventListener("keyup", handleKeyUp);
  };
});  // ← missing []
```

**Fix:** Add `[]` as the dependency array so it runs only on mount/unmount:

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

Note: `handleKeyPress` and `handleKeyUp` already have stable references from `useCallback(…, [])`, so this is safe.

---

## Fix 2: `src/components/Nature.tsx`

### Bug — `useMemo` return value discarded

The `useMemo` callback populates the outer `objects` array as a side-effect but returns `undefined`. The variable `createTrees` (which holds `undefined`) is never used. This means if the component ever re-renders, `objects` will be empty (the side-effect doesn't re-run because `useMemo` caches `undefined`):

```tsx
const objects: React.JSX.Element[] = [];  // ← declared outside

const createTrees = useMemo(() => {
  for (let i = 0; i < 100; i++) {
    // ... builds obj ...
    objects.push(obj);  // ← side-effect on outer array
  }
  // ← returns undefined
}, []);
```

**Fix:** Make `useMemo` own and return the array directly:

```tsx
const objects = useMemo(() => {
  const items: React.JSX.Element[] = [];
  for (let i = 0; i < 100; i++) {
    const idx: number = Math.floor(Math.random() * 11) + 1;
    const pos = new THREE.Vector3(
      Math.ceil(Math.random() * 450) * (Math.round(Math.random()) ? 1 : -1),
      0,
      Math.ceil(Math.random() * 450) * (Math.round(Math.random()) ? 1 : -1)
    );

    const obj = (
      <primitive
        key={i}
        position={pos}
        object={
          idx === 1
            ? birch3.clone()
            : idx === 2
            ? birch4.clone()
            : idx === 3
            ? berry1.clone()
            : idx === 4
            ? ctree3.clone()
            : idx === 5
            ? ctree5.clone()
            : idx === 6
            ? grass2.clone()
            : idx === 7
            ? grass.clone()
            : idx === 8
            ? rock1.clone()
            : idx === 9
            ? rock5.clone()
            : idx === 10
            ? willow2.clone()
            : idx === 11
            ? willow5.clone()
            : log.clone()
        }
      />
    );

    items.push(obj);
  }
  return items;
}, [birch3, birch4, berry1, ctree3, ctree5, grass2, grass, rock1, rock5, willow2, willow5, log]);
```

The `return` in the JSX stays unchanged — `objects.map(...)` still works because `objects` is now the array itself (not `undefined`).

Also remove the now-unused `createTrees` variable declaration.

---

## Steps

1. Apply Fix 1A to `src/components/Character.tsx` (activeAnimation → useRef, update all accesses)
2. Apply Fix 1B to `src/components/Character.tsx` (add `[]` to useEffect)
3. Apply Fix 2 to `src/components/Nature.tsx` (useMemo returns the array)
4. Run `npx tsc --noEmit` — must pass with zero errors
5. Run `npm run dev` — Vite must start cleanly
6. Commit: `git add src/components/Character.tsx src/components/Nature.tsx && git commit -m "fix: stable activeAnimation ref in Character, fix useMemo return in Nature"`

## Verification
- `npx tsc --noEmit` → zero errors
- `npm run dev` → Vite starts
- `activeAnimation` in Character.tsx is a `useRef`, all accesses use `.current`
- `useEffect` in Character.tsx has `[]` dep array
- `useMemo` in Nature.tsx returns `items` and `createTrees` variable is gone

## Report
Write your full report to: `C:\Users\bastian.diaz\Work\personal\tiann-web\.superpowers\sdd\task-5-report.md`

Include:
- Confirmation of each fix applied
- Output of `npx tsc --noEmit`
- Whether `npm run dev` started
- Any deviations

Return: status (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED), commit hash, one-line verification summary.
