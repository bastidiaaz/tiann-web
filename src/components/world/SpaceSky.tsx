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
