import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gameStore, useGameStore } from '../../hooks/useGameStore';
import { BIRTHDAY_CONTENT } from '../../data/birthdayContent';

function ProceduralAnimeFemale({
  isMoving,
  isSitting,
  isHoldingHand,
  hasNecklace,
  specialAction,
}) {
  const groupRef = useRef();
  const headRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const skirtRef = useRef();
  const hairSwayRef = useRef();
  const eyesRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // 1. SPECIAL ACTION: COUPLE DANCE
    if (specialAction === 'dance') {
      if (leftArmRef.current) {
        // Left hand rests on male's shoulder
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -1.2, 0.1);
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0.5, 0.1);
      }
      if (rightArmRef.current) {
        // Right hand clasped in male's left hand
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -0.9, 0.1);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.6, 0.1);
      }
      if (headRef.current) {
        // Soft tilt towards partner
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, 0.25, 0.1);
        headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0.1, 0.1);
      }
      if (skirtRef.current) {
        skirtRef.current.rotation.z = Math.sin(time * 2.5) * 0.08;
      }
      return;
    }

    // 2. SPECIAL ACTION: 4-SECOND ROMANTIC HUG
    if (specialAction === 'hug') {
      if (leftArmRef.current && rightArmRef.current) {
        // Arms wrapped warmly around male's upper torso / shoulders
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -1.35, 0.15);
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0.7, 0.15);

        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -1.35, 0.15);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.7, 0.15);
      }
      if (headRef.current) {
        // Head rests tenderly on male's shoulder
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0.15, 0.1);
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, 0.35, 0.1);
        headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0.18, 0.1);
      }
      return;
    }

    // 3. SPECIAL ACTION: 4-SECOND ROMANTIC KISS
    if (specialAction === 'kiss') {
      if (leftArmRef.current && rightArmRef.current) {
        // Hands gently on male's chest
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -0.9, 0.15);
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0.3, 0.15);

        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -0.9, 0.15);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.3, 0.15);
      }
      if (headRef.current) {
        // Leaning softly up for gentle kiss
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -0.22, 0.12);
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, 0.12, 0.12);
      }
      if (eyesRef.current) {
        // Closed eyes during kiss
        eyesRef.current.scale.y = 0.05;
      }
      return;
    }

    // 4. SITTING POSE ON BED
    if (isSitting) {
      if (groupRef.current) {
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0.45, 0.1);
      }
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, -Math.PI / 2.2, 0.1);
        rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, -Math.PI / 2.2, 0.1);
      }
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0.3, 0.1);
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -0.2, 0.1);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, 0.3, 0.1);
      }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(time * 0.5) * 0.1 - 0.2;
        headRef.current.rotation.z = -0.08;
      }
      return;
    }

    // 5. MOVING WALK ANIMATION
    if (isMoving) {
      const walkFreq = 9.0;
      const walkCycle = Math.sin(time * walkFreq);
      const walkCos = Math.cos(time * walkFreq);

      if (leftLegRef.current) leftLegRef.current.rotation.x = walkCycle * 0.55;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -walkCycle * 0.55;

      if (leftArmRef.current) leftArmRef.current.rotation.x = -walkCycle * 0.45;
      if (rightArmRef.current) {
        if (isHoldingHand) {
          rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -0.4, 0.1);
          rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, 0.35, 0.1);
        } else {
          rightArmRef.current.rotation.x = walkCycle * 0.45;
        }
      }

      if (groupRef.current) groupRef.current.position.y = Math.abs(walkCos) * 0.06;
      if (skirtRef.current) skirtRef.current.rotation.x = walkCycle * 0.08;
      if (hairSwayRef.current) hairSwayRef.current.rotation.x = -0.2 + Math.abs(walkCycle) * 0.15;
    } else {
      // 6. IDLE BREATHING
      const idleSpeed = 1.8;
      const breath = Math.sin(time * idleSpeed);

      if (groupRef.current) groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, 0.1);
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, 0.1);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, 0.1);

      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0.1 + breath * 0.03, 0.1);
        leftArmRef.current.rotation.z = 0.1;
      }
      if (rightArmRef.current) {
        if (isHoldingHand) {
          rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -0.3, 0.1);
          rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, 0.3, 0.1);
        } else {
          rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0.1 - breath * 0.03, 0.1);
          rightArmRef.current.rotation.z = -0.1;
        }
      }

      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(time * 0.6) * 0.06;
        headRef.current.rotation.x = Math.sin(time * 1.2) * 0.03;
      }
      if (hairSwayRef.current) {
        hairSwayRef.current.rotation.z = Math.sin(time * 2.0) * 0.05;
      }
    }

    // Blinking
    if (eyesRef.current && specialAction !== 'kiss') {
      const blinkCycle = Math.sin(time * 0.8);
      eyesRef.current.scale.y = blinkCycle > 0.96 ? 0.1 : 1.0;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Torso & Dress */}
      <group position={[0, 0.85, 0]}>
        {/* Upper Dress (Blush Pink / Rose Gold Silk) */}
        <mesh castShadow position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.16, 0.14, 0.34, 16]} />
          <meshStandardMaterial color="#ff9ebb" roughness={0.4} metalness={0.15} />
        </mesh>

        {/* Golden Waist Sash */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.16, 0.06, 16]} />
          <meshStandardMaterial color="#e6b980" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Flowing Birthday Skirt */}
        <group ref={skirtRef} position={[0, -0.02, 0]}>
          <mesh castShadow position={[0, -0.25, 0]}>
            <coneGeometry args={[0.32, 0.52, 16, 1, true]} />
            <meshStandardMaterial color="#ff758c" roughness={0.5} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -0.5, 0]}>
            <torusGeometry args={[0.31, 0.02, 8, 24]} />
            <meshStandardMaterial color="#fff0f5" roughness={0.3} />
          </mesh>
        </group>

        {/* Neck */}
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.06, 0.07, 0.12, 12]} />
          <meshStandardMaterial color="#fce2db" roughness={0.6} />
        </mesh>

        {/* Sparkling Necklace if unlocked */}
        {hasNecklace && (
          <group position={[0, 0.32, 0.05]}>
            <mesh>
              <torusGeometry args={[0.07, 0.008, 8, 24]} />
              <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0, -0.06, 0.03]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.035, 0.035, 0.02]} />
              <meshStandardMaterial color="#ff3366" emissive="#ff6699" emissiveIntensity={0.6} metalness={0.8} roughness={0.1} />
            </mesh>
          </group>
        )}

        {/* Anime Head & Face */}
        <group ref={headRef} position={[0, 0.48, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.18, 20, 20]} />
            <meshStandardMaterial color="#fce2db" roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.08, 0.05]}>
            <coneGeometry args={[0.13, 0.14, 16]} />
            <meshStandardMaterial color="#fce2db" roughness={0.6} />
          </mesh>

          {/* Big Expressive Anime Eyes */}
          <group ref={eyesRef} position={[0, 0.01, 0.155]}>
            <group position={[-0.065, 0, 0]}>
              <mesh><circleGeometry args={[0.038, 16]} /><meshBasicMaterial color="#ffffff" /></mesh>
              <mesh position={[0, -0.005, 0.002]}><circleGeometry args={[0.028, 16]} /><meshBasicMaterial color="#6b2d5c" /></mesh>
              <mesh position={[-0.01, 0.01, 0.004]}><circleGeometry args={[0.009, 8]} /><meshBasicMaterial color="#ffffff" /></mesh>
            </group>
            <group position={[0.065, 0, 0]}>
              <mesh><circleGeometry args={[0.038, 16]} /><meshBasicMaterial color="#ffffff" /></mesh>
              <mesh position={[0, -0.005, 0.002]}><circleGeometry args={[0.028, 16]} /><meshBasicMaterial color="#6b2d5c" /></mesh>
              <mesh position={[-0.01, 0.01, 0.004]}><circleGeometry args={[0.009, 8]} /><meshBasicMaterial color="#ffffff" /></mesh>
            </group>
          </group>

          {/* Cute Anime Blush */}
          <mesh position={[-0.08, -0.04, 0.14]}>
            <circleGeometry args={[0.025, 12]} />
            <meshBasicMaterial color="#ff85a1" transparent opacity={0.5} />
          </mesh>
          <mesh position={[0.08, -0.04, 0.14]}>
            <circleGeometry args={[0.025, 12]} />
            <meshBasicMaterial color="#ff85a1" transparent opacity={0.5} />
          </mesh>

          {/* Sweet Smile */}
          <mesh position={[0, -0.07, 0.16]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.02, 0.004, 6, 12, Math.PI * 0.8]} />
            <meshBasicMaterial color="#d45b78" />
          </mesh>

          {/* Layered Flowing Hair */}
          <group position={[0, 0.04, -0.02]}>
            <mesh position={[0, 0.02, 0]}>
              <sphereGeometry args={[0.19, 16, 16]} />
              <meshStandardMaterial color="#4a2518" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.12, 0.14]} rotation={[0.4, 0, 0]}>
              <coneGeometry args={[0.16, 0.12, 12]} />
              <meshStandardMaterial color="#542a1b" roughness={0.7} />
            </mesh>
            <mesh position={[-0.14, -0.08, 0.08]} rotation={[0.1, 0, -0.15]}>
              <capsuleGeometry args={[0.03, 0.22, 6, 8]} />
              <meshStandardMaterial color="#4a2518" roughness={0.7} />
            </mesh>
            <mesh position={[0.14, -0.08, 0.08]} rotation={[0.1, 0, 0.15]}>
              <capsuleGeometry args={[0.03, 0.22, 6, 8]} />
              <meshStandardMaterial color="#4a2518" roughness={0.7} />
            </mesh>
            <group ref={hairSwayRef} position={[0, 0.05, -0.16]}>
              <mesh position={[0, -0.22, -0.05]} rotation={[-0.2, 0, 0]}>
                <coneGeometry args={[0.12, 0.45, 12]} />
                <meshStandardMaterial color="#3f1f13" roughness={0.7} />
              </mesh>
              <mesh position={[0, 0.02, 0]}>
                <torusGeometry args={[0.04, 0.015, 6, 16]} />
                <meshStandardMaterial color="#ff758c" metalness={0.2} roughness={0.4} />
              </mesh>
            </group>
          </group>
        </group>

        {/* Left Arm */}
        <group ref={leftArmRef} position={[-0.2, 0.25, 0]}>
          <mesh castShadow position={[0, -0.18, 0]}>
            <capsuleGeometry args={[0.04, 0.32, 6, 10]} />
            <meshStandardMaterial color="#fce2db" roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.36, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#fce2db" roughness={0.6} />
          </mesh>
        </group>

        {/* Right Arm */}
        <group ref={rightArmRef} position={[0.2, 0.25, 0]}>
          <mesh castShadow position={[0, -0.18, 0]}>
            <capsuleGeometry args={[0.04, 0.32, 6, 10]} />
            <meshStandardMaterial color="#fce2db" roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.36, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#fce2db" roughness={0.6} />
          </mesh>
        </group>
      </group>

      {/* Legs & Shoes */}
      <group position={[0, 0.52, 0]}>
        <group ref={leftLegRef} position={[-0.09, 0, 0]}>
          <mesh castShadow position={[0, -0.24, 0]}>
            <capsuleGeometry args={[0.045, 0.44, 6, 10]} />
            <meshStandardMaterial color="#fce2db" roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.5, 0.03]}>
            <boxGeometry args={[0.07, 0.06, 0.14]} />
            <meshStandardMaterial color="#d4af37" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
        <group ref={rightLegRef} position={[0.09, 0, 0]}>
          <mesh castShadow position={[0, -0.24, 0]}>
            <capsuleGeometry args={[0.045, 0.44, 6, 10]} />
            <meshStandardMaterial color="#fce2db" roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.5, 0.03]}>
            <boxGeometry args={[0.07, 0.06, 0.14]} />
            <meshStandardMaterial color="#d4af37" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export default function FemaleCharacter({ controls, joystickVector }) {
  const playerGroupRef = useRef();
  const [isMoving, setIsMoving] = useState(false);
  const positionRef = useRef(new THREE.Vector3(0, 0, 8));
  const rotationRef = useRef(0);

  const mode = useGameStore((s) => s.mode);
  const isPreviewMode = useGameStore((s) => s.isPreviewMode);
  const currentRoom = useGameStore((s) => s.currentRoom);
  const bedroomStep = useGameStore((s) => s.bedroomStep);
  const specialAction = useGameStore((s) => s.specialAction);
  const isDanceMusicPlaying = useGameStore((s) => s.isDanceMusicPlaying);
  const isSingingPlaying = useGameStore((s) => s.isSingingPlaying);

  const isSitting = currentRoom === 'bedroom' && !specialAction && (bedroomStep === 'sitting_on_bed' || bedroomStep === 'voice_message' || bedroomStep === 'final');
  const isHoldingHand = currentRoom === 'bedroom' && (bedroomStep === 'walking_to_bed' || isSitting);
  const hasNecklace = currentRoom === 'bedroom' && bedroomStep !== 'outside' && bedroomStep !== 'entering' && bedroomStep !== 'greeting';

  // Sync position on room change
  const prevRoomRef = useRef(currentRoom);
  useEffect(() => {
    if (prevRoomRef.current !== currentRoom) {
      prevRoomRef.current = currentRoom;
      let targetZ = 8;
      if (currentRoom === 'museum') targetZ = 8;
      else if (currentRoom === 'singing') targetZ = -20;
      else if (currentRoom === 'dancing') targetZ = -50;
      else if (currentRoom === 'bedroom') targetZ = -80;
      positionRef.current.set(0, 0, targetZ);
    }
  }, [currentRoom]);

  useFrame((state, delta) => {
    if (!playerGroupRef.current) return;
    const time = state.clock.getElapsedTime();

    // A. Visitor Mode, Creator Preview Mode, OR in Museum: Female is the player-controlled character!
    if (mode === 'visitor' || isPreviewMode || currentRoom === 'museum') {
      if (specialAction === 'dance' || (currentRoom === 'dancing' && isDanceMusicPlaying)) {
        // Coordinated circular waltz steps across the ballroom floor
        const orbitAngle = time * 0.35;
        const pivotX = Math.sin(orbitAngle) * 1.5;
        const pivotZ = -60 + Math.cos(orbitAngle) * 1.5;
        const spinAngle = time * 0.75;
        const partnerDist = 0.38;

        positionRef.current.set(
          pivotX + Math.cos(spinAngle) * partnerDist,
          0,
          pivotZ + Math.sin(spinAngle) * partnerDist
        );
        rotationRef.current = spinAngle + Math.PI;
        setIsMoving(false);
      } else if (specialAction === 'hug') {
        positionRef.current.set(2.16, 0, -92.2);
        rotationRef.current = -Math.PI / 2;
        setIsMoving(false);
      } else if (specialAction === 'kiss') {
        positionRef.current.set(2.14, 0, -92.2);
        rotationRef.current = -Math.PI / 2;
        setIsMoving(false);
      } else if (currentRoom === 'singing' && (specialAction === 'singing' || isSingingPlaying)) {
        // Watching admiringly from audience
        positionRef.current.set(0, 0, -26);
        rotationRef.current = Math.PI;
        setIsMoving(false);
      } else if (isSitting) {
        positionRef.current.set(1.7, 0, -93.6);
        rotationRef.current = 0;
        setIsMoving(false);
      } else {
        // Free movement
        let moveX = 0;
        let moveZ = 0;
        if (controls.forward) moveZ -= 1;
        if (controls.backward) moveZ += 1;
        if (controls.left) moveX -= 1;
        if (controls.right) moveX += 1;

        const storeJoy = gameStore.get().joystickVector;
        const jX = (joystickVector && Math.abs(joystickVector.x) > 0.04) ? joystickVector.x : (storeJoy?.x || 0);
        const jY = (joystickVector && Math.abs(joystickVector.y) > 0.04) ? joystickVector.y : (storeJoy?.y || 0);

        if (Math.abs(jX) > 0.04 || Math.abs(jY) > 0.04) {
          moveX += jX;
          moveZ += jY;
        }

        const len = Math.hypot(moveX, moveZ);
        const moving = len > 0.08;
        setIsMoving(moving);

        if (moving) {
          const dirX = moveX / len;
          const dirZ = moveZ / len;
          const speed = 4.2 * delta;

          const targetRot = Math.atan2(dirX, dirZ);
          const diff = (targetRot - rotationRef.current + Math.PI * 3) % (Math.PI * 2) - Math.PI;
          rotationRef.current += diff * Math.min(1, 10 * delta);

          let nextX = THREE.MathUtils.clamp(positionRef.current.x + dirX * speed, -6.2, 6.2);
          let nextZ = positionRef.current.z + dirZ * speed;
          const inDoorway = Math.abs(positionRef.current.x) < 1.6;

          // Furniture collision in Bedroom
          if (currentRoom === 'bedroom') {
            // Bed footprint: x in [0.6, 3.6], z in [-96.2, -92.8]
            if (nextX > 0.6 && nextX < 3.6 && nextZ > -96.2 && nextZ < -92.8) {
              if (positionRef.current.x <= 0.6 || positionRef.current.x >= 3.6) nextX = positionRef.current.x;
              if (positionRef.current.z <= -96.2 || positionRef.current.z >= -92.8) nextZ = positionRef.current.z;
            }
            // Desk footprint: x in [-5.2, -3.8], z in [-91.2, -88.8]
            if (nextX < -3.8 && nextX > -5.2 && nextZ > -91.2 && nextZ < -88.8) {
              if (positionRef.current.x >= -3.8 || positionRef.current.x <= -5.2) nextX = positionRef.current.x;
              if (positionRef.current.z <= -91.2 || positionRef.current.z >= -88.8) nextZ = positionRef.current.z;
            }
          }

          // Physical connected door walking transitions
          if (currentRoom === 'museum') {
            if (inDoorway && nextZ < -14.8) {
              gameStore.navigateToRoom('singing', [positionRef.current.x, 0, -17.5]);
              return;
            }
            positionRef.current.z = inDoorway ? nextZ : THREE.MathUtils.clamp(nextZ, -14.2, 13.5);
          } else if (currentRoom === 'singing') {
            if (inDoorway && nextZ > -15.5) {
              gameStore.navigateToRoom('museum', [positionRef.current.x, 0, -13.5]);
              return;
            } else if (inDoorway && nextZ < -44.8) {
              gameStore.navigateToRoom('dancing', [positionRef.current.x, 0, -47.5]);
              return;
            }
            positionRef.current.z = inDoorway ? nextZ : THREE.MathUtils.clamp(nextZ, -43.5, -16.5);
          } else if (currentRoom === 'dancing') {
            if (inDoorway && nextZ > -45.5) {
              gameStore.navigateToRoom('singing', [positionRef.current.x, 0, -43.0]);
              return;
            } else if (inDoorway && nextZ < -74.8) {
              gameStore.navigateToRoom('bedroom', [positionRef.current.x, 0, -77.5]);
              return;
            }
            positionRef.current.z = inDoorway ? nextZ : THREE.MathUtils.clamp(nextZ, -73.5, -46.5);
          } else if (currentRoom === 'bedroom') {
            if (inDoorway && nextZ > -75.5) {
              gameStore.navigateToRoom('dancing', [positionRef.current.x, 0, -73.0]);
              return;
            }
            positionRef.current.z = inDoorway ? nextZ : THREE.MathUtils.clamp(nextZ, -103.0, -76.5);
          }
          positionRef.current.x = nextX;
        }
      }

      gameStore.set({
        playerPos: [positionRef.current.x, positionRef.current.y, positionRef.current.z],
        cameraAngle: rotationRef.current,
      });
    } else {
      // B. In Creator Mode (Editing), Woman character appears in the scenes to preview interactions:
      if (specialAction === 'dance' || (currentRoom === 'dancing' && (specialAction === 'dance' || isDanceMusicPlaying))) {
        const orbitAngle = time * 0.35;
        const pivotX = Math.sin(orbitAngle) * 1.5;
        const pivotZ = -60 + Math.cos(orbitAngle) * 1.5;
        const spinAngle = time * 0.75;
        const partnerDist = 0.38;

        positionRef.current.set(
          pivotX + Math.cos(spinAngle) * partnerDist,
          0,
          pivotZ + Math.sin(spinAngle) * partnerDist
        );
        rotationRef.current = spinAngle + Math.PI;
        setIsMoving(false);
      } else if (specialAction === 'hug') {
        positionRef.current.set(2.16, 0, -92.2);
        rotationRef.current = -Math.PI / 2;
        setIsMoving(false);
      } else if (specialAction === 'kiss') {
        positionRef.current.set(2.14, 0, -92.2);
        rotationRef.current = -Math.PI / 2;
        setIsMoving(false);
      } else if (currentRoom === 'singing') {
        // Watching admiringly from the audience table
        positionRef.current.set(0, 0, -26);
        rotationRef.current = Math.PI; // Looking at stage
        setIsMoving(false);
      } else if (currentRoom === 'bedroom') {
        positionRef.current.set(1.7, 0, -93.6);
        rotationRef.current = 0;
        setIsMoving(false);
      } else {
        // In museum
        positionRef.current.set(0, 0, 7);
        rotationRef.current = 0;
        setIsMoving(false);
      }
    }

    playerGroupRef.current.position.copy(positionRef.current);
    playerGroupRef.current.rotation.y = rotationRef.current;
  });

  return (
    <group ref={playerGroupRef} position={[0, 0, 8]}>
      <ProceduralAnimeFemale
        isMoving={isMoving}
        isSitting={isSitting}
        isHoldingHand={isHoldingHand}
        hasNecklace={hasNecklace}
        specialAction={
          currentRoom === 'dancing' && (specialAction === 'dance' || isDanceMusicPlaying)
            ? 'dance'
            : specialAction
        }
      />
    </group>
  );
}
