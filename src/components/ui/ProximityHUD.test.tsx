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
    expect(screen.getByText(/Nostalgia/)).toBeInTheDocument();
    expect(screen.getByText(/Tiann/)).toBeInTheDocument();
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
