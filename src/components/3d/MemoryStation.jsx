import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles, Text } from '@react-three/drei';
import { gameStore, useGameStore } from '../../hooks/useGameStore';

export default function MemoryStation({ memory, index }) {
  const stationRef = useRef();
  const heartRef = useRef();
  const envelopeRef = useRef();
  const spotLightRef = useRef();
  const [isNearby, setIsNearby] = useState(false);

  const mode = useGameStore((s) => s.mode);
  const currentRoom = useGameStore((s) => s.currentRoom);
  const memoriesRead = useGameStore((s) => s.memoriesRead);
  const isRead = memoriesRead.includes(memory.id);

  // Compute position based on wall and offset
  const transform = useMemo(() => {
    const wall = memory.wall || (index % 2 === 0 ? 'west' : 'east');
    const offset = memory.positionOffset || 0;
    const scale = memory.scale || 1.0;

    let pos = [0, 0, 0];
    let rot = [0, 0, 0];

    // Standard positions along gallery
    const zDefault = 8 - index * 3.2;

    if (wall === 'west') {
      pos = [-5.2, 0, zDefault + offset];
      rot = [0, Math.PI / 4, 0];
    } else if (wall === 'east') {
      pos = [5.2, 0, zDefault + offset];
      rot = [0, -Math.PI / 4, 0];
    } else if (wall === 'north') {
      pos = [-2.5 + (index % 2) * 5.0, 0, -11.5 + offset];
      rot = [0, 0, 0];
    } else {
      pos = [-4.6, 0, zDefault];
      rot = [0, Math.PI / 4, 0];
    }

    return { pos, rot, scale };
  }, [memory, index]);

  // Safe, leak-free CanvasTexture management
  const [photoTexture, setPhotoTexture] = useState(null);
  const textureRef = useRef(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');

    const drawCard = (img = null) => {
      if (img) {
        ctx.drawImage(img, 0, 0, 512, 640);
        const grad = ctx.createRadialGradient(256, 320, 200, 256, 320, 360);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.4)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 640);
      } else {
        const bgGrad = ctx.createLinearGradient(0, 0, 512, 640);
        bgGrad.addColorStop(0, '#ff758c');
        bgGrad.addColorStop(1, '#2c1824');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 512, 640);

        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 10;
        ctx.strokeRect(20, 20, 472, 600);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 70px serif';
        ctx.textAlign = 'center';
        ctx.fillText('❤️', 256, 260);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px "Playfair Display", serif';
        ctx.fillText(memory.title || `Memory 0${index + 1}`, 256, 370);

        ctx.fillStyle = '#fce2db';
        ctx.font = 'italic 20px "Plus Jakarta Sans", sans-serif';
        ctx.fillText((memory.date || 'Our Special Day') + ' • ' + (memory.location || 'Sanctuary'), 256, 420);
      }

      if (textureRef.current) {
        textureRef.current.needsUpdate = true;
      }
    };

    if (!textureRef.current) {
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      textureRef.current = tex;
      setPhotoTexture(tex);
    }
    drawCard();

    let isMounted = true;
    if (memory.image) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = memory.image;
      img.onload = () => {
        if (isMounted) drawCard(img);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [memory.id, memory.image, memory.title, memory.date, memory.location, index]);

  // Safely dispose texture ONLY when component genuinely unmounts
  useEffect(() => {
    return () => {
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
    };
  }, []);

  useFrame((state) => {
    if (currentRoom !== 'museum') return;

    const playerPos = gameStore.get().playerPos;
    const dist = Math.hypot(playerPos[0] - transform.pos[0], playerPos[2] - transform.pos[2]);
    const close = dist < 2.5;

    // Trigger proximity prompt for both visitor, preview mode, and creator
    if (close !== isNearby) {
      setIsNearby(close);
      if (close) {
        gameStore.set({
          nearbyObject: { type: 'memory', id: memory.id, memory },
          interactionPrompt: 'read_memory',
        });
      } else {
        const curNear = gameStore.get().nearbyObject;
        if (curNear && curNear.type === 'memory' && curNear.id === memory.id) {
          gameStore.set({ nearbyObject: null, interactionPrompt: null });
        }
      }
    }

    const time = state.clock.getElapsedTime();

    if (heartRef.current) {
      heartRef.current.position.y = 3.3 + Math.sin(time * 3 + index) * 0.1;
      heartRef.current.rotation.y = time * 1.5;
      heartRef.current.scale.setScalar(close ? 1.0 + Math.sin(time * 6) * 0.12 : 0.001);
    }

    if (envelopeRef.current) {
      envelopeRef.current.position.y = 1.35 + Math.sin(time * 2.5 + index) * 0.05;
      envelopeRef.current.rotation.y = time * 0.8;
    }

    if (spotLightRef.current) {
      spotLightRef.current.intensity = THREE.MathUtils.lerp(
        spotLightRef.current.intensity,
        close ? 2.8 : 1.2,
        0.1
      );
    }
  });

  const handleViewPhoto = (e) => {
    e.stopPropagation();
    gameStore.set({
      isPhotoModalOpen: true,
      selectedPhoto: memory,
    });
  };

  const handleViewLetter = (e) => {
    e.stopPropagation();
    gameStore.openMemoryLetter(memory);
  };

  return (
    <group ref={stationRef} position={transform.pos} rotation={transform.rot} scale={transform.scale}>
      {/* Marble Pedestal Base */}
      <mesh castShadow position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.55, 0.65, 0.9, 16]} />
        <meshStandardMaterial color="#f0eae4" roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.58, 0.58, 0.05, 16]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Stand Column */}
      <mesh castShadow position={[0, 1.45, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 1.1, 12]} />
        <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Ornate Golden Frame (Direct click to View Photo) */}
      <group position={[0, 2.3, 0]} onClick={handleViewPhoto} cursor="pointer">
        <mesh castShadow position={[0, 0, -0.04]}>
          <boxGeometry args={[1.6, 2.0, 0.08]} />
          <meshStandardMaterial color="#2d1d12" roughness={0.5} />
        </mesh>
        <mesh castShadow position={[0, 0, 0.01]}>
          <boxGeometry args={[1.56, 1.96, 0.06]} />
          <meshStandardMaterial
            color={isNearby ? '#ffe082' : '#d4af37'}
            metalness={0.88}
            roughness={0.25}
          />
        </mesh>
        <mesh position={[0, 0, 0.045]}>
          <planeGeometry args={[1.35, 1.75]} />
          <meshStandardMaterial map={photoTexture} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[1.35, 1.75]} />
          <meshStandardMaterial color="#ffffff" roughness={0.05} metalness={0.1} transparent opacity={0.15} />
        </mesh>
      </group>

      {/* Dedicated Letter Stand (Direct click to View Letter) */}
      <group position={[0.85, 0, 0.3]} onClick={handleViewLetter} cursor="pointer">
        <mesh castShadow position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.2, 0.25, 0.9, 12]} />
          <meshStandardMaterial color="#f0eae4" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.92, 0]}>
          <boxGeometry args={[0.42, 0.04, 0.32]} />
          <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.2} />
        </mesh>

        {/* 3D Wax-Sealed Envelope */}
        <group ref={envelopeRef} position={[0, 1.35, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.34, 0.22, 0.03]} />
            <meshStandardMaterial color="#fdfbf7" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.02, 0.018]}>
            <coneGeometry args={[0.15, 0.1, 3]} rotation={[0, 0, Math.PI]} />
            <meshStandardMaterial color="#f7f3ea" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.025]}>
            <cylinderGeometry args={[0.032, 0.032, 0.012, 16]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#b7094c" roughness={0.3} />
          </mesh>
          {!isRead && (
            <Sparkles count={10} scale={[0.5, 0.5, 0.5]} size={2} color="#ffd700" speed={1.5} />
          )}
        </group>
      </group>

      {/* Floating 3D Heart */}
      <group ref={heartRef} position={[0, 3.4, 0]}>
        <mesh>
          <octahedronGeometry args={[0.16, 1]} />
          <meshStandardMaterial color="#ff3366" emissive="#ff6699" emissiveIntensity={0.8} />
        </mesh>
        <Sparkles count={15} scale={[0.6, 0.6, 0.6]} size={2} color="#ff85a1" />
      </group>

      {/* Plaque Number */}
      <Text
        position={[0, 0.98, 0.52]}
        fontSize={0.11}
        color="#1a0f05"
        anchorX="center"
        anchorY="middle"
      >
        {`MEMORY 0${index + 1}`}
      </Text>
    </group>
  );
}
