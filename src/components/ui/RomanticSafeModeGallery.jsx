import React, { useState } from 'react';
import {
  Heart,
  Sparkles,
  Music,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Image as ImageIcon,
  Compass,
  Gift,
  ArrowRight,
  Maximize2,
  Box,
} from 'lucide-react';
import { gameStore, useGameStore } from '../../hooks/useGameStore';
import { romanticAudio } from '../../hooks/useAudioManager';

function resolveImgUrl(src) {
  if (!src) return '';
  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
  return src.startsWith('/uploads/') && apiBase ? `${apiBase}${src}` : src;
}

export default function RomanticSafeModeGallery({ onSwitchTo3D }) {
  const currentRoom = useGameStore((s) => s.currentRoom);
  const roomData = useGameStore((s) => s.roomData);
  const memoriesRead = useGameStore((s) => s.memoriesRead);

  const [activeTab, setActiveTab] = useState(currentRoom || 'museum');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  const photos = roomData?.museumConfiguration?.photos || [];
  const bedroomLetter = roomData?.bedroomConfiguration?.birthdayLetter || {};
  const songTitle = roomData?.singingConfiguration?.songTitle || 'A Song From My Heart';
  const songUrl = roomData?.singingConfiguration?.singingAudioUrl || '/assets/audio/background-music.mp3';
  const voiceUrl = roomData?.bedroomConfiguration?.voiceRecordingUrl || '/assets/audio/birthday-voice.mp3';

  const toggleMusic = () => {
    if (isPlayingMusic) {
      romanticAudio.pauseBackgroundMusic();
      setIsPlayingMusic(false);
    } else {
      romanticAudio.playBackgroundMusic();
      setIsPlayingMusic(true);
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-gradient-to-b from-[#0b0813] via-[#1a0f24] to-[#0b0813] text-white select-none overflow-hidden">
      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-3.5 bg-black/40 backdrop-blur-md border-b border-amber-400/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-rose-400 flex items-center justify-center shadow-md">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <h1 className="font-cinzel text-sm sm:text-base font-bold text-amber-200 tracking-wider">
              OUR FOREVER WORLD
            </h1>
            <p className="text-[10px] text-rose-300 font-light">Safe Sanctuary Mode • 100% Smooth</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch to 3D Button */}
          {onSwitchTo3D && (
            <button
              onClick={onSwitchTo3D}
              className="px-3 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition shadow"
              title="Switch to 3D View"
            >
              <Box className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Switch to 3D</span>
            </button>
          )}

          {/* Music Toggle */}
          <button
            onClick={toggleMusic}
            className={`p-2 rounded-full border transition ${
              isPlayingMusic
                ? 'bg-rose-500/30 border-rose-400 text-rose-200 shadow-[0_0_12px_rgba(255,117,140,0.5)]'
                : 'bg-white/10 border-white/20 text-gray-300'
            }`}
            title="Toggle Melody"
          >
            {isPlayingMusic ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex items-center justify-center gap-1.5 sm:gap-3 px-3 py-2 bg-black/20 border-b border-white/10 overflow-x-auto text-xs font-cinzel">
        {[
          { id: 'museum', label: '1. Memory Museum' },
          { id: 'singing', label: '2. Concert Hall' },
          { id: 'dancing', label: '3. Grand Ballroom' },
          { id: 'bedroom', label: '4. Our Bedroom' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              gameStore.set({ currentRoom: tab.id });
            }}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-amber-400/20 border border-amber-300/50 text-amber-200 font-bold shadow'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main className="relative flex-1 overflow-y-auto p-4 sm:p-8">
        {/* TAB 1: MEMORY MUSEUM */}
        {activeTab === 'museum' && (
          <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-amber-100">
                The Museum of Our Love
              </h2>
              <p className="text-xs text-rose-200 font-light">
                Click any photograph to inspect our memories or open the love letter behind it.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {photos.map((photo, i) => (
                <div
                  key={photo.id || i}
                  className="glass-panel-gold rounded-2xl overflow-hidden border border-amber-400/30 shadow-xl transition hover:scale-[1.02] flex flex-col"
                >
                  <div className="relative aspect-[4/3] bg-black/50 overflow-hidden group">
                    <img
                      src={resolveImgUrl(photo.image)}
                      alt={photo.title}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = '/assets/photos/memory1.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                      <span className="font-cinzel text-xs font-bold text-amber-200">
                        Memory 0{i + 1}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-cinzel text-sm font-bold text-white line-clamp-1">
                        {photo.title || `Memory 0${i + 1}`}
                      </h3>
                      <p className="text-[11px] text-gray-300 font-light">
                        {photo.date || 'Our Special Day'} • {photo.location || 'Sanctuary'}
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setSelectedPhoto(photo)}
                        className="btn-romantic flex-1 py-1.5 text-[11px] font-semibold flex items-center justify-center gap-1"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>View Photo</span>
                      </button>
                      <button
                        onClick={() => setSelectedLetter(photo)}
                        className="btn-gold flex-1 py-1.5 text-[11px] font-semibold flex items-center justify-center gap-1"
                      >
                        <Heart className="w-3 h-3 text-amber-950 fill-amber-950" />
                        <span>Read Letter</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: CONCERT HALL */}
        {activeTab === 'singing' && (
          <div className="max-w-2xl mx-auto text-center space-y-6 animate-fade-in py-8">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center mx-auto text-amber-300 shadow-xl">
              <Music className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="font-cinzel text-2xl font-bold text-amber-100">
                {songTitle}
              </h2>
              <p className="text-xs text-rose-200 font-light italic">
                "A special melody prepared just for your birthday..."
              </p>
            </div>

            <div className="glass-panel-gold rounded-3xl p-6 border border-amber-400/30 shadow-2xl space-y-4">
              <audio controls src={songUrl} className="w-full rounded-xl" />
              <p className="text-xs text-gray-300 leading-relaxed font-light">
                Press play above to listen to the special song prepared for you on stage.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: GRAND BALLROOM */}
        {activeTab === 'dancing' && (
          <div className="max-w-2xl mx-auto text-center space-y-6 animate-fade-in py-8">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center mx-auto text-rose-300 shadow-xl">
              <Sparkles className="w-8 h-8 animate-spin" />
            </div>

            <div className="space-y-2">
              <h2 className="font-cinzel text-2xl font-bold text-rose-100">
                Our Romantic Waltz
              </h2>
              <p className="text-xs text-rose-200 font-light italic">
                Step into the candlelit ballroom under falling rose petals.
              </p>
            </div>

            <div className="glass-panel-gold rounded-3xl p-6 border border-amber-400/30 shadow-2xl space-y-4">
              <div className="h-40 rounded-2xl bg-gradient-to-b from-[#2d1222] to-[#120817] border border-white/10 flex flex-col items-center justify-center p-4 text-center space-y-2">
                <Heart className="w-8 h-8 text-rose-400 fill-rose-400 animate-pulse" />
                <p className="font-cinzel text-sm text-amber-200">Synchronized Couple Waltz</p>
                <p className="text-[11px] text-gray-300 font-light">
                  Two hearts beating as one in eternal harmony.
                </p>
              </div>

              <button
                onClick={toggleMusic}
                className="btn-romantic w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2"
              >
                <Music className="w-3.5 h-3.5" />
                <span>{isPlayingMusic ? 'Pause Waltz Melody' : 'Play Waltz Melody'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: BEDROOM & BIRTHDAY LETTER */}
        {activeTab === 'bedroom' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in py-4">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-amber-400/20 border border-amber-300/40 flex items-center justify-center mx-auto text-amber-200 shadow-lg">
                <Gift className="w-6 h-6 animate-bounce" />
              </div>
              <h2 className="font-cinzel text-2xl font-black text-amber-100">
                HAPPY BIRTHDAY, MY LOVE! ❤️
              </h2>
              <p className="text-xs text-rose-200 font-light">
                Your personal sanctuary & birthday surprise.
              </p>
            </div>

            {/* Voice Message Player */}
            {voiceUrl && (
              <div className="glass-panel-gold rounded-2xl p-4 border border-amber-300/40 shadow-lg space-y-2 text-center">
                <h4 className="font-cinzel text-xs font-bold text-amber-200 flex items-center justify-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                  <span>Listen to My Personal Voice Recording</span>
                </h4>
                <audio controls src={voiceUrl} className="w-full rounded-lg" />
              </div>
            )}

            {/* Parchment Love Letter */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#fff9ee] text-[#2c1810] shadow-2xl border-4 border-[#d4af37] space-y-4 font-serif">
              <h3 className="font-cinzel text-base sm:text-lg font-bold text-[#8b1e2f] border-b border-[#e2d5c3] pb-2">
                {bedroomLetter.salutation || 'To My Dearest Wife,'}
              </h3>

              {(bedroomLetter.bodyParagraphs || [
                'Happy Birthday, my love! You make every day pure magic.',
              ]).map((para, idx) => (
                <p key={idx} className="text-xs sm:text-sm leading-relaxed text-gray-800">
                  {para}
                </p>
              ))}

              <div className="pt-4 border-t border-[#e2d5c3] text-right">
                <p className="text-xs text-gray-600 italic">{bedroomLetter.closing || 'Forever Yours,'}</p>
                <p className="font-cinzel text-sm font-bold text-[#8b1e2f] pt-1">
                  {bedroomLetter.signature || 'Your Loving Husband ❤️'}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Fullscreen Photo Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-2xl w-full glass-panel-gold rounded-3xl overflow-hidden border border-amber-400/40 shadow-2xl space-y-3 p-4"
          >
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black/40">
              <img
                src={selectedPhoto.image}
                alt={selectedPhoto.title}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center justify-between px-2">
              <div>
                <h3 className="font-cinzel text-base font-bold text-amber-200">
                  {selectedPhoto.title}
                </h3>
                <p className="text-xs text-gray-300">
                  {selectedPhoto.date} • {selectedPhoto.location}
                </p>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Letter Modal */}
      {selectedLetter && (
        <div
          onClick={() => setSelectedLetter(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-lg w-full p-6 sm:p-8 rounded-3xl bg-[#fff9ee] text-[#2c1810] shadow-2xl border-4 border-[#d4af37] space-y-4 font-serif"
          >
            <div className="flex items-center justify-between border-b border-[#e2d5c3] pb-2">
              <span className="font-cinzel text-xs font-bold text-[#8b1e2f]">
                LETTER FOR {selectedLetter.title?.toUpperCase() || 'OUR MEMORY'}
              </span>
              <button
                onClick={() => setSelectedLetter(null)}
                className="text-xs text-gray-500 hover:text-black font-sans px-2 py-1 rounded"
              >
                ✕ Close
              </button>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line text-gray-800">
              {selectedLetter.letter || 'Forever in my heart ❤️'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
