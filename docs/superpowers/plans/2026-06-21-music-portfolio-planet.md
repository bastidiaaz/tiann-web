# Music Portfolio Planet — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing R3F world into a music portfolio where an astronaut explores a dark alien planet, discovers 6 glowing crystal clusters, and hears Spotify song previews on approach.

**Architecture:** A Vercel serverless function proxies Spotify Client Credentials so the secret never reaches the frontend. A shared `characterPositionRef` (written each frame by `Astronaut`) lets each `CrystalSpot` check proximity without re-renders. A shared `activeSpotId` state in `App` coordinates audio, HUD, and the E-key between components. The "circular planet" illusion is achieved with a `PlaneGeometry` (400×400) combined with `FogExp2` that dissolves the edges into darkness — `CircleGeometry` lacks interior vertex resolution for terrain deformation.

**Tech Stack:** React 19, React Three Fiber 9, Three.js 0.184, Drei 10, Vite 8, TypeScript 6, Vitest, Tailwind CSS, Vercel Serverless Functions, Spotify Web API

## Global Constraints

- TypeScript strict mode — no `any` except wrapping the FBX loader (existing pattern)
- All Three.js JSX attrs use r152+ naming (no deprecated buffer geometry names)
- `SPOTIFY_CLIENT_SECRET` never in frontend bundle — only in Vercel env vars
- Proximity enter threshold: 18 units; exit threshold: 22 units (hysteresis prevents flickering)
- Planet terrain: `PlaneGeometry(400, 400, 150, 150)`, dark surface color `#1a1025`
- All 6 crystal positions within 130 units of origin; minimum pairwise distance > 44 units
- No `<OrbitControls>` — third-person camera only
- No mobile/touch controls in this version

---

## File Map

**Created:**
- `api/spotify-token.ts` — Vercel serverless: Client Credentials token exchange
- `src/context/SpotifyContext.tsx` — context, provider, `TrackData` type, `useSpotifyContext()`
- `src/hooks/useSpotify.ts` — re-export alias of `useSpotifyContext`
- `src/components/world/Planet.tsx` — dark terrain disc with simplex noise
- `src/components/world/SpaceSky.tsx` — Drei Stars + FogExp2
- `src/components/world/BackgroundPlanet.tsx` — decorative distant sphere
- `src/components/character/Astronaut.tsx` — movement + camera, suppresses dance near crystals
- `src/components/spots/spots.config.ts` — `SpotConfig` type, `SPOTS` array, thresholds
- `src/components/spots/CrystalSpot.tsx` — geometry, proximity detection, audio
- `src/components/ui/ProximityHUD.tsx` — HTML overlay: song info + E-key prompt
- `src/test-setup.ts` — testing-library jest-dom import
- `vercel.json` — deployment config
- `.env.local` — local Spotify credentials (gitignored)

**Modified:**
- `src/App.tsx` — full rewrite: new world, providers, `activeSpotId`, E-key handler
- `vite.config.ts` — add Vitest config block
- `package.json` — add test deps and scripts

**Deleted:**
- `src/components/Ground.tsx` → replaced by `Planet.tsx`
- `src/components/Character.tsx` → replaced by `Astronaut.tsx`
- `src/components/Nature.tsx` → Earth trees/rocks don't belong on a space planet

**Test files:**
- `src/components/spots/spots.config.test.ts`
- `src/context/SpotifyContext.test.tsx`
- `src/components/ui/ProximityHUD.test.tsx`

---

### Task 1: Dev Infrastructure

**Files:**
- Modify: `vite.config.ts`
- Modify: `package.json`
- Create: `src/test-setup.ts`
- Create: `vercel.json`
- Create: `.env.local` (gitignored, never committed)

**Interfaces:**
- Produces: `npm test` runs Vitest; `vercel dev` serves Vite + `/api/*` serverless routes locally

- [ ] **Step 1: Install dev dependencies**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vercel/node
```

Expected: packages install without errors.

- [ ] **Step 2: Update vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

- [ ] **Step 3: Create src/test-setup.ts**

```typescript
import '@testing-library/jest-dom';
```

- [ ] **Step 4: Add test scripts to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Create vercel.json**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

- [ ] **Step 6: Create .env.local (never commit)**

Create `.env.local` at project root:
```
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
```

Get credentials: https://developer.spotify.com/dashboard → create an app → copy Client ID and Secret.

- [ ] **Step 7: Ensure .env.local is gitignored**

Open `.gitignore`. If these lines are missing, add them:
```
.env
.env.local
```

- [ ] **Step 8: Install Vercel CLI if not present**

```bash
npm install -g vercel
```

- [ ] **Step 9: Verify Vitest config works**

```bash
npm test
```

Expected: `No test files found, exiting with code 0` or similar. No errors.

- [ ] **Step 10: Commit**

```bash
git add vite.config.ts src/test-setup.ts vercel.json package.json package-lock.json .gitignore
git commit -m "chore: add vitest, testing-library, vercel config"
```

---

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

### Task 3: Spotify Serverless Token

**Files:**
- Create: `api/spotify-token.ts`

**Interfaces:**
- Produces: `GET /api/spotify-token` → `{ access_token: string, expires_in: number }`

- [ ] **Step 1: Create the serverless function**

Create `api/spotify-token.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Spotify credentials not configured' });
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const detail = await response.text();
    return res.status(502).json({ error: 'Spotify token request failed', detail });
  }

  const data = await response.json() as { access_token: string; expires_in: number };

  // Spotify tokens live 3600s — cache for 3500s so Vercel's CDN serves stale-safe tokens
  res.setHeader('Cache-Control', 's-maxage=3500, stale-while-revalidate');
  return res.status(200).json({ access_token: data.access_token, expires_in: data.expires_in });
}
```

- [ ] **Step 2: Test the endpoint locally**

```bash
vercel dev
```

Open `http://localhost:3000/api/spotify-token` in a browser.

