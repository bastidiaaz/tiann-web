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
