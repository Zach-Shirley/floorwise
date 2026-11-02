/**
 * A soft, neutral reflection environment so metal, chrome and screens read as
 * shiny instead of black. Not a light source; the lighting pass comes later.
 */
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export function useSoftEnvironment(intensity = 0.35) {
  const { gl, scene } = useThree();
  useEffect(() => {
    // ?lowfx=1 skips it (software renderers in automated tests find it expensive)
    if (new URLSearchParams(location.search).has('lowfx')) return;
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = intensity;
    return () => {
      scene.environment = null;
      env.dispose();
      pm.dispose();
    };
  }, [gl, scene, intensity]);
}
