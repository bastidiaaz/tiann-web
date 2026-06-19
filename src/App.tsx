import { Suspense } from "react";
import { Loader, OrbitControls, SoftShadows } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import Ground from "./components/Ground";
import Character from "./components/Character";
import * as THREE from "three";
import Nature from "./components/Nature";

const camera = new THREE.PerspectiveCamera(60, 1920 / 1080, 1.0, 1000.0);
camera.position.set(25, 10, 25);

function App() {
  return (
    <div className="w-full h-screen bg-fuchsia-100">
      <Canvas shadows camera={camera}>
        <SoftShadows />
        <hemisphereLight
          color={new THREE.Color().setHSL(0.6, 1, 0.6)}
          groundColor={new THREE.Color().setHSL(0.095, 1, 0.75)}
          intensity={0.6}
        />
        <directionalLight
          position={[-100, 100, 100]}
          intensity={1.0}
          castShadow
          shadow-bias={-0.001}
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-near={0.5}
          shadow-camera-far={500.0}
          shadow-camera-left={50}
          shadow-camera-right={-50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
        />
        <ambientLight intensity={0.1} />
        <OrbitControls />
        <Suspense fallback={null}>
          <Ground />
          <perspectiveCamera args={[60, 1920 / 1080, 1.0, 1000.0]} position={[25, 10, 25]} />
          <Character camera={camera} />
          <Nature />
        </Suspense>
        <fog attach="fog" args={["#ffffff", 50, 300]} />
      </Canvas>
      <Loader
        dataInterpolation={(p) => `Loading ${p.toFixed(2)}%`}
        initialState={(active) => active}
      />
    </div>
  );
}

export default App;
