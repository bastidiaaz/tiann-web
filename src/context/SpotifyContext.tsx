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
