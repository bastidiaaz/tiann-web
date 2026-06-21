### Task 2: Spots Config

**Files:**
- Create: `src/components/spots/spots.config.ts`
- Create: `src/components/spots/spots.config.test.ts`

**Interfaces:**
- Produces:
  - `SpotConfig: { id: number; trackId: string; position: [number, number, number]; color: string }`
  - `SPOTS: SpotConfig[]` — 6 entries
  - `PROXIMITY_ENTER: number` (18)
  - `PROXIMITY_EXIT: number` (22)

- [ ] **Step 1: Write the failing test**

Create `src/components/spots/spots.config.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { SPOTS, PROXIMITY_ENTER, PROXIMITY_EXIT, type SpotConfig } from './spots.config';

describe('spots.config', () => {
  it('exports exactly 6 spots', () => {
    expect(SPOTS).toHaveLength(6);
  });

  it('each spot has required fields with correct types', () => {
    SPOTS.forEach((spot: SpotConfig) => {
      expect(typeof spot.id).toBe('number');
      expect(typeof spot.trackId).toBe('string');
      expect(spot.trackId.length).toBeGreaterThan(0);
      expect(spot.position).toHaveLength(3);
      spot.position.forEach((v) => expect(typeof v).toBe('number'));
      expect(spot.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it('exit threshold is greater than enter threshold', () => {
    expect(PROXIMITY_EXIT).toBeGreaterThan(PROXIMITY_ENTER);
  });

  it('all spots are within 130 units of origin', () => {
    SPOTS.forEach((spot) => {
      const [x, , z] = spot.position;
      const dist = Math.sqrt(x ** 2 + z ** 2);
      expect(dist).toBeLessThanOrEqual(130);
    });
  });

  it('all spots are far enough apart to prevent simultaneous activation', () => {
    const minDist = PROXIMITY_EXIT * 2;
    for (let i = 0; i < SPOTS.length; i++) {
      for (let j = i + 1; j < SPOTS.length; j++) {
        const [x1, , z1] = SPOTS[i].position;
        const [x2, , z2] = SPOTS[j].position;
        const dist = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
        expect(dist).toBeGreaterThan(minDist);
      }
    }
  });
});
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
npm test
```

Expected: FAIL — `Cannot find module './spots.config'`

- [ ] **Step 3: Create spots.config.ts**

```typescript
export interface SpotConfig {
  id: number;
  trackId: string;
  position: [number, number, number];
  color: string;
}

// Replace each trackId with your actual Spotify track IDs.
// To find a track ID: open the song on Spotify → right-click → Share → Copy link
// The ID is the part after /track/ in the URL.
// Example: https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC → ID is "4uLU6hMCjMI75M1A2tKUQC"
export const SPOTS: SpotConfig[] = [
  { id: 1, trackId: 'REPLACE_ME_1', position: [80,   0,  30],  color: '#ffaa33' },
  { id: 2, trackId: 'REPLACE_ME_2', position: [-60,  0,  90],  color: '#ff6b8a' },
  { id: 3, trackId: 'REPLACE_ME_3', position: [-100, 0, -20],  color: '#9b6bff' },
  { id: 4, trackId: 'REPLACE_ME_4', position: [-40,  0, -100], color: '#ff7f5c' },
  { id: 5, trackId: 'REPLACE_ME_5', position: [50,   0, -110], color: '#4ecdc4' },
  { id: 6, trackId: 'REPLACE_ME_6', position: [110,  0, -50],  color: '#fff5e0' },
];

export const PROXIMITY_ENTER = 18;
export const PROXIMITY_EXIT = 22;
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test
```

Expected: 5 tests pass. (The `trackId.length > 0` test will pass because `'REPLACE_ME_1'` is non-empty — that's correct; you'll fill in real IDs in the next step.)

- [ ] **Step 5: Fill in your 6 Spotify track IDs**

Replace each `'REPLACE_ME_N'` in `SPOTS` with a real Spotify track ID. Run `npm test` again after filling them in to confirm all tests still pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/spots/
git commit -m "feat: add spots config with 6 crystal positions and colors"
```

---

