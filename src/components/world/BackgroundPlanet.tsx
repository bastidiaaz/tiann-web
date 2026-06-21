import React from 'react';

const BackgroundPlanet: React.FC = () => {
  return (
    <mesh position={[0, -400, -600]}>
      <sphereGeometry args={[300, 32, 32]} />
      <meshStandardMaterial
        color="#0d1b3e"
        emissive="#1a3a6e"
        emissiveIntensity={0.3}
        roughness={0.8}
        metalness={0.0}
      />
    </mesh>
  );
};

export default BackgroundPlanet;
