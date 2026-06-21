# Task 2: Upgrade React 19 and TypeScript 5

## Context
This is Task 2 of 5 in a tooling upgrade for a React + Three.js 3D world project. Task 1 already replaced CRA with Vite (complete). This task upgrades React to v19 and TypeScript (TypeScript was already upgraded to 6.0.3 in Task 1 — see note below).

## Working directory
`C:\Users\bastian.diaz\Work\personal\tiann-web\.claude\worktrees\tooling-upgrade`

## Global Constraints
- Package manager is npm — use `--legacy-peer-deps` if plain install fails (pre-existing peer dep conflicts from @react-spring transitive deps)
- Tailwind CSS stays on v3 — do NOT touch it
- No new components, abstractions, or features

## Important note on TypeScript
Task 1 already upgraded TypeScript to 6.0.3 (latest). The plan originally said "upgrade to TypeScript 5" but 6.x is what `npm install typescript@latest` installs. TypeScript is already at 6.0.3 — do NOT downgrade it. No TypeScript version change is needed in this task.

## What to do

Run:
```bash
npm install react@latest react-dom@latest
npm install --save-dev @types/react@latest @types/react-dom@latest
```

If plain install fails due to peer conflicts, add `--legacy-peer-deps`.

## Verification

1. Check installed React version: `npm ls react` — confirm v19.x
2. Run `npx tsc --noEmit` — must pass with zero errors
3. Run `npm run dev` — Vite dev server must start cleanly

## Steps

1. Run `npm install react@latest react-dom@latest` (add `--legacy-peer-deps` if needed)
2. Run `npm install --save-dev @types/react@latest @types/react-dom@latest` (add `--legacy-peer-deps` if needed)
3. Run `npm ls react` — confirm v19.x installed
4. Run `npx tsc --noEmit` — confirm zero errors
5. Run `npm run dev` — confirm server starts
6. Commit: `git add package.json package-lock.json && git commit -m "chore: upgrade React to 19"`

## Report
Write your full report to: `C:\Users\bastian.diaz\Work\personal\tiann-web\.superpowers\sdd\task-2-report.md`

Include:
- Installed React version (from `npm ls react`)
- Output of `npx tsc --noEmit`
- Whether `npm run dev` started successfully
- Any deviations or concerns

Return: status (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED), commit hash, one-line verification summary.
