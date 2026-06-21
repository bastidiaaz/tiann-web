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

