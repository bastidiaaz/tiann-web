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
