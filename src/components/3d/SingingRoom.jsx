import React from 'react';
import * as THREE from 'three';
import { Sparkles, Text } from '@react-three/drei';
import { useGameStore } from '../../hooks/useGameStore';

// Banquet table with velvet tablecloth and glowing candle
function RomanticTable({ position }) {
  return (
    <group position={position}>
      {/* Table cloth base */}
      <mesh castShadow position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.5, 0.55, 0.9, 16]} />
        <meshStandardMaterial color="#4a1525" roughness={0.7} />
      </mesh>
      {/* Golden rim plate */}
      <mesh position={[0, 0.91, 0]}>
        <cylinderGeometry args={[0.52, 0.52, 0.02, 16]} />
        <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Candle */}
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.25, 12]} />
        <meshStandardMaterial color="#fffbee" emissive="#ffaa33" emissiveIntensity={0.6} roughness={0.3} />
      </mesh>
      {/* Flame */}
      <mesh position={[0, 1.2, 0]}>
        <coneGeometry args={[0.035, 0.08, 8]} />
        <meshBasicMaterial color="#ffaa33" />
      </mesh>
    </group>
  );
}

export default function SingingRoom() {
  const currentRoom = useGameStore((s) => s.currentRoom);
  const roomData = useGameStore((s) => s.roomData);
  const singingConfig = roomData?.singingConfiguration || {};
  const stageLightColor = singingConfig.stageLightingColor || '#ffd700';

  const isRoomActive = currentRoom === 'singing' || currentRoom === 'museum' || currentRoom === 'dancing';

  return (
    <group>
      {/* Room Floor (Z: -16 to -44, Width: 14) */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -30]}>
        <planeGeometry args={[14, 28]} />
        <meshStandardMaterial color="#221220" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 6.4, -30]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 28]} />
        <meshStandardMaterial color="#140b17" roughness={0.9} />
      </mesh>

      {/* Left Wall (West, x = -7) */}
      <group position={[-7, 3.2, -30]}>
        <mesh receiveShadow rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[28, 6.4]} />
          <meshStandardMaterial color="#4a1d2e" roughness={0.6} />
        </mesh>
        {/* Golden pilasters along wall with gentle emissive sheen */}
        {[-10, -5, 0, 5, 10].map((z) => (
          <group key={z} position={[0.08, 0, z]}>
            <mesh>
              <boxGeometry args={[0.1, 6.2, 0.35]} />
              <meshStandardMaterial
                color="#d4af37"
                emissive="#ffdd99"
                emissiveIntensity={0.25}
                metalness={0.8}
                roughness={0.25}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Right Wall (East, x = +7) */}
      <group position={[7, 3.2, -30]}>
        <mesh receiveShadow rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[28, 6.4]} />
          <meshStandardMaterial color="#4a1d2e" roughness={0.6} />
        </mesh>
        {/* Golden pilasters along wall with gentle emissive sheen */}
        {[-10, -5, 0, 5, 10].map((z) => (
          <group key={z} position={[-0.08, 0, z]}>
            <mesh>
              <boxGeometry args={[0.1, 6.2, 0.35]} />
              <meshStandardMaterial
                color="#d4af37"
                emissive="#ffdd99"
                emissiveIntensity={0.25}
                metalness={0.8}
                roughness={0.25}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Wall Wash Lighting (2 efficient lights instead of 10) */}
      {isRoomActive && (
        <>
          <pointLight position={[-4.5, 3.5, -30]} intensity={1.1} distance={15} decay={2} color="#ffdd99" />
          <pointLight position={[4.5, 3.5, -30]} intensity={1.1} distance={15} decay={2} color="#ffdd99" />
          {/* Soft Banquet seating fill light */}
          <pointLight position={[0, 2.2, -25]} intensity={0.9} distance={12} decay={2} color="#ffaa55" />
        </>
      )}

      {/* South Wall with Open Doorway to Museum (z = -16) */}
      <group position={[0, 3.2, -16]}>
        {/* Left Wall Panel */}
        <mesh receiveShadow position={[-4.7, 0, 0]}>
          <planeGeometry args={[4.6, 6.4]} />
          <meshStandardMaterial color="#4a1d2e" roughness={0.6} />
        </mesh>
        {/* Right Wall Panel */}
        <mesh receiveShadow position={[4.7, 0, 0]}>
          <planeGeometry args={[4.6, 6.4]} />
          <meshStandardMaterial color="#4a1d2e" roughness={0.6} />
        </mesh>
        {/* Lintel above Door Arch */}
        <mesh receiveShadow position={[0, 2.3, 0]}>
          <planeGeometry args={[4.8, 1.8]} />
          <meshStandardMaterial color="#4a1d2e" roughness={0.6} />
        </mesh>
      </group>

      {/* North Wall with Open Doorway to Dancing Room (z = -44) */}
      <group position={[0, 3.2, -44]} rotation={[0, Math.PI, 0]}>
        {/* Left Wall Panel */}
        <mesh receiveShadow position={[-4.7, 0, 0]}>
          <planeGeometry args={[4.6, 6.4]} />
          <meshStandardMaterial color="#4a1d2e" roughness={0.6} />
        </mesh>
        {/* Right Wall Panel */}
        <mesh receiveShadow position={[4.7, 0, 0]}>
          <planeGeometry args={[4.6, 6.4]} />
          <meshStandardMaterial color="#4a1d2e" roughness={0.6} />
        </mesh>
        {/* Lintel above Door Arch */}
        <mesh receiveShadow position={[0, 2.3, 0]}>
          <planeGeometry args={[4.8, 1.8]} />
          <meshStandardMaterial color="#4a1d2e" roughness={0.6} />
        </mesh>
      </group>

      {/* ================= STAGE PLATFORM ================= */}
      <group position={[0, 0, -38]}>
        {/* Raised Wooden Stage Platform */}
        <mesh castShadow receiveShadow position={[0, 0.45, 0]}>
          <boxGeometry args={[9.5, 0.9, 7.5]} />
          <meshStandardMaterial color="#4d2836" roughness={0.35} metalness={0.15} />
        </mesh>
        {/* Golden Stage Front Molding */}
        <mesh position={[0, 0.88, 3.76]}>
          <boxGeometry args={[9.6, 0.08, 0.12]} />
          <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.2} />
        </mesh>

        {/* Glowing Stage Front Footlights */}
        {[-3.6, -2.7, -1.8, -0.9, 0, 0.9, 1.8, 2.7, 3.6].map((fx, fi) => (
          <group key={fi} position={[fx, 0.94, 3.7]}>
            <mesh>
              <sphereGeometry args={[0.065, 12, 12]} />
              <meshStandardMaterial
                color="#fff8e7"
                emissive="#ffcc66"
                emissiveIntensity={1.8}
                roughness={0.1}
              />
            </mesh>
          </group>
        ))}
        {/* Single Center Footlight Wash */}
        {isRoomActive && (
          <pointLight color="#ffdd88" intensity={1.2} distance={6} decay={2} position={[0, 1.2, 3.8]} />
        )}

        {/* Velvet Stage Back Curtains */}
        <mesh position={[0, 3.6, -3.6]}>
          <boxGeometry args={[9.6, 5.6, 0.3]} />
          <meshStandardMaterial color="#6e1b34" roughness={0.7} />
        </mesh>
        {/* Velvet Side Curtains / Wings */}
        <mesh position={[-4.5, 3.6, -0.5]}>
          <boxGeometry args={[0.5, 5.6, 6.0]} />
          <meshStandardMaterial color="#6e1b34" roughness={0.7} />
        </mesh>
        <mesh position={[4.5, 3.6, -0.5]}>
          <boxGeometry args={[0.5, 5.6, 6.0]} />
          <meshStandardMaterial color="#6e1b34" roughness={0.7} />
        </mesh>

        {/* Gold Fringe Crown */}
        <mesh position={[0, 6.2, -3.4]}>
          <boxGeometry args={[9.8, 0.4, 0.4]} />
          <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.2} />
        </mesh>

        {/* Professional Stage Monitor Speakers */}
        <group position={[-2.8, 0.95, 3.0]} rotation={[-0.4, 0.35, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.7, 0.45, 0.5]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0, 0.26]}>
            <planeGeometry args={[0.6, 0.38]} />
            <meshStandardMaterial color="#2d2d2d" metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
        <group position={[2.8, 0.95, 3.0]} rotation={[-0.4, -0.35, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.7, 0.45, 0.5]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0, 0.26]}>
            <planeGeometry args={[0.6, 0.38]} />
            <meshStandardMaterial color="#2d2d2d" metalness={0.5} roughness={0.4} />
          </mesh>
        </group>

        {/* Main Stage PA Towers */}
        <group position={[-4.3, 2.2, 3.2]}>
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[0.7, 1.8, 0.6]} />
            <meshStandardMaterial color="#151515" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0, 0.31]}>
            <planeGeometry args={[0.6, 1.65]} />
            <meshStandardMaterial color="#2b2b2b" metalness={0.4} roughness={0.5} />
          </mesh>
        </group>
        <group position={[4.3, 2.2, 3.2]}>
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[0.7, 1.8, 0.6]} />
            <meshStandardMaterial color="#151515" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0, 0.31]}>
            <planeGeometry args={[0.6, 1.65]} />
            <meshStandardMaterial color="#2b2b2b" metalness={0.4} roughness={0.5} />
          </mesh>
        </group>

        {/* Vintage Microphone on Stand at [0, 0.9, 1.2] */}
        <group position={[0, 0.9, 1.2]}>
          {/* Circular Cast Iron Base */}
          <mesh castShadow position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.2, 0.22, 0.04, 16]} />
            <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Chrome Pole */}
          <mesh castShadow position={[0, 0.65, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 1.26, 12]} />
            <meshStandardMaterial color="#cccccc" metalness={0.95} roughness={0.1} />
          </mesh>
          {/* Vintage Capsule Microphone */}
          <group position={[0, 1.32, 0]}>
            <mesh castShadow>
              <capsuleGeometry args={[0.045, 0.09, 8, 16]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.95} roughness={0.15} />
            </mesh>
            <mesh position={[0, 0, 0.01]}>
              <ringGeometry args={[0.035, 0.045, 16]} />
              <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} />
            </mesh>
          </group>
        </group>

        {/* Stage Lighting Fixtures */}
        <mesh position={[-3.8, 5.6, 1.5]} rotation={[0.4, 0.4, 0]}>
          <cylinderGeometry args={[0.2, 0.3, 0.4, 12]} />
          <meshStandardMaterial color="#222222" metalness={0.8} />
        </mesh>
        <mesh position={[3.8, 5.6, 1.5]} rotation={[0.4, -0.4, 0]}>
          <cylinderGeometry args={[0.2, 0.3, 0.4, 12]} />
          <meshStandardMaterial color="#222222" metalness={0.8} />
        </mesh>

        {/* Spotlight Beams hitting stage center */}
        {isRoomActive && (
          <>
            <spotLight
              position={[-3.8, 5.6, 1.5]}
              target-position={[0, 1.5, 1.2]}
              angle={0.48}
              penumbra={0.7}
              intensity={2.8}
              color={stageLightColor}
            />
            <spotLight
              position={[3.8, 5.6, 1.5]}
              target-position={[0, 1.5, 1.2]}
              angle={0.48}
              penumbra={0.7}
              intensity={2.8}
              color={stageLightColor}
            />
          </>
        )}

        {/* Stage Sign Text */}
        <Text
          position={[0, 5.8, -3.3]}
          fontSize={0.28}
          color="#ffd700"
          anchorX="center"
          anchorY="middle"
        >
          {singingConfig.songTitle || 'A Song For You'}
        </Text>

        {/* Musical Sparkles over stage */}
        <Sparkles
          count={35}
          scale={[6, 4, 4]}
          position={[0, 2.5, 0]}
          size={3}
          color="#ffdd77"
          speed={0.8}
        />
      </group>

      {/* Audience Tables with Candles */}
      <RomanticTable position={[-4.2, 0, -24]} />
      <RomanticTable position={[4.2, 0, -24]} />
      <RomanticTable position={[-3.5, 0, -30]} />
      <RomanticTable position={[3.5, 0, -30]} />
    </group>
  );
}