Expected JSON response:
```json
{ "access_token": "BQD...", "expires_in": 3600 }
```

If you see `{ "error": "Spotify credentials not configured" }`, confirm `.env.local` has valid values and is at project root.

- [ ] **Step 3: Commit**

```bash
git add api/spotify-token.ts
git commit -m "feat: add Spotify client credentials serverless token endpoint"
```

---

### Task 4: Spotify Data Layer

**Files:**
- Create: `src/context/SpotifyContext.tsx`
- Create: `src/hooks/useSpotify.ts`
- Create: `src/context/SpotifyContext.test.tsx`

**Interfaces:**
- Consumes: `SPOTS` from `spots.config.ts`; `/api/spotify-token` endpoint
- Produces:
  - `TrackData: { spotId: number; trackId: string; name: string; artist: string; previewUrl: string | null; spotifyUrl: string }`
  - `SpotifyContext` (exported React context — needed for test wrappers)
  - `SpotifyProvider({ children })` — wraps app, fetches all track data on mount
  - `useSpotifyContext(): { tracks: Record<number, TrackData>; loading: boolean }`
  - `useSpotify()` — re-export alias of `useSpotifyContext`

- [ ] **Step 1: Write the failing tests**

Create `src/context/SpotifyContext.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { SpotifyProvider, useSpotifyContext } from './SpotifyContext';

const wrapper = ({ children }: { children: ReactNode }) => (
  <SpotifyProvider>{children}</SpotifyProvider>
);

const mockTrack = {
  name: 'Test Song',
  artists: [{ name: 'Test Artist' }],
  preview_url: 'https://cdn.spotify.com/preview.mp3',
  external_urls: { spotify: 'https://open.spotify.com/track/abc' },
};

function stubFetch(trackOverride?: object) {
  const track = { ...mockTrack, ...trackOverride };
  vi.stubGlobal(
    'fetch',
    vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'tok', expires_in: 3600 }) })
      .mockResolvedValue({ ok: true, json: async () => track })
  );
}

describe('SpotifyContext', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('starts in loading state', () => {
    stubFetch();
    const { result } = renderHook(() => useSpotifyContext(), { wrapper });
    expect(result.current.loading).toBe(true);
  });

  it('populates all 6 tracks after load', async () => {
    stubFetch();
    const { result } = renderHook(() => useSpotifyContext(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(Object.keys(result.current.tracks)).toHaveLength(6);
  });

  it('maps track fields correctly', async () => {
    stubFetch();
    const { result } = renderHook(() => useSpotifyContext(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tracks[1]).toMatchObject({
      name: 'Test Song',
      artist: 'Test Artist',
      previewUrl: 'https://cdn.spotify.com/preview.mp3',
      spotifyUrl: 'https://open.spotify.com/track/abc',
    });
  });

  it('maps null preview_url correctly', async () => {
    stubFetch({ preview_url: null });
    const { result } = renderHook(() => useSpotifyContext(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tracks[1].previewUrl).toBeNull();
  });

  it('finishes loading with empty tracks on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    const { result } = renderHook(() => useSpotifyContext(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tracks).toEqual({});
  });
});
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
npm test
```

Expected: FAIL — `Cannot find module './SpotifyContext'`

- [ ] **Step 3: Create SpotifyContext.tsx**

```typescript
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SPOTS } from '../components/spots/spots.config';

export interface TrackData {
  spotId: number;
  trackId: string;
  name: string;
  artist: string;
  previewUrl: string | null;
  spotifyUrl: string;
}

interface SpotifyContextValue {
  tracks: Record<number, TrackData>;
  loading: boolean;
}

export const SpotifyContext = createContext<SpotifyContextValue>({
  tracks: {},
  loading: true,
});

export function SpotifyProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<Record<number, TrackData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const tokenRes = await fetch('/api/spotify-token');
        const { access_token } = await tokenRes.json() as { access_token: string };

        const results: Record<number, TrackData> = {};

        await Promise.all(
          SPOTS.map(async (spot) => {
            const res = await fetch(`https://api.spotify.com/v1/tracks/${spot.trackId}`, {
              headers: { Authorization: `Bearer ${access_token}` },
            });
            const data = await res.json() as {
              name: string;
              artists: { name: string }[];
              preview_url: string | null;
              external_urls: { spotify: string };
            };
            results[spot.id] = {
              spotId: spot.id,
              trackId: spot.trackId,
              name: data.name,
              artist: data.artists[0].name,
              previewUrl: data.preview_url,
              spotifyUrl: data.external_urls.spotify,
            };
          })
        );

        setTracks(results);
      } catch {
        // Network or API failure — crystals still glow, previews silently skipped
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <SpotifyContext.Provider value={{ tracks, loading }}>
      {children}
    </SpotifyContext.Provider>
  );
}

