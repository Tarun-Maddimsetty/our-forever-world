import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, X, BookOpen, Mail } from 'lucide-react';
import { gameStore, useGameStore } from '../../hooks/useGameStore';
import { BIRTHDAY_CONTENT } from '../../data/birthdayContent';
import { romanticAudio } from '../../hooks/useAudioManager';

export default function BirthdayLetterModal() {
  const isOpen = useGameStore((s) => s.isBirthdayLetterModalOpen);
  const roomData = useGameStore((s) => s.roomData);
  const [isOpeningEnvelope, setIsOpeningEnvelope] = useState(true);

  // Trigger brief opening animation each time modal opens
  useEffect(() => {
    if (isOpen) {
      setIsOpeningEnvelope(true);
      const timer = setTimeout(() => setIsOpeningEnvelope(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Retrieve creator's custom birthday letter from persistent room configuration
  const savedLetter = roomData?.bedroomConfiguration?.birthdayLetter;
  const fallbackLetter = BIRTHDAY_CONTENT.bedroom.birthdayLetter;

  let salutation = savedLetter?.salutation || fallbackLetter.salutation || 'To My Dearest Wife,';
  let paragraphs = [];
  if (Array.isArray(savedLetter?.bodyParagraphs) && savedLetter.bodyParagraphs.length > 0) {
    paragraphs = savedLetter.bodyParagraphs;
  } else if (typeof savedLetter === 'string') {
    paragraphs = savedLetter.split('\n\n').filter(Boolean);
  } else {
    paragraphs = fallbackLetter.bodyParagraphs;
  }
  let closing = savedLetter?.closing || fallbackLetter.closing || 'With all my heart,';
  let signature = savedLetter?.signature || fallbackLetter.signature || 'Your Loving Husband ❤️';

  const handleClose = () => {
    gameStore.set({ isBirthdayLetterModalOpen: false });
  };

  const handleReadAgain = () => {
    const container = document.getElementById('birthday-letter-scroll');
    if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      {isOpeningEnvelope ? (
        <div className="flex flex-col items-center justify-center text-center p-8 glass-panel-gold rounded-3xl border-2 border-amber-300 animate-pulse shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500 to-amber-300 flex items-center justify-center shadow-lg mb-3">
            <Mail className="w-10 h-10 text-white animate-bounce" />
          </div>
          <span className="font-serif-romantic text-lg font-bold text-amber-100">
            Unsealing Your Birthday Love Letter...
          </span>
          <span className="text-xs text-rose-200 mt-1">Written with all his love ❤️</span>
        </div>
      ) : (
        <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col parchment rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-400/40 animate-fade-in">
          {/* Gold Leaf Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-200/90 via-rose-100/90 to-amber-200/90 border-b border-amber-900/20">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-700 animate-spin" style={{ animationDuration: '6s' }} />
              <h3 className="font-cinzel font-black text-amber-950 text-base sm:text-xl tracking-wider">
                A BIRTHDAY LETTER FOR MY WIFE
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-full bg-amber-200 hover:bg-amber-300 text-amber-950 flex items-center justify-center transition-colors shadow"
              aria-label="Close letter"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Parchment Letter */}
          <div id="birthday-letter-scroll" className="flex-1 overflow-y-auto p-6 sm:p-10 parchment-scroll space-y-6">
            <div className="font-calligraphy text-2xl sm:text-3xl text-rose-950 font-bold">
              {salutation}
            </div>

            <div className="space-y-4 font-serif-romantic text-base sm:text-lg text-gray-900 leading-relaxed whitespace-pre-line">
              {paragraphs.map((para, i) => (
                <p key={i} className="first-letter:text-3xl first-letter:font-bold first-letter:text-rose-800">
                  {para}
                </p>
              ))}
            </div>

            <div className="pt-4 text-right">
              <div className="font-serif-romantic italic text-rose-900 text-sm sm:text-base">
                {closing}
              </div>
              <div className="font-handwriting text-3xl sm:text-4xl text-rose-950 font-bold mt-1">
                {signature}
              </div>
            </div>
          </div>

          {/* Bottom Options Bar */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-100 via-rose-100 to-amber-100 border-t border-amber-900/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleReadAgain}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-rose-400 text-rose-900 hover:bg-rose-200/50 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
            >
              <BookOpen className="w-4 h-4 text-rose-700" />
              <span>Read Again</span>
            </button>

            <button
              onClick={handleClose}
              className="btn-gold w-full sm:w-auto px-7 py-3 text-sm sm:text-base font-bold shadow-xl flex items-center justify-center gap-2"
            >
              <span>Keep Letter Close & Continue ❤️</span>
              <Heart className="w-4 h-4 text-rose-700 fill-rose-700" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
