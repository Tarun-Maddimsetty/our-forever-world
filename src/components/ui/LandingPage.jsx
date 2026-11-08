import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, KeyRound, PlusCircle, Compass, ArrowRight, Loader2, Sliders, ShieldCheck } from 'lucide-react';
import { gameStore, useGameStore } from '../../hooks/useGameStore';
import { roomApi } from '../../services/roomApi';
import { romanticAudio } from '../../hooks/useAudioManager';

export default function LandingPage() {
  const graphicsQuality = useGameStore((s) => s.graphicsQuality);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Check URL parameters for direct cross-device room joining (e.g. ?room=ALWAYS-5373)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sharedCode = params.get('room') || params.get('join') || params.get('code');
      if (sharedCode) {
        setRoomCodeInput(sharedCode.trim().toUpperCase());
      }
    }
  }, []);

  const toggleGraphics = () => {
    gameStore.set({
      graphicsQuality:
        graphicsQuality === 'high' ? 'medium' : graphicsQuality === 'medium' ? 'low' : 'high',
    });
  };

  // Handle CREATOR Workflow
  const handleCreateRoom = async (forceNew = false) => {
    try {
      setIsCreating(true);
      setErrorMessage('');
      romanticAudio.init();
      romanticAudio.playSparkle();

      const cur = gameStore.get();
      if (!forceNew && cur.roomId && cur.creatorToken && cur.roomCode) {
        gameStore.set({
          mode: 'creator',
          currentRoom: 'museum',
          creatorEditPanel: 'museum',
        });
        return;
      }

      const data = await roomApi.createRoom();

      gameStore.set({
        mode: 'creator',
        roomId: data.roomId,
        roomCode: data.roomCode,
        creatorToken: data.creatorToken,
        isPublished: false,
        roomData: data.room,
        currentRoom: 'museum',
        creatorEditPanel: 'museum',
      });
    } catch (err) {
      console.error('Room creation fallback triggered:', err);
      const fallbackCode = 'LOVE-' + Math.floor(1000 + Math.random() * 9000);
      gameStore.set({
        mode: 'creator',
        roomId: 'room_' + Date.now(),
        roomCode: fallbackCode,
        creatorToken: 'token_' + Date.now(),
        isPublished: false,
        currentRoom: 'museum',
        creatorEditPanel: 'museum',
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Handle VISITOR Workflow
  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) {
      setErrorMessage('Please enter your special room code.');
      return;
    }

    try {
      setIsJoining(true);
      setErrorMessage('');
      romanticAudio.init();
      romanticAudio.playSparkle();

      const data = await roomApi.getRoom(roomCodeInput.trim());

      gameStore.set({
        mode: 'visitor',
        roomId: data.room.roomId,
        roomCode: data.room.roomCode,
        isPublished: true,
        roomData: data.room,
        currentRoom: 'museum',
        memoriesRead: [],
      });
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Invalid room code. Please check and try again.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-between p-6 bg-gradient-to-b from-[#0b0813]/90 via-[#190d1f]/85 to-[#0b0813]/95 backdrop-blur-md text-white select-none overflow-y-auto">
      {/* Background Anime Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-amber-400/10 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 text-center mt-4 sm:mt-6 animate-fade-in">
        <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-amber-300/30 text-amber-200 text-xs font-semibold uppercase tracking-widest shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Private Romantic 3D Sanctuary</span>
          </div>
          <button
            id="btn-landing-quality"
            type="button"
            onClick={toggleGraphics}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition shadow-lg ${
              graphicsQuality === 'high'
                ? 'bg-amber-500/20 text-amber-200 border-amber-300/40 hover:bg-amber-500/30'
                : graphicsQuality === 'medium'
                ? 'bg-sky-500/20 text-sky-200 border-sky-400/40 hover:bg-sky-500/30'
                : 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40 hover:bg-emerald-500/30'
            }`}
            title="Click to toggle Graphics Mode"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>
              {graphicsQuality === 'high'
                ? 'High Graphics ✨'
                : graphicsQuality === 'medium'
                ? 'Balanced 🌿'
                : 'Safe Mode ⚡'}
            </span>
          </button>
        </div>
        <h1 className="font-cinzel text-3xl sm:text-5xl md:text-6xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-200 to-amber-100 drop-shadow-md">
          OUR FOREVER WORLD
        </h1>
        <p className="font-serif-romantic italic text-rose-200/90 text-sm sm:text-lg mt-2">
          An Interactive Anime Birthday Adventure
        </p>
      </div>

      {/* Main Choice Cards: CREATE A ROOM vs JOIN A ROOM */}
      <div className="relative z-10 max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
        {/* Card 1: ROOM CREATOR – MAN */}
        <div className="glass-panel-gold rounded-3xl p-6 sm:p-8 flex flex-col justify-between border-2 border-amber-400/40 shadow-2xl hover:border-amber-300 transition-all duration-300">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-400 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4 border border-white/30">
              <PlusCircle className="w-7 h-7 text-white" />
            </div>

            <div className="text-xs font-bold text-amber-300 uppercase tracking-widest mb-1">
              For The Husband / Partner
            </div>
            <h2 className="font-cinzel text-2xl font-bold text-white mb-2">
              CREATE A ROOM
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-6 font-light">
              Craft a romantic world made only for her: place up to 7 memory photos with personal letters, upload your singing concert recording, and customize the bedroom surprise.
            </p>
          </div>

          <button
            id="btn-create-room"
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="btn-gold w-full py-4 px-6 text-sm sm:text-base font-bold shadow-xl flex items-center justify-center gap-2 group"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-950" />
                <span>Creating Your World...</span>
              </>
            ) : (
              <>
                <span>Enter Room Creator</span>
                <ArrowRight className="w-4 h-4 text-amber-950 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </div>

        {/* Card 2: ROOM VISITOR – WOMAN */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between border-2 border-rose-400/40 shadow-2xl hover:border-rose-300 transition-all duration-300">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-400 flex items-center justify-center shadow-lg shadow-rose-500/20 mb-4 border border-white/30">
              <KeyRound className="w-7 h-7 text-white" />
            </div>

            <div className="text-xs font-bold text-rose-300 uppercase tracking-widest mb-1">
              For The Wife / Birthday Girl
            </div>
            <h2 className="font-cinzel text-2xl font-bold text-white mb-2">
              JOIN A ROOM
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-4 font-light">
              Enter the special secret room code he gave you to step into the world he created for your birthday.
            </p>

            {/* Room Code Input Form */}
            <form onSubmit={handleJoinRoom} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-rose-200 mb-1">
                  Enter Your Private Room Code:
                </label>
                <input
                  type="text"
                  placeholder="e.g. LOVE-7391"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-rose-400/40 text-amber-200 placeholder-gray-500 font-mono font-bold tracking-widest text-center focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300 text-base"
                />
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-lg bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs text-center">
                  {errorMessage}
                </div>
              )}

              <button
                id="btn-join-room"
                type="submit"
                disabled={isJoining}
                className="btn-romantic w-full py-3.5 px-6 text-sm sm:text-base font-bold shadow-xl flex items-center justify-center gap-2 group mt-2"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Opening Your Sanctuary...</span>
                  </>
                ) : (
                  <>
                    <span>Join Room Now</span>
                    <Heart className="w-4 h-4 text-white fill-white transition-transform group-hover:scale-125" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center text-xs text-rose-300/70 font-marcellus pb-2">
        A private romantic world created with love • Desktop & Mobile Friendly
      </div>
    </div>
  );
}
