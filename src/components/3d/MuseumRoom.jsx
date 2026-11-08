import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../hooks/useGameStore';

// Golden Chandelier with glowing candle lights
function Chandelier({ position, enableLight = true }) {
  return (
    <group position={position}>
      {/* Hanging Chain */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 2.4, 8]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Center Crown */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[0.6, 0.04, 8, 24]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0, -0.3, 0]}>
        <torusGeometry args={[0.9, 0.05, 8, 24]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Crystal Pendant Droplets */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x = Math.cos(rad) * 0.9;
        const z = Math.sin(rad) * 0.9;
        return (
          <group key={i} position={[x, -0.3, z]}>
            {/* Candle base */}
            <mesh position={[0, 0.1, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.18, 8]} />
              <meshStandardMaterial color="#fffbee" roughness={0.3} />
            </mesh>
            {/* Candle flame */}
            <mesh position={[0, 0.22, 0]}>
              <coneGeometry args={[0.025, 0.07, 8]} />
              <meshBasicMaterial color="#ffcc66" />
            </mesh>
            {/* Crystal teardrop below */}
            <mesh position={[0, -0.15, 0]}>
              <octahedronGeometry args={[0.05, 0]} />
              <meshStandardMaterial color="#ffffff" metalness={0.2} roughness={0.05} transparent opacity={0.85} />
            </mesh>
          </group>
        );
      })}

      {/* Warm Point Light illuminating the museum hall */}
      {enableLight && (
        <pointLight color="#ffe8c2" intensity={1.5} distance={14} decay={2} position={[0, -0.4, 0]} />
      )}
    </group>
  );
}

// Classical Fluted Architectural Column
function Column({ position }) {
  return (
    <group position={position}>
      {/* Plinth Base */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.9, 0.4, 0.9]} />
        <meshStandardMaterial color="#e8dfd8" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.38, 0.42, 0.1, 16]} />
        <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Fluted Shaft */}
      <mesh position={[0, 3.2, 0]}>
        <cylinderGeometry args={[0.32, 0.35, 5.4, 16]} />
        <meshStandardMaterial color="#f0eae4" roughness={0.4} />
      </mesh>

      {/* Golden Capital Head */}
      <mesh position={[0, 5.95, 0]}>
        <cylinderGeometry args={[0.42, 0.34, 0.2, 16]} />
        <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 6.15, 0]}>
        <boxGeometry args={[0.9, 0.2, 0.9]} />
        <meshStandardMaterial color="#e8dfd8" roughness={0.4} />
      </mesh>
    </group>
  );
}

// Decorative Flower Urn with Red & Pink Roses
function FlowerUrn({ position }) {
  return (
    <group position={position}>
      {/* Golden Urn */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.3, 0.15, 0.8, 16]} />
        <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <torusGeometry args={[0.32, 0.04, 8, 24]} />
        <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Rose Bouquet Clump */}
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.38, 12, 12]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.8} />
      </mesh>
      {/* Individual Blossoms */}
      {[-0.15, 0, 0.15].map((x, i) =>
        [-0.15, 0, 0.15].map((z, j) => (
          <mesh key={`${i}-${j}`} position={[x * 1.5, 1.25 + (i + j) * 0.04, z * 1.5]}>
            <sphereGeometry args={[0.09, 8, 8]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#ff3366' : '#ff758c'} roughness={0.5} />
          </mesh>
        ))
      )}
    </group>
  );
}

// Wall Sconce Lamp (Emissive warm glow, zero extra point lights per fixture)
function WallSconce({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[0.12, 0.25, 0.05]} />
        <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.12, 0.18]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.04, 0.2, 12]} />
        <meshStandardMaterial
          color="#fffbee"
          emissive="#ffe0a3"
          emissiveIntensity={0.8}
          roughness={0.2}
          transparent
          opacity={0.95}
        />
      </mesh>
    </group>
  );
}

// Cached singleton floor texture to prevent re-creation & premature disposal crashes
let cachedMuseumFloorTexture = null;
function getMuseumFloorTexture() {
  if (cachedMuseumFloorTexture) return cachedMuseumFloorTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Marble tile background
  ctx.fillStyle = '#f5efe6';
  ctx.fillRect(0, 0, 512, 512);

  // Marble veins
  ctx.strokeStyle = 'rgba(212, 197, 185, 0.4)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 512, 0);
    ctx.bezierCurveTo(Math.random() * 512, 150, Math.random() * 512, 350, Math.random() * 512, 512);
    ctx.stroke();
  }

  // Gold inlaid tile borders
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, 480, 480);
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(32, 32, 448, 448);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 12);
  cachedMuseumFloorTexture = texture;
  return cachedMuseumFloorTexture;
}

