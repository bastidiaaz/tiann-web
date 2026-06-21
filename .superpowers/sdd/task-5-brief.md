### Task 5: Space Sky

**Files:**
- Create: `src/components/world/SpaceSky.tsx`

**Interfaces:**
- Produces: `<SpaceSky />` — renders Drei `<Stars>` and attaches `<fogExp2>` to the scene

- [ ] **Step 1: Create SpaceSky.tsx**

```typescript
import React from 'react';
import { Stars } from '@react-three/drei';

const SpaceSky: React.FC = () => {
  return (
    <>
      <Stars
        radius={300}
        depth={60}
        count={8000}
        factor={4}
        saturation={0.4}
        fade
        speed={0.5}
      />
      {/* FogExp2 dissolves terrain edges into the dark sky, creating the small-planet illusion */}
      <fogExp2 attach="fog" args={['#080010', 0.008]} />
    </>
  );
};

export default SpaceSky;
```

- [ ] **Step 2: Add SpaceSky temporarily to App.tsx for visual check**

In `src/App.tsx`:
1. Add import: `import SpaceSky from './components/world/SpaceSky';`
2. Replace the existing `<fog attach="fog" args={["#ffffff", 50, 300]} />` with `<SpaceSky />`
3. Update the container div class to `"w-full h-screen bg-[#080010]"` (dark background matches fog color)

- [ ] **Step 3: Start dev server and visually verify**

```bash
vercel dev
```

Open `http://localhost:3000`. Expected:
- Near-black purple background
- Dense star field covering the whole sky
- Stars fade at the edges (the `fade` prop)
- Existing green terrain and character still present — only the sky changed
- White fog replaced by dark exponential fog that fades geometry at distance

- [ ] **Step 4: Commit**

```bash
git add src/components/world/SpaceSky.tsx src/App.tsx
git commit -m "feat: add space sky with stars and exponential dark fog"
```

---