export function useSpotifyContext() {
  return useContext(SpotifyContext);
}
```

- [ ] **Step 4: Create src/hooks/useSpotify.ts**

```typescript
export { useSpotifyContext as useSpotify } from '../context/SpotifyContext';
```

- [ ] **Step 5: Run tests — confirm they pass**

```bash
npm test
```

Expected: 5 SpotifyContext tests + 5 spots.config tests = 10 passing. No failures.

- [ ] **Step 6: Commit**

```bash
git add src/context/ src/hooks/
git commit -m "feat: add Spotify context and track data hook"
```

---

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

### Task 6: Planet Terrain

**Files:**
- Create: `src/components/world/Planet.tsx`
- Delete: `src/components/Ground.tsx`
- Delete: `src/components/Nature.tsx`

**Interfaces:**
- Produces: `<Planet />` — dark textured terrain disc, 400×400 units, gently undulating with simplex noise, `receiveShadow`

- [ ] **Step 1: Create Planet.tsx**

```typescript
import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { createNoise2D } from 'simplex-noise';
import * as THREE from 'three';

const SIZE = 400;
const SEGMENTS = 150;

const Planet: React.FC = () => {
  const noise2D = useMemo(() => createNoise2D(), []);
  const terrain = useRef<THREE.BufferGeometry>(null!);

  useLayoutEffect(() => {
    const pos = terrain.current.getAttribute('position') as THREE.BufferAttribute;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Low-amplitude multi-octave noise: gentle undulation, not hills
      const elevation =
        noise2D(x / SIZE * 3, y / SIZE * 3) * 1.5 +
        noise2D(x / SIZE * 6, y / SIZE * 6) * 0.75 +
        noise2D(x / SIZE * 12, y / SIZE * 12) * 0.375;
      pos.setZ(i, elevation);
    }

    pos.needsUpdate = true;
    terrain.current.computeVertexNormals();
  }, []); // [] = static terrain, computed once after mount

  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry ref={terrain} args={[SIZE, SIZE, SEGMENTS, SEGMENTS]} />
      <meshStandardMaterial color="#1a1025" roughness={0.9} metalness={0.1} />
    </mesh>
  );
};

export default Planet;
```

- [ ] **Step 2: Replace Ground with Planet in App.tsx**

In `src/App.tsx`:
1. Remove: `import Ground from './components/Ground';`
2. Remove: `import Nature from './components/Nature';`
3. Add: `import Planet from './components/world/Planet';`
4. Replace `<Ground />` with `<Planet />`
5. Remove `<Nature />`

- [ ] **Step 3: Delete old components**

```bash
git rm src/components/Ground.tsx
git rm src/components/Nature.tsx
```

- [ ] **Step 4: Start dev server and visually verify**

```bash
vercel dev
```

Open `http://localhost:3000`. Expected:
- Dark purple-charcoal terrain, smaller than before, edges dissolve into dark fog
- No green ground, no trees or rocks
- Stars visible overhead
- Character still walks on the surface
- The terrain feels like a small clearing on an alien planet

- [ ] **Step 5: Commit**

```bash
git add src/components/world/Planet.tsx src/App.tsx
git commit -m "feat: replace terrain with small dark planet disc, remove nature objects"
```

---

### Task 7: Background Planet

**Files:**
- Create: `src/components/world/BackgroundPlanet.tsx`

**Interfaces:**
- Produces: `<BackgroundPlanet />` — large sphere positioned far below/behind, faintly visible at the horizon

- [ ] **Step 1: Create BackgroundPlanet.tsx**

```typescript
import React from 'react';

const BackgroundPlanet: React.FC = () => {
  return (
    <mesh position={[0, -400, -600]}>
      <sphereGeometry args={[300, 32, 32]} />
      <meshStandardMaterial
        color="#0d1b3e"
        emissive="#1a3a6e"
        emissiveIntensity={0.3}
        roughness={0.8}
        metalness={0.0}
      />
    </mesh>
  );
};

export default BackgroundPlanet;
```

- [ ] **Step 2: Add BackgroundPlanet to App.tsx**

In `src/App.tsx`:
1. Add: `import BackgroundPlanet from './components/world/BackgroundPlanet';`
2. Inside `<Suspense>`, add `<BackgroundPlanet />` after `<Planet />`

- [ ] **Step 3: Start dev server and visually verify**

```bash
vercel dev
```