export default function MuseumRoom() {
  const currentRoom = useGameStore((s) => s.currentRoom);
  const isRoomActive = currentRoom === 'museum' || currentRoom === 'singing';
  const floorTexture = getMuseumFloorTexture();

  return (
    <group>
      {/* Polished Marble Floor (14 wide, 30 long) */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[14, 30]} />
        <meshStandardMaterial
          map={floorTexture}
          roughness={0.25}
          metalness={0.1}
        />
      </mesh>

      {/* Royal Red Central Velvet Carpet Runner */}
      <group position={[0, 0.015, 0]}>
        {/* Main Red Velvet Runner */}
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[2.8, 29.5]} />
          <meshStandardMaterial color="#8e172e" roughness={0.8} />
        </mesh>
        {/* Golden Embroidered Edge Borders */}
        <mesh position={[-1.4, 0.005, 0]}>
          <boxGeometry args={[0.08, 0.01, 29.5]} />
          <meshStandardMaterial color="#d4af37" metalness={0.88} roughness={0.2} />
        </mesh>
        <mesh position={[1.4, 0.005, 0]}>
          <boxGeometry args={[0.08, 0.01, 29.5]} />
          <meshStandardMaterial color="#d4af37" metalness={0.88} roughness={0.2} />
        </mesh>
      </group>

      {/* Ceiling with recessed panels */}
      <mesh position={[0, 6.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 30]} />
        <meshStandardMaterial color="#1a1424" roughness={0.9} />
      </mesh>

      {/* Left Wall (West, x = -7) */}
      <group position={[-7, 3.2, 0]}>
        <mesh receiveShadow position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[30, 6.4]} />
          <meshStandardMaterial color="#f8f4ee" roughness={0.7} />
        </mesh>
        {/* Wall baseboard & chair rail */}
        <mesh position={[0.1, -2.8, 0]}>
          <boxGeometry args={[0.2, 0.8, 30]} />
          <meshStandardMaterial color="#2d2238" roughness={0.5} />
        </mesh>
        <mesh position={[0.08, -1.2, 0]}>
          <boxGeometry args={[0.15, 0.1, 30]} />
          <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Crown Molding */}
        <mesh position={[0.1, 3.1, 0]}>
          <boxGeometry args={[0.2, 0.2, 30]} />
          <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Wall Sconces */}
        {[-8, -2, 4, 10].map((z, idx) => (
          <WallSconce key={idx} position={[0.1, 0.2, z]} rotation={[0, Math.PI / 2, 0]} />
        ))}
      </group>

      {/* Right Wall (East, x = +7) */}
      <group position={[7, 3.2, 0]}>
        <mesh receiveShadow position={[0, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[30, 6.4]} />
          <meshStandardMaterial color="#f8f4ee" roughness={0.7} />
        </mesh>
        <mesh position={[-0.1, -2.8, 0]}>
          <boxGeometry args={[0.2, 0.8, 30]} />
          <meshStandardMaterial color="#2d2238" roughness={0.5} />
        </mesh>
        <mesh position={[-0.08, -1.2, 0]}>
          <boxGeometry args={[0.15, 0.1, 30]} />
          <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[-0.1, 3.1, 0]}>
          <boxGeometry args={[0.2, 0.2, 30]} />
          <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Wall Sconces */}
        {[-8, -2, 4, 10].map((z, idx) => (
          <WallSconce key={idx} position={[-0.1, 0.2, z]} rotation={[0, -Math.PI / 2, 0]} />
        ))}
      </group>

      {/* Museum Entrance Back Wall (South, z = +15) */}
      <group position={[0, 3.2, 15]}>
        <mesh receiveShadow rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[14, 6.4]} />
          <meshStandardMaterial color="#f8f4ee" roughness={0.7} />
        </mesh>
        {/* Grand Entrance Arch */}
        <mesh position={[0, 0.2, -0.05]}>
          <boxGeometry args={[4.2, 5.0, 0.2]} />
          <meshStandardMaterial color="#1f182c" roughness={0.6} />
        </mesh>
        <mesh position={[0, 2.7, -0.06]}>
          <cylinderGeometry args={[2.1, 2.1, 0.2, 32, 1, false, 0, Math.PI]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>

      {/* Grand Chandeliers down the central gallery axis (1 central light) */}
      <Chandelier position={[0, 4.8, 9]} enableLight={false} />
      <Chandelier position={[0, 4.8, 1]} enableLight={isRoomActive} />
      <Chandelier position={[0, 4.8, -7]} enableLight={false} />

      {/* Classical Columns flanking gallery */}
      {[-5.8, 5.8].map((x) =>
        [-9, -3, 3, 9].map((z) => (
          <Column key={`${x}-${z}`} position={[x, 0, z]} />
        ))
      )}

      {/* Decorative Flower Urns at corners and transitions */}
      <FlowerUrn position={[-5.6, 0, 13.5]} />
      <FlowerUrn position={[5.6, 0, 13.5]} />
      <FlowerUrn position={[-5.6, 0, -13.5]} />
      <FlowerUrn position={[5.6, 0, -13.5]} />
    </group>
  );
}
