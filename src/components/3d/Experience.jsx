import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import MuseumRoom from './MuseumRoom';
import SingingRoom from './SingingRoom';
import DancingRoom from './DancingRoom';
import BedroomRoom from './BedroomRoom';
import ConnectedDoor from './ConnectedDoor';
import MemoryStation from './MemoryStation';
import FemaleCharacter from './FemaleCharacter';
import MaleCharacter from './MaleCharacter';
import Necklace3D from './Necklace3D';
import FloatingPetals from './FloatingPetals';
import LightBeacons from './LightBeacons';

import { useGameStore } from '../../hooks/useGameStore';

export default function Experience({ keyboardControls, joystickVector }) {
  const { camera, gl } = useThree();
  const currentCamPos = useRef(new THREE.Vector3(0, 3, 14));
  const currentCamLook = useRef(new THREE.Vector3(0, 1.2, 8));

  // Interactive Camera Orbit Rotation (Mouse drag & Touch drag)
  const orbitRef = useRef({ yaw: 0, pitch: 0.22, distance: 4.8 });
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });

  const mode = useGameStore((s) => s.mode);
  const currentRoom = useGameStore((s) => s.currentRoom);
  const bedroomStep = useGameStore((s) => s.bedroomStep);
  const specialAction = useGameStore((s) => s.specialAction);
  const isSingingPlaying = useGameStore((s) => s.isSingingPlaying);
  const isDanceMusicPlaying = useGameStore((s) => s.isDanceMusicPlaying);
  const graphicsQuality = useGameStore((s) => s.graphicsQuality);
  const roomData = useGameStore((s) => s.roomData);

  const photos = roomData?.museumConfiguration?.photos || [];

  // Reset camera yaw & pitch when changing rooms
  const prevRoom = useRef(currentRoom);
  useEffect(() => {
    if (prevRoom.current !== currentRoom) {
      prevRoom.current = currentRoom;
      orbitRef.current.yaw = 0;
      orbitRef.current.pitch = 0.22;
      orbitRef.current.distance = 4.8;
    }
  }, [currentRoom]);

  // Pointer/Touch Drag for Camera Orbit in all rooms & Mouse Wheel Zoom
  useEffect(() => {
    const dom = gl.domElement;
    if (!dom) return;

    let activePointerId = null;

    const onPointerDown = (e) => {
      // Only drag if not touching a button or input or joystick zone
      if (
        e.target &&
        e.target.closest &&
        e.target.closest('button, input, textarea, form, .touch-control-zone, .parchment, .glass-panel-gold, .btn-gold, .btn-romantic')
      ) {
        return;
      }
      if (activePointerId !== null) return;
      activePointerId = e.pointerId;
      isDraggingRef.current = true;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e) => {
      if (!isDraggingRef.current || e.pointerId !== activePointerId) return;
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };

      orbitRef.current.yaw -= dx * 0.006;
      orbitRef.current.pitch = THREE.MathUtils.clamp(
        orbitRef.current.pitch + dy * 0.005,
        -0.05,
        0.75
      );
    };

    const onPointerUp = (e) => {
      if (e.pointerId === activePointerId) {
        activePointerId = null;
        isDraggingRef.current = false;
      }
    };

    const onWheel = (e) => {
      e.preventDefault();
      orbitRef.current.distance = THREE.MathUtils.clamp(
        orbitRef.current.distance + e.deltaY * 0.005,
        2.2,
        8.0
      );
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
    };
  }, [gl]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const playerPos = useGameStore.getState().playerPos;

    let targetCamPos = new THREE.Vector3();
    let targetLook = new THREE.Vector3();

    if (mode === 'landing') {
      targetCamPos.set(Math.sin(time * 0.2) * 2.5, 3.8, 13.5);
      targetLook.set(0, 1.5, 4.0);
    } else if (specialAction === 'dance' || isDanceMusicPlaying) {
      // Coordinated waltz circular camera following the dancing couple around the ballroom
      const orbitAngle = time * 0.35;
      const pivotX = Math.sin(orbitAngle) * 1.5;
      const pivotZ = -60 + Math.cos(orbitAngle) * 1.5;
      const camRadius = 3.8;
      const camAngle = time * 0.25;
      targetCamPos.set(pivotX + Math.sin(camAngle) * camRadius, 1.85, pivotZ + Math.cos(camAngle) * camRadius);
      targetLook.set(pivotX, 1.35, pivotZ);
    } else if (specialAction === 'hug' || specialAction === 'kiss') {
      // Close romantic two-shot framing embrace or kiss in bedroom
      targetCamPos.set(2.0, 1.45, -88.6);
      targetLook.set(2.0, 1.35, -91.5);
    } else if (currentRoom === 'singing' && (specialAction === 'singing' || isSingingPlaying)) {
      // Cinematic concert angle facing the stage with male singer
      targetCamPos.set(0, 2.0, -31.0);
      targetLook.set(0, 1.8, -37.4);
    } else if (currentRoom === 'bedroom') {
      if (bedroomStep === 'greeting') {
        targetCamPos.set(-2.2, 1.9, -84.5);
        targetLook.set(0, 1.4, -86.5);
      } else if (bedroomStep === 'necklace') {
        targetCamPos.set(1.4, 1.6, -86.6);
        targetLook.set(0, 1.3, -88);
      } else if (bedroomStep === 'walking_to_bed') {
        targetCamPos.set(playerPos[0] - 2.5, 2.2, playerPos[2] + 3.0);
        targetLook.set(playerPos[0] + 0.4, 1.3, playerPos[2] - 0.5);
      } else if (bedroomStep === 'sitting_on_bed' || bedroomStep === 'voice_message' || bedroomStep === 'final') {
        // Frontal framing of both characters sitting side-by-side on bed
        const orbitOffset = Math.sin(time * 0.15) * 0.3;
        targetCamPos.set(2.1 + orbitOffset, 1.5, -90.5);
        targetLook.set(2.1, 1.15, -93.8);
      } else {
        // Free 3rd-person follow with camera orbit & wall collision clamping
        const yaw = orbitRef.current.yaw;
        const pitch = orbitRef.current.pitch;
        const dist = orbitRef.current.distance;

        let idealX = playerPos[0] + Math.sin(yaw) * dist * Math.cos(pitch);
        let idealY = playerPos[1] + 1.8 + Math.sin(pitch) * dist;
        let idealZ = playerPos[2] + Math.cos(yaw) * dist * Math.cos(pitch);

        idealX = THREE.MathUtils.clamp(idealX, -5.8, 5.8);
        idealY = THREE.MathUtils.clamp(idealY, 1.2, 5.8);
        idealZ = THREE.MathUtils.clamp(idealZ, -102.5, -77.2);

        targetCamPos.set(idealX, idealY, idealZ);
        targetLook.set(playerPos[0], playerPos[1] + 1.3, playerPos[2]);
      }
    } else {
      // Free 3rd-person follow with camera orbit & wall collision clamping
      const yaw = orbitRef.current.yaw;
      const pitch = orbitRef.current.pitch;
      const dist = orbitRef.current.distance;

      let idealX = playerPos[0] + Math.sin(yaw) * dist * Math.cos(pitch);
      let idealY = playerPos[1] + 1.8 + Math.sin(pitch) * dist;
      let idealZ = playerPos[2] + Math.cos(yaw) * dist * Math.cos(pitch);

      let minZ = -13.8;
      let maxZ = 13.8;
      if (currentRoom === 'museum') {
        minZ = -13.8;
        maxZ = 13.8;
      } else if (currentRoom === 'singing') {
        minZ = -42.8;
        maxZ = -17.2;
      } else if (currentRoom === 'dancing') {
        minZ = -72.8;
        maxZ = -47.2;
      }

      idealX = THREE.MathUtils.clamp(idealX, -5.8, 5.8);
      idealY = THREE.MathUtils.clamp(idealY, 1.2, 5.8);
      idealZ = THREE.MathUtils.clamp(idealZ, minZ, maxZ);

      targetCamPos.set(idealX, idealY, idealZ);
      targetLook.set(playerPos[0], playerPos[1] + 1.3, playerPos[2]);
    }

    currentCamPos.current.lerp(targetCamPos, Math.min(1, 4.0 * delta));
    currentCamLook.current.lerp(targetLook, Math.min(1, 5.0 * delta));

    camera.position.copy(currentCamPos.current);
    camera.lookAt(currentCamLook.current);
  });

  return (
    <>
      {/* Romantic Canvas Background Color & Twilight Fog */}
      <color attach="background" args={['#181024']} />
      <fog attach="fog" args={['#181024', 28, 75]} />

      {/* Global Warm Ambient Lighting for All Rooms */}
      <ambientLight intensity={0.85} color="#ffe8d6" />

      {/* 1. MUSEUM ROOM ILLUMINATION (Z: +14 to -14) */}
      {(currentRoom === 'museum' || currentRoom === 'singing') && (
        <directionalLight
          position={[5, 12, 5]}
          intensity={1.2}
          color="#fff4e0"
          castShadow={graphicsQuality === 'high'}
          shadow-mapSize={graphicsQuality === 'high' ? [1024, 1024] : [512, 512]}
          shadow-camera-near={0.5}
          shadow-camera-far={32}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={16}
          shadow-camera-bottom={-16}
        />
      )}

      {/* 2. SINGING ROOM CONCERT ILLUMINATION (Z: -16 to -44) */}
      {(currentRoom === 'singing' || currentRoom === 'museum' || currentRoom === 'dancing') && (
        <>
          <directionalLight position={[0, 10, -28]} intensity={1.3} color="#ffeef5" />
          <spotLight
            position={[-3, 7.5, -31]}
            angle={0.55}
            penumbra={0.7}
            intensity={3.0}
            color="#ffd700"
          />
          <spotLight
            position={[3, 7.5, -31]}
            angle={0.55}
            penumbra={0.7}
            intensity={3.0}
            color="#ff758c"
          />
        </>
      )}

      {/* 3. DANCING ROOM BALLROOM ILLUMINATION (Z: -46 to -74) */}
      {(currentRoom === 'dancing' || currentRoom === 'singing' || currentRoom === 'bedroom') && (
        <>
          <directionalLight position={[4, 11, -60]} intensity={1.4} color="#ffe5cc" />
          <pointLight position={[0, 5.2, -60]} intensity={3.0} color="#ffd700" distance={20} decay={1} />
        </>
      )}

      {/* 4. BEDROOM ILLUMINATION (Z: -76 to -104) */}
      {(currentRoom === 'bedroom' || currentRoom === 'dancing') && (
        <>
          <directionalLight position={[-2.8, 6.5, -98]} intensity={1.5} color="#d4e8ff" />
          <pointLight position={[2.1, 3.2, -94.5]} intensity={2.2} color="#ffddaa" distance={16} decay={1} />
        </>
      )}

      {/* 1. MEMORY MUSEUM (Visible in Museum and Singing Room) */}
      {(currentRoom === 'museum' || currentRoom === 'singing') && (
        <>
          <MuseumRoom />
          {photos.map((photo, index) => (
            <MemoryStation key={photo.id || index} memory={photo} index={index} />
          ))}
          <LightBeacons />
        </>
      )}

      {/* Door 1: Museum <-> Singing Room at Z = -15 */}
      <ConnectedDoor
        position={[0, 0, -15]}
        sourceRoom="museum"
        targetRoom="singing"
        roomTitle="SINGING ROOM"
      />

      {/* 2. SINGING ROOM (Visible in Museum, Singing, and Dancing) */}
      {(currentRoom === 'museum' || currentRoom === 'singing' || currentRoom === 'dancing') && (
        <SingingRoom />
      )}

      {/* Door 2: Singing Room <-> Dancing Room at Z = -45 */}
      <ConnectedDoor
        position={[0, 0, -45]}
        sourceRoom="singing"
        targetRoom="dancing"
        roomTitle="DANCING ROOM"
      />

      {/* 3. DANCING ROOM (Visible in Singing, Dancing, and Bedroom) */}
      {(currentRoom === 'singing' || currentRoom === 'dancing' || currentRoom === 'bedroom') && (
        <DancingRoom />
      )}

      {/* Door 3: Dancing Room <-> Bedroom at Z = -75 */}
      <ConnectedDoor
        position={[0, 0, -75]}
        sourceRoom="dancing"
        targetRoom="bedroom"
        roomTitle="OUR BEDROOM"
      />

      {/* 4. BEDROOM (Visible in Dancing and Bedroom) */}
      {(currentRoom === 'dancing' || currentRoom === 'bedroom') && (
        <BedroomRoom />
      )}

      {/* Both Anime Characters */}
      <FemaleCharacter controls={keyboardControls} joystickVector={joystickVector} />
      <MaleCharacter controls={keyboardControls} joystickVector={joystickVector} />

      {/* Floating Sparkles & Rose Petals */}
      <FloatingPetals count={graphicsQuality === 'high' ? 80 : (graphicsQuality === 'medium' ? 50 : 30)} />
    </>
  );
}