Walk the character toward any edge of the terrain and look toward the horizon. Expected: a large faint blue-grey sphere is partially visible through the fog, reinforcing the "standing on a tiny planet" scale. Adjust the `position` prop (try `[0, -350, -500]`) and `emissiveIntensity` if needed to suit the look.

- [ ] **Step 4: Commit**

```bash
git add src/components/world/BackgroundPlanet.tsx src/App.tsx
git commit -m "feat: add decorative background planet at horizon"
```

---

### Task 8: Astronaut Character

**Files:**
- Create: `src/components/character/Astronaut.tsx`
- Delete: `src/components/Character.tsx`

**Interfaces:**
- Consumes:
  - `camera: THREE.PerspectiveCamera`
  - `activeSpotId: number | null` — suppresses dance (E key) when set
  - `characterPositionRef: React.MutableRefObject<THREE.Vector3>` — written each frame so CrystalSpots can read position
- Produces: `<Astronaut />` — same WASD + Shift movement and third-person camera as the old Character

**Note on astronaut model:** The plan uses the existing `character.fbx` as a placeholder. To use a real astronaut:
1. Go to https://www.mixamo.com (free, requires Adobe account)
2. Choose a character (Y Bot or similar), apply a space-suit-style look
3. Download as FBX (without skin)
4. Place at `public/character/astronaut.fbx`
5. Download matching idle/walk/run/dance animations for the same character
6. Update the `useLoader` path in `Astronaut.tsx` from `./character/character.fbx` to `./character/astronaut.fbx`

- [ ] **Step 1: Create Astronaut.tsx**

Create `src/components/character/Astronaut.tsx`:

```typescript
import { useFrame, useLoader } from '@react-three/fiber';
import React, { useCallback, useEffect, useRef } from 'react';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { useFBX } from '@react-three/drei';
import * as THREE from 'three';
import { Mesh } from 'three';

interface Animations {
  [name: string]: { clip: THREE.AnimationAction };
}

interface AstronautProps {
  camera: THREE.PerspectiveCamera;
  activeSpotId: number | null;
  characterPositionRef: React.MutableRefObject<THREE.Vector3>;
}

const Astronaut: React.FC<AstronautProps> = ({ camera, activeSpotId, characterPositionRef }) => {
  const character = useRef<Mesh>(null!);

  const activeKeys = useRef({
    forward: false, backward: false, left: false, right: false,
    run: false, dance: false,
  });

  const animations: Animations = {};
  const currentPosition = new THREE.Vector3();
  const currentLookAt = new THREE.Vector3();
  const deceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
  const acceleration = new THREE.Vector3(1, 0.125, 100.0);
  const velocity = new THREE.Vector3(0, 0, 0);

  const c = useLoader(FBXLoader as any, './character/character.fbx');
  c.scale.setScalar(0.1);
  c.traverse((f: THREE.Object3D) => { f.castShadow = true; f.receiveShadow = true; });

  const mixer = new THREE.AnimationMixer(c);

  const idle = useFBX('./character/idle.fbx');
  animations['idle'] = { clip: mixer.clipAction(idle.animations[0]) };
  const walk = useFBX('./character/walking.fbx');
  animations['walk'] = { clip: mixer.clipAction(walk.animations[0]) };
  const run = useFBX('./character/running.fbx');
  animations['run'] = { clip: mixer.clipAction(run.animations[0]) };
  const dance = useFBX('./character/dance.fbx');
  animations['dance'] = { clip: mixer.clipAction(dance.animations[0]) };

  let currAction = animations['idle'].clip;
  let prevAction: THREE.AnimationAction;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.keyCode) {
      case 87: activeKeys.current.forward = true; break;
      case 65: activeKeys.current.left = true; break;
      case 83: activeKeys.current.backward = true; break;
      case 68: activeKeys.current.right = true; break;
      case 16: activeKeys.current.run = true; break;
      case 69:
        // Dance only when NOT standing near a crystal — E near a crystal opens Spotify (handled in App)
        if (activeSpotId === null) activeKeys.current.dance = true;
        break;
    }
  }, [activeSpotId]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    switch (e.keyCode) {
      case 87: activeKeys.current.forward = false; break;
      case 65: activeKeys.current.left = false; break;
      case 83: activeKeys.current.backward = false; break;
      case 68: activeKeys.current.right = false; break;
      case 16: activeKeys.current.run = false; break;
      case 69: activeKeys.current.dance = false; break;
    }
  }, []);

  const calculateIdealOffset = () => {
    const offset = new THREE.Vector3(0, 22, -32);
    offset.applyQuaternion(character.current.quaternion);
    offset.add(character.current.position);
    return offset;
  };

  const calculateIdealLookat = () => {
    const lookat = new THREE.Vector3(0, 10, 50);
    lookat.applyQuaternion(character.current.quaternion);
    lookat.add(character.current.position);
    return lookat;
  };

  const updateCamera = (delta: number) => {
    const t = 1.0 - Math.pow(0.001, delta);
    currentPosition.lerp(calculateIdealOffset(), t);
    currentLookAt.lerp(calculateIdealLookat(), t);
    camera.position.copy(currentPosition);
  };

  const updateMovement = (delta: number) => {
    const vel = velocity;
    const frameDecel = new THREE.Vector3(
      vel.x * deceleration.x,
      vel.y * deceleration.y,
      vel.z * deceleration.z,
    );
    frameDecel.multiplyScalar(delta);
    frameDecel.z = Math.sign(frameDecel.z) * Math.min(Math.abs(frameDecel.z), Math.abs(vel.z));
    vel.add(frameDecel);

    const obj = character.current;
    const _Q = new THREE.Quaternion();
    const _A = new THREE.Vector3();
    const _R = obj.quaternion.clone();
    const acc = acceleration.clone();

    if (activeKeys.current.run) acc.multiplyScalar(2.0);
    if (currAction === animations['dance'].clip) acc.multiplyScalar(0.0);

    if (activeKeys.current.forward) vel.z += acc.z * delta;
    if (activeKeys.current.backward) vel.z -= acc.z * delta;
    if (activeKeys.current.left) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, 4.0 * Math.PI * delta * acceleration.y);
      _R.multiply(_Q);
    }
    if (activeKeys.current.right) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, 4.0 * -Math.PI * delta * acceleration.y);
      _R.multiply(_Q);
    }

    obj.quaternion.copy(_R);

    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(obj.quaternion).normalize();
    const sideways = new THREE.Vector3(1, 0, 0).applyQuaternion(obj.quaternion).normalize();

    obj.position.add(forward.multiplyScalar(vel.z * delta));
    obj.position.add(sideways.multiplyScalar(vel.x * delta));
    character.current.position.copy(obj.position);
    updateCamera(delta);
  };

  useFrame((state, delta) => {
    prevAction = currAction;

    if (activeKeys.current.forward || activeKeys.current.backward ||
        activeKeys.current.left || activeKeys.current.right) {
      currAction = activeKeys.current.run ? animations['run'].clip : animations['walk'].clip;
    } else if (activeKeys.current.dance) {
      currAction = animations['dance'].clip;
    } else {
      currAction = animations['idle'].clip;
    }

    if (prevAction !== currAction) {
      prevAction.fadeOut(0.2);
      if (prevAction === animations['walk'].clip) {
        const ratio = currAction.getClip().duration / prevAction.getClip().duration;
        currAction.time = prevAction.time * ratio;
      }
      currAction.reset().play();
    } else {
      currAction.play();
    }

    updateMovement(delta);

    // Write position each frame — CrystalSpots read this ref to check proximity
    characterPositionRef.current.copy(character.current.position);

    state.camera.lookAt(calculateIdealLookat());
    state.camera.updateProjectionMatrix();
    mixer.update(delta);
  });

  // Separate effects: initial play vs listener lifecycle (avoids replaying on handler re-creation)
  useEffect(() => { currAction.play(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return <primitive object={c} ref={character} />;
};

export default Astronaut;
```

