import React from 'react';
import {
  Heart,
  Music,
  Mic,
  Sliders,
  Volume2,
  VolumeX,
  Sparkles,
  Gift,
  Home,
  Play,
  Pause,
  Square,
  Radio,
  Eye,
  ArrowLeft,
} from 'lucide-react';
import { gameStore, useGameStore } from '../../hooks/useGameStore';
import { romanticAudio } from '../../hooks/useAudioManager';

export default function RoomNavigationHUD({ audioManager }) {
  const mode = useGameStore((s) => s.mode);
  const isPreviewMode = useGameStore((s) => s.isPreviewMode);
  const currentRoom = useGameStore((s) => s.currentRoom);
  const specialAction = useGameStore((s) => s.specialAction);
  const timeRemaining = useGameStore((s) => s.specialActionTimeRemaining);
  const isMuted = useGameStore((s) => s.isAudioMuted);
  const graphicsQuality = useGameStore((s) => s.graphicsQuality);
  const roomData = useGameStore((s) => s.roomData);

  const isMusicPlaying = useGameStore((s) => s.isMusicPlaying);
  const isSingingPlaying = useGameStore((s) => s.isSingingPlaying);
  const isDanceMusicPlaying = useGameStore((s) => s.isDanceMusicPlaying);
  const isVoicePlaying = useGameStore((s) => s.isVoicePlaying);
  const activeAudioTrack = useGameStore((s) => s.activeAudioTrack);

  if (mode === 'landing') return null;

  const roomsList = [
    { id: 'museum', name: 'Museum', icon: Home },
    { id: 'singing', name: 'Concert', icon: Mic },
    { id: 'dancing', name: 'Ballroom', icon: Music },
    { id: 'bedroom', name: 'Bedroom', icon: Gift },
  ];

  const handleRoomClick = (roomId) => {
    romanticAudio.playSparkle();
    gameStore.navigateToRoom(roomId);
  };

  const handleOpenCreatorStudio = () => {
    gameStore.set({ creatorEditPanel: 'museum' });
  };

  const handleTriggerHug = () => {
    romanticAudio.playSparkle();
    gameStore.triggerSpecialAction('hug', 4);
  };

  const handleTriggerKiss = () => {
    romanticAudio.playSparkle();
    gameStore.triggerSpecialAction('kiss', 4);
  };

  const toggleQuality = () => {
    gameStore.set((s) => ({
      graphicsQuality: s.graphicsQuality === 'high' ? 'low' : 'high',
    }));
  };

  // Background Music Handlers
  const handleToggleBackgroundMusic = () => {
    if (isMusicPlaying) {
      audioManager?.pauseBackgroundMusic();
    } else {
      audioManager?.playBackgroundMusic();
    }
  };

  const handleStopBackgroundMusic = () => {
    audioManager?.stopBackgroundMusic();
  };

  // Singing Performance Handlers
  const handleToggleSinging = () => {
    if (isSingingPlaying) {
      audioManager?.pauseSingingAudio();
    } else {
      const songUrl = roomData?.singingConfiguration?.songAudioUrl;
      audioManager?.playSingingAudio(songUrl);
    }
  };

  const handleStopSinging = () => {
    audioManager?.stopSingingAudio();
  };

  // Dance Music Handlers
  const handleToggleDance = () => {
    if (isDanceMusicPlaying) {
      audioManager?.pauseDanceMusic();
    } else {
      const danceUrl = roomData?.dancingConfiguration?.musicTrackUrl;
      audioManager?.playDanceMusic(danceUrl);
    }
  };

  const handleStopDance = () => {
    audioManager?.stopDanceMusic();
  };

  // Bedroom Personal Voice Message Handlers
  const handleToggleVoice = () => {
    if (isVoicePlaying) {
      audioManager?.pauseVoice();
    } else {
      const voiceUrl = roomData?.bedroomConfiguration?.voiceRecordingUrl;
      audioManager?.playVoice(voiceUrl);
    }
  };

  const handleStopVoice = () => {
    audioManager?.stopVoice();
  };

  return (
    <div className="fixed top-4 inset-x-4 z-40 flex flex-col items-center gap-2 pointer-events-none select-none">
      {/* Creator Preview Mode Floating Bar */}
      {isPreviewMode && (
        <div className="pointer-events-auto flex items-center justify-between w-full max-w-5xl glass-panel-gold rounded-2xl px-4 sm:px-6 py-2 border-2 border-amber-400 shadow-2xl animate-slide-down">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-950">
            <Eye className="w-4 h-4 text-rose-700 animate-pulse" />
            <span>CREATOR PREVIEW MODE — Testing All Interactions as Visitor</span>
          </div>
          <button
            onClick={() => gameStore.exitPreviewMode()}
            className="btn-romantic py-1.5 px-4 text-xs font-bold shadow-md flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Edit Studio</span>
          </button>
        </div>
      )}

      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between w-full max-w-5xl pointer-events-auto">
        {/* Left: Room Breadcrumbs */}
        <div className="glass-panel rounded-full px-2 py-1.5 flex items-center gap-1 shadow-xl">
          {roomsList.map((r) => {
            const Icon = r.icon;
            const isCurrent = currentRoom === r.id;
            return (
              <button
                key={r.id}
                onClick={() => handleRoomClick(r.id)}
                className={`py-1.5 px-3 sm:px-4 rounded-full text-xs font-bold flex items-center gap-1.5 transition ${
                  isCurrent
                    ? 'bg-gradient-to-r from-amber-400 to-rose-400 text-black shadow-md font-extrabold'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{r.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Studio / Preview / Mute / Quality Controls */}
        <div className="flex items-center gap-2">
          {mode === 'creator' && !isPreviewMode && (
            <>
              <button
                onClick={() => gameStore.enterPreviewMode(currentRoom)}
                className="btn-romantic py-2 px-3 sm:px-4 text-xs font-bold shadow-xl flex items-center gap-1.5"
                title="Preview entire experience as visitor"
              >
                <Eye className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">Preview as Visitor</span>
              </button>
              <button
                onClick={handleOpenCreatorStudio}
                className="btn-gold py-2 px-3 sm:px-4 text-xs font-bold shadow-xl flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-950" />
                <span>Edit Room Studio</span>
              </button>
            </>
          )}

          {/* Graphics Quality */}
          <button
            onClick={toggleQuality}
            className="glass-panel w-9 h-9 rounded-full flex items-center justify-center text-amber-200 hover:text-white transition shadow"
            title={`Toggle Quality (${graphicsQuality.toUpperCase()})`}
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Audio Mute */}
          <button
            onClick={() => audioManager?.toggleMute()}
            className={`glass-panel w-9 h-9 rounded-full flex items-center justify-center transition shadow ${
              isMuted ? 'text-gray-400 bg-red-500/20' : 'text-rose-300 hover:text-white'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Explicit Audio Controls Toolbar */}
      <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 mt-1">
        {/* Background Romantic Music Bar */}
        <div className="glass-panel rounded-full px-3 py-1 flex items-center gap-2 shadow-lg border border-amber-300/20 text-xs">
          <span className="text-amber-200/80 font-medium hidden sm:inline flex items-center gap-1">
            <Radio className="w-3 h-3 text-rose-400" />
            Romantic Melody:
          </span>

          <button
            onClick={handleToggleBackgroundMusic}
            className={`px-3 py-1 rounded-full font-bold flex items-center gap-1 transition ${
              isMusicPlaying
                ? 'bg-amber-400 text-amber-950 shadow'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isMusicPlaying ? 'Pause Melody' : 'Play Romantic Melody'}
          >
            {isMusicPlaying ? (
              <>
                <Pause className="w-3 h-3 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Play Melody</span>
              </>
            )}
          </button>

          {isMusicPlaying && (
            <button
              onClick={handleStopBackgroundMusic}
              className="p-1 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition"
              title="Stop Melody"
            >
              <Square className="w-3 h-3 fill-current" />
            </button>
          )}
        </div>

        {/* Concert Room Specific Audio Player */}
        {currentRoom === 'singing' && (
          <div className="glass-panel rounded-full px-3 py-1 flex items-center gap-2 shadow-lg border border-rose-400/40 text-xs animate-fade-in bg-rose-950/40">
            <Mic className="w-3.5 h-3.5 text-rose-300" />
            <span className="text-rose-200 font-semibold">Concert Song:</span>

            <button
              onClick={handleToggleSinging}
              className={`px-3 py-1 rounded-full font-bold flex items-center gap-1 transition ${
                isSingingPlaying
                  ? 'bg-rose-500 text-white shadow'
                  : 'bg-rose-500/30 text-rose-100 hover:bg-rose-500/50'
              }`}
            >
              {isSingingPlaying ? (
                <>
                  <Pause className="w-3 h-3 fill-current" />
                  <span>Pause Song</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Play Song 🎤</span>
                </>
              )}
            </button>

            {isSingingPlaying && (
              <button
                onClick={handleStopSinging}
                className="p-1 rounded-full text-rose-300 hover:text-white hover:bg-rose-500/20 transition"
                title="Stop Song"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            )}
          </div>
        )}

        {/* Ballroom Specific Dance Music Player */}
        {currentRoom === 'dancing' && (
          <div className="glass-panel rounded-full px-3 py-1 flex items-center gap-2 shadow-lg border border-amber-400/40 text-xs animate-fade-in bg-amber-950/40">
            <Music className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-amber-200 font-semibold">Ballroom Dance:</span>

            <button
              onClick={handleToggleDance}
              className={`px-3 py-1 rounded-full font-bold flex items-center gap-1 transition ${
                isDanceMusicPlaying
                  ? 'bg-amber-400 text-amber-950 shadow'
                  : 'bg-amber-400/30 text-amber-100 hover:bg-amber-400/50'
              }`}
            >
              {isDanceMusicPlaying ? (
                <>
                  <Pause className="w-3 h-3 fill-current" />
                  <span>Pause Dance</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>START DANCING 💃🕺</span>
                </>
              )}
            </button>

            {isDanceMusicPlaying && (
              <button
                onClick={handleStopDance}
                className="p-1 rounded-full text-amber-300 hover:text-white hover:bg-amber-400/20 transition"
                title="Stop Dance"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            )}
          </div>
        )}

        {/* Bedroom Voice Note Player */}
        {currentRoom === 'bedroom' && (
          <div className="glass-panel rounded-full px-3 py-1 flex items-center gap-2 shadow-lg border border-rose-400/40 text-xs animate-fade-in bg-rose-950/40">
            <Radio className="w-3.5 h-3.5 text-rose-300" />
            <span className="text-rose-200 font-semibold">Voice Note:</span>

            <button
              onClick={handleToggleVoice}
              className={`px-3 py-1 rounded-full font-bold flex items-center gap-1 transition ${
                isVoicePlaying
                  ? 'bg-rose-500 text-white shadow'
                  : 'bg-rose-500/30 text-rose-100 hover:bg-rose-500/50'
              }`}
            >
              {isVoicePlaying ? (
                <>
                  <Pause className="w-3 h-3 fill-current" />
                  <span>Pause Voice</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Play Voice Note 🎙️</span>
                </>
              )}
            </button>

            {isVoicePlaying && (
              <button
                onClick={handleStopVoice}
                className="p-1 rounded-full text-rose-300 hover:text-white hover:bg-rose-500/20 transition"
                title="Stop Voice"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Special Action Timer Notification (During 4s Hug or 4s Kiss) */}
      {specialAction && (specialAction === 'hug' || specialAction === 'kiss') && (
        <div className="pointer-events-auto glass-panel-gold rounded-full px-5 py-2 shadow-2xl border-2 border-rose-400/60 flex items-center gap-2.5 animate-bounce">
          <Heart className="w-4 h-4 fill-rose-500 text-rose-500 animate-pulse" />
          <span className="text-xs sm:text-sm font-bold text-amber-100 uppercase tracking-wider">
            {specialAction === 'hug' ? 'Romantic Embrace...' : 'Gentle Romantic Kiss...'}
          </span>
          <span className="w-6 h-6 rounded-full bg-rose-500 text-white font-mono font-bold text-xs flex items-center justify-center">
            {timeRemaining}s
          </span>
        </div>
      )}

      {/* Interactive Options in Bedroom (HUG & KISS buttons) */}
      {currentRoom === 'bedroom' && !specialAction && (
        <div className="pointer-events-auto flex items-center gap-3 mt-1 animate-slide-up">
          <button
            onClick={handleTriggerHug}
            className="btn-romantic py-2 px-4 text-xs font-bold shadow-2xl flex items-center gap-1.5 border border-white/20"
          >
            <Heart className="w-3.5 h-3.5 fill-white" />
            <span>HUG ❤️ (4s)</span>
          </button>

          <button
            onClick={handleTriggerKiss}
            className="btn-gold py-2 px-4 text-xs font-bold shadow-2xl flex items-center gap-1.5 border border-amber-300"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-950" />
            <span>KISS 💋 (4s)</span>
          </button>
        </div>
      )}
    </div>
  );
}
