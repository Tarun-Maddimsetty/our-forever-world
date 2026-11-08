import React, { useState, Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { Sparkles, RefreshCw, ShieldCheck, Compass, AlertCircle, Heart } from 'lucide-react';

import Experience from './components/3d/Experience';
import LandingPage from './components/ui/LandingPage';
import RoomNavigationHUD from './components/ui/RoomNavigationHUD';
import CreatorPanel from './components/ui/CreatorPanel';
import HUD from './components/ui/HUD';
import MobileJoystick from './components/ui/MobileJoystick';
import LetterModal from './components/ui/LetterModal';
import BirthdayLetterModal from './components/ui/BirthdayLetterModal';
import VoicePlayerModal from './components/ui/VoicePlayerModal';
import FinalSceneOverlay from './components/ui/FinalSceneOverlay';
import PhotoModal from './components/ui/PhotoModal';
import RomanticSafeModeGallery from './components/ui/RomanticSafeModeGallery';

import { useKeyboardControls } from './hooks/useKeyboardControls';
import { useAudioManager } from './hooks/useAudioManager';
import { gameStore, useGameStore } from './hooks/useGameStore';

// Gentle 3D fallback so WebGL Canvas is NEVER pitch black while loading
function Romantic3DLoader() {
  const meshRef = useRef();
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 1.5;
      meshRef.current.rotation.x += delta * 0.8;
    }
  });

  return (
    <group position={[0, 1.8, 10]}>
      <ambientLight intensity={0.9} color="#ffe8d6" />
      <pointLight position={[0, 2, 2]} intensity={2.0} color="#ffd700" />
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial
          color="#ff758c"
          emissive="#ff2d55"
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </group>
  );
}