- [ ] **Step 2: Update App.tsx to use Astronaut**

In `src/App.tsx`:
1. Add imports at the top:
   ```typescript
   import { useRef, useState } from 'react';
   import * as THREE from 'three';
   import Astronaut from './components/character/Astronaut';
   ```
2. Remove: `import Character from './components/Character';`
3. Inside the `App` function, before the return, add:
   ```typescript
   const characterPositionRef = useRef(new THREE.Vector3());
   const [activeSpotId, setActiveSpotId] = useState<number | null>(null);
   ```
4. Replace `<Character camera={camera} />` with:
   ```typescript
   <Astronaut
     camera={camera}
     activeSpotId={activeSpotId}
     characterPositionRef={characterPositionRef}
   />
   ```

- [ ] **Step 3: Delete Character.tsx**

```bash
git rm src/components/Character.tsx
```

- [ ] **Step 4: Also remove OrbitControls from App.tsx**

In `src/App.tsx`, remove `import { Loader, OrbitControls } from '@react-three/drei';` and add back just `Loader`:
```typescript
import { Loader } from '@react-three/drei';
```

Remove `<OrbitControls />` from the Canvas JSX.

- [ ] **Step 5: Start dev server and visually verify**

```bash
vercel dev
```

Expected:
- Character moves with WASD + Shift
- E triggers dance when walking around freely
- Camera follows character, slightly higher than before (shows more sky)
- No OrbitControls — camera locked to character

- [ ] **Step 6: Commit**

```bash
git add src/components/character/ src/App.tsx
git commit -m "feat: replace Character with Astronaut, expose position ref for proximity system"
```

---

### Task 9: Crystal Spot

**Files:**
- Create: `src/components/spots/CrystalSpot.tsx`

**Interfaces:**
- Consumes:
  - `spotId: number`
  - `position: [number, number, number]`
  - `color: string`
  - `characterPositionRef: React.MutableRefObject<THREE.Vector3>`
  - `activeSpotId: number | null`
  - `setActiveSpotId: (id: number | null) => void`
  - `useSpotifyContext()` → `TrackData` for this spot's `previewUrl`
  - `PROXIMITY_ENTER`, `PROXIMITY_EXIT` from `spots.config.ts`
