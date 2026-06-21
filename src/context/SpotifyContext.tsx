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
        if (!tokenRes.ok) throw new Error(`Token fetch failed: ${tokenRes.status}`);
        const { access_token } = await tokenRes.json() as { access_token: string };

        const results = await Promise.all(
          SPOTS.map(async (spot) => {
            try {
              const res = await fetch(`https://api.spotify.com/v1/tracks/${spot.trackId}`, {
                headers: { Authorization: `Bearer ${access_token}` },
              });
              if (!res.ok) throw new Error(`Track ${spot.trackId} fetch failed: ${res.status}`);
              const data = await res.json() as {
                name: string;
                artists: { name: string }[];
                preview_url: string | null;
                external_urls: { spotify: string };
              };
              return [spot.id, {
                spotId: spot.id,
                trackId: spot.trackId,
                name: data.name,
                artist: data.artists[0]?.name ?? 'Unknown Artist',
                previewUrl: data.preview_url,
                spotifyUrl: data.external_urls.spotify,
              }] as const;
            } catch {
              return null;
            }
          })
        );

        const loaded: Record<number, TrackData> = {};
        for (const entry of results) {
          if (entry) loaded[entry[0]] = entry[1];
        }
        setTracks(loaded);
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
