import React, { useState, useEffect } from 'react';
import {
  Heart,
  Sparkles,
  KeyRound,
  PlusCircle,
  Compass,
  ArrowRight,
  Loader2,
  Sliders,
  ShieldCheck,
  FolderHeart,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  X,
  Key,
  ExternalLink,
} from 'lucide-react';
import { gameStore, useGameStore } from '../../hooks/useGameStore';
import { roomApi, getMyRooms, saveMyRoom, removeMyRoom } from '../../services/roomApi';
import { romanticAudio } from '../../hooks/useAudioManager';

export default function LandingPage() {
  const graphicsQuality = useGameStore((s) => s.graphicsQuality);

  // Core Room State
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // "My Rooms" Feature State
  const [myRoomsList, setMyRoomsList] = useState(() => getMyRooms());
  const [myRoomsModalOpen, setMyRoomsModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('list'); // 'list' | 'restore' | 'claim'
  const [restoreCode, setRestoreCode] = useState('');
  const [restoreKey, setRestoreKey] = useState('');
  const [claimCode, setClaimCode] = useState('');
  const [modalFeedback, setModalFeedback] = useState({ error: '', success: '', loading: false });
  const [copiedKeyIndex, setCopiedKeyIndex] = useState(null);

  // Secret Creator Key Notification Modal (Shown once after room creation)
  const [createdModalData, setCreatedModalData] = useState(null);
  const [createdKeyCopied, setCreatedKeyCopied] = useState(false);
  const [createdCodeCopied, setCreatedCodeCopied] = useState(false);

  // Sync myRooms list with localStorage on modal open
  useEffect(() => {
    if (myRoomsModalOpen) {
      setMyRoomsList(getMyRooms());
      setModalFeedback({ error: '', success: '', loading: false });
    }
  }, [myRoomsModalOpen]);

  // Check URL parameters for direct cross-device room joining (e.g. ?room=ALWAYS-5373)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sharedCode = params.get('room') || params.get('join') || params.get('code');
      if (sharedCode) {
        setRoomCodeInput(sharedCode.trim().toUpperCase());
      }
    }
  }, []);

  const toggleGraphics = () => {
    gameStore.set({
      graphicsQuality:
        graphicsQuality === 'high' ? 'medium' : graphicsQuality === 'medium' ? 'low' : 'high',
    });
  };

  // 1. Handle CREATOR Workflow
  const handleCreateRoom = async () => {
    try {
      setIsCreating(true);
      setErrorMessage('');
      romanticAudio.init();
      romanticAudio.playSparkle();

      const data = await roomApi.createRoom();
      const secretKey = data.creatorKey || data.creatorToken;

      saveMyRoom({
        roomId: data.roomId,
        roomCode: data.roomCode,
        creatorKey: secretKey,
        creatorToken: secretKey,
        title: data.room?.title || 'Our Forever World',
        createdAt: data.room?.createdAt || new Date().toISOString(),
      });
      setMyRoomsList(getMyRooms());

      // Prepare state in gameStore
      gameStore.set({
        mode: 'creator',
        roomId: data.roomId,
        roomCode: data.roomCode,
        creatorToken: secretKey,
        isPublished: true,
        roomData: data.room,
        currentRoom: 'museum',
        creatorEditPanel: 'museum',
      });

      // Show secret key modal once after creation
      setCreatedModalData({
        roomCode: data.roomCode,
        creatorKey: secretKey,
      });
    } catch (err) {
      console.error('Room creation error:', err);
      setErrorMessage(err.message || 'Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // 2. Handle VISITOR JOIN Workflow (Joining with only code ALWAYS opens VIEWER mode)
  const handleJoinRoom = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanCode = roomCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage('Please enter your special room code.');
      return;
    }

    try {
      setIsJoining(true);
      setErrorMessage('');
      romanticAudio.init();
      romanticAudio.playSparkle();

      // STRICT: Joining with only the room code opens VIEWER mode with no creator permissions
      const data = await roomApi.getRoom(cleanCode);

      if (!data || !data.room) {
        throw new Error(`Room code "${cleanCode}" not found. Please verify the code and try again.`);
      }

      gameStore.set({
        mode: 'visitor',
        roomId: data.room.roomId,
        roomCode: data.room.roomCode,
        creatorToken: null,
        isPublished: true,
        roomData: data.room,
        currentRoom: 'museum',
        creatorEditPanel: null,
        isPreviewMode: false,
        memoriesRead: [],
      });
    } catch (err) {
      console.error('Join room error:', err);
      setErrorMessage(err.message || 'Invalid room code. Please check and try again.');
    } finally {
      setIsJoining(false);
    }
  };

  // 3. Open & Edit from "My Rooms" list
  const handleOpenAndEdit = async (roomItem) => {
    try {
      setModalFeedback({ error: '', success: 'Opening your room...', loading: true });
      romanticAudio.init();
      romanticAudio.playSparkle();

      const data = await roomApi.getRoom(roomItem.roomCode, roomItem.creatorKey);
      if (!data || !data.room) {
        throw new Error('Could not retrieve room details.');
      }

      gameStore.set({
        mode: 'creator',
        roomId: data.room.roomId,
        roomCode: data.room.roomCode,
        creatorToken: roomItem.creatorKey,
        isPublished: true,
        roomData: data.room,
        currentRoom: 'museum',
        creatorEditPanel: 'museum',
      });

      setMyRoomsModalOpen(false);
    } catch (err) {
      setModalFeedback({ error: err.message || 'Failed to open room.', success: '', loading: false });
    }
  };

  // 4. Restore Room using Code + Creator Key from another device
  const handleRestoreSubmit = async (e) => {
    e.preventDefault();
    const cleanCode = restoreCode.trim().toUpperCase();
    const cleanKey = restoreKey.trim();

    if (!cleanCode || !cleanKey) {
      setModalFeedback({ error: 'Please enter both Room Code and Creator Key.', success: '', loading: false });
      return;
    }

    try {
      setModalFeedback({ error: '', success: 'Validating creator credentials...', loading: true });
      const data = await roomApi.getRoom(cleanCode, cleanKey);

      if (!data || !data.room) {
        throw new Error('Room not found with this code.');
      }

      if (!data.isCreator) {
        throw new Error('Invalid creator key for this room. Please check the key.');
      }

      saveMyRoom({
        roomId: data.room.roomId,
        roomCode: data.room.roomCode,
        creatorKey: cleanKey,
        creatorToken: cleanKey,
        title: data.room.title || 'Our Forever World',
        createdAt: data.room.createdAt || new Date().toISOString(),
      });

      const updated = getMyRooms();
      setMyRoomsList(updated);
      setModalFeedback({ error: '', success: 'Room restored successfully! 🎉', loading: false });

      // Automatically open in creator mode
      setTimeout(() => {
        gameStore.set({
          mode: 'creator',
          roomId: data.room.roomId,
          roomCode: data.room.roomCode,
          creatorToken: cleanKey,
          isPublished: true,
          roomData: data.room,
          currentRoom: 'museum',
          creatorEditPanel: 'museum',
        });
        setMyRoomsModalOpen(false);
      }, 700);
    } catch (err) {
      setModalFeedback({ error: err.message || 'Failed to restore room.', success: '', loading: false });
    }
  };

  // 5. Claim an unowned legacy room
  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    const cleanCode = claimCode.trim().toUpperCase();
    if (!cleanCode) {
      setModalFeedback({ error: 'Please enter the room code to claim.', success: '', loading: false });
      return;
    }

    try {
      setModalFeedback({ error: '', success: 'Verifying room ownership...', loading: true });
      const data = await roomApi.claimRoom(cleanCode);
      const updated = getMyRooms();
      setMyRoomsList(updated);
      setModalFeedback({
        error: '',
        success: `Room claimed! Secret Key: ${data.creatorKey.substring(0, 12)}...`,
        loading: false,
      });

      setTimeout(() => {
        gameStore.set({
          mode: 'creator',
          roomId: data.room.roomId,
          roomCode: data.room.roomCode,
          creatorToken: data.creatorKey,
          isPublished: true,
          roomData: data.room,
          currentRoom: 'museum',
          creatorEditPanel: 'museum',
        });
        setMyRoomsModalOpen(false);
      }, 1000);
    } catch (err) {
      setModalFeedback({ error: err.message || 'Failed to claim room.', success: '', loading: false });
    }
  };

  // 6. Delete a room (only creator with key)
  const handleDeleteRoom = async (roomItem) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete room "${roomItem.roomCode}"?\n\nThis will permanently delete the room and its memory photos from cloud storage. This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setModalFeedback({ error: '', success: 'Deleting room...', loading: true });
      await roomApi.deleteRoom(roomItem.roomId, roomItem.creatorKey, roomItem.roomCode);
      removeMyRoom(roomItem.roomCode);
      setMyRoomsList(getMyRooms());
      setModalFeedback({ error: '', success: 'Room deleted successfully.', loading: false });
    } catch (err) {
      setModalFeedback({ error: err.message || 'Failed to delete room.', success: '', loading: false });
    }
  };

  const copyToClipboard = (text, type = 'key', index = null) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'createdKey') {
      setCreatedKeyCopied(true);
      setTimeout(() => setCreatedKeyCopied(false), 2200);
    } else if (type === 'createdCode') {
      setCreatedCodeCopied(true);
      setTimeout(() => setCreatedCodeCopied(false), 2200);
    } else if (type === 'listKey') {
      setCopiedKeyIndex(index);
      setTimeout(() => setCopiedKeyIndex(null), 2200);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-between p-6 bg-gradient-to-b from-[#0b0813]/90 via-[#190d1f]/85 to-[#0b0813]/95 backdrop-blur-md text-white select-none overflow-y-auto">
      {/* Background Anime Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-amber-400/10 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 text-center mt-4 sm:mt-6 animate-fade-in">
        <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-amber-300/30 text-amber-200 text-xs font-semibold uppercase tracking-widest shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Private Romantic 3D Sanctuary</span>
          </div>

          {/* "My Rooms" Button */}
          <button
            id="btn-my-rooms"
            type="button"
            onClick={() => setMyRoomsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-200 hover:bg-amber-500/30 hover:border-amber-300 transition shadow-lg"
            title="View rooms created on this device or restore access"
          >
            <FolderHeart className="w-3.5 h-3.5 text-amber-300" />
            <span>My Rooms {myRoomsList.length > 0 ? `(${myRoomsList.length})` : ''}</span>
          </button>

          {/* Graphics Quality Toggle Button */}
          <button
            id="btn-landing-quality"
            type="button"
            onClick={toggleGraphics}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition shadow-lg ${
              graphicsQuality === 'high'
                ? 'bg-amber-500/20 text-amber-200 border-amber-300/40 hover:bg-amber-500/30'
                : graphicsQuality === 'medium'
                ? 'bg-sky-500/20 text-sky-200 border-sky-400/40 hover:bg-sky-500/30'
                : 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40 hover:bg-emerald-500/30'
            }`}
            title="Click to toggle Graphics Mode"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>
              {graphicsQuality === 'high'
                ? 'High Graphics ✨'
                : graphicsQuality === 'medium'
                ? 'Balanced 🌿'
                : 'Safe Mode ⚡'}
            </span>
          </button>
        </div>

        <h1 className="font-cinzel text-3xl sm:text-5xl md:text-6xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-200 to-amber-100 drop-shadow-md">
          OUR FOREVER WORLD
        </h1>
        <p className="font-serif-romantic italic text-rose-200/90 text-sm sm:text-lg mt-2">
          An Interactive Anime Birthday Adventure
        </p>
      </div>

      {/* Main Choice Cards: CREATE A ROOM vs JOIN A ROOM */}
      <div className="relative z-10 max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
        {/* Card 1: ROOM CREATOR – MAN */}
        <div className="glass-panel-gold rounded-3xl p-6 sm:p-8 flex flex-col justify-between border-2 border-amber-400/40 shadow-2xl hover:border-amber-300 transition-all duration-300">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-400 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4 border border-white/30">
              <PlusCircle className="w-7 h-7 text-white" />
            </div>

            <div className="text-xs font-bold text-amber-300 uppercase tracking-widest mb-1">
              For The Husband / Partner
            </div>
            <h2 className="font-cinzel text-2xl font-bold text-white mb-2">
              CREATE A ROOM
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-6 font-light">
              Craft a romantic world made only for her: place up to 7 memory photos with personal letters, upload your singing concert recording, and customize the bedroom surprise.
            </p>
          </div>

          <button
            id="btn-create-room"
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="btn-gold w-full py-4 px-6 text-sm sm:text-base font-bold shadow-xl flex items-center justify-center gap-2 group"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-950" />
                <span>Creating Your World...</span>
              </>
            ) : (
              <>
                <span>Enter Room Creator</span>
                <ArrowRight className="w-4 h-4 text-amber-950 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </div>

        {/* Card 2: ROOM VISITOR – WOMAN */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between border-2 border-rose-400/40 shadow-2xl hover:border-rose-300 transition-all duration-300">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-400 flex items-center justify-center shadow-lg shadow-rose-500/20 mb-4 border border-white/30">
              <KeyRound className="w-7 h-7 text-white" />
            </div>

            <div className="text-xs font-bold text-rose-300 uppercase tracking-widest mb-1">
              For The Wife / Birthday Girl
            </div>
            <h2 className="font-cinzel text-2xl font-bold text-white mb-2">
              JOIN A ROOM
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-4 font-light">
              Enter the special secret room code he gave you to step into the world he created for your birthday.
            </p>

            {/* Room Code Input Form */}
            <form onSubmit={handleJoinRoom} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-rose-200 mb-1">
                  Enter Your Private Room Code:
                </label>
                <input
                  type="text"
                  placeholder="e.g. LOVE-7391"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-rose-400/40 text-amber-200 placeholder-gray-500 font-mono font-bold tracking-widest text-center focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300 text-base"
                />
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs text-center space-y-2">
                  <div>{errorMessage}</div>
                  <button
                    type="button"
                    onClick={handleJoinRoom}
                    disabled={isJoining}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-400/30 hover:bg-rose-400/40 text-white text-xs font-bold transition"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry Join</span>
                  </button>
                </div>
              )}

              <button
                id="btn-join-room"
                type="submit"
                disabled={isJoining}
                className="btn-romantic w-full py-3.5 px-6 text-sm sm:text-base font-bold shadow-xl flex items-center justify-center gap-2 group mt-2"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Loading Room Sanctuary...</span>
                  </>
                ) : (
                  <>
                    <span>Join Room Now</span>
                    <Heart className="w-4 h-4 text-white fill-white transition-transform group-hover:scale-125" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center text-xs text-rose-300/70 font-marcellus pb-2">
        A private romantic world created with love • Desktop & Mobile Friendly
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: "MY ROOMS" MANAGEMENT MODAL                         */}
      {/* ============================================================ */}
      {myRoomsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col glass-panel-gold rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-400/40">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-400/20 via-rose-500/20 to-amber-400/20 border-b border-amber-400/30">
              <div className="flex items-center gap-2">
                <FolderHeart className="w-5 h-5 text-amber-300" />
                <h3 className="font-cinzel text-lg sm:text-xl font-bold text-amber-100">
                  MY CREATED ROOMS
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMyRoomsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center border-b border-white/10 bg-black/40 px-6 gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveModalTab('list');
                  setModalFeedback({ error: '', success: '', loading: false });
                }}
                className={`py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition ${
                  activeModalTab === 'list'
                    ? 'border-amber-300 text-amber-200 bg-amber-400/10'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                Saved Rooms ({myRoomsList.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveModalTab('restore');
                  setModalFeedback({ error: '', success: '', loading: false });
                }}
                className={`py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition ${
                  activeModalTab === 'restore'
                    ? 'border-amber-300 text-amber-200 bg-amber-400/10'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                Restore Room On This Device
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveModalTab('claim');
                  setModalFeedback({ error: '', success: '', loading: false });
                }}
                className={`py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition ${
                  activeModalTab === 'claim'
                    ? 'border-amber-300 text-amber-200 bg-amber-400/10'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                Claim Room
              </button>
            </div>

            {/* Feedback Notifications */}
            {modalFeedback.error && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs">
                {modalFeedback.error}
              </div>
            )}
            {modalFeedback.success && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-semibold">
                {modalFeedback.success}
              </div>
            )}

            {/* Tab 1: Saved Rooms List */}
            {activeModalTab === 'list' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {myRoomsList.length === 0 ? (
                  <div className="text-center py-10 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-300/30 flex items-center justify-center mx-auto text-amber-300">
                      <FolderHeart className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-gray-300">
                      No rooms saved on this browser yet.
                    </p>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                      Click <strong>"Enter Room Creator"</strong> to make your first sanctuary, or switch to the <strong>"Restore Room"</strong> tab if you created one on another device!
                    </p>
                  </div>
                ) : (
                  myRoomsList.map((room, idx) => (
                    <div
                      key={room.roomCode || idx}
                      className="p-4 rounded-2xl bg-black/40 border border-amber-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-amber-300 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-mono font-bold">
                            {room.roomCode}
                          </span>
                          <span className="text-sm font-bold text-white">
                            {room.title || 'Our Forever World'}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400">
                          Created:{' '}
                          {room.createdAt
                            ? new Date(room.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Earlier'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleOpenAndEdit(room)}
                          disabled={modalFeedback.loading}
                          className="btn-gold py-2 px-3.5 text-xs font-bold flex items-center gap-1.5 shadow"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-amber-950" />
                          <span>Open & Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => copyToClipboard(room.creatorKey, 'listKey', idx)}
                          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-gray-200 flex items-center gap-1 transition"
                          title="Copy Secret Creator Key"
                        >
                          {copiedKeyIndex === idx ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">Key Copied!</span>
                            </>
                          ) : (
                            <>
                              <Key className="w-3.5 h-3.5 text-amber-300" />
                              <span>Copy Key</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRoom(room)}
                          disabled={modalFeedback.loading}
                          className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 transition"
                          title="Delete this room permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 2: Restore Room on This Device */}
            {activeModalTab === 'restore' && (
              <form onSubmit={handleRestoreSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <p className="text-xs text-gray-300 leading-relaxed font-light">
                  Have a room code and secret creator key from another browser, phone, or laptop? Enter both below to restore full creator edit access on this device.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">
                    Room Code:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LOVE-7391"
                    value={restoreCode}
                    onChange={(e) => setRestoreCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/20 text-amber-200 font-mono font-bold tracking-widest focus:outline-none focus:border-amber-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">
                    Secret Creator Key:
                  </label>
                  <input
                    type="text"
                    placeholder="Paste your 64-character secret key..."
                    value={restoreKey}
                    onChange={(e) => setRestoreKey(e.target.value.trim())}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/20 text-amber-100 font-mono text-xs focus:outline-none focus:border-amber-300"
                  />
                </div>

                <button
                  type="submit"
                  disabled={modalFeedback.loading}
                  className="btn-gold w-full py-3 px-4 text-xs font-bold shadow-lg flex items-center justify-center gap-2 mt-2"
                >
                  {modalFeedback.loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-950" />
                      <span>Validating Key...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 text-amber-950" />
                      <span>Restore My Room & Open Studio</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Tab 3: Claim Unowned Room */}
            {activeModalTab === 'claim' && (
              <form onSubmit={handleClaimSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <p className="text-xs text-gray-300 leading-relaxed font-light">
                  If you have a room created earlier before the creator key system was active, enter its room code below. If it currently has no owner, you can generate a secret creator key and claim it as yours.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">
                    Room Code to Claim:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LOVE-7391"
                    value={claimCode}
                    onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/20 text-amber-200 font-mono font-bold tracking-widest focus:outline-none focus:border-amber-300 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={modalFeedback.loading}
                  className="btn-romantic w-full py-3 px-4 text-xs font-bold shadow-lg flex items-center justify-center gap-2 mt-2"
                >
                  {modalFeedback.loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Claiming Room...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 text-white" />
                      <span>Claim This Room & Generate Key</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: CREATOR KEY GENERATED NOTIFICATION (SHOWN ONCE)     */}
      {/* ============================================================ */}
      {createdModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg glass-panel-gold rounded-3xl p-6 sm:p-8 space-y-5 border-2 border-amber-300 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-400 flex items-center justify-center shadow-lg shadow-amber-500/20 mx-auto text-white">
              <Key className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-amber-100">
                Your Sanctuary Is Ready!
              </h3>
              <p className="text-xs text-rose-200/90 font-light">
                Here is your secret creator key. Please save it in a safe place.
              </p>
            </div>

            {/* Room Code */}
            <div className="p-3.5 rounded-2xl bg-black/50 border border-amber-400/40 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-amber-300 uppercase tracking-widest font-semibold">
                  Room Code (Share with your love):
                </div>
                <div className="font-mono text-lg font-black text-amber-100">
                  {createdModalData.roomCode}
                </div>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(createdModalData.roomCode, 'createdCode')}
                className="btn-romantic py-1.5 px-3 text-xs font-bold flex items-center gap-1 shadow"
              >
                {createdCodeCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                <span>{createdCodeCopied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Creator Key */}
            <div className="p-3.5 rounded-2xl bg-black/50 border border-amber-400/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-amber-300 uppercase tracking-widest font-semibold">
                  Secret Creator Key:
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(createdModalData.creatorKey, 'createdKey')}
                  className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 text-xs font-bold flex items-center gap-1 transition"
                >
                  {createdKeyCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-amber-300" />}
                  <span>{createdKeyCopied ? 'Key Copied!' : 'Copy Key'}</span>
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-black/60 font-mono text-[11px] text-amber-200/90 break-all select-all border border-white/10">
                {createdModalData.creatorKey}
              </div>
              <p className="text-[11px] text-amber-200/80 leading-relaxed font-light">
                ⚠️ <strong>Save this key.</strong> You need it to edit this room, upload photos, or change letters from another device or browser.
              </p>
            </div>

            {/* Continue to studio button */}
            <button
              type="button"
              onClick={() => setCreatedModalData(null)}
              className="btn-gold w-full py-3.5 px-6 text-sm font-bold shadow-xl flex items-center justify-center gap-2 group"
            >
              <span>Enter Room Creator Studio</span>
              <ArrowRight className="w-4 h-4 text-amber-950 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
