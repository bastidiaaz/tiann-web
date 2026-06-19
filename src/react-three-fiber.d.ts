/// <reference types="@react-three/fiber" />
import "@react-three/fiber";
import React from "react";
import * as THREE from "three";

// Bridge React 19's JSX namespace with global JSX namespace from @react-three/fiber
declare global {
  namespace JSX {
    type Element = React.ReactElement<any, any> | null;
  }
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends globalThis.JSX.IntrinsicElements {}
  }
}

// Override fiber types to accept Object3D children which are internally used by three-fiber
declare module "@react-three/fiber" {
  interface NodeProps<T, P> {
    children?: React.ReactNode | THREE.Object3D[];
  }
}
