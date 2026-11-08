import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function FloatingPetals({ count = 80 }) {
  const meshRef = useRef();

  // Create random petal data
  const petals = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        x: (Math.random() - 0.5) * 13,
        y: Math.random() * 6.0,
        z: (Math.random() - 0.5) * 44 - 6, // Spans museum (z: -14 to +14) and bedroom (z: -15 to -32)
        rx: Math.random() * Math.PI,
        ry: Math.random() * Math.PI,
        rz: Math.random() * Math.PI,
        speedY: 0.25 + Math.random() * 0.4,
        rotSpeedX: 0.5 + Math.random() * 1.5,
        rotSpeedY: 0.4 + Math.random() * 1.0,
        swayFreq: 1.5 + Math.random() * 2.0,
        swayAmp: 0.3 + Math.random() * 0.4,
        scale: 0.05 + Math.random() * 0.04,
      });
    }
    return data;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    petals.forEach((p, i) => {
      // Descend
      p.y -= p.speedY * delta;
      if (p.y < 0.05) {
        p.y = 6.0;
        p.x = (Math.random() - 0.5) * 13;
      }

      // Sway with gentle breeze
      const swayX = p.x + Math.sin(time * p.swayFreq + i) * p.swayAmp;
      const swayZ = p.z + Math.cos(time * p.swayFreq * 0.8 + i) * (p.swayAmp * 0.5);

      // Rotate
      p.rx += p.rotSpeedX * delta;
      p.ry += p.rotSpeedY * delta;

      dummy.position.set(swayX, p.y, swayZ);
      dummy.rotation.set(p.rx, p.ry, p.rz);
      dummy.scale.set(p.scale, p.scale * 0.2, p.scale * 1.4);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial
        color="#ff2d55"
        roughness={0.4}
        metalness={0.1}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}
