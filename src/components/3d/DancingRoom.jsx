import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { Sparkles, Text } from '@react-three/drei';
import { useGameStore } from '../../hooks/useGameStore';

function BallroomChandelier({ position, enableLight = true }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 2.0, 8]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Triple Ring Crystal Chandelier */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[1.2, 0.06, 8, 32]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0, -0.4, 0]}>
        <torusGeometry args={[0.8, 0.05, 8, 28]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0, -0.7, 0]}>
        <torusGeometry args={[0.4, 0.04, 8, 24]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Warm Golden Glow */}
      {enableLight && (
        <pointLight color="#ffe8b3" intensity={2.0} distance={15} decay={2} position={[0, -0.5, 0]} />
      )}
    </group>
  );
}

// Ornate Wall Mirror
function WallMirror({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Gold Frame */}
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[2.2, 3.6, 0.1]} />
        <meshStandardMaterial color="#d4af37" metalness={0.88} roughness={0.2} />
      </mesh>
      {/* Mirror Surface */}
      <mesh position={[0, 0, 0.09]}>
        <planeGeometry args={[1.9, 3.3]} />
        <meshStandardMaterial color="#f0f4f8" metalness={0.95} roughness={0.05} />
      </mesh>
    </group>
  );
}

// Cached singleton floor texture to prevent re-creation & premature disposal crashes
let cachedBallroomFloorTexture = null;
function getBallroomFloorTexture() {
  if (cachedBallroomFloorTexture) return cachedBallroomFloorTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Rich warm honey-amber teak wood
  ctx.fillStyle = '#542417';
  ctx.fillRect(0, 0, 512, 512);

  // Parquet herringbone pattern
  ctx.strokeStyle = '#6e3524';
  ctx.lineWidth = 4;
  for (let i = 0; i < 512; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 64, 512);
    ctx.stroke();
  }

  // Gold inlaid central dance circle
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(256, 256, 180, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(256, 256, 210, 0, Math.PI * 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  cachedBallroomFloorTexture = texture;
  return cachedBallroomFloorTexture;
}

export default function DancingRoom() {
  const currentRoom = useGameStore((s) => s.currentRoom);
  const isRoomActive = currentRoom === 'dancing' || currentRoom === 'singing' || currentRoom === 'bedroom';
  const floorTexture = getBallroomFloorTexture();

  return (
    <group>
      {/* Ballroom Floor (Z: -46 to -74, Width: 14) */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -60]}>
        <planeGeometry args={[14, 28]} />
        <meshStandardMaterial
          map={floorTexture}
          roughness={0.2}
          metalness={0.15}
        />
      </mesh>

      {/* Scattered Rose Petals on Ballroom Floor */}
      {[-4, -2.5, -1, 1, 2.5, 4].map((px, pi) =>
        [-68, -64, -60, -56, -52].map((pz, pj) => (
          <mesh
            key={`${pi}-${pj}`}
            position={[px + Math.sin(pi + pj) * 0.8, 0.015, pz + Math.cos(pi * 2) * 0.8]}
            rotation={[-Math.PI / 2, 0, pi + pj * 1.2]}
          >
            <circleGeometry args={[0.07, 8]} />
            <meshStandardMaterial color={pi % 2 === 0 ? '#ff2a55' : '#ff6584'} roughness={0.4} />
          </mesh>
        ))
      )}

      {/* Ceiling */}
      <mesh position={[0, 6.4, -60]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 28]} />
        <meshStandardMaterial color="#1a1020" roughness={0.9} />
      </mesh>

      {/* Left Wall (West, x = -7) */}
      <group position={[-7, 3.2, -60]}>
        {/* Upper Damask Wall */}
        <mesh receiveShadow rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[28, 6.4]} />
          <meshStandardMaterial color="#dfc5ce" roughness={0.6} />
        </mesh>
        {/* Lower Wainscoting */}
        <mesh position={[0.08, -1.8, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[28, 2.8]} />
          <meshStandardMaterial color="#4a2232" roughness={0.5} />
        </mesh>
        <mesh position={[0.1, -0.4, 0]}>
          <boxGeometry args={[0.15, 0.1, 28]} />
          <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.2} />
        </mesh>

        <WallMirror position={[0.12, 0.4, -6]} rotation={[0, Math.PI / 2, 0]} />
        <WallMirror position={[0.12, 0.4, 6]} rotation={[0, Math.PI / 2, 0]} />

        {/* Golden Wall Sconces flanking mirrors with warm emissive glow */}
        {[-8, -4, 4, 8].map((sz) => (
          <group key={sz} position={[0.12, 0.6, sz]}>
            <mesh>
              <cylinderGeometry args={[0.04, 0.02, 0.25, 8]} />
              <meshStandardMaterial
                color="#d4af37"
                emissive="#ffe0a3"
                emissiveIntensity={0.8}
                metalness={0.85}
                roughness={0.2}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Right Wall (East, x = +7) */}
      <group position={[7, 3.2, -60]}>
        {/* Upper Damask Wall */}
        <mesh receiveShadow rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[28, 6.4]} />
          <meshStandardMaterial color="#dfc5ce" roughness={0.6} />
        </mesh>
        {/* Lower Wainscoting */}
        <mesh position={[-0.08, -1.8, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[28, 2.8]} />
          <meshStandardMaterial color="#4a2232" roughness={0.5} />
        </mesh>
        <mesh position={[-0.1, -0.4, 0]}>
          <boxGeometry args={[0.15, 0.1, 28]} />
          <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.2} />
        </mesh>

        <WallMirror position={[-0.12, 0.4, -6]} rotation={[0, -Math.PI / 2, 0]} />
        <WallMirror position={[-0.12, 0.4, 6]} rotation={[0, -Math.PI / 2, 0]} />

        {/* Golden Wall Sconces flanking mirrors with warm emissive glow */}
        {[-8, -4, 4, 8].map((sz) => (
          <group key={sz} position={[-0.12, 0.6, sz]}>
            <mesh>
              <cylinderGeometry args={[0.04, 0.02, 0.25, 8]} />
              <meshStandardMaterial
                color="#d4af37"
                emissive="#ffe0a3"
                emissiveIntensity={0.8}
                metalness={0.85}
                roughness={0.2}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* South Wall with Open Doorway to Singing Room (z = -46) */}
      <group position={[0, 3.2, -46]}>
        {/* Left Wall Panel */}
        <mesh receiveShadow position={[-4.7, 0, 0]}>
          <planeGeometry args={[4.6, 6.4]} />
          <meshStandardMaterial color="#dfc5ce" roughness={0.6} />
        </mesh>
        {/* Right Wall Panel */}
        <mesh receiveShadow position={[4.7, 0, 0]}>
          <planeGeometry args={[4.6, 6.4]} />
          <meshStandardMaterial color="#dfc5ce" roughness={0.6} />
        </mesh>
        {/* Lintel above Door Arch */}
        <mesh receiveShadow position={[0, 2.3, 0]}>
          <planeGeometry args={[4.8, 1.8]} />
          <meshStandardMaterial color="#dfc5ce" roughness={0.6} />
        </mesh>
      </group>

      {/* North Wall with Open Doorway to Bedroom (z = -74) */}
      <group position={[0, 3.2, -74]} rotation={[0, Math.PI, 0]}>
        {/* Left Wall Panel */}
        <mesh receiveShadow position={[-4.7, 0, 0]}>
          <planeGeometry args={[4.6, 6.4]} />
          <meshStandardMaterial color="#dfc5ce" roughness={0.6} />
        </mesh>
        {/* Right Wall Panel */}
        <mesh receiveShadow position={[4.7, 0, 0]}>
          <planeGeometry args={[4.6, 6.4]} />
          <meshStandardMaterial color="#dfc5ce" roughness={0.6} />
        </mesh>
        {/* Lintel above Door Arch */}
        <mesh receiveShadow position={[0, 2.3, 0]}>
          <planeGeometry args={[4.8, 1.8]} />
          <meshStandardMaterial color="#dfc5ce" roughness={0.6} />
        </mesh>
      </group>

      {/* Twin Grand Chandeliers */}
      <BallroomChandelier position={[0, 4.8, -54]} enableLight={isRoomActive} />
      <BallroomChandelier position={[0, 4.8, -66]} enableLight={isRoomActive} />

      {/* Ballroom Banner */}
      <Text
        position={[0, 5.8, -46.2]}
        rotation={[0, 0, 0]}
        fontSize={0.24}
        color="#d4af37"
        anchorX="center"
        anchorY="middle"
      >
        THE ROMANTIC BALLROOM ✨
      </Text>

      {/* Floating Sparkles in Ballroom */}
      <Sparkles
        count={65}
        scale={[12, 5, 24]}
        position={[0, 2.5, -60]}
        size={2.8}
        color="#ffd700"
        speed={0.8}
      />
    </group>
  );
}
