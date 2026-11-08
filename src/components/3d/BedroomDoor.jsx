import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles, Text } from '@react-three/drei';
import { gameStore, useGameStore } from '../../hooks/useGameStore';
import { romanticAudio } from '../../hooks/useAudioManager';

export default function BedroomDoor() {
  const doorLeftRef = useRef();
  const doorRightRef = useRef();
  const glowLightRef = useRef();
  const [isOpen, setIsOpen] = useState(false);

  const bedroomStep = useGameStore((s) => s.bedroomStep);
  const memoriesRead = useGameStore((s) => s.memoriesRead);
  const allRead = memoriesRead.length >= 7;

  useFrame((state, delta) => {
    const playerPos = gameStore.get().playerPos;
    const distToDoor = Math.hypot(playerPos[0] - 0, playerPos[2] - (-14.8));
    const close = distToDoor < 3.0;

    // Check if player is near bedroom door while in museum
    if (bedroomStep === 'outside') {
      if (close) {
        gameStore.set({
          nearbyObject: { type: 'door' },
          interactionPrompt: 'open_door',
        });
      } else {
        const curNear = gameStore.get().nearbyObject;
        if (curNear && curNear.type === 'door') {
          gameStore.set({ nearbyObject: null, interactionPrompt: null });
        }
      }
    }

    // Door opening animation when entering bedroom
    const targetDoorRot = bedroomStep !== 'outside' ? Math.PI * 0.45 : 0;

    if (doorLeftRef.current && doorRightRef.current) {
      doorLeftRef.current.rotation.y = THREE.MathUtils.lerp(
        doorLeftRef.current.rotation.y,
        -targetDoorRot,
        4.0 * delta
      );
      doorRightRef.current.rotation.y = THREE.MathUtils.lerp(
        doorRightRef.current.rotation.y,
        targetDoorRot,
        4.0 * delta
      );
    }

    // Warm glow shining through the doorway
    if (glowLightRef.current) {
      const time = state.clock.getElapsedTime();
      glowLightRef.current.intensity = 2.0 + Math.sin(time * 2) * 0.5;
    }
  });

  return (
    <group position={[0, 0, -14.9]}>
      {/* Door Frame Arch */}
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[4.2, 5.0, 0.4]} />
        <meshStandardMaterial color="#2d2238" roughness={0.4} />
      </mesh>
      {/* Golden Frame Border */}
      <mesh position={[0, 2.5, 0.05]}>
        <boxGeometry args={[3.8, 4.8, 0.35]} />
        <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Door Opening Cavity */}
      <mesh position={[0, 2.3, 0]}>
        <boxGeometry args={[3.2, 4.4, 0.3]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Left Door Leaf (Pivot at x = -1.5) */}
      <group position={[-1.5, 0, 0]}>
        <group ref={doorLeftRef}>
          {/* Wooden Door Panel */}
          <mesh castShadow position={[0.75, 2.3, 0]}>
            <boxGeometry args={[1.5, 4.3, 0.12]} />
            <meshStandardMaterial color="#4a2c1d" roughness={0.5} />
          </mesh>
          {/* Gold Moldings */}
          <mesh position={[0.75, 3.2, 0.08]}>
            <boxGeometry args={[1.1, 1.6, 0.04]} />
            <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0.75, 1.4, 0.08]}>
            <boxGeometry args={[1.1, 1.4, 0.04]} />
            <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Golden Handle */}
          <mesh position={[1.35, 2.1, 0.12]}>
            <cylinderGeometry args={[0.025, 0.025, 0.28, 8]} />
            <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      </group>

      {/* Right Door Leaf (Pivot at x = +1.5) */}
      <group position={[1.5, 0, 0]}>
        <group ref={doorRightRef}>
          <mesh castShadow position={[-0.75, 2.3, 0]}>
            <boxGeometry args={[1.5, 4.3, 0.12]} />
            <meshStandardMaterial color="#4a2c1d" roughness={0.5} />
          </mesh>
          {/* Gold Moldings */}
          <mesh position={[-0.75, 3.2, 0.08]}>
            <boxGeometry args={[1.1, 1.6, 0.04]} />
            <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[-0.75, 1.4, 0.08]}>
            <boxGeometry args={[1.1, 1.4, 0.04]} />
            <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Golden Handle */}
          <mesh position={[-1.35, 2.1, 0.12]}>
            <cylinderGeometry args={[0.025, 0.025, 0.28, 8]} />
            <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      </group>

      {/* Archway Plaque */}
      <mesh position={[0, 4.85, 0.2]}>
        <boxGeometry args={[2.8, 0.45, 0.08]} />
        <meshStandardMaterial color="#d4af37" metalness={0.88} roughness={0.2} />
      </mesh>
      <Text
        position={[0, 4.85, 0.26]}
        fontSize={0.18}
        color="#1a0f05"
        anchorX="center"
        anchorY="middle"
      >
        OUR SANCTUARY ❤️
      </Text>

      {/* Warm Golden Light pouring into museum */}
      <pointLight
        ref={glowLightRef}
        position={[0, 2.5, -0.6]}
        color="#ffd384"
        intensity={2.5}
        distance={12}
        decay={2}
      />

      {/* Golden Sparkles radiating when all memories are read */}
      {allRead && (
        <Sparkles
          count={40}
          scale={[3.5, 4.5, 2]}
          size={3}
          color="#ffd700"
          speed={1.2}
          position={[0, 2.3, 0.5]}
        />
      )}
    </group>
  );
}