// Resilient React Error Boundary specifically for WebGL/3D context
class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorDetails: '',
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      errorDetails: error?.message || 'Graphics context interruption detected.',
    };
  }

  componentDidCatch(error, info) {
    console.error('🚨 [3D Canvas Error caught by Boundary]:', error);
    if (error?.stack) {
      console.error('[Error Stack]:', error.stack);
    }
    if (info && info.componentStack) {
      console.error('🚨 [Failing Component Hierarchy]:', info.componentStack);
    }
  }

  handleSafeModeRecovery = () => {
    console.log('[Recovery] Switching to Safe Mode (Low Quality)...');
    gameStore.set({ graphicsQuality: 'low' });
    this.setState({ hasError: false, error: null });
    if (this.props.onResetCanvas) {
      this.props.onResetCanvas();
    }
  };

  handleSwitchTo2D = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onSwitchTo2D) {
      this.props.onSwitchTo2D();
    }
  };

  handleRetryStandard = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onResetCanvas) {
      this.props.onResetCanvas();
    }
  };

  handleReturnToSelection = () => {
    gameStore.set({ mode: 'landing' });
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-[#0b0813]/95 backdrop-blur-md text-center">
          <div className="max-w-md w-full glass-panel-gold rounded-3xl p-8 border-2 border-rose-400/50 shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center mx-auto text-amber-300">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>

            <h2 className="font-cinzel text-xl font-bold text-amber-200">
              3D Sanctuary Optimization
            </h2>

            <p className="text-xs text-rose-200/90 leading-relaxed font-light">
              Your device requested a graphics memory refresh. All your custom photos, letters, and progress are completely safe and preserved!
            </p>

            {this.state.errorDetails && (
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-[11px] text-gray-300 font-mono text-left max-h-24 overflow-y-auto">
                <span className="text-amber-300">Diagnostic:</span> {this.state.errorDetails}
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={this.handleSafeModeRecovery}
                className="btn-gold w-full py-3 px-4 text-xs font-bold shadow-lg flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-amber-950" />
                <span>Launch in Safe Mode (Smooth 3D)</span>
              </button>
              <button
                onClick={this.handleSwitchTo2D}
                className="btn-romantic w-full py-2.5 px-4 text-xs font-bold shadow-lg flex items-center justify-center gap-1.5"
              >
                <Heart className="w-4 h-4 text-rose-300 fill-rose-300" />
                <span>Explore in Romantic 2D Sanctuary</span>
              </button>
              <div className="flex gap-2">
                <button
                  onClick={this.handleRetryStandard}
                  className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs text-gray-200 font-medium flex-1 flex items-center justify-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-white" />
                  <span>Retry</span>
                </button>
                <button
                  onClick={this.handleReturnToSelection}
                  className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs text-gray-200 font-medium flex items-center justify-center gap-1.5 transition"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Room Selection</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Check WebGL hardware support without leaking a context
function isWebGLAvailable() {
  if (typeof window === 'undefined') return true;
  try {
    if (!window.WebGLRenderingContext) return false;
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext('experimental-webgl');
    if (!gl) return false;
    // Release immediately so it never counts against browser active context limit
    const ext = gl.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
    return true;
  } catch (e) {
    return false;
  }
}

export default function App() {
  const mode = useGameStore((s) => s.mode);
  const currentRoom = useGameStore((s) => s.currentRoom);
  const nearbyObject = useGameStore((s) => s.nearbyObject);
  const isActionPressed = useGameStore((s) => s.isActionPressed);
  const graphicsQuality = useGameStore((s) => s.graphicsQuality);

  const [webglSupported] = useState(() => isWebGLAvailable());
  const [is2DMode, setIs2DMode] = useState(false);
  const [recoveryState, setRecoveryState] = useState('active'); // 'active' | 'restoring' | 'failed'
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const restoreTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const [canvasKey, setCanvasKey] = useState(0);

  const [joystickVector, setJoystickVector] = useState({ x: 0, y: 0 });
  const keyboardControls = useKeyboardControls();
  const audioManager = useAudioManager();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (restoreTimeoutRef.current) clearTimeout(restoreTimeoutRef.current);
    };
  }, []);

  // Listen to Key [E] & Key [V] interactions
  useEffect(() => {
    if (isActionPressed && nearbyObject) {
      if (nearbyObject.type === 'memory' && nearbyObject.memory) {
        audioManager.playSparkle();
        gameStore.openMemoryLetter(nearbyObject.memory);
      } else if (nearbyObject.type === 'door' && nearbyObject.targetRoom) {
        audioManager.playDoorSound();
        gameStore.navigateToRoom(nearbyObject.targetRoom);
      } else if (nearbyObject.type === 'bedroom_letter') {
        audioManager.playSparkle();
        gameStore.set({ isBirthdayLetterModalOpen: true });
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'v' || e.key === 'V') {
        const curNear = gameStore.get().nearbyObject;
        if (curNear && curNear.type === 'memory' && curNear.memory) {
          audioManager.playSparkle();
          gameStore.set({
            isPhotoModalOpen: true,
            selectedPhoto: curNear.memory,
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActionPressed, nearbyObject, audioManager]);

  const handleLaunchSafeMode = () => {
    console.log('[Recovery] Launching Safe Mode (Smooth 3D)...');
    retryCountRef.current = 0;
    gameStore.set({ graphicsQuality: 'low' });
    setRecoveryState('active');
    setCanvasKey((k) => k + 1);
  };

  const handleRetrySanctuary = () => {
    console.log('[Recovery] Retrying standard sanctuary...');
    retryCountRef.current = 0;
    setRecoveryState('active');
    setCanvasKey((k) => k + 1);
  };

  const handleLaunch2DMode = () => {
    console.log('[Recovery] Launching 2D Romantic Sanctuary...');
    setRecoveryState('active');
    setIs2DMode(true);
  };

  const handleReturnToLanding = () => {
    gameStore.set({ mode: 'landing' });
    setRecoveryState('active');
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0b0813] select-none touch-none">
      {/* 1. Landing Screen (Create Room / Join Room) */}
      {mode === 'landing' && <LandingPage />}

      {/* 2. 3D WebGL Canvas for the 4 Connected Environments */}
      <CanvasErrorBoundary
        onResetCanvas={() => setCanvasKey((k) => k + 1)}
        onSwitchTo2D={handleLaunch2DMode}
      >
        {webglSupported && !is2DMode ? (
          <Canvas
            key={canvasKey}
            frameloop={mode === 'landing' ? 'never' : 'always'}
            shadows={graphicsQuality === 'high'}
            camera={{ position: [0, 3, 14], fov: 45 }}
            gl={{
              antialias: graphicsQuality !== 'low',
              powerPreference: 'default',
              alpha: false,
              failIfMajorPerformanceCaveat: false,
              preserveDrawingBuffer: false,
              stencil: false,
              depth: true,
            }}
            dpr={
              graphicsQuality === 'low'
                ? 1
                : graphicsQuality === 'medium'
                ? Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.25)
                : Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5)
            }
            onCreated={({ gl }) => {
              const canvasEl = gl.domElement;
              if (!canvasEl) return;

              const handleContextLost = (e) => {
                // Crucial per WebGL spec: preventDefault signals intent to restore
                e.preventDefault();
                const reason = e.statusMessage || 'GPU hardware context lost';
                console.warn(
                  `[WebGL] Context lost detected: ${reason}. Active retries: ${retryCountRef.current}/2`
                );

                if (retryCountRef.current < 2) {
                  retryCountRef.current += 1;
                  setRecoveryState('restoring');
                  setRecoveryMessage(
                    `Auto-optimizing 3D graphics for your device (attempt ${retryCountRef.current}/2)...`
                  );

                  // Automatically step down to low/safe mode to prevent repeated crashes
                  gameStore.set({ graphicsQuality: 'low' });

                  if (restoreTimeoutRef.current) clearTimeout(restoreTimeoutRef.current);
                  restoreTimeoutRef.current = setTimeout(() => {
                    console.log('[WebGL] Automatically restoring 3D canvas in Safe Mode...');
                    setRecoveryState('active');
                    setCanvasKey((k) => k + 1);
                  }, 1200);
                } else {
                  console.warn('[WebGL] Automatic retries exhausted. Presenting safe recovery options.');
                  setRecoveryState('failed');
                  setRecoveryMessage(
                    'Graphics connection paused. You can resume smoothly in Safe Mode or Romantic 2D Sanctuary.'
                  );
                }
              };

              const handleContextRestored = () => {
                console.log('[WebGL] Context successfully restored.');
                retryCountRef.current = 0;
                if (restoreTimeoutRef.current) clearTimeout(restoreTimeoutRef.current);
                setRecoveryState('active');
              };

              canvasEl.addEventListener('webglcontextlost', handleContextLost, false);
              canvasEl.addEventListener('webglcontextrestored', handleContextRestored, false);
            }}
            className="w-full h-full"
          >
            <Suspense fallback={<Romantic3DLoader />}>
              <Experience
                keyboardControls={keyboardControls}
                joystickVector={joystickVector}
              />
            </Suspense>
          </Canvas>
        ) : null}
      </CanvasErrorBoundary>

      {/* WebGL Genuine In-Flight Recovery Indicator Overlay */}
      {recoveryState === 'restoring' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0b0813]/90 backdrop-blur-sm select-none p-6">
          <div className="glass-panel-gold rounded-3xl p-8 max-w-sm w-full text-center space-y-4 border border-amber-300/40 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center mx-auto text-rose-300 animate-spin">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-cinzel text-lg font-bold text-amber-200">
              Restoring 3D Sanctuary...
            </h3>
            <p className="text-xs text-rose-200/90 leading-relaxed font-light">
              {recoveryMessage || 'Adapting graphics resources for smooth performance.'}
            </p>
          </div>
        </div>
      )}

      {/* Safe Fallback Modal (Displayed if automatic recovery timed out or WebGL unavailable) */}
      {(recoveryState === 'failed' || !webglSupported) && !is2DMode && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0b0813]/95 backdrop-blur-md select-none p-6">
          <div className="glass-panel-gold rounded-3xl p-8 max-w-md w-full text-center space-y-5 border-2 border-rose-400/50 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center mx-auto text-amber-300">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="font-cinzel text-xl font-bold text-amber-200">
              3D Sanctuary Notice
            </h3>

            <p className="text-xs text-rose-200/90 leading-relaxed font-light">
              {recoveryMessage ||
                "Your device's graphics driver paused. All your custom photos, letters, and progress are completely safe!"}
            </p>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={handleLaunchSafeMode}
                className="btn-gold w-full py-3 px-4 text-xs font-bold shadow-lg flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-amber-950" />
                <span>Launch in Safe Mode (Smooth 3D)</span>
              </button>
              <button
                onClick={handleLaunch2DMode}
                className="btn-romantic w-full py-2.5 px-4 text-xs font-bold shadow-lg flex items-center justify-center gap-1.5"
              >
                <Heart className="w-4 h-4 text-rose-300 fill-rose-300" />
                <span>Explore in Romantic 2D Sanctuary (No GPU Required)</span>
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleRetrySanctuary}
                  className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs text-gray-200 font-medium flex-1 flex items-center justify-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-white" />
                  <span>Retry Standard 3D</span>
                </button>
                <button
                  onClick={handleReturnToLanding}
                  className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs text-gray-200 font-medium flex items-center justify-center gap-1.5 transition"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Room Selection</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2D Romantic Sanctuary (when active) */}
      {is2DMode && (
        <RomanticSafeModeGallery
          onSwitchTo3D={() => {
            setIs2DMode(false);
            setRecoveryState('active');
            setCanvasKey((k) => k + 1);
          }}
        />
      )}

      {/* 3. Room Navigation Bar (Museum -> Concert -> Ballroom -> Bedroom) */}
      {!is2DMode && <RoomNavigationHUD audioManager={audioManager} />}

      {/* 4. Creator Studio Editing Panel (Creator Mode Only) */}
      {!is2DMode && <CreatorPanel />}

      {/* 5. In-Game Heads-Up Display (Progress, Prompts, Action Banners) */}
      {!is2DMode && <HUD audioManager={audioManager} />}

      {/* 6. Mobile Virtual Joystick & Touch Controls */}
      {!is2DMode && (
        <MobileJoystick
          onJoystickMove={setJoystickVector}
          audioManager={audioManager}
        />
      )}

      {/* 7. Memory Letter Modal */}
      <LetterModal />

      {/* 8. Special Gold-foiled Birthday Letter Modal */}
      <BirthdayLetterModal />

      {/* 9. Final Scene Climax Overlay */}
      <FinalSceneOverlay />

      {/* 11. Fullscreen Photo Inspector Modal */}
      <PhotoModal />

      {/* 12. Cinematic Loading Screen */}
      <Loader
        containerStyles={{
          backgroundColor: '#0b0813',
          zIndex: 9999,
        }}
        innerStyles={{
          backgroundColor: '#2d1d36',
          width: '240px',
        }}
        barStyles={{
          backgroundColor: '#ff758c',
          height: '4px',
        }}
        dataStyles={{
          color: '#e6b980',
          fontFamily: "'Playfair Display', serif",
          fontSize: '14px',
        }}
        dataInterpolation={(p) => `Preparing Your Romantic World... ${p.toFixed(0)}%`}
      />
    </div>
  );
}
