import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles } from '@react-three/drei';
import { useGameStore } from '../../hooks/useGameStore';

export default function LightBeacons() {
  const groupRef = useRef();
  const memoriesRead = useGameStore((s) => s.memoriesRead);
  const isUnlocked = memoriesRead.length >= 7;

  // Path nodes from museum entrance towards bedroom door (z: 10 down to -14)
  const waypoints = [
    [0, 0.05, 10],
    [0, 0.05, 6],
    [0, 0.05, 2],
    [0, 0.05, -2],
    [0, 0.05, -6],
    [0, 0.05, -10],
    [0, 0.05, -14],
  ];

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    // Shimmering wave effect along the path
    groupRef.current.children.forEach((child, i) => {
      const scale = isUnlocked
        ? 1.0 + Math.sin(time * 3 - i * 0.8) * 0.35
        : 0.001; // Hidden until unlocked
      child.scale.set(scale, 1, scale);
    });
  });

  if (!isUnlocked) return null;

  return (
    <group ref={groupRef}>
      {waypoints.map(([x, y, z], idx) => (
        <group key={idx} position={[x, y, z]}>
          {/* Glowing Golden Circle on Floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.7, 24]} />
            <meshBasicMaterial color="#ffd700" transparent opacity={0.65} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.3, 24]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
          </mesh>
          {/* Upward Light Beam */}
          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.2, 0.5, 2.4, 16, 1, true]} />
            <meshBasicMaterial color="#ffd700" transparent opacity={0.25} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}

      {/* Golden Pathway Sparkles */}
      <Sparkles
        count={50}
        scale={[2, 3, 24]}
        position={[0, 1.5, -2]}
        size={2.5}
        color="#ffd700"
        speed={1.0}
      />
    </group>
  );
}
