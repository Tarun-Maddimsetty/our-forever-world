import React, { useState } from 'react';
import {
  X,
  Upload,
  Save,
  CheckCircle,
  Copy,
  Sparkles,
  Music,
  Heart,
  Sliders,
  Image as ImageIcon,
  Mic,
  Gift,
  Eye,
  Loader2,
  Share2,
  Trash2,
  Key,
} from 'lucide-react';
import { gameStore, useGameStore } from '../../hooks/useGameStore';
import { roomApi } from '../../services/roomApi';
import { romanticAudio } from '../../hooks/useAudioManager';
import confetti from 'canvas-confetti';

function resolveImgUrl(src) {
  if (!src) return '';
  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
  return src.startsWith('/uploads/') && apiBase ? `${apiBase}${src}` : src;
}

export default function CreatorPanel() {
  const mode = useGameStore((s) => s.mode);
  const roomId = useGameStore((s) => s.roomId);
  const roomCode = useGameStore((s) => s.roomCode);
  const creatorToken = useGameStore((s) => s.creatorToken);
  const roomData = useGameStore((s) => s.roomData);
  const creatorEditPanel = useGameStore((s) => s.creatorEditPanel);
  const isPreviewMode = useGameStore((s) => s.isPreviewMode);

  const [activeTab, setActiveTab] = useState(0); // 0: Museum, 1: Singing, 2: Dancing, 3: Bedroom
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [copiedCreatorKey, setCopiedCreatorKey] = useState(false);

  if (mode !== 'creator' || !creatorEditPanel || isPreviewMode) return null;

  const photos = roomData?.museumConfiguration?.photos || [];
  const activePhoto = photos[selectedPhotoIndex] || {};

  const handleClose = () => {
    gameStore.set({ creatorEditPanel: null });
  };

  // 1. Photo File Upload with automatic resizing and cloud database persistence
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadError('');
      const res = await roomApi.uploadMedia(file, creatorToken, {
        roomCode,
        roomId,
        photoIndex: selectedPhotoIndex,
        caption: activePhoto.title || `Memory 0${selectedPhotoIndex + 1}`,
        room: 'museum',
        uploader: 'creator',
      });
      const updatedPhotos = [...photos];
      updatedPhotos[selectedPhotoIndex] = {
        ...updatedPhotos[selectedPhotoIndex],
        image: res.url,
        url: res.url,
        caption: res.caption || updatedPhotos[selectedPhotoIndex].title,
        uploader: 'creator',
        uploadedAt: new Date().toISOString(),
      };

      const newConfig = {
        ...roomData,
        museumConfiguration: {
          ...roomData.museumConfiguration,
          photos: updatedPhotos,
        },
      };

      gameStore.setRoomData(newConfig);
      await roomApi.updateRoom(roomId, creatorToken, {
        museumConfiguration: newConfig.museumConfiguration,
      });
    } catch (err) {
      setUploadError(err.message || 'Error uploading photograph to cloud storage.');
    } finally {
      setIsUploading(false);
    }
  };

  // Safe manual photo deletion (Never automatic!)
  const handleDeletePhoto = async () => {
    if (!activePhoto?.image) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete "${activePhoto.title || 'this photo'}" from your world? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setIsSaving(true);
      const photoId = activePhoto.id || (selectedPhotoIndex + 1);
      const updatedPhotos = [...photos];
      updatedPhotos[selectedPhotoIndex] = {
        ...updatedPhotos[selectedPhotoIndex],
        image: null,
        url: null,
      };

      const newConfig = {
        ...roomData,
        museumConfiguration: {
          ...roomData.museumConfiguration,
          photos: updatedPhotos,
        },
      };

      gameStore.setRoomData(newConfig);
      await roomApi.updateRoom(roomId, creatorToken, {
        museumConfiguration: newConfig.museumConfiguration,
      });
      await roomApi.deletePhoto(roomId, creatorToken, photoId).catch(() => {});
    } catch (err) {
      alert(err.message || 'Failed to delete photo.');
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Photo metadata change
  const handlePhotoFieldChange = (field, value) => {
    const updatedPhotos = [...photos];
    updatedPhotos[selectedPhotoIndex] = {
      ...updatedPhotos[selectedPhotoIndex],
      [field]: value,
    };

    const newConfig = {
      ...roomData,
      museumConfiguration: {
        ...roomData.museumConfiguration,
        photos: updatedPhotos,
      },
    };
    gameStore.setRoomData(newConfig);
  };

  // 3. Singing audio upload
  const handleSingingUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await roomApi.uploadMedia(file, creatorToken);
      const newConfig = {
        ...roomData,
        singingConfiguration: {
          ...roomData.singingConfiguration,
          singingAudioUrl: res.url,
          hasCustomAudio: true,
        },
      };
      gameStore.setRoomData(newConfig);
      await roomApi.updateRoom(roomId, creatorToken, {
        singingConfiguration: newConfig.singingConfiguration,
      });
    } catch (err) {
      alert(err.message || 'Error uploading singing audio.');
    } finally {
      setIsUploading(false);
    }
  };

  // 4. Voice Recording upload for bedroom
  const handleVoiceUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await roomApi.uploadMedia(file, creatorToken);
      const newConfig = {
        ...roomData,
        bedroomConfiguration: {
          ...roomData.bedroomConfiguration,
          voiceRecordingUrl: res.url,
          hasCustomVoice: true,
        },
      };
      gameStore.setRoomData(newConfig);
      await roomApi.updateRoom(roomId, creatorToken, {
        bedroomConfiguration: newConfig.bedroomConfiguration,
      });
    } catch (err) {
      alert(err.message || 'Error uploading voice recording.');
    } finally {
      setIsUploading(false);
    }
  };

  // 5. Save all current changes to backend
  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      await roomApi.updateRoom(roomId, creatorToken, {
        museumConfiguration: roomData.museumConfiguration,
        singingConfiguration: roomData.singingConfiguration,
        dancingConfiguration: roomData.dancingConfiguration,
        bedroomConfiguration: roomData.bedroomConfiguration,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      alert(err.message || 'Error saving changes.');
    } finally {
      setIsSaving(false);
    }
  };

  // 6. DONE & PUBLISH WORKFLOW
  const handlePublishRoom = async () => {
    try {
      setIsSaving(true);
      await handleSaveAll();
      const res = await roomApi.publishRoom(roomId, creatorToken);
      gameStore.set({ isPublished: true });
      setPublishModalOpen(true);
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.6 },
      });
    } catch (err) {
      alert(err.message || 'Error publishing room.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}/?room=${encodeURIComponent(roomCode)}`;
    if (navigator.share) {
      navigator
        .share({
          title: 'Our Forever World ❤️',
          text: `I created a private romantic 3D sanctuary for you! Room code: ${roomCode}`,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
        <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col glass-panel-gold rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-400/40">
          {/* Top Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-300/20 via-rose-500/20 to-amber-300/20 border-b border-amber-400/30">
            <div className="flex items-center gap-2 flex-wrap">
              <Sliders className="w-5 h-5 text-amber-300" />
              <h3 className="font-cinzel text-lg sm:text-xl font-bold text-amber-100">
                ROOM CREATOR STUDIO
              </h3>
              <span className="ml-2 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-mono font-bold">
                {roomCode}
              </span>
              {creatorToken && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(creatorToken);
                    setCopiedCreatorKey(true);
                    setTimeout(() => setCopiedCreatorKey(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-amber-200 text-xs font-mono flex items-center gap-1 transition"
                  title="Copy secret creator key"
                >
                  <Key className="w-3 h-3 text-amber-300" />
                  <span>{copiedCreatorKey ? 'Key Copied! ✅' : 'Copy Key'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  handleSaveAll();
                  gameStore.enterPreviewMode('museum');
                }}
                className="btn-romantic py-1.5 px-3 sm:px-4 text-xs font-bold shadow-md flex items-center gap-1.5"
                title="Preview entire experience as visitor"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview All Rooms</span>
              </button>

              <button
                onClick={handleSaveAll}
                disabled={isSaving}
                className="px-3.5 py-1.5 rounded-full bg-amber-400/20 hover:bg-amber-400/30 border border-amber-300/50 text-amber-200 text-xs font-bold flex items-center gap-1.5 transition"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{saveSuccess ? 'Saved! ✨' : 'Save Draft'}</span>
              </button>

              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Room Environment Tabs */}
          <div className="flex items-center border-b border-white/10 bg-black/40 px-6 gap-2 overflow-x-auto">
            {[
              { id: 0, name: '1. Memory Museum', icon: ImageIcon },
              { id: 1, name: '2. Singing Room', icon: Mic },
              { id: 2, name: '3. Dancing Room', icon: Music },
              { id: 3, name: '4. Bedroom & Surprises', icon: Gift },
            ].map((tab) => {
              const Icon = tab.icon;
              const isCurrent = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-4 font-semibold text-xs sm:text-sm whitespace-nowrap flex items-center gap-2 border-b-2 transition ${
                    isCurrent
                      ? 'border-amber-300 text-amber-200 bg-amber-400/10'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 0: MUSEUM EDITING */}
          {activeTab === 0 && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Photo Selector Strip */}
              <div>
                <label className="block text-xs font-semibold text-amber-200 mb-2 uppercase tracking-wider">
                  Select Photograph Station To Customize (Up to 7):
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {photos.map((p, idx) => (
                    <button
                      key={p.id || idx}
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className={`relative w-16 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition ${
                        selectedPhotoIndex === idx
                          ? 'border-amber-300 ring-2 ring-amber-300/40 scale-105'
                          : 'border-white/20 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={resolveImgUrl(p.image)} alt={p.title} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[10px] text-center text-white py-0.5">
                        #{idx + 1}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Editing Active Photo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/30 p-5 rounded-2xl border border-white/10">
                {/* Left: Image & Wall Positioning */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={resolveImgUrl(activePhoto.image)}
                      alt={activePhoto.title}
                      className="w-28 h-36 object-cover rounded-xl border border-amber-300/40 shadow-md"
                    />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <label className={`btn-romantic py-2 px-4 text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                          {isUploading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          <span>{isUploading ? 'Uploading to Cloud...' : 'Upload Photograph'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            disabled={isUploading}
                            className="hidden"
                          />
                        </label>

                        {activePhoto.image && (
                          <button
                            type="button"
                            onClick={handleDeletePhoto}
                            className="px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition shadow"
                            title="Delete photo after confirmation"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>

                      {uploadError && (
                        <div className="p-2 rounded-xl bg-red-950/80 border border-red-500/50 text-[11px] text-red-200">
                          {uploadError}
                        </div>
                      )}

                      <p className="text-[11px] text-gray-400">
                        Auto-resizes to 1600px max. Stored permanently in cloud.
                      </p>
                    </div>
                  </div>

                  {/* Wall Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Museum Wall Placement:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['west', 'east', 'north'].map((wall) => (
                        <button
                          key={wall}
                          onClick={() => handlePhotoFieldChange('wall', wall)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold uppercase transition ${
                            (activePhoto.wall || 'west') === wall
                              ? 'bg-amber-400 text-black font-extrabold shadow'
                              : 'bg-white/10 text-gray-300 hover:bg-white/20'
                          }`}
                        >
                          {wall} Wall
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Position Offset Slider */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>Wall Offset Position:</span>
                      <span className="font-mono text-amber-300">{activePhoto.positionOffset || 0}</span>
                    </div>
                    <input
                      type="range"
                      min="-2.5"
                      max="2.5"
                      step="0.2"
                      value={activePhoto.positionOffset || 0}
                      onChange={(e) => handlePhotoFieldChange('positionOffset', parseFloat(e.target.value))}
                      className="w-full accent-amber-300"
                    />
                  </div>

                  {/* Scale Slider */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>Frame Scale:</span>
                      <span className="font-mono text-amber-300">{activePhoto.scale || 1.0}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="1.3"
                      step="0.05"
                      value={activePhoto.scale || 1.0}
                      onChange={(e) => handlePhotoFieldChange('scale', parseFloat(e.target.value))}
                      className="w-full accent-amber-300"
                    />
                  </div>
                </div>

                {/* Right: Personal Love Letter */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-amber-200 mb-1">
                      Memory Title:
                    </label>
                    <input
                      type="text"
                      value={activePhoto.title || ''}
                      onChange={(e) => handlePhotoFieldChange('title', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/20 text-white text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        Date / Milestone:
                      </label>
                      <input
                        type="text"
                        value={activePhoto.date || ''}
                        onChange={(e) => handlePhotoFieldChange('date', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/20 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        Location:
                      </label>
                      <input
                        type="text"
                        value={activePhoto.location || ''}
                        onChange={(e) => handlePhotoFieldChange('location', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/20 text-white text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-amber-200 mb-1">
                      Personal Love Letter For This Memory:
                    </label>
                    <textarea
                      rows={6}
                      value={activePhoto.letter || ''}
                      onChange={(e) => handlePhotoFieldChange('letter', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/20 text-rose-100 text-sm font-handwriting text-lg leading-relaxed resize-none"
                    />
                  </div>

                  <button
                    onClick={() => gameStore.openMemoryLetter(activePhoto)}
                    className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview Letter Interface</span>
                  </button>

                  <button
                    onClick={() => {
                      handleSaveAll();
                      gameStore.enterPreviewMode('museum');
                    }}
                    className="w-full py-2.5 rounded-xl btn-gold text-amber-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview Memory Museum in 3D</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 1: SINGING ROOM CREATION */}
          {activeTab === 1 && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-black/30 p-5 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-300/40 flex items-center justify-center text-amber-300">
                    <Mic className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-serif-romantic text-lg font-bold text-amber-100">
                      Anime Concert Singing Scene
                    </h4>
                    <p className="text-xs text-gray-300">
                      Upload your personal singing performance. Your anime character will sing it passionately at the microphone for her on stage.
                    </p>
                  </div>
                </div>

                {/* Upload Singing Audio */}
                <div className="p-4 rounded-xl bg-black/40 border border-amber-400/30 space-y-3">
                  <label className="block text-xs font-semibold text-amber-200">
                    Upload Your Singing Audio File (MP3 / WAV / M4A):
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="btn-gold py-2.5 px-5 text-xs font-bold cursor-pointer inline-flex items-center gap-2">
                      <Upload className="w-3.5 h-3.5 text-amber-950" />
                      <span>{isUploading ? 'Uploading Audio...' : 'Choose Singing Audio File'}</span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleSingingUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-xs text-gray-300">
                      {roomData.singingConfiguration?.hasCustomAudio
                        ? 'Custom singing audio uploaded! ✅'
                        : 'Using romantic song placeholder'}
                    </span>
                  </div>
                </div>

                {/* Stage Lighting Color */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    Stage Spotlight Theme Color:
                  </label>
                  <div className="flex items-center gap-3">
                    {[
                      { name: 'Warm Gold', color: '#ffd700' },
                      { name: 'Rose Romance', color: '#ff758c' },
                      { name: 'Moonlight Blue', color: '#bfe3ff' },
                      { name: 'Violet Velvet', color: '#c084fc' },
                    ].map((c) => (
                      <button
                        key={c.color}
                        onClick={() => {
                          const newConfig = {
                            ...roomData,
                            singingConfiguration: {
                              ...roomData.singingConfiguration,
                              stageLightingColor: c.color,
                            },
                          };
                          gameStore.setRoomData(newConfig);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition ${
                          roomData.singingConfiguration?.stageLightingColor === c.color
                            ? 'border-white bg-white/20 text-white'
                            : 'border-white/20 text-gray-400 hover:text-white'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview Performance */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      handleSaveAll();
                      gameStore.enterPreviewMode('singing');
                      gameStore.triggerSpecialAction('singing', 20);
                    }}
                    className="btn-romantic py-3 px-6 text-sm font-bold w-full flex items-center justify-center gap-2 shadow-xl"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview Anime Singing Performance On Stage</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: DANCING ROOM PREVIEW */}
          {activeTab === 2 && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-black/30 p-5 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-300/40 flex items-center justify-center text-rose-300">
                    <Music className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-serif-romantic text-lg font-bold text-amber-100">
                      Romantic Ballroom Couple Dance
                    </h4>
                    <p className="text-xs text-gray-300">
                      Romantic slow-dance waltz music is automatically provided by the sanctuary. Both anime characters will hold each other and slow-dance together under chandelier lights.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs text-gray-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-rose-200">Dance Music Track:</span>
                    <span className="font-mono text-amber-300">"Our Romantic Waltz" (Included Automatically)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-rose-200">Atmosphere:</span>
                    <span className="text-gray-300">Golden Chandeliers & Floating Rose Petals</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleSaveAll();
                    gameStore.enterPreviewMode('dancing');
                    gameStore.triggerSpecialAction('dance', 30);
                  }}
                  className="btn-gold py-3 px-6 text-sm font-bold w-full flex items-center justify-center gap-2 shadow-xl"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview Couple Slow Dance in Ballroom</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: BEDROOM SURPRISES */}
          {activeTab === 3 && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-black/30 p-5 rounded-2xl border border-white/10 space-y-4">
                {/* Voice recording upload */}
                <div className="p-4 rounded-xl bg-black/40 border border-amber-400/30 space-y-2">
                  <label className="block text-xs font-semibold text-amber-200">
                    Upload Your Personal Voice Note For Her (MP3 / WAV / M4A):
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="btn-gold py-2 px-4 text-xs font-bold cursor-pointer inline-flex items-center gap-2">
                      <Upload className="w-3.5 h-3.5 text-amber-950" />
                      <span>{isUploading ? 'Uploading Voice Note...' : 'Choose Voice Recording File'}</span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleVoiceUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-xs text-gray-300">
                      {roomData.bedroomConfiguration?.hasCustomVoice
                        ? 'Custom voice note uploaded! ✅'
                        : 'Using romantic chime placeholder'}
                    </span>
                  </div>
                </div>

                {/* Birthday Letter Customization for Desk */}
                <div className="p-4 rounded-xl bg-black/40 border border-amber-400/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-amber-200 uppercase tracking-wider">
                      Personal Birthday Letter On Bedroom Desk:
                    </label>
                    <button
                      type="button"
                      onClick={() => gameStore.set({ isBirthdayLetterModalOpen: true })}
                      className="px-3 py-1 rounded-full bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 text-xs font-bold flex items-center gap-1 transition"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview Letter</span>
                    </button>
                  </div>

                  {/* Salutation */}
                  <div>
                    <label className="block text-[11px] text-gray-300 mb-1">Salutation:</label>
                    <input
                      type="text"
                      value={roomData.bedroomConfiguration?.birthdayLetter?.salutation || ''}
                      onChange={(e) => {
                        const newConfig = {
                          ...roomData,
                          bedroomConfiguration: {
                            ...roomData.bedroomConfiguration,
                            birthdayLetter: {
                              ...roomData.bedroomConfiguration?.birthdayLetter,
                              salutation: e.target.value,
                            },
                          },
                        };
                        gameStore.setRoomData(newConfig);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/20 text-white text-sm"
                      placeholder="To My Dearest Wife,"
                    />
                  </div>

                  {/* Multi-paragraph Body */}
                  <div>
                    <label className="block text-[11px] text-gray-300 mb-1">
                      Love Letter Content (Paragraphs separated by blank lines):
                    </label>
                    <textarea
                      rows={6}
                      value={
                        Array.isArray(roomData.bedroomConfiguration?.birthdayLetter?.bodyParagraphs)
                          ? roomData.bedroomConfiguration?.birthdayLetter?.bodyParagraphs.join('\n\n')
                          : typeof roomData.bedroomConfiguration?.birthdayLetter === 'string'
                          ? roomData.bedroomConfiguration?.birthdayLetter
                          : ''
                      }
                      onChange={(e) => {
                        const paras = e.target.value.split('\n\n').filter(Boolean);
                        const newConfig = {
                          ...roomData,
                          bedroomConfiguration: {
                            ...roomData.bedroomConfiguration,
                            birthdayLetter: {
                              ...roomData.bedroomConfiguration?.birthdayLetter,
                              bodyParagraphs: paras,
                            },
                          },
                        };
                        gameStore.setRoomData(newConfig);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/20 text-white text-sm font-serif-romantic leading-relaxed resize-none"
                      placeholder="Write your heart's deepest words to her..."
                    />
                  </div>

                  {/* Closing & Signature */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-gray-300 mb-1">Closing:</label>
                      <input
                        type="text"
                        value={roomData.bedroomConfiguration?.birthdayLetter?.closing || ''}
                        onChange={(e) => {
                          const newConfig = {
                            ...roomData,
                            bedroomConfiguration: {
                              ...roomData.bedroomConfiguration,
                              birthdayLetter: {
                                ...roomData.bedroomConfiguration?.birthdayLetter,
                                closing: e.target.value,
                              },
                            },
                          };
                          gameStore.setRoomData(newConfig);
                        }}
                        className="w-full px-3 py-1.5 rounded-xl bg-black/50 border border-white/20 text-white text-sm"
                        placeholder="With all my love,"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-300 mb-1">Signature:</label>
                      <input
                        type="text"
                        value={roomData.bedroomConfiguration?.birthdayLetter?.signature || ''}
                        onChange={(e) => {
                          const newConfig = {
                            ...roomData,
                            bedroomConfiguration: {
                              ...roomData.bedroomConfiguration,
                              birthdayLetter: {
                                ...roomData.bedroomConfiguration?.birthdayLetter,
                                signature: e.target.value,
                              },
                            },
                          };
                          gameStore.setRoomData(newConfig);
                        }}
                        className="w-full px-3 py-1.5 rounded-xl bg-black/50 border border-white/20 text-white text-sm"
                        placeholder="Your Loving Husband ❤️"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview Bedroom in 3D Button */}
                <button
                  onClick={() => {
                    handleSaveAll();
                    gameStore.enterPreviewMode('bedroom');
                  }}
                  className="btn-romantic py-3 px-6 text-sm font-bold w-full flex items-center justify-center gap-2 shadow-xl"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview Bedroom (Desk Letter & Bed Sitting)</span>
                </button>

                {/* Test Hug & Kiss Animations */}
                <div className="pt-2 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      handleSaveAll();
                      gameStore.enterPreviewMode('bedroom');
                      gameStore.triggerSpecialAction('hug', 4);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Heart className="w-3.5 h-3.5 fill-rose-300" />
                    <span>Preview 4s Romantic Hug</span>
                  </button>

                  <button
                    onClick={() => {
                      handleSaveAll();
                      gameStore.enterPreviewMode('bedroom');
                      gameStore.triggerSpecialAction('kiss', 4);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/40 text-pink-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Preview 4s Romantic Kiss</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Bar with DONE / PUBLISH Button */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-300/10 via-rose-500/10 to-amber-300/10 border-t border-amber-400/30 flex items-center justify-between">
            <div className="text-xs text-gray-400 font-light">
              Make sure to test each room before publishing your world.
            </div>

            <button
              onClick={handlePublishRoom}
              disabled={isSaving}
              className="btn-gold py-3 px-8 text-sm sm:text-base font-bold shadow-2xl flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5 text-amber-950" />
              <span>DONE – PUBLISH WORLD ❤️</span>
            </button>
          </div>
        </div>
      </div>

      {/* Prominent Publication Success Modal */}
      {publishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fade-in">
          <div className="max-w-md w-full glass-panel-gold rounded-3xl p-8 text-center shadow-2xl border-2 border-amber-300 space-y-5">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-rose-400 flex items-center justify-center shadow-lg border border-white/40">
              <Heart className="w-8 h-8 text-white fill-white animate-pulse" />
            </div>

            <h3 className="font-cinzel text-2xl font-black text-amber-100">
              YOUR WORLD IS READY ❤️
            </h3>

            <p className="text-sm text-gray-200 font-light leading-relaxed">
              Share this secret room code with her so she can enter your personalized 3D world:
            </p>

            <div className="p-4 rounded-2xl bg-black/60 border-2 border-amber-300/60 flex items-center justify-center gap-3 shadow-inner">
              <span className="font-mono text-2xl sm:text-3xl font-black text-amber-200 tracking-widest">
                {roomCode}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                onClick={handleCopyCode}
                className="btn-gold flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-lg"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-amber-950" />
                    <span>Copied Code! ✨</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-950" />
                    <span>Copy Room Code</span>
                  </>
                )}
              </button>

              <button
                onClick={handleShareLink}
                className="btn-romantic flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-lg"
              >
                {shareCopied ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-white" />
                    <span>Link Copied! ✨</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-white" />
                    <span>Share Link</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => {
                setPublishModalOpen(false);
                handleClose();
              }}
              className="text-xs text-rose-300 hover:text-white underline pt-2 block mx-auto"
            >
              Continue Exploring My Room
            </button>
          </div>
        </div>
      )}
    </>
  );
}
