import { useFrame, useLoader } from '@react-three/fiber';
import React, { useCallback, useEffect, useRef } from 'react';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { useFBX } from '@react-three/drei';
import * as THREE from 'three';
import { Mesh } from 'three';

interface Animations {
  [name: string]: { clip: THREE.AnimationAction };
}

interface AstronautProps {
  camera: THREE.PerspectiveCamera;
  activeSpotId: number | null;
  characterPositionRef: React.MutableRefObject<THREE.Vector3>;
}

const Astronaut: React.FC<AstronautProps> = ({ camera, activeSpotId, characterPositionRef }) => {
  const character = useRef<Mesh>(null!);

  const activeKeys = useRef({
    forward: false, backward: false, left: false, right: false,
    run: false, dance: false,
  });

  const animations: Animations = {};
  const currentPosition = new THREE.Vector3();
  const currentLookAt = new THREE.Vector3();
  const deceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
  const acceleration = new THREE.Vector3(1, 0.125, 100.0);
  const velocity = new THREE.Vector3(0, 0, 0);

  const c = useLoader(FBXLoader as any, './character/character.fbx');
  c.scale.setScalar(0.1);
  c.traverse((f: THREE.Object3D) => { f.castShadow = true; f.receiveShadow = true; });

  const mixer = new THREE.AnimationMixer(c);

  const idle = useFBX('./character/idle.fbx');
  animations['idle'] = { clip: mixer.clipAction(idle.animations[0]) };
  const walk = useFBX('./character/walking.fbx');
  animations['walk'] = { clip: mixer.clipAction(walk.animations[0]) };
  const run = useFBX('./character/running.fbx');
  animations['run'] = { clip: mixer.clipAction(run.animations[0]) };
  const dance = useFBX('./character/dance.fbx');
  animations['dance'] = { clip: mixer.clipAction(dance.animations[0]) };

  let currAction = animations['idle'].clip;
  let prevAction: THREE.AnimationAction;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.keyCode) {
      case 87: activeKeys.current.forward = true; break;
      case 65: activeKeys.current.left = true; break;
      case 83: activeKeys.current.backward = true; break;
      case 68: activeKeys.current.right = true; break;
      case 16: activeKeys.current.run = true; break;
      case 69:
        // Dance only when NOT standing near a crystal — E near a crystal opens Spotify (handled in App)
        if (activeSpotId === null) activeKeys.current.dance = true;
        break;
    }
  }, [activeSpotId]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    switch (e.keyCode) {
      case 87: activeKeys.current.forward = false; break;
      case 65: activeKeys.current.left = false; break;
      case 83: activeKeys.current.backward = false; break;
      case 68: activeKeys.current.right = false; break;
      case 16: activeKeys.current.run = false; break;
      case 69: activeKeys.current.dance = false; break;
    }
  }, []);

  const calculateIdealOffset = () => {
    const offset = new THREE.Vector3(0, 22, -32);
    offset.applyQuaternion(character.current.quaternion);
    offset.add(character.current.position);
    return offset;
  };

  const calculateIdealLookat = () => {
    const lookat = new THREE.Vector3(0, 10, 50);
    lookat.applyQuaternion(character.current.quaternion);
    lookat.add(character.current.position);
    return lookat;
  };

  const updateCamera = (delta: number) => {
    const t = 1.0 - Math.pow(0.001, delta);
    currentPosition.lerp(calculateIdealOffset(), t);
    currentLookAt.lerp(calculateIdealLookat(), t);
    camera.position.copy(currentPosition);
  };

  const updateMovement = (delta: number) => {
    const vel = velocity;
    const frameDecel = new THREE.Vector3(
      vel.x * deceleration.x,
      vel.y * deceleration.y,
      vel.z * deceleration.z,
    );
    frameDecel.multiplyScalar(delta);
    frameDecel.z = Math.sign(frameDecel.z) * Math.min(Math.abs(frameDecel.z), Math.abs(vel.z));
    vel.add(frameDecel);

    const obj = character.current;
    const _Q = new THREE.Quaternion();
    const _A = new THREE.Vector3();
    const _R = obj.quaternion.clone();
    const acc = acceleration.clone();

    if (activeKeys.current.run) acc.multiplyScalar(2.0);
    if (currAction === animations['dance'].clip) acc.multiplyScalar(0.0);

    if (activeKeys.current.forward) vel.z += acc.z * delta;
    if (activeKeys.current.backward) vel.z -= acc.z * delta;
    if (activeKeys.current.left) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, 4.0 * Math.PI * delta * acceleration.y);
      _R.multiply(_Q);
    }
    if (activeKeys.current.right) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, 4.0 * -Math.PI * delta * acceleration.y);
      _R.multiply(_Q);
    }

    obj.quaternion.copy(_R);

    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(obj.quaternion).normalize();
    const sideways = new THREE.Vector3(1, 0, 0).applyQuaternion(obj.quaternion).normalize();

    obj.position.add(forward.multiplyScalar(vel.z * delta));
    obj.position.add(sideways.multiplyScalar(vel.x * delta));
    character.current.position.copy(obj.position);
    updateCamera(delta);
  };

  useFrame((state, delta) => {
    prevAction = currAction;

    if (activeKeys.current.forward || activeKeys.current.backward ||
        activeKeys.current.left || activeKeys.current.right) {
      currAction = activeKeys.current.run ? animations['run'].clip : animations['walk'].clip;
    } else if (activeKeys.current.dance) {
      currAction = animations['dance'].clip;
    } else {
      currAction = animations['idle'].clip;
    }

    if (prevAction !== currAction) {
      prevAction.fadeOut(0.2);
      if (prevAction === animations['walk'].clip) {
        const ratio = currAction.getClip().duration / prevAction.getClip().duration;
        currAction.time = prevAction.time * ratio;
      }
      currAction.reset().play();
    } else {
      currAction.play();
    }

    updateMovement(delta);

    // Write position each frame — CrystalSpots read this ref to check proximity
    characterPositionRef.current.copy(character.current.position);

    state.camera.lookAt(calculateIdealLookat());
    state.camera.updateProjectionMatrix();
    mixer.update(delta);
  });

  // Separate effects: initial play vs listener lifecycle (avoids replaying on handler re-creation)
  useEffect(() => { currAction.play(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return <primitive object={c} ref={character} />;
};

export default Astronaut;
