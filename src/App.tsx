import { Suspense } from "react";
import { Loader, OrbitControls } from "@react-three/drei";
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
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        camera={camera}
        onCreated={() => {
          // R3F v9 sets ColorManagement.enabled=true during Canvas setup, overriding any
          // module-level disable. Setting it here (after R3F init, before FBX loading
          // resolves) restores the pre-migration behavior where FBX sRGB colors are
          // used as-is in the shader rather than being linearized, matching the original look.
          THREE.ColorManagement.enabled = false;
        }}
      >
        <hemisphereLight
          color={new THREE.Color().setHSL(0.6, 1, 0.6)}
          groundColor={new THREE.Color().setHSL(0.095, 1, 0.75)}
          intensity={2.0}
        />
        <directionalLight
          position={[-100, 100, 100]}
          intensity={3.0}
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
        <ambientLight intensity={1.0} />
        <OrbitControls />
        <Suspense fallback={null}>
          <Ground />
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
