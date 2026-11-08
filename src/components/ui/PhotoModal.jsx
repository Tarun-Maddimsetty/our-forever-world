import React from 'react';
import { X, Calendar, MapPin } from 'lucide-react';
import { gameStore, useGameStore } from '../../hooks/useGameStore';

export default function PhotoModal() {
  const isOpen = useGameStore((s) => s.isPhotoModalOpen);
  const selectedPhoto = useGameStore((s) => s.selectedPhoto);

  if (!isOpen || !selectedPhoto) return null;

  const handleClose = () => {
    gameStore.set({ isPhotoModalOpen: false, selectedPhoto: null });
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fade-in cursor-zoom-out"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-3xl max-h-[90vh] glass-panel-gold rounded-3xl p-3 sm:p-5 flex flex-col items-center shadow-2xl border border-amber-400/40 cursor-default"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition border border-white/20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* High Res Image */}
        <div className="w-full flex-1 overflow-hidden rounded-2xl max-h-[75vh]">
          <img
            src={
              selectedPhoto.image?.startsWith('/uploads/') && import.meta.env.VITE_API_URL
                ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}${selectedPhoto.image}`
                : selectedPhoto.image
            }
            alt={selectedPhoto.title}
            className="w-full h-full object-contain mx-auto"
          />
        </div>

        {/* Caption & Action */}
        <div className="w-full pt-3 pb-1 text-center flex flex-col items-center gap-2">
          <h4 className="font-serif-romantic text-lg sm:text-xl font-bold text-amber-200">
            {selectedPhoto.title}
          </h4>
          <div className="flex items-center justify-center gap-4 text-xs text-rose-200/80">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-rose-400" />
              {selectedPhoto.date}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-rose-400" />
              {selectedPhoto.location}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={() => {
                const photo = selectedPhoto;
                handleClose();
                gameStore.openMemoryLetter(photo);
              }}
              className="btn-romantic py-2 px-5 text-xs sm:text-sm font-bold shadow-md flex items-center gap-1.5"
            >
              <span>Read Memory Letter 📜</span>
            </button>
            <button
              onClick={handleClose}
              className="btn-gold py-2 px-4 text-xs sm:text-sm font-bold shadow-md"
            >
              <span>Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