- Produces: `<CrystalSpot />` — crystal geometry, pulse animation, proximity detection, audio fade in/out

- [ ] **Step 1: Create CrystalSpot.tsx**

```typescript
import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSpotifyContext } from '../../context/SpotifyContext';
import { PROXIMITY_ENTER, PROXIMITY_EXIT } from './spots.config';

interface CrystalSpotProps {
  spotId: number;
  position: [number, number, number];
  color: string;
  characterPositionRef: React.MutableRefObject<THREE.Vector3>;
  activeSpotId: number | null;
  setActiveSpotId: (id: number | null) => void;
}

// [radiusBottom, height, rotX, rotY, rotZ] — irregular angles for organic look
const SHARDS: [number, number, number, number, number][] = [
  [0.30, 4.5,  0.30,  0.00,  0.20],
  [0.25, 3.2, -0.20,  0.50,  0.30],
  [0.35, 5.0,  0.10,  1.20, -0.20],
  [0.20, 2.8, -0.30,  0.80,  0.10],
];

const CrystalSpot: React.FC<CrystalSpotProps> = ({
  spotId, position, color, characterPositionRef, activeSpotId, setActiveSpotId,
}) => {
  const { tracks } = useSpotifyContext();
  const track = tracks[spotId];
  const isActive = activeSpotId === spotId;

  const materialRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const crystalPos = useRef(new THREE.Vector3(...position));

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.loop = true;
    return () => {
      audioRef.current?.pause();
      if (fadeRef.current) clearInterval(fadeRef.current);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (fadeRef.current) clearInterval(fadeRef.current);

    if (isActive && track?.previewUrl) {
      audio.src = track.previewUrl;
      audio.volume = 0;
      audio.play().catch(() => {}); // autoplay may require prior user interaction
      fadeRef.current = setInterval(() => {
        if (!audio) return;
        audio.volume = Math.min(1, audio.volume + 0.05);
        if (audio.volume >= 1) { clearInterval(fadeRef.current!); fadeRef.current = null; }
      }, 50);
    } else if (!isActive && audio.src) {
      fadeRef.current = setInterval(() => {
        if (!audio) return;
        audio.volume = Math.max(0, audio.volume - 0.05);
        if (audio.volume <= 0) {
          clearInterval(fadeRef.current!);
          fadeRef.current = null;
          audio.pause();
          audio.src = '';
        }
      }, 50);
    }
  }, [isActive, track]);

  useFrame(({ clock }) => {
    // Proximity check
    const dist = characterPositionRef.current.distanceTo(crystalPos.current);
    if (dist < PROXIMITY_ENTER && activeSpotId !== spotId) setActiveSpotId(spotId);
    if (dist > PROXIMITY_EXIT && activeSpotId === spotId) setActiveSpotId(null);

    // Emissive pulse: slower when idle, faster when active
    const period = isActive ? 1.5 : 3.0;
    const intensity = 0.4 + 0.4 * Math.sin((clock.elapsedTime / period) * Math.PI * 2);
    materialRefs.current.forEach((mat) => { if (mat) mat.emissiveIntensity = intensity; });
  });

  return (
    <group position={position}>
      {SHARDS.map(([radius, height, rx, ry, rz], i) => (
        <mesh key={i} rotation={[rx, ry, rz]} castShadow>
          <coneGeometry args={[radius, height, 5]} />
          <meshStandardMaterial
            ref={(mat) => { materialRefs.current[i] = mat; }}
            color={color}
            emissive={color}
            emissiveIntensity={0.6}
            roughness={0.1}
            metalness={0.8}
          />
        </mesh>
      ))}
      {/* Warm coloured pool of light on the terrain surface */}
      <pointLight color={color} intensity={2} distance={30} />
    </group>
  );
};

export default CrystalSpot;
```

- [ ] **Step 2: Add crystals to App.tsx**

In `src/App.tsx`, add inside `<Suspense>` after `<Astronaut>`:

```typescript
import CrystalSpot from './components/spots/CrystalSpot';
import { SPOTS } from './components/spots/spots.config';

// Inside <Suspense>:
{SPOTS.map((spot) => (
  <CrystalSpot
    key={spot.id}
    spotId={spot.id}
    position={spot.position}
    color={spot.color}
    characterPositionRef={characterPositionRef}
    activeSpotId={activeSpotId}
    setActiveSpotId={setActiveSpotId}
  />
))}
```

- [ ] **Step 3: Start dev server and visually verify**

```bash
vercel dev
```

Expected:
- 6 crystal clusters glow on the terrain, each in its own warm colour
- Each crystal pulses slowly at idle; pulse quickens when you walk within 18 units
- A coloured pool of light illuminates the ground under each cluster
- Walk close to a crystal — audio preview should start fading in
- Walk away — audio fades out within ~1 second

If audio does not play, click anywhere on the page first (browsers require a user interaction before allowing autoplay).

