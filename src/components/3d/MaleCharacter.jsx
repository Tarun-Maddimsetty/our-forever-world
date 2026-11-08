import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gameStore, useGameStore } from '../../hooks/useGameStore';

function ProceduralAnimeMale({
  isMoving,
  isSitting,
  isPresentingNecklace,
  isHoldingHand,
  specialAction,
}) {
  const groupRef = useRef();
  const headRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // 1. SINGING POSE
    if (specialAction === 'singing') {
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -1.2 + Math.sin(time * 3) * 0.15, 0.1);
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, -0.4, 0.1);
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -1.1 + Math.sin(time * 2.5) * 0.2, 0.1);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, 0.5, 0.1);
      }
      if (headRef.current) {
        headRef.current.rotation.x = -0.1 + Math.sin(time * 2) * 0.08;
        headRef.current.rotation.y = Math.sin(time * 1.5) * 0.1;
      }
      return;
    }

    // 2. COUPLE DANCE
    if (specialAction === 'dance') {
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -0.9, 0.1);
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, -0.6, 0.1);
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -1.2, 0.1);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, 0.5, 0.1);
      }
      if (headRef.current) {
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0.18, 0.1);
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, -0.25, 0.1);
      }
      return;
    }

    // 3. 4-SECOND HUG
    if (specialAction === 'hug') {
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -1.4, 0.15);
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, -0.7, 0.15);

        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -1.4, 0.15);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, 0.7, 0.15);
      }
      if (headRef.current) {
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0.2, 0.1);
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, -0.35, 0.1);
      }
      return;
    }

    // 4. 4-SECOND KISS
    if (specialAction === 'kiss') {
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -1.0, 0.15);
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, -0.4, 0.15);

        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -1.0, 0.15);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, 0.4, 0.15);
      }
      if (headRef.current) {
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0.22, 0.12);
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, -0.12, 0.12);
      }
      return;
    }

    // 5. SITTING ON BED
    if (isSitting) {
      if (groupRef.current) {
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0.48, 0.1);
      }
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, -Math.PI / 2.2, 0.1);
        rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, -Math.PI / 2.2, 0.1);
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -0.25, 0.1);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.25, 0.1);
      }
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0.25, 0.1);
      if (headRef.current) headRef.current.rotation.y = Math.sin(time * 0.5) * 0.08 + 0.25;
      return;
    }

    // 6. PRESENTING NECKLACE
    if (isPresentingNecklace) {
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -1.1, 0.1);
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0.4, 0.1);

        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -1.1, 0.1);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.4, 0.1);
      }
      if (headRef.current) {
        headRef.current.rotation.x = 0.15;
        headRef.current.rotation.y = Math.sin(time * 1.5) * 0.02;
      }
      return;
    }

    // 7. WALKING
    if (isMoving) {
      const walkFreq = 8.5;
      const walkCycle = Math.sin(time * walkFreq);
      const walkCos = Math.cos(time * walkFreq);

      if (leftLegRef.current) leftLegRef.current.rotation.x = walkCycle * 0.5;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -walkCycle * 0.5;

      if (leftArmRef.current) {
        if (isHoldingHand) {
          leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -0.4, 0.1);
          leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, -0.35, 0.1);
        } else {
          leftArmRef.current.rotation.x = -walkCycle * 0.4;
        }
      }
      if (rightArmRef.current) rightArmRef.current.rotation.x = walkCycle * 0.4;

      if (groupRef.current) groupRef.current.position.y = Math.abs(walkCos) * 0.05;
    } else {
      // 8. IDLE
      const breath = Math.sin(time * 1.6);
      if (groupRef.current) groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, 0.1);
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, 0.1);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, 0.1);

      if (leftArmRef.current) {
        if (isHoldingHand) {
          leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -0.3, 0.1);
          leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, -0.3, 0.1);
        } else {
          leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0.1 + breath * 0.03, 0.1);
          leftArmRef.current.rotation.z = -0.08;
        }
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0.1 - breath * 0.03, 0.1);
        rightArmRef.current.rotation.z = 0.08;
      }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(time * 0.8) * 0.05;
        headRef.current.rotation.x = Math.sin(time * 1.4) * 0.02;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Torso & Suit */}
      <group position={[0, 0.95, 0]}>
        <mesh castShadow position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.2, 0.17, 0.42, 16]} />
          <meshStandardMaterial color="#1a2238" roughness={0.4} />
        </mesh>

        <mesh position={[0, 0.38, 0.07]}>
          <boxGeometry args={[0.12, 0.1, 0.08]} />
          <meshStandardMaterial color="#f8f9fa" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.22, 0.15]}>
          <boxGeometry args={[0.04, 0.22, 0.02]} />
          <meshStandardMaterial color="#8b0000" metalness={0.2} roughness={0.3} />
        </mesh>
        <mesh position={[-0.12, 0.3, 0.12]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#ff3366" roughness={0.3} />
        </mesh>

        <mesh position={[0, -0.04, 0]}>
          <cylinderGeometry args={[0.175, 0.175, 0.06, 16]} />
          <meshStandardMaterial color="#2d1d12" roughness={0.4} />
        </mesh>

        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.07, 0.08, 0.12, 12]} />
          <meshStandardMaterial color="#f7dfd4" roughness={0.6} />
        </mesh>

        {/* Head */}
        <group ref={headRef} position={[0, 0.58, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.19, 20, 20]} />
            <meshStandardMaterial color="#f7dfd4" roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.09, 0.06]}>
            <coneGeometry args={[0.14, 0.16, 16]} />
            <meshStandardMaterial color="#f7dfd4" roughness={0.6} />
          </mesh>

          {/* Eyes */}
          <group position={[0, 0.02, 0.16]}>
            <group position={[-0.068, 0, 0]}>
              <mesh><circleGeometry args={[0.035, 16]} /><meshBasicMaterial color="#ffffff" /></mesh>
              <mesh position={[0, -0.004, 0.002]}><circleGeometry args={[0.025, 16]} /><meshBasicMaterial color="#2c3e50" /></mesh>
              <mesh position={[-0.01, 0.008, 0.004]}><circleGeometry args={[0.008, 8]} /><meshBasicMaterial color="#ffffff" /></mesh>
            </group>
            <group position={[0.068, 0, 0]}>
              <mesh><circleGeometry args={[0.035, 16]} /><meshBasicMaterial color="#ffffff" /></mesh>
              <mesh position={[0, -0.004, 0.002]}><circleGeometry args={[0.025, 16]} /><meshBasicMaterial color="#2c3e50" /></mesh>
              <mesh position={[-0.01, 0.008, 0.004]}><circleGeometry args={[0.008, 8]} /><meshBasicMaterial color="#ffffff" /></mesh>
            </group>
          </group>

          {/* Smile */}
          <mesh position={[0, -0.08, 0.17]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.024, 0.004, 6, 14, Math.PI * 0.8]} />
            <meshBasicMaterial color="#b23b5b" />
          </mesh>

          {/* Hair */}
          <group position={[0, 0.06, 0]}>
            <mesh position={[0, 0.06, 0]}>
              <sphereGeometry args={[0.205, 16, 16]} />
              <meshStandardMaterial color="#201815" roughness={0.8} />
            </mesh>
            <mesh position={[-0.05, 0.11, 0.14]} rotation={[0.4, 0.2, -0.2]}>
              <coneGeometry args={[0.12, 0.16, 8]} />
              <meshStandardMaterial color="#2b201c" roughness={0.8} />
            </mesh>
            <mesh position={[0.06, 0.1, 0.13]} rotation={[0.4, -0.3, 0.3]}>
              <coneGeometry args={[0.11, 0.15, 8]} />
              <meshStandardMaterial color="#2b201c" roughness={0.8} />
            </mesh>
          </group>
        </group>

        {/* Arms */}
        <group ref={leftArmRef} position={[-0.24, 0.32, 0]}>
          <mesh castShadow position={[0, -0.22, 0]}>
            <capsuleGeometry args={[0.05, 0.38, 6, 10]} />
            <meshStandardMaterial color="#1a2238" roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.44, 0]}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshStandardMaterial color="#f7dfd4" roughness={0.6} />
          </mesh>
        </group>

        <group ref={rightArmRef} position={[0.24, 0.32, 0]}>
          <mesh castShadow position={[0, -0.22, 0]}>
            <capsuleGeometry args={[0.05, 0.38, 6, 10]} />
            <meshStandardMaterial color="#1a2238" roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.44, 0]}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshStandardMaterial color="#f7dfd4" roughness={0.6} />
          </mesh>
        </group>
      </group>

      {/* Legs & Shoes */}
      <group position={[0, 0.55, 0]}>
        <group ref={leftLegRef} position={[-0.1, 0, 0]}>
          <mesh castShadow position={[0, -0.27, 0]}>
            <capsuleGeometry args={[0.055, 0.5, 6, 10]} />
            <meshStandardMaterial color="#141b2d" roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.56, 0.04]}>
            <boxGeometry args={[0.08, 0.07, 0.16]} />
            <meshStandardMaterial color="#111111" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>

        <group ref={rightLegRef} position={[0.1, 0, 0]}>
          <mesh castShadow position={[0, -0.27, 0]}>
            <capsuleGeometry args={[0.055, 0.5, 6, 10]} />
            <meshStandardMaterial color="#141b2d" roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.56, 0.04]}>
            <boxGeometry args={[0.08, 0.07, 0.16]} />
            <meshStandardMaterial color="#111111" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export default function MaleCharacter({ controls, joystickVector }) {
  const maleGroupRef = useRef();
  const currentRoom = useGameStore((s) => s.currentRoom);
  const mode = useGameStore((s) => s.mode);
  const isPreviewMode = useGameStore((s) => s.isPreviewMode);
  const bedroomStep = useGameStore((s) => s.bedroomStep);
  const specialAction = useGameStore((s) => s.specialAction);
  const isSingingPlaying = useGameStore((s) => s.isSingingPlaying);
  const isDanceMusicPlaying = useGameStore((s) => s.isDanceMusicPlaying);

  // Initial position matching Museum
  const positionRef = useRef(new THREE.Vector3(0, 0, 8));
  const rotationRef = useRef(0);
  const [isMoving, setIsMoving] = useState(false);

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

  const isPresentingNecklace = currentRoom === 'bedroom' && bedroomStep === 'necklace';
  const isHoldingHand = currentRoom === 'bedroom' && (bedroomStep === 'walking_to_bed' || bedroomStep === 'sitting_on_bed');
  const isSitting = currentRoom === 'bedroom' && !specialAction && (bedroomStep === 'sitting_on_bed' || bedroomStep === 'voice_message' || bedroomStep === 'final');

  useFrame((state, delta) => {
    if (!maleGroupRef.current) return;
    // In Museum, the male character is inactive and hidden
    if (currentRoom === 'museum') return;

    const time = state.clock.getElapsedTime();

    // A. Creator Mode (When NOT in preview): Male character is the active player!
    // In Creator Mode (and !isPreviewMode):
    if (mode === 'creator' && !isPreviewMode) {
      let moveX = 0;
      let moveZ = 0;
      if (controls?.forward) moveZ -= 1;
      if (controls?.backward) moveZ += 1;
      if (controls?.left) moveX -= 1;
      if (controls?.right) moveX += 1;

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
          if (nextX > 0.6 && nextX < 3.6 && nextZ > -96.2 && nextZ < -92.8) {
            if (positionRef.current.x <= 0.6 || positionRef.current.x >= 3.6) nextX = positionRef.current.x;
            if (positionRef.current.z <= -96.2 || positionRef.current.z >= -92.8) nextZ = positionRef.current.z;
          }
          if (nextX < -3.8 && nextX > -5.2 && nextZ > -91.2 && nextZ < -88.8) {
            if (positionRef.current.x >= -3.8 || positionRef.current.x <= -5.2) nextX = positionRef.current.x;
            if (positionRef.current.z <= -91.2 || positionRef.current.z >= -88.8) nextZ = positionRef.current.z;
          }
        }

        // Physical connected door walking transitions
        if (currentRoom === 'singing') {
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

      gameStore.set({
        playerPos: [positionRef.current.x, positionRef.current.y, positionRef.current.z],
        cameraAngle: rotationRef.current,
      });
    } else {
      // B. Visitor Mode OR Creator Preview Mode: Male character performs interactive partner roles!
      if (currentRoom === 'singing') {
        // Positioned on stage directly behind the vintage microphone
        positionRef.current.set(0, 0.9, -37.4);
        rotationRef.current = 0;
        setIsMoving(false);
      } else if (currentRoom === 'dancing') {
        if (specialAction === 'dance' || isDanceMusicPlaying) {
          // Coordinated waltz trajectory revolving around ballroom center
          const orbitAngle = time * 0.35;
          const pivotX = Math.sin(orbitAngle) * 1.5;
          const pivotZ = -60 + Math.cos(orbitAngle) * 1.5;
          const spinAngle = time * 0.75;
          const partnerDist = 0.38;

          positionRef.current.set(
            pivotX - Math.cos(spinAngle) * partnerDist,
            0,
            pivotZ - Math.sin(spinAngle) * partnerDist
          );
          rotationRef.current = spinAngle;
          setIsMoving(false);
        } else {
          positionRef.current.set(-0.7, 0, -60);
          rotationRef.current = Math.PI / 2;
          setIsMoving(false);
        }
      } else if (currentRoom === 'bedroom') {
        if (specialAction === 'hug') {
          positionRef.current.set(1.84, 0, -92.2);
          rotationRef.current = Math.PI / 2;
          setIsMoving(false);
        } else if (specialAction === 'kiss') {
          positionRef.current.set(1.86, 0, -92.2);
          rotationRef.current = Math.PI / 2;
          setIsMoving(false);
        } else if (isSitting) {
          // Sitting comfortably side-by-side on the bed edge
          positionRef.current.set(2.45, 0, -93.6);
          rotationRef.current = 0;
          setIsMoving(false);
        } else {
          positionRef.current.set(2.45, 0, -93.6);
          rotationRef.current = 0;
          setIsMoving(false);
        }
      } else {
        positionRef.current.set(0, 0, -10);
        rotationRef.current = 0;
        setIsMoving(false);
      }
    }

    maleGroupRef.current.position.copy(positionRef.current);
    maleGroupRef.current.rotation.y = rotationRef.current;
  });

  return (
    <group
      ref={maleGroupRef}
      position={[0, 0, 8]}
      visible={currentRoom !== 'museum'}
    >
      {currentRoom !== 'museum' && (
        <ProceduralAnimeMale
          isMoving={isMoving}
          isSitting={isSitting}
          isPresentingNecklace={isPresentingNecklace}
          isHoldingHand={isHoldingHand}
          specialAction={
            currentRoom === 'singing' && (specialAction === 'singing' || isSingingPlaying)
              ? 'singing'
              : currentRoom === 'dancing' && (specialAction === 'dance' || isDanceMusicPlaying)
              ? 'dance'
              : specialAction
          }
        />
      )}
    </group>
  );
}
