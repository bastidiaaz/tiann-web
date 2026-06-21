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
