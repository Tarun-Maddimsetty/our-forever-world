import React from 'react';
import { Sparkles, Heart, Compass } from 'lucide-react';
import { gameStore } from '../../hooks/useGameStore';
import { BIRTHDAY_CONTENT } from '../../data/birthdayContent';

export default function CinematicOpening({ onEnter }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-between p-6 bg-gradient-to-b from-[#0b0813]/90 via-[#190d1f]/85 to-[#0b0813]/95 backdrop-blur-md text-white select-none">
      {/* Anime Starry Sky background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-amber-400/10 rounded-full blur-[120px]" />
      </div>

      {/* Top Title Banner */}
      <div className="relative z-10 text-center mt-6 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-amber-300/30 text-amber-200 text-xs font-semibold uppercase tracking-widest mb-3 shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Interactive 3D Romantic Museum</span>
        </div>
        <h1 className="font-cinzel text-3xl sm:text-5xl md:text-6xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-200 to-amber-100 drop-shadow-md">
          {BIRTHDAY_CONTENT.opening.headline}
        </h1>
        <p className="font-serif-romantic italic text-rose-200/90 text-sm sm:text-lg mt-2">
          {BIRTHDAY_CONTENT.opening.subheadline}
        </p>
      </div>

      {/* Center Romantic Card */}
      <div className="relative z-10 max-w-lg w-full glass-panel-gold rounded-3xl p-6 sm:p-8 text-center animate-float">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-gradient-to-tr from-rose-500 to-amber-300 flex items-center justify-center shadow-xl shadow-rose-500/25 mb-4 border-2 border-white/40">
          <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white animate-pulse" />
        </div>

        <h2 className="font-serif-romantic text-xl sm:text-2xl font-bold text-amber-100 mb-2">
          {BIRTHDAY_CONTENT.opening.welcomeText}
        </h2>
        <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-6 font-light">
          Step into a world woven from our most treasured memories, heartfelt letters, and a special birthday surprise awaiting you in our sanctuary.
        </p>

        {/* Enter World Button */}
        <button
          onClick={onEnter}
          className="btn-gold w-full py-4 px-6 text-sm sm:text-base font-bold shadow-2xl transition duration-300 group"
        >
          <span>{BIRTHDAY_CONTENT.opening.enterButtonText}</span>
          <Heart className="w-4 h-4 text-rose-800 fill-rose-800 transition-transform group-hover:scale-125" />
        </button>

        {/* Quick Controls Tip */}
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center gap-2 text-[11px] text-gray-400">
          <Compass className="w-3.5 h-3.5 text-amber-300" />
          <span className="hidden sm:inline">{BIRTHDAY_CONTENT.opening.instructionsDesktop}</span>
          <span className="sm:hidden">{BIRTHDAY_CONTENT.opening.instructionsMobile}</span>
        </div>
      </div>

      {/* Footer message */}
      <div className="relative z-10 text-center text-xs text-rose-300/70 font-marcellus pb-2">
        Crafted with endless love for your special day • Forever & Always
      </div>
    </div>
  );
}