- [ ] **Step 4: Commit**

```bash
git add src/components/spots/CrystalSpot.tsx src/App.tsx
git commit -m "feat: add glowing crystal spots with proximity detection and audio"
```

---

### Task 10: Proximity HUD

**Files:**
- Create: `src/components/ui/ProximityHUD.tsx`
- Create: `src/components/ui/ProximityHUD.test.tsx`

**Interfaces:**
- Consumes: `activeSpotId: number | null`, `useSpotifyContext()` → `TrackData`
- Produces: `<ProximityHUD activeSpotId={...} />` — fixed bottom-centre overlay; null when no crystal active

- [ ] **Step 1: Write failing tests**

Create `src/components/ui/ProximityHUD.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import ProximityHUD from './ProximityHUD';
import { SpotifyContext, type TrackData } from '../../context/SpotifyContext';

const mockTrack: TrackData = {
  spotId: 1, trackId: 'abc123', name: 'Nostalgia', artist: 'Tiann',
  previewUrl: 'https://cdn.spotify.com/preview.mp3',
  spotifyUrl: 'https://open.spotify.com/track/abc123',
};

function wrap(tracks: Record<number, TrackData>) {
  return ({ children }: { children: ReactNode }) => (
    <SpotifyContext.Provider value={{ tracks, loading: false }}>
      {children}
    </SpotifyContext.Provider>
  );
}

describe('ProximityHUD', () => {
  it('renders nothing when activeSpotId is null', () => {
    const { container } = render(
      <ProximityHUD activeSpotId={null} />,
      { wrapper: wrap({ 1: mockTrack }) }
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when track data is not loaded yet', () => {
    const { container } = render(
      <ProximityHUD activeSpotId={1} />,
      { wrapper: wrap({}) }
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders song name and artist when active', () => {
    render(<ProximityHUD activeSpotId={1} />, { wrapper: wrap({ 1: mockTrack }) });
    expect(screen.getByText('Nostalgia')).toBeInTheDocument();
    expect(screen.getByText('Tiann')).toBeInTheDocument();
  });

  it('renders the E-key prompt', () => {
    render(<ProximityHUD activeSpotId={1} />, { wrapper: wrap({ 1: mockTrack }) });
    expect(screen.getByText(/Press E to open on Spotify/i)).toBeInTheDocument();
  });

  it('shows preview unavailable when previewUrl is null', () => {
    const noPreview = { ...mockTrack, previewUrl: null };
    render(<ProximityHUD activeSpotId={1} />, { wrapper: wrap({ 1: noPreview }) });
    expect(screen.getByText(/preview unavailable/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
npm test
```

Expected: FAIL — `Cannot find module './ProximityHUD'`

- [ ] **Step 3: Create ProximityHUD.tsx**

```typescript
import React from 'react';
import { useSpotifyContext } from '../../context/SpotifyContext';

interface ProximityHUDProps {
  activeSpotId: number | null;
}

const ProximityHUD: React.FC<ProximityHUDProps> = ({ activeSpotId }) => {
  const { tracks } = useSpotifyContext();

  if (activeSpotId === null) return null;
  const track = tracks[activeSpotId];
  if (!track) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: '12px',
        padding: '1rem 1.5rem',
        textAlign: 'center',
        color: '#fff5e0',
        fontFamily: 'Georgia, "Times New Roman", serif',
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 10,
        border: '1px solid rgba(255, 245, 224, 0.15)',
        minWidth: '220px',
      }}
    >
      <div style={{ fontSize: '1.1rem', fontWeight: 600, letterSpacing: '0.02em' }}>
        ♫ {track.name}
      </div>
      <div style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.2rem' }}>
        {track.artist}
      </div>
      {track.previewUrl === null && (
        <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.25rem' }}>
          (preview unavailable in your region)
        </div>
      )}
      <div
        style={{
          marginTop: '0.75rem',
          fontSize: '0.8rem',
          opacity: 0.85,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          borderTop: '1px solid rgba(255, 245, 224, 0.2)',
          paddingTop: '0.5rem',
        }}
      >
        Press E to open on Spotify
      </div>
    </div>
  );
};

export default ProximityHUD;
```

- [ ] **Step 4: Run all tests — confirm they pass**

```bash
npm test
```

Expected: 15 tests pass total (5 spots.config + 5 SpotifyContext + 5 ProximityHUD). No failures.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add ProximityHUD overlay with song info and Spotify E-key prompt"
```

---

### Task 11: App.tsx — Full Wiring

**Files:**
- Modify: `src/App.tsx` — complete final version

**Interfaces:**
- Consumes: all components from Tasks 5–10
- Produces: the complete integrated portfolio experience

- [ ] **Step 1: Write the final App.tsx**

Replace the full content of `src/App.tsx`:

```typescript
import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import * as THREE from 'three';

