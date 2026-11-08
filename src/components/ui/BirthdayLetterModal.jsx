import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, X, BookOpen, Mail, Edit3, Save, Check, Loader2 } from 'lucide-react';
import { gameStore, useGameStore } from '../../hooks/useGameStore';
import { BIRTHDAY_CONTENT } from '../../data/birthdayContent';
import { romanticAudio } from '../../hooks/useAudioManager';
import { roomApi } from '../../services/roomApi';

export default function BirthdayLetterModal() {
  const isOpen = useGameStore((s) => s.isBirthdayLetterModalOpen);
  const roomData = useGameStore((s) => s.roomData);
  const roomId = useGameStore((s) => s.roomId);
  const creatorToken = useGameStore((s) => s.creatorToken);
  const mode = useGameStore((s) => s.mode);
  const isPreviewMode = useGameStore((s) => s.isPreviewMode);

  const [isOpeningEnvelope, setIsOpeningEnvelope] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editSalutation, setEditSalutation] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editClosing, setEditClosing] = useState('');
  const [editSignature, setEditSignature] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const canEdit = mode === 'creator' && !isPreviewMode && Boolean(creatorToken);

  // Retrieve creator's custom birthday letter from persistent room configuration
  const savedLetter = roomData?.bedroomConfiguration?.birthdayLetter;
  const fallbackLetter = BIRTHDAY_CONTENT.bedroom.birthdayLetter;

  let currentSalutation = savedLetter?.salutation || fallbackLetter.salutation || 'To My Dearest, Most Beautiful Wife,';
  let currentParagraphs = [];
  if (Array.isArray(savedLetter?.bodyParagraphs) && savedLetter.bodyParagraphs.length > 0) {
    currentParagraphs = savedLetter.bodyParagraphs;
  } else if (typeof savedLetter === 'string') {
    currentParagraphs = savedLetter.split('\n\n').filter(Boolean);
  } else {
    currentParagraphs = fallbackLetter.bodyParagraphs;
  }
  let currentClosing = savedLetter?.closing || fallbackLetter.closing || 'With all my heart and my entire soul,';
  let currentSignature = savedLetter?.signature || fallbackLetter.signature || 'Your Loving Husband ❤️';

  // Sync edit state whenever letter or modal opens
  useEffect(() => {
    if (isOpen) {
      setIsOpeningEnvelope(true);
      const timer = setTimeout(() => setIsOpeningEnvelope(false), 500);
      setEditSalutation(currentSalutation);
      setEditBody(currentParagraphs.join('\n\n'));
      setEditClosing(currentClosing);
      setEditSignature(currentSignature);
      setIsEditing(false);
      setSaveSuccess(false);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    gameStore.set({ isBirthdayLetterModalOpen: false });
  };

  const handleReadAgain = () => {
    const container = document.getElementById('birthday-letter-scroll');
    if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveLetter = async () => {
    try {
      setIsSaving(true);
      romanticAudio.playSparkle();

      const newParagraphs = editBody.split('\n\n').map((p) => p.trim()).filter(Boolean);
      const updatedLetterObj = {
        salutation: editSalutation.trim() || currentSalutation,
        bodyParagraphs: newParagraphs.length > 0 ? newParagraphs : currentParagraphs,
        closing: editClosing.trim() || currentClosing,
        signature: editSignature.trim() || currentSignature,
      };

      const newConfig = {
        ...roomData,
        bedroomConfiguration: {
          ...roomData.bedroomConfiguration,
          birthdayLetter: updatedLetterObj,
        },
      };

      // 1. Immediately update client reactive store
      gameStore.setRoomData(newConfig);

      // 2. Persist to cloud database
      if (roomId) {
        await roomApi.updateRoom(roomId, creatorToken, {
          bedroomConfiguration: newConfig.bedroomConfiguration,
        });
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditing(false);
      }, 1200);
    } catch (err) {
      alert(err.message || 'Failed to save letter to cloud database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
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
          <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-amber-200/90 via-rose-100/90 to-amber-200/90 border-b border-amber-900/20">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-700 animate-spin" style={{ animationDuration: '6s' }} />
              <h3 className="font-cinzel font-black text-amber-950 text-sm sm:text-lg tracking-wider">
                {isEditing ? 'EDIT OUR BIRTHDAY LETTER' : 'A BIRTHDAY LETTER FOR MY WIFE'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 rounded-full bg-amber-400/30 hover:bg-amber-400/50 border border-amber-900/20 text-amber-950 text-xs font-bold flex items-center gap-1.5 transition shadow"
                  title="Edit Letter"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-900" />
                  <span>Edit</span>
                </button>
              )}
              <button
                onClick={handleClose}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-200 hover:bg-amber-300 text-amber-950 flex items-center justify-center transition-colors shadow"
                aria-label="Close letter"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Letter Content (Edit vs View Mode) */}
          <div id="birthday-letter-scroll" className="flex-1 overflow-y-auto p-5 sm:p-8 parchment-scroll space-y-5">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-rose-950 uppercase mb-1">
                    Salutation:
                  </label>
                  <input
                    type="text"
                    value={editSalutation}
                    onChange={(e) => setEditSalutation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-amber-400/60 bg-amber-50/80 font-calligraphy text-xl text-rose-950 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                    placeholder="To My Dearest Wife,"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-rose-950 uppercase mb-1">
                    Letter Body (separate paragraphs with blank lines):
                  </label>
                  <textarea
                    rows={10}
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-amber-400/60 bg-amber-50/80 font-serif-romantic text-base text-gray-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                    placeholder="Write your romantic birthday message..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-rose-950 uppercase mb-1">
                      Closing:
                    </label>
                    <input
                      type="text"
                      value={editClosing}
                      onChange={(e) => setEditClosing(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-amber-400/60 bg-amber-50/80 font-serif-romantic italic text-sm text-rose-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                      placeholder="With all my heart,"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-rose-950 uppercase mb-1">
                      Signature:
                    </label>
                    <input
                      type="text"
                      value={editSignature}
                      onChange={(e) => setEditSignature(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-amber-400/60 bg-amber-50/80 font-handwriting text-2xl text-rose-950 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                      placeholder="Your Loving Husband ❤️"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="font-calligraphy text-2xl sm:text-3xl text-rose-950 font-bold">
                  {currentSalutation}
                </div>

                <div className="space-y-4 font-serif-romantic text-base sm:text-lg text-gray-900 leading-relaxed whitespace-pre-line">
                  {currentParagraphs.map((para, i) => (
                    <p key={i} className="first-letter:text-3xl first-letter:font-bold first-letter:text-rose-800">
                      {para}
                    </p>
                  ))}
                </div>

                <div className="pt-4 text-right">
                  <div className="font-serif-romantic italic text-rose-900 text-sm sm:text-base">
                    {currentClosing}
                  </div>
                  <div className="font-handwriting text-3xl sm:text-4xl text-rose-950 font-bold mt-1">
                    {currentSignature}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bottom Options Bar */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-100 via-rose-100 to-amber-100 border-t border-amber-900/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-gray-400 text-gray-700 hover:bg-gray-200/50 font-semibold text-xs sm:text-sm transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveLetter}
                  disabled={isSaving}
                  className="btn-gold w-full sm:w-auto px-7 py-2.5 text-xs sm:text-sm font-bold shadow-xl flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-950" />
                  ) : saveSuccess ? (
                    <Check className="w-4 h-4 text-emerald-800" />
                  ) : (
                    <Save className="w-4 h-4 text-amber-950" />
                  )}
                  <span>{isSaving ? 'Saving to Cloud...' : saveSuccess ? 'Saved to Sanctuary! ❤️' : 'Save Letter'}</span>
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
