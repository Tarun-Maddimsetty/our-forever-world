import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles, Text } from '@react-three/drei';
import { gameStore, useGameStore } from '../../hooks/useGameStore';

// Fairy lights string draped across a span
function FairyLights({ start, end, count = 12 }) {
  const lights = useMemo(() => {
    const items = [];
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const sag = Math.sin(t * Math.PI) * 0.45;
      const x = THREE.MathUtils.lerp(start[0], end[0], t);
      const y = THREE.MathUtils.lerp(start[1], end[1], t) - sag;
      const z = THREE.MathUtils.lerp(start[2], end[2], t);
      items.push([x, y, z]);
    }
    return items;
  }, [start, end, count]);

  return (
    <group>
      {lights.map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial
              color="#ffe5b4"
              emissive="#ffcc77"
              emissiveIntensity={1.8}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Grand Romantic Bed
function RomanticBed({ position = [2.1, 0, -94.5] }) {
  return (
    <group position={position}>
      {/* Bed Wooden Base / Platform */}
      <mesh castShadow position={[0, 0.22, 0]}>
        <boxGeometry args={[3.2, 0.44, 3.4]} />
        <meshStandardMaterial color="#3a1e12" roughness={0.6} />
      </mesh>
      {/* Golden trim base */}
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[3.25, 0.05, 3.45]} />
        <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Plush Quilted Mattress */}
      <mesh castShadow position={[0, 0.65, 0]}>
        <boxGeometry args={[3.0, 0.45, 3.2]} />
        <meshStandardMaterial color="#fcfbf9" roughness={0.8} />
      </mesh>

      {/* Satin Rose Bed Runner / Duvet Cover */}
      <mesh castShadow position={[0, 0.72, 0.2]}>
        <boxGeometry args={[3.05, 0.35, 2.4]} />
        <meshStandardMaterial color="#ff758c" roughness={0.4} metalness={0.1} />
      </mesh>
      {/* Rose Duvet Fold */}
      <mesh position={[0, 0.9, -0.9]}>
        <cylinderGeometry args={[0.15, 0.15, 2.9, 16]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ff5376" roughness={0.4} />
      </mesh>

      {/* Plush Sleeping Pillows */}
      {[-0.85, 0.85].map((x, i) => (
        <group key={i} position={[x, 0.95, -1.1]} rotation={[0.3, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.95, 0.25, 0.6]} />
            <meshStandardMaterial color="#ffffff" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.08, 0.1]} rotation={[-0.1, 0, 0]}>
            <boxGeometry args={[0.7, 0.2, 0.5]} />
            <meshStandardMaterial color="#ffe3eb" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Ornate Tufted Headboard */}
      <group position={[0, 1.8, -1.65]}>
        <mesh castShadow>
          <boxGeometry args={[3.3, 2.4, 0.18]} />
          <meshStandardMaterial color="#4a2518" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.1]}>
          <boxGeometry args={[3.0, 2.1, 0.08]} />
          <meshStandardMaterial color="#7e223c" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.25, 0.05]}>
          <cylinderGeometry args={[1.5, 1.6, 0.15, 16, 1, false, 0, Math.PI]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#ffd700" metalness={0.88} roughness={0.2} />
        </mesh>
      </group>

      {/* Four Canopy Bed Posts with Gold Filigree */}
      {[
        [-1.55, -1.6],
        [1.55, -1.6],
        [-1.55, 1.6],
        [1.55, 1.6],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 2.3, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.06, 0.08, 4.6, 12]} />
            <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0, 2.35, 0]}>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* Romantic Sheer Drapes Canopy Top */}
      <mesh position={[0, 4.6, 0]}>
        <boxGeometry args={[3.2, 0.08, 3.3]} />
        <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[0, 4.55, 0]}>
        <planeGeometry args={[3.0, 3.1]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* Rose Petals Scattered on Bed */}
      {[-0.6, 0, 0.5].map((rx, idx) =>
        [-0.4, 0.3, 0.8].map((rz, jdx) => (
          <mesh key={`${idx}-${jdx}`} position={[rx, 0.9, rz]} rotation={[0, (idx + jdx) * 1.5, 0]}>
            <sphereGeometry args={[0.06, 6, 6]} scale={[1, 0.1, 1.4]} />
            <meshStandardMaterial color="#ff2d55" roughness={0.4} />
          </mesh>
        ))
      )}
    </group>
  );
}