import { SpotifyProvider, useSpotifyContext } from './context/SpotifyContext';
import { SPOTS } from './components/spots/spots.config';
import SpaceSky from './components/world/SpaceSky';
import Planet from './components/world/Planet';
import BackgroundPlanet from './components/world/BackgroundPlanet';
import Astronaut from './components/character/Astronaut';
import CrystalSpot from './components/spots/CrystalSpot';
import ProximityHUD from './components/ui/ProximityHUD';

const camera = new THREE.PerspectiveCamera(60, 1920 / 1080, 1.0, 1000.0);
camera.position.set(25, 10, 25);

// World is a child of SpotifyProvider so it can read track data for the E-key handler
function World() {
  const characterPositionRef = useRef(new THREE.Vector3());
  const [activeSpotId, setActiveSpotId] = useState<number | null>(null);
  const { tracks } = useSpotifyContext();

  // E key: open Spotify when near a crystal; dance handled inside Astronaut otherwise
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'e' || e.key === 'E') && activeSpotId !== null) {
        const track = tracks[activeSpotId];
        if (track) window.open(track.spotifyUrl, '_blank', 'noopener,noreferrer');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeSpotId, tracks]);

  return (
    <>
      <div className="w-full h-screen bg-[#080010]">
        <Canvas
          shadows={{ type: THREE.PCFShadowMap }}
          camera={camera}
          onCreated={() => {
            // Preserve pre-migration FBX colour behaviour (see original Character.tsx comment)
            THREE.ColorManagement.enabled = false;
          }}
        >
          <hemisphereLight
            color={new THREE.Color().setHSL(0.72, 0.8, 0.25)}
            groundColor={new THREE.Color().setHSL(0.1, 0.4, 0.08)}
            intensity={1.5}
          />
          <directionalLight
            position={[-100, 100, 100]}
            intensity={2.0}
            castShadow
            shadow-bias={-0.001}
            shadow-mapSize-width={4096}
            shadow-mapSize-height={4096}
            shadow-camera-near={0.5}
            shadow-camera-far={500.0}
            shadow-camera-left={-50}
            shadow-camera-right={50}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
          />
          <ambientLight intensity={0.4} />
          <SpaceSky />
          <Suspense fallback={null}>
            <Planet />
            <BackgroundPlanet />
            <Astronaut
              camera={camera}
              activeSpotId={activeSpotId}
              characterPositionRef={characterPositionRef}
            />
            {SPOTS.map((spot) => (
              <CrystalSpot
                key={spot.id}
                spotId={spot.id}
                position={spot.position}
                color={spot.color}
                characterPositionRef={characterPositionRef}
                activeSpotId={activeSpotId}
                setActiveSpotId={setActiveSpotId}
              />
            ))}
          </Suspense>
        </Canvas>
        <Loader
          dataInterpolation={(p) => `Loading ${p.toFixed(2)}%`}
          initialState={(active) => active}
        />
      </div>
      <ProximityHUD activeSpotId={activeSpotId} />
    </>
  );
}

function App() {
  return (
    <SpotifyProvider>
      <World />
    </SpotifyProvider>
  );
}

export default App;
```

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: 15 tests pass. No failures.

- [ ] **Step 3: Start dev server and do full walkthrough**

```bash
vercel dev
```

Test the complete experience:

1. **Load**: page opens with dark sky and star field; loading bar appears while FBX assets load
2. **Movement**: WASD moves the character, Shift runs, E triggers dance when in open space
3. **Crystal discovery**: walk toward each of the 6 crystal clusters; each glows in its own colour
4. **Proximity enter**: within ~18 units, a song preview fades in and the HUD appears showing song name, artist, and "Press E to open on Spotify"
5. **Spotify open**: press E near a crystal → song opens in a new tab on Spotify
6. **Proximity exit**: walk away → audio fades out over ~1 second, HUD disappears
7. **Switching spots**: walk from one crystal directly toward another → previous audio fades out as new one fades in
8. **No preview**: if a track has no `preview_url`, the HUD appears with the "(preview unavailable in your region)" line but no audio — still functions

- [ ] **Step 4: Final commit**

```bash
git add src/App.tsx
git commit -m "feat: wire full music portfolio planet — astronaut, crystals, Spotify, HUD"
```

---

## Post-Implementation Notes

**Crystal position tuning:** Once you can see the planet, walk around and adjust positions in `spots.config.ts` so crystals sit at interesting points on the terrain rather than floating or sinking.

**Astronaut model swap:** Replace `public/character/character.fbx` and animation files with the Mixamo astronaut model. See Task 8 for instructions.

**Nebula texture (optional):** Download a free equirectangular JPEG from https://polyhaven.com/hdris (search "galaxy" or "nebula"). Place it in `public/nebula.jpg`. Then in `SpaceSky.tsx`, add:
```typescript
import { useTexture } from '@react-three/drei';
// Inside SpaceSky:
const nebula = useTexture('/nebula.jpg');
nebula.mapping = THREE.EquirectangularReflectionMapping;
// Then in App.tsx Canvas:
// scene.background = nebula; // via useThree
```

**Vercel deployment:** Push to GitHub, connect repo in Vercel dashboard, add `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` to Vercel environment variables. Deploy.
