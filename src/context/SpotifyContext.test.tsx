import { describe, it, expect, vi, afterEach } from 'vitest';
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
