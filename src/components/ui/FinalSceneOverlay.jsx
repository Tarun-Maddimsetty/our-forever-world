import React, { useEffect } from 'react';
import { Heart, Sparkles, RotateCcw } from 'lucide-react';
import { gameStore, useGameStore } from '../../hooks/useGameStore';
import { BIRTHDAY_CONTENT } from '../../data/birthdayContent';
import confetti from 'canvas-confetti';

export default function FinalSceneOverlay() {
  const bedroomStep = useGameStore((s) => s.bedroomStep);

  useEffect(() => {
    if (bedroomStep === 'final') {
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#ff758c', '#ffd700', '#ff2d55', '#ffffff'],
      });
    }
  }, [bedroomStep]);

  if (bedroomStep !== 'final') return null;

  const content = BIRTHDAY_CONTENT.bedroom.finalScene;

  const handleRevisit = () => {
    gameStore.revisitMuseum();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/60 backdrop-blur-sm text-center animate-fade-in pointer-events-auto">
      <div className="max-w-xl w-full glass-panel-gold rounded-3xl p-8 sm:p-12 shadow-2xl border-2 border-amber-300/50 space-y-6">
        {/* Pulsing Sacred Heart */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-gradient-to-tr from-rose-600 to-amber-300 flex items-center justify-center shadow-2xl shadow-rose-600/40 border-4 border-amber-200/50">
          <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-white fill-white animate-pulse" />
        </div>

        {/* The Two Quotes */}
        <div className="space-y-4">
          <p className="font-serif-romantic italic text-lg sm:text-2xl text-rose-200/90 leading-relaxed font-medium">
            "{content.quotePart1}"
          </p>

          <h2 className="font-cinzel text-2xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-200 to-amber-100 tracking-wider">
            {content.quotePart2}
          </h2>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-3 py-2">
          <div className="w-12 h-px bg-amber-400/40" />
          <Sparkles className="w-4 h-4 text-amber-300" />
          <div className="w-12 h-px bg-amber-400/40" />
        </div>

        {/* Revisit Memories Button */}
        <button
          onClick={handleRevisit}
          className="btn-gold py-4 px-8 text-sm sm:text-base font-bold shadow-2xl transition duration-300 group inline-flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4 text-amber-950 transition-transform group-hover:-rotate-90" />
          <span>{content.revisitButton}</span>
          <Heart className="w-4 h-4 text-rose-700 fill-rose-700" />
        </button>
      </div>
    </div>
  );
}
