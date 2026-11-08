import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Heart, KeyRound, Sparkles } from 'lucide-react';
import { gameStore, useGameStore } from '../../hooks/useGameStore';
import { romanticAudio } from '../../hooks/useAudioManager';

export default function MobileJoystick({ onJoystickMove, audioManager }) {
  const [active, setActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const activePointerId = useRef(null);
  const baseRef = useRef(null);

  const nearbyObject = useGameStore((s) => s.nearbyObject);
  const mode = useGameStore((s) => s.mode);

  const maxRadius = 45; // Max knob displacement in px

  const updateKnob = useCallback((clientX, clientY) => {
    if (!baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;
    const dist = Math.hypot(deltaX, deltaY);

    if (dist > maxRadius) {
      deltaX = (deltaX / dist) * maxRadius;
      deltaY = (deltaY / dist) * maxRadius;
    }

    setKnobPos({ x: deltaX, y: deltaY });

    // Normalized between -1 and 1
    // deltaX: positive = right, negative = left
    // deltaY: negative = forward (up), positive = backward (down)
    const normX = Number((deltaX / maxRadius).toFixed(3));
    const normY = Number((deltaY / maxRadius).toFixed(3));

    const vector = { x: normX, y: normY };
    onJoystickMove?.(vector);
    gameStore.set({ joystickVector: vector });
  }, [onJoystickMove, maxRadius]);

  const handlePointerDown = (e) => {
    e.stopPropagation();
    if (activePointerId.current !== null) return;
    activePointerId.current = e.pointerId;
    try {
      e.target.setPointerCapture(e.pointerId);
    } catch (_) {}
    setActive(true);
    updateKnob(e.clientX, e.clientY);
  };

  const handlePointerMove = (e) => {
    e.stopPropagation();
    if (e.pointerId !== activePointerId.current) return;
    updateKnob(e.clientX, e.clientY);
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();
    if (e.pointerId === activePointerId.current) {
      try {
        e.target.releasePointerCapture(e.pointerId);
      } catch (_) {}
      activePointerId.current = null;
      setActive(false);
      setKnobPos({ x: 0, y: 0 });
      onJoystickMove?.({ x: 0, y: 0 });
      gameStore.set({ joystickVector: { x: 0, y: 0 } });
    }
  };

  // Fallback Touch Events for legacy browsers
  const handleTouchStart = (e) => {
    e.stopPropagation();
    if (activePointerId.current !== null) return;
    const touch = e.changedTouches[0];
    activePointerId.current = touch.identifier;
    setActive(true);
    updateKnob(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e) => {
    e.stopPropagation();
    if (activePointerId.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activePointerId.current) {
        updateKnob(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activePointerId.current) {
        activePointerId.current = null;
        setActive(false);
        setKnobPos({ x: 0, y: 0 });
        onJoystickMove?.({ x: 0, y: 0 });
        gameStore.set({ joystickVector: { x: 0, y: 0 } });
        break;
      }
    }
  };

  if (mode === 'landing') return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-20 select-none">
      {/* Bottom Left Virtual Joystick */}
      <div className="absolute bottom-8 left-8 pointer-events-auto">
        <div
          ref={baseRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          style={{ touchAction: 'none' }}
          className="relative w-28 h-28 rounded-full glass-panel flex items-center justify-center border-2 border-white/20 touch-control-zone shadow-2xl cursor-grab active:cursor-grabbing"
        >
          {/* Outer compass ring markings */}
          <div className="absolute inset-2 rounded-full border border-dashed border-amber-300/30 pointer-events-none" />

          {/* Cardinal direction hints */}
          <span className="absolute top-1 text-[9px] text-amber-200/60 font-mono pointer-events-none">▲</span>
          <span className="absolute bottom-1 text-[9px] text-amber-200/60 font-mono pointer-events-none">▼</span>
          <span className="absolute left-1.5 text-[9px] text-amber-200/60 font-mono pointer-events-none">◀</span>
          <span className="absolute right-1.5 text-[9px] text-amber-200/60 font-mono pointer-events-none">▶</span>

          {/* Draggable Knob */}
          <div
            className={`w-12 h-12 rounded-full shadow-lg transition-transform pointer-events-none flex items-center justify-center ${
              active
                ? 'bg-gradient-to-tr from-rose-500 to-amber-300 scale-105'
                : 'bg-white/30 backdrop-blur-md'
            }`}
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
              transition: active ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            <div className="w-4 h-4 rounded-full bg-white/70" />
          </div>
        </div>
      </div>
    </div>
  );
}