// Antique Writing Desk with Creator's Personal Letter
function BedroomDesk({ position = [-4.5, 0, -90], rotation = [0, Math.PI / 2, 0] }) {
  const heartRef = useRef();
  const currentRoom = useGameStore((s) => s.currentRoom);
  const [isNearby, setIsNearby] = useState(false);

  useFrame((state) => {
    if (currentRoom !== 'bedroom') return;
    const playerPos = gameStore.get().playerPos;
    const dist = Math.hypot(playerPos[0] - position[0], playerPos[2] - position[2]);
    const close = dist < 2.5;

    if (close !== isNearby) {
      setIsNearby(close);
      if (close) {
        gameStore.set({
          nearbyObject: { type: 'bedroom_letter', title: 'Personal Birthday Letter' },
          interactionPrompt: 'Read Birthday Letter on Desk',
        });
      } else {
        const cur = gameStore.get().nearbyObject;
        if (cur && cur.type === 'bedroom_letter') {
          gameStore.set({ nearbyObject: null, interactionPrompt: null });
        }
      }
    }

    if (heartRef.current) {
      const time = state.clock.getElapsedTime();
      heartRef.current.position.y = 1.35 + Math.sin(time * 3) * 0.05;
      heartRef.current.rotation.y = time * 1.5;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Wooden Desk Top */}
      <mesh castShadow position={[0, 0.95, 0]}>
        <boxGeometry args={[2.2, 0.08, 1.2]} />
        <meshStandardMaterial color="#3a1e12" roughness={0.4} />
      </mesh>
      {/* Golden Desk Edge Trim */}
      <mesh position={[0, 0.95, 0.6]}>
        <boxGeometry args={[2.22, 0.04, 0.04]} />
        <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* 4 Turned Wooden Legs */}
      {[
        [-0.95, -0.45],
        [0.95, -0.45],
        [-0.95, 0.45],
        [0.95, 0.45],
      ].map(([lx, lz], i) => (
        <group key={i} position={[lx, 0.46, lz]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.045, 0.035, 0.92, 12]} />
            <meshStandardMaterial color="#2d1508" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[0.1, 0.08, 0.1]} />
            <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.25} />
          </mesh>
        </group>
      ))}

      {/* Desk Drawers with Brass Pulls */}
      <mesh castShadow position={[0, 0.82, -0.1]}>
        <boxGeometry args={[2.0, 0.18, 0.9]} />
        <meshStandardMaterial color="#2d1508" roughness={0.5} />
      </mesh>
      {[-0.55, 0.55].map((dx, i) => (
        <mesh key={i} position={[dx, 0.82, 0.36]}>
          <cylinderGeometry args={[0.02, 0.02, 0.08, 8]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}

      {/* Antique Banker's Lamp */}
      <group position={[-0.7, 0.99, -0.3]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.08, 0.1, 0.04, 12]} />
          <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.3, 8]} />
          <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Emerald Green Glass Shade */}
        <mesh position={[0, 0.3, 0.08]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.22, 12, 1, false, 0, Math.PI]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#1a4d2e" roughness={0.2} metalness={0.1} transparent opacity={0.9} />
        </mesh>
        <pointLight color="#ffe8b3" intensity={1.2} distance={4} decay={2} position={[0, 0.28, 0.08]} />
      </group>

      {/* Quill in Inkwell */}
      <group position={[0.65, 0.99, -0.3]}>
        <mesh>
          <cylinderGeometry args={[0.035, 0.045, 0.06, 8]} />
          <meshStandardMaterial color="#111111" roughness={0.3} />
        </mesh>
        <mesh position={[0.04, 0.14, 0]} rotation={[0, 0, -0.35]}>
          <coneGeometry args={[0.015, 0.28, 6]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.6} />
        </mesh>
      </group>

      {/* ============ PHYSICAL 3D LETTER & ENVELOPE ON DESK ============ */}
      <group position={[0, 1.0, 0.05]} rotation={[-0.05, 0.15, 0]}>
        {/* Parchment Envelope Base */}
        <mesh castShadow position={[0, 0.015, 0]}>
          <boxGeometry args={[0.42, 0.02, 0.28]} />
          <meshStandardMaterial color="#fdfbf7" roughness={0.4} />
        </mesh>
        {/* Golden Border Edge */}
        <mesh position={[0, 0.026, 0]}>
          <boxGeometry args={[0.4, 0.005, 0.26]} />
          <meshStandardMaterial color="#f7f3ea" roughness={0.3} />
        </mesh>
        {/* Red Wax Seal */}
        <mesh position={[0, 0.032, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.036, 0.036, 0.012, 16]} />
          <meshStandardMaterial color="#b7094c" roughness={0.3} />
        </mesh>

        {/* Floating Heart indicator above the letter */}
        <group ref={heartRef} position={[0, 0.25, 0]}>
          <mesh>
            <octahedronGeometry args={[0.08, 0]} />
            <meshStandardMaterial color="#ff3366" emissive="#ff6699" emissiveIntensity={0.8} />
          </mesh>
          <Sparkles count={12} scale={[0.5, 0.5, 0.5]} size={2} color="#ffd700" speed={1.2} />
        </group>
      </group>

      {/* Classical Wooden Desk Chair */}
      <group position={[0, 0, 0.85]} rotation={[0, Math.PI, 0]}>
        {/* Seat */}
        <mesh castShadow position={[0, 0.48, 0]}>
          <boxGeometry args={[0.55, 0.06, 0.5]} />
          <meshStandardMaterial color="#3a1e12" roughness={0.5} />
        </mesh>
        {/* Velvet Cushion */}
        <mesh position={[0, 0.52, 0]}>
          <boxGeometry args={[0.48, 0.04, 0.44]} />
          <meshStandardMaterial color="#7e223c" roughness={0.8} />
        </mesh>
        {/* Chair Legs */}
        {[-0.22, 0.22].map((cx, i) =>
          [-0.2, 0.2].map((cz, j) => (
            <mesh key={`${i}-${j}`} position={[cx, 0.24, cz]}>
              <cylinderGeometry args={[0.025, 0.02, 0.48, 8]} />
              <meshStandardMaterial color="#2d1508" roughness={0.5} />
            </mesh>
          ))
        )}
        {/* Backrest */}
        <mesh position={[0, 0.85, -0.22]}>
          <boxGeometry args={[0.5, 0.7, 0.05]} />
          <meshStandardMaterial color="#3a1e12" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

