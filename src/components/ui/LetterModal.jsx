import React, { useState, useEffect } from 'react';
import { X, Heart, Sparkles, MapPin, Calendar, Maximize2, Mail } from 'lucide-react';
import { gameStore, useGameStore } from '../../hooks/useGameStore';
import { romanticAudio } from '../../hooks/useAudioManager';

export default function LetterModal() {
  const activeMemory = useGameStore((s) => s.activeMemory);
  const isOpen = useGameStore((s) => s.isLetterModalOpen);
  const [isOpeningEnvelope, setIsOpeningEnvelope] = useState(true);

  // Trigger brief opening animation each time modal opens
  useEffect(() => {
    if (isOpen) {
      setIsOpeningEnvelope(true);
      const timer = setTimeout(() => setIsOpeningEnvelope(false), 550);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen || !activeMemory) return null;

  const handleClose = () => {
    gameStore.closeMemoryLetter();
  };

  const handleViewFullPhoto = () => {
    gameStore.set({
      isPhotoModalOpen: true,
      selectedPhoto: activeMemory,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      {isOpeningEnvelope ? (
        <div className="flex flex-col items-center justify-center text-center p-8 glass-panel-gold rounded-3xl border-2 border-amber-300 animate-pulse shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500 to-amber-300 flex items-center justify-center shadow-lg mb-3">
            <Mail className="w-10 h-10 text-white animate-bounce" />
          </div>
          <span className="font-serif-romantic text-lg font-bold text-amber-100">
            Unsealing Memory Love Letter...
          </span>
          <span className="text-xs text-rose-200 mt-1">Written with all his love ❤️</span>
        </div>
      ) : (
        <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col parchment rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-600/30">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-100/80 via-rose-50/80 to-amber-100/80 border-b border-amber-900/15">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-xs shadow">
              {activeMemory.id}
            </span>
            <div>
              <h3 className="font-serif-romantic font-bold text-gray-900 text-base sm:text-lg leading-tight">
                {activeMemory.title}
              </h3>
              <div className="flex items-center gap-3 text-xs text-gray-600 font-medium">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-rose-500" />
                  {activeMemory.date}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-500" />
                  {activeMemory.location}
                </span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-rose-100 hover:bg-rose-200 text-gray-700 hover:text-rose-700 flex items-center justify-center transition-colors shadow-sm"
            aria-label="Close letter"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Letter Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 parchment-scroll space-y-6">
          {/* Photo Thumbnail with Zoom Prompt */}
          <div
            onClick={handleViewFullPhoto}
            className="relative mx-auto w-40 sm:w-48 h-48 sm:h-56 rounded-2xl overflow-hidden border-4 border-amber-200/90 shadow-lg cursor-pointer group hover:scale-[1.02] transition-transform"
          >
            <img
              src={activeMemory.image}
              alt={activeMemory.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="px-3 py-1 bg-black/60 rounded-full text-white text-xs flex items-center gap-1 backdrop-blur-sm">
                <Maximize2 className="w-3 h-3" /> View Photo
              </span>
            </div>
          </div>

          {/* The Written Love Letter */}
          <div className="space-y-4 text-gray-900">
            <div className="font-handwriting text-2xl sm:text-3xl text-rose-900 leading-relaxed whitespace-pre-line">
              {activeMemory.letter}
            </div>
          </div>

          {/* Wax Seal Stamp & Heart */}
          <div className="pt-4 flex items-center justify-between border-t border-amber-900/15">
            <div className="flex items-center gap-2">
              <div className="wax-seal">
                <span>❤️</span>
              </div>
              <div className="text-xs text-amber-900/80 font-marcellus">
                <span>Memory Kept In Eternity</span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="btn-romantic py-2 px-5 text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-md"
            >
              <span>Continue Exploring</span>
              <Heart className="w-3.5 h-3.5 fill-white" />
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
