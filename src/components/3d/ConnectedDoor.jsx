import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { gameStore, useGameStore } from '../../hooks/useGameStore';

export default function ConnectedDoor({
  position = [0, 0, -15],
  sourceRoom,
  targetRoom,
  roomTitle = 'NEXT ROOM',
}) {
  const doorLeftRef = useRef();
  const doorRightRef = useRef();
  const currentRoom = useGameStore((s) => s.currentRoom);
  const [isOpening, setIsOpening] = useState(false);

  // Capitalized names for display
  const targetName = roomTitle;
  const sourceName = sourceRoom ? sourceRoom.toUpperCase() : 'PREVIOUS ROOM';

  useFrame((state, delta) => {
    const playerPos = gameStore.get().playerPos;
    const distToDoor = Math.hypot(playerPos[0] - position[0], playerPos[2] - position[2]);
    
    // Bidirectional proximity detection
    const isAtSource = currentRoom === sourceRoom;
    const isAtTarget = currentRoom === targetRoom;
    const close = distToDoor < 3.0 && (isAtSource || isAtTarget);

    if (close) {
      if (isAtSource) {
        gameStore.set({
          nearbyObject: { type: 'door', targetRoom, sourceRoom, direction: 'forward' },
          interactionPrompt: `OPEN DOOR: Enter ${targetName}`,
        });
      } else if (isAtTarget) {
        gameStore.set({
          nearbyObject: { type: 'door', targetRoom: sourceRoom, sourceRoom: targetRoom, direction: 'return' },
          interactionPrompt: `OPEN DOOR: Return to ${sourceName}`,
        });
      }
      setIsOpening(true);
    } else {
      const curNear = gameStore.get().nearbyObject;
      if (curNear && curNear.type === 'door' && (curNear.targetRoom === targetRoom || curNear.targetRoom === sourceRoom)) {
        gameStore.set({ nearbyObject: null, interactionPrompt: null });
      }
      setIsOpening(false);
    }

    const targetRot = isOpening ? Math.PI * 0.45 : 0;
    if (doorLeftRef.current && doorRightRef.current) {
      doorLeftRef.current.rotation.y = THREE.MathUtils.lerp(
        doorLeftRef.current.rotation.y,
        -targetRot,
        4.0 * delta
      );
      doorRightRef.current.rotation.y = THREE.MathUtils.lerp(
        doorRightRef.current.rotation.y,
        targetRot,
        4.0 * delta
      );
    }
  });

  const handleDoorClick = (e) => {
    e.stopPropagation();
    const isAtSource = currentRoom === sourceRoom;
    const isAtTarget = currentRoom === targetRoom;
    if (isAtSource) {
      gameStore.navigateToRoom(targetRoom);
    } else if (isAtTarget) {
      gameStore.navigateToRoom(sourceRoom);
    }
  };

  return (
    <group position={position} onClick={handleDoorClick}>
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
          <mesh castShadow position={[0.75, 2.3, 0]}>
            <boxGeometry args={[1.5, 4.3, 0.12]} />
            <meshStandardMaterial color="#4a2c1d" roughness={0.5} />
          </mesh>
          <mesh position={[0.75, 3.2, 0.08]}>
            <boxGeometry args={[1.1, 1.6, 0.04]} />
            <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0.75, 1.4, 0.08]}>
            <boxGeometry args={[1.1, 1.4, 0.04]} />
            <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
          </mesh>
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
          <mesh position={[-0.75, 3.2, 0.08]}>
            <boxGeometry args={[1.1, 1.6, 0.04]} />
            <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[-0.75, 1.4, 0.08]}>
            <boxGeometry args={[1.1, 1.4, 0.04]} />
            <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[-1.35, 2.1, 0.12]}>
            <cylinderGeometry args={[0.025, 0.025, 0.28, 8]} />
            <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      </group>

      {/* South Facing Archway Plaque (Approaching from South) */}
      <mesh position={[0, 4.85, 0.2]}>
        <boxGeometry args={[3.2, 0.45, 0.08]} />
        <meshStandardMaterial color="#d4af37" metalness={0.88} roughness={0.2} />
      </mesh>
      <Text
        position={[0, 4.85, 0.26]}
        fontSize={0.18}
        color="#1a0f05"
        anchorX="center"
        anchorY="middle"
      >
        {`${targetName} ❤️`}
      </Text>

      {/* North Facing Archway Plaque (Approaching from North / Return direction) */}
      <mesh position={[0, 4.85, -0.2]} rotation={[0, Math.PI, 0]}>
        <boxGeometry args={[3.2, 0.45, 0.08]} />
        <meshStandardMaterial color="#d4af37" metalness={0.88} roughness={0.2} />
      </mesh>
      <Text
        position={[0, 4.85, -0.26]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.18}
        color="#1a0f05"
        anchorX="center"
        anchorY="middle"
      >
        {`TO ${sourceName} 💫`}
      </Text>

      {/* Warm Glow shining through doorway */}
      <pointLight position={[0, 2.5, 0]} color="#ffd384" intensity={2.0} distance={10} decay={2} />
    </group>
  );
}
