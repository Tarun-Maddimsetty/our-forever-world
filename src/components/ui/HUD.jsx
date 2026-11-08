import React from 'react';
import {
  Heart,
  Volume2,
  VolumeX,
  Sparkles,
  Sliders,
  ChevronRight,
  Gift,
  KeyRound,
  DoorOpen,
  Eye,
  Image as ImageIcon,
} from 'lucide-react';
import { gameStore, useGameStore } from '../../hooks/useGameStore';
import { BIRTHDAY_CONTENT } from '../../data/birthdayContent';
import { romanticAudio } from '../../hooks/useAudioManager';

export default function HUD({ audioManager }) {
  const mode = useGameStore((s) => s.mode);
  const currentRoom = useGameStore((s) => s.currentRoom);
  const scene = currentRoom;
  const bedroomStep = useGameStore((s) => s.bedroomStep);
  const memoriesRead = useGameStore((s) => s.memoriesRead);
  const nearbyObject = useGameStore((s) => s.nearbyObject);
  const isMuted = useGameStore((s) => s.isAudioMuted);
  const graphicsQuality = useGameStore((s) => s.graphicsQuality);

  if (mode === 'landing') return null;

  const totalMemories = 7;
  const readCount = memoriesRead.length;
  const allRead = readCount >= totalMemories;

  const toggleQuality = () => {
    gameStore.set((s) => {
      const nextQuality =
        s.graphicsQuality === 'high' ? 'medium' : s.graphicsQuality === 'medium' ? 'low' : 'high';
      return { graphicsQuality: nextQuality };
    });
  };

  const handleInteract = () => {
    if (!nearbyObject) return;
    if (nearbyObject.type === 'bedroom_letter') {
      romanticAudio.playSparkle();
      gameStore.set({ isBirthdayLetterModalOpen: true });
    } else if (nearbyObject.type === 'memory' && nearbyObject.memory) {
      gameStore.openMemoryLetter(nearbyObject.memory);
    } else if (nearbyObject.type === 'door') {
      audioManager.playDoorSound();
      if (nearbyObject.targetRoom) {
        gameStore.navigateToRoom(nearbyObject.targetRoom);
      } else {
        gameStore.enterBedroom();
      }
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Top Bar: Progress & Controls */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        {/* Memories Counter with 7 Glowing Hearts */}
        <div className="glass-panel rounded-full px-4 sm:px-5 py-2.5 flex items-center gap-3 shadow-lg">
          <div className="flex items-center gap-1">
            <span className="text-xs sm:text-sm font-semibold text-rose-200">
              Memories discovered:
            </span>
            <span className="font-bold text-amber-300 text-xs sm:text-sm ml-1">
              {readCount} / {totalMemories}
            </span>
          </div>

          {/* 7 Interactive Heart Badges */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((num) => {
              const isFilled = memoriesRead.includes(num);
              return (
                <div
                  key={num}
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isFilled
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/50 scale-110'
                      : 'bg-white/10 text-white/30 border border-white/10'
                  }`}
                >
                  <Heart
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${
                      isFilled ? 'fill-white' : ''
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Audio Mute & Graphics Quality Toggles */}
        <div className="flex items-center gap-2">
          {/* Quality Toggle with Badge (LOW | MED | HIGH) */}
          <button
            id="btn-toggle-quality"
            onClick={toggleQuality}
            className={`glass-panel px-2.5 sm:px-3 h-10 sm:h-11 rounded-full flex items-center gap-1.5 transition shadow-lg ${
              graphicsQuality === 'high'
                ? 'text-amber-200 border-amber-300/40'
                : graphicsQuality === 'medium'
                ? 'text-sky-200 border-sky-400/40'
                : 'text-emerald-300 border-emerald-400/40'
            }`}
            title={`Toggle Graphics Quality (Current: ${graphicsQuality.toUpperCase()})`}
          >
            <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-xs font-bold tracking-wider">
              {graphicsQuality === 'high' ? 'HD' : graphicsQuality === 'medium' ? 'MED' : 'SAFE'}
            </span>
          </button>

          {/* Mute Audio Button */}
          <button
            onClick={() => audioManager.toggleMute()}
            className="glass-panel w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-rose-300 hover:text-white transition shadow-lg"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Completion Banner (when all 7 letters read while in museum) */}
      {scene === 'museum' && allRead && (
        <div className="self-center glass-panel-gold rounded-full px-5 py-2.5 shadow-xl border border-amber-300/50 flex items-center gap-2 animate-bounce pointer-events-auto">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span className="text-xs sm:text-sm font-semibold text-amber-100">
            {BIRTHDAY_CONTENT.museum.allMemoriesUnlockedBanner}
          </span>
          <DoorOpen className="w-4 h-4 text-rose-400 ml-1" />
        </div>
      )}

      {/* Scripted Bedroom Dialogue Cards */}
      {scene === 'bedroom' && (
        <div className="self-center max-w-lg w-[92%] pointer-events-auto animate-fade-in mb-4">
          {bedroomStep === 'greeting' && (
            <div className="glass-panel-gold rounded-3xl p-5 text-center shadow-2xl border-2 border-amber-300/40 space-y-3">
              <h2 className="font-cinzel text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-200 to-amber-100">
                {BIRTHDAY_CONTENT.bedroom.maleGreetingBanner}
              </h2>
              <p className="text-xs sm:text-sm text-gray-200 font-serif-romantic italic">
                {BIRTHDAY_CONTENT.bedroom.maleGreetingSubtitle}
              </p>
              <button
                onClick={() => {
                  romanticAudio.playSparkle();
                  gameStore.nextBedroomStep('necklace');
                }}
                className="btn-gold py-2.5 px-6 text-xs sm:text-sm font-bold mx-auto"
              >
                <span>A Special Gift</span>
                <Gift className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}

          {bedroomStep === 'necklace' && (
            <div className="glass-panel-gold rounded-3xl p-5 text-center shadow-2xl border-2 border-amber-300/40 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{BIRTHDAY_CONTENT.bedroom.necklaceSparkleText}</span>
              </div>
              <p className="text-xs sm:text-sm text-rose-100 font-serif-romantic leading-relaxed">
                "{BIRTHDAY_CONTENT.bedroom.necklaceIntro}"
              </p>
              <button
                onClick={() => {
                  romanticAudio.playSparkle();
                  gameStore.nextBedroomStep('letter');
                  gameStore.set({ isBirthdayLetterModalOpen: true });
                }}
                className="btn-gold py-2.5 px-6 text-xs sm:text-sm font-bold mx-auto"
              >
                <span>{BIRTHDAY_CONTENT.bedroom.letterButtonText}</span>
              </button>
            </div>
          )}

          {bedroomStep === 'letter' && (
            <div className="glass-panel rounded-2xl p-4 text-center shadow-lg flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-200">
                {BIRTHDAY_CONTENT.bedroom.envelopePrompt}
              </span>
              <button
                onClick={() => gameStore.set({ isBirthdayLetterModalOpen: true })}
                className="btn-romantic py-1.5 px-4 text-xs font-bold"
              >
                Open Letter
              </button>
            </div>
          )}
        </div>
      )}

      {/* Proximity Interaction Buttons (Desktop & Mobile) */}
      {nearbyObject && (
        <div className="self-center pointer-events-auto animate-bounce mb-6">
          {nearbyObject.type === 'memory' ? (
            <div className="glass-panel-gold rounded-3xl p-2.5 flex items-center gap-3 border-2 border-amber-300 shadow-2xl">
              <button
                id="btn-view-photo"
                onClick={() => {
                  romanticAudio.playSparkle();
                  gameStore.set({
                    isPhotoModalOpen: true,
                    selectedPhoto: nearbyObject.memory,
                  });
                }}
                className="btn-gold py-3 px-5 text-xs sm:text-sm font-bold shadow-xl flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4 text-amber-950" />
                <span>VIEW PHOTO 🖼️</span>
                <span className="hidden sm:inline text-[11px] text-amber-900 font-normal">([V])</span>
              </button>

              <button
                id="btn-view-letter"
                onClick={() => {
                  romanticAudio.playSparkle();
                  gameStore.openMemoryLetter(nearbyObject.memory);
                }}
                className="btn-romantic py-3 px-5 text-xs sm:text-sm font-bold shadow-xl flex items-center gap-2"
              >
                <Heart className="w-4 h-4 fill-white text-white" />
                <span>VIEW LETTER 📜</span>
                <span className="hidden sm:inline text-[11px] text-rose-200 font-normal">([E])</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleInteract}
              className="btn-gold py-3.5 px-7 text-sm sm:text-base font-bold shadow-2xl flex items-center gap-2 border-2 border-amber-300"
            >
              {nearbyObject.type === 'door' ? (
                <>
                  <KeyRound className="w-4 h-4 text-amber-950" />
                  <span>
                    {nearbyObject.direction === 'return'
                      ? `OPEN DOOR: Return to ${nearbyObject.targetRoom.toUpperCase()} ([E])`
                      : `OPEN DOOR: Enter ${nearbyObject.targetRoom ? nearbyObject.targetRoom.toUpperCase() : 'NEXT ROOM'} ([E])`}
                  </span>
                </>
              ) : nearbyObject.type === 'bedroom_letter' ? (
                <>
                  <Heart className="w-4 h-4 text-rose-700 fill-rose-700" />
                  <span>READ LETTER: Open Birthday Letter on Desk ([E])</span>
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 text-rose-700 fill-rose-700" />
                  <span>Interact ([E])</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
