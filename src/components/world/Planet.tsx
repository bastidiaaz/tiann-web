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