// Bedside Nightstand
function Nightstand({ position, enableLight = true }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.45, 0]}>
        <boxGeometry args={[0.7, 0.9, 0.7]} />
        <meshStandardMaterial color="#3a1e12" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.6, 0.36]}>
        <cylinderGeometry args={[0.015, 0.015, 0.12, 8]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
      </mesh>
      <group position={[0, 0.9, 0]}>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.03, 0.08, 0.3, 12]} />
          <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.38, 0]}>
          <cylinderGeometry args={[0.16, 0.24, 0.32, 16]} />
          <meshStandardMaterial
            color="#fffbee"
            emissive="#ffddaa"
            emissiveIntensity={0.6}
            roughness={0.3}
            transparent
            opacity={0.88}
          />
        </mesh>
        {enableLight && (
          <pointLight color="#ffe3b3" intensity={0.9} distance={6} decay={2} position={[0, 0.4, 0]} />
        )}
      </group>
    </group>
  );
}

export default function BedroomRoom() {
  const currentRoom = useGameStore((s) => s.currentRoom);
  const roomData = useGameStore((s) => s.roomData);
  const bedroomConfig = roomData?.bedroomConfiguration || {};

  const isRoomActive = currentRoom === 'bedroom' || currentRoom === 'dancing';

  return (
    <group>
      {/* Bedroom Floor (Z: -76 to -104, Width: 14) */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -90]}>
        <planeGeometry args={[14, 28]} />
        <meshStandardMaterial color="#3a1e28" roughness={0.7} />
      </mesh>

      {/* Plush Bedroom Rug under Grand Bed */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[2.1, 0.015, -94.5]}>
        <planeGeometry args={[4.8, 5.2]} />
        <meshStandardMaterial color="#fff4f7" roughness={0.9} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 6.4, -90]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 28]} />
        <meshStandardMaterial color="#1a1020" roughness={0.9} />
      </mesh>

      {/* Back Wall with Grand Moonlit Window (z = -104) */}
      <group position={[0, 3.2, -104]}>
        <mesh receiveShadow>
          <planeGeometry args={[14, 6.4]} />
          <meshStandardMaterial color="#d4c2cb" roughness={0.6} />
        </mesh>

        {/* Grand Arched French Window revealing starry night */}
        <group position={[-2.8, 0.4, 0.05]}>
          <mesh position={[0, 0, -0.05]}>
            <planeGeometry args={[3.4, 4.4]} />
            <meshBasicMaterial color="#080718" />
          </mesh>
          <mesh position={[0.7, 1.2, -0.02]}>
            <circleGeometry args={[0.65, 24]} />
            <meshBasicMaterial color="#fffdec" />
          </mesh>
          <mesh position={[0, 0, 0.05]}>
            <boxGeometry args={[3.4, 4.4, 0.1]} />
            <meshStandardMaterial color="#3a1e12" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <planeGeometry args={[3.2, 4.2]} />
            <meshStandardMaterial color="#bfe3ff" transparent opacity={0.25} roughness={0.1} />
          </mesh>
        </group>

        {/* Velvet Window Curtains */}
        <mesh position={[-4.7, 0.4, 0.2]} rotation={[0, 0.3, 0]}>
          <boxGeometry args={[0.8, 4.6, 0.25]} />
          <meshStandardMaterial color="#7e223c" roughness={0.7} />
        </mesh>
        <mesh position={[-0.9, 0.4, 0.2]} rotation={[0, -0.3, 0]}>
          <boxGeometry args={[0.8, 4.6, 0.25]} />
          <meshStandardMaterial color="#7e223c" roughness={0.7} />
        </mesh>
      </group>

      {/* Left Wall (x = -7) */}
      <group position={[-7, 3.2, -90]}>
        <mesh receiveShadow rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[28, 6.4]} />
          <meshStandardMaterial color="#d4c2cb" roughness={0.6} />
        </mesh>
        {/* Warm Bedroom Sconces with soft emissive sheen */}
        {[-8, 0, 8].map((wz) => (
          <group key={wz} position={[0.1, 0.4, wz]}>
            <mesh>
              <cylinderGeometry args={[0.04, 0.08, 0.25, 8]} />
              <meshStandardMaterial
                color="#d4af37"
                emissive="#ffe0b3"
                emissiveIntensity={0.8}
                metalness={0.85}
                roughness={0.2}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Right Wall (x = +7) */}
      <group position={[7, 3.2, -90]}>
        <mesh receiveShadow rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[28, 6.4]} />
          <meshStandardMaterial color="#d4c2cb" roughness={0.6} />
        </mesh>
        {/* Warm Bedroom Sconces with soft emissive sheen */}
        {[-8, 0, 8].map((wz) => (
          <group key={wz} position={[-0.1, 0.4, wz]}>
            <mesh>
              <cylinderGeometry args={[0.04, 0.08, 0.25, 8]} />
              <meshStandardMaterial
                color="#d4af37"
                emissive="#ffe0b3"
                emissiveIntensity={0.8}
                metalness={0.85}
                roughness={0.2}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* South Wall with Open Doorway to Dancing Room (z = -76) */}
      <group position={[0, 3.2, -76]}>
        {/* Left Wall Panel */}
        <mesh receiveShadow position={[-4.7, 0, 0]}>
          <planeGeometry args={[4.6, 6.4]} />
          <meshStandardMaterial color="#d4c2cb" roughness={0.6} />
        </mesh>
        {/* Right Wall Panel */}
        <mesh receiveShadow position={[4.7, 0, 0]}>
          <planeGeometry args={[4.6, 6.4]} />
          <meshStandardMaterial color="#d4c2cb" roughness={0.6} />
        </mesh>
        {/* Lintel above Door Arch */}
        <mesh receiveShadow position={[0, 2.3, 0]}>
          <planeGeometry args={[4.8, 1.8]} />
          <meshStandardMaterial color="#d4c2cb" roughness={0.6} />
        </mesh>
      </group>

      {/* The Grand Bed at [2.1, 0, -94.5] */}
      <RomanticBed position={[2.1, 0, -94.5]} />

      {/* Decorative Antique Writing Desk with Birthday Letter */}
      <BedroomDesk position={[-4.5, 0, -90]} rotation={[0, Math.PI / 2, 0]} />

      {/* Nightstands flanking bed */}
      <Nightstand position={[0.1, 0, -96.0]} enableLight={isRoomActive} />
      <Nightstand position={[4.1, 0, -96.0]} enableLight={false} />

      {/* Cozy Fairy Lights String across bedroom */}
      <FairyLights start={[-6.5, 4.5, -78]} end={[-1, 3.8, -102]} count={16} />
      <FairyLights start={[6.5, 4.5, -78]} end={[4.5, 4.2, -102]} count={14} />

      {/* Floating Sparkles in Bedroom */}
      <Sparkles
        count={70}
        scale={[12, 5, 24]}
        position={[0, 2.5, -90]}
        size={2.5}
        color="#ffccd5"
        speed={0.6}
      />
    </group>
  );
}
