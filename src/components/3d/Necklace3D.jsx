import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles } from '@react-three/drei';
import { useGameStore } from '../../hooks/useGameStore';

export default function Necklace3D() {
  const necklaceRef = useRef();
  const bedroomStep = useGameStore((s) => s.bedroomStep);

  // Visible during necklace presentation and transitions
  const isPresenting = bedroomStep === 'necklace';

  useFrame((state) => {
    if (!necklaceRef.current) return;
    const time = state.clock.getElapsedTime();

    if (isPresenting) {
      // Shimmers and floats gently between the two characters
      necklaceRef.current.position.set(0, 1.25 + Math.sin(time * 3) * 0.04, -24.1);
      necklaceRef.current.rotation.y = time * 0.8;
      necklaceRef.current.rotation.z = Math.sin(time * 2) * 0.05;
    }
  });

  if (!isPresenting) return null;

  return (
    <group ref={necklaceRef} position={[0, 1.25, -24.1]}>
      {/* Golden Chain Ring */}
      <mesh>
        <torusGeometry args={[0.12, 0.012, 12, 32]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Sparkling Heart / Teardrop Diamond Pendant */}
      <mesh position={[0, -0.12, 0]} rotation={[0, 0, Math.PI / 4]}>
        <octahedronGeometry args={[0.045, 0]} />
        <meshStandardMaterial
          color="#ff3366"
          emissive="#ff6699"
          emissiveIntensity={0.8}
          metalness={0.8}
          roughness={0.1}
        />
      </mesh>

      {/* Radiant sparkles around the necklace */}
      <Sparkles
        count={25}
        scale={[0.6, 0.6, 0.6]}
        size={2.5}
        speed={1.5}
        color="#ffd700"
      />
    </group>
  );
}
