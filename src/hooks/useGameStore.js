import { useState, useEffect } from 'react';
import { DEFAULT_ROOM_DATA } from '../data/defaultRoomData';

const SESSION_STORAGE_KEY = 'forever_world_session_v2';

// Helper to load persisted session
function loadSavedSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not load session from localStorage:', e);
  }
  return null;
}

const savedSession = loadSavedSession();

// Automatic device detection heuristic for initial quality
function detectOptimalStartingQuality() {
  if (savedSession?.graphicsQuality) {
    return savedSession.graphicsQuality;
  }
  if (typeof window === 'undefined') return 'high';
  try {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const memory = navigator.deviceMemory || 8;
    const cores = navigator.hardwareConcurrency || 4;

    if (isMobile) {
      return memory <= 4 ? 'low' : 'medium';
    }
    if (memory <= 4 || cores <= 2) {
      return 'medium';
    }
  } catch (e) {}
  return 'high';
}

const state = {
  // Mode: 'landing' | 'creator' | 'visitor' (ALWAYS start on landing screen upon open or refresh)
  mode: 'landing',

  // Room Identifiers
  roomId: savedSession?.roomId || null,
  roomCode: savedSession?.roomCode || '',
  creatorToken: savedSession?.creatorToken || null,
  isPublished: savedSession?.isPublished ?? false,

  // Full Room Configuration (Guaranteed default so it's NEVER null)
  roomData: savedSession?.roomData || DEFAULT_ROOM_DATA,

  // Current Active Room Environment
  currentRoom: savedSession?.currentRoom || 'museum', // 'museum' | 'singing' | 'dancing' | 'bedroom'
  scene: savedSession?.currentRoom || 'museum', // backwards compatibility with HUD & modals

  // Creator Preview Mode (testing entire experience as visitor before sharing)
  isPreviewMode: false,

  // Bedroom Sequence
  bedroomStep: 'sitting_on_bed',

  // Special Actions: null | 'dance' | 'hug' | 'kiss' | 'singing'
  specialAction: null,
  specialActionTimeRemaining: 0,

  // Audio Playback states (STRICT: All default to FALSE. No automatic music!)
  isAudioMuted: false,
  activeAudioTrack: null, // null | 'background' | 'singing' | 'dance' | 'voice'
  isMusicPlaying: false,
  isSingingPlaying: false,
  isDanceMusicPlaying: false,
  isVoicePlaying: false,

  // Creator Editing Modals
  creatorEditPanel: null, // null | 'museum' | 'singing' | 'dancing' | 'bedroom' | 'publish'
  activeEditingPhotoIndex: 0,

  // Proximity & Interaction
  nearbyObject: null,
  interactionPrompt: null,

  // Visitor Progression
  memoriesRead: [],
  activeMemory: null,

  // Modals
  isLetterModalOpen: false,
  isBirthdayLetterModalOpen: false,
  isVoiceModalOpen: false,
  isPhotoModalOpen: false,
  selectedPhoto: null,

  // Performance & Settings ('low' | 'medium' | 'high')
  graphicsQuality: detectOptimalStartingQuality(),
  playerPos: [0, 0, 6],
  cameraOrbit: { yaw: 0, pitch: 0.22, distance: 4.5 },
  joystickVector: { x: 0, y: 0 },
  isActionPressed: false,
  cameraAngle: 0,
};

const listeners = new Set();
const PERSISTENT_KEYS = new Set(['mode', 'roomId', 'roomCode', 'creatorToken', 'isPublished', 'currentRoom', 'roomData', 'graphicsQuality']);

function saveSessionState() {
  try {
    const dataToSave = {
      mode: state.mode,
      roomId: state.roomId,
      roomCode: state.roomCode,
      creatorToken: state.creatorToken,
      isPublished: state.isPublished,
      currentRoom: state.currentRoom,
      roomData: state.roomData,
      graphicsQuality: state.graphicsQuality,
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (e) {
    console.warn('Could not save session to localStorage:', e);
  }
}

export const gameStore = {
  get: () => state,
  set: (updater) => {
    let shouldPersist = false;
    if (typeof updater === 'function') {
      const next = updater(state);
      shouldPersist = Object.keys(next).some((k) => PERSISTENT_KEYS.has(k));
      Object.assign(state, next);
    } else {
      shouldPersist = Object.keys(updater).some((k) => PERSISTENT_KEYS.has(k));
      Object.assign(state, updater);
    }
    if (shouldPersist) {
      saveSessionState();
    }
    listeners.forEach((listener) => listener(state));
  },
  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  setRoomData: (roomData) => {
    gameStore.set({ roomData });
  },

  navigateToRoom: (targetRoom, customPos = null) => {
    let targetPos = customPos;
    if (!targetPos) {
      if (targetRoom === 'museum') targetPos = [0, 0, 6];
      else if (targetRoom === 'singing') targetPos = [0, 0, -24];
      else if (targetRoom === 'dancing') targetPos = [0, 0, -54];
      else if (targetRoom === 'bedroom') targetPos = [0, 0, -84];
      else targetPos = [0, 0, 0];
    }

    gameStore.set({
      currentRoom: targetRoom,
      scene: targetRoom,
      playerPos: targetPos,
      cameraOrbit: { yaw: 0, pitch: 0.22, distance: 4.5 },
      nearbyObject: null,
      interactionPrompt: null,
      specialAction: null,
      bedroomStep: targetRoom === 'bedroom' ? 'sitting_on_bed' : 'outside',
      isSingingPlaying: targetRoom === 'singing' ? state.isSingingPlaying : false,
      isDanceMusicPlaying: targetRoom === 'dancing' ? state.isDanceMusicPlaying : false,
    });
  },

  enterPreviewMode: (initialRoom = 'museum') => {
    let targetPos = [0, 0, 6];
    if (initialRoom === 'singing') targetPos = [0, 0, -26];
    else if (initialRoom === 'dancing') targetPos = [0, 0, -56];
    else if (initialRoom === 'bedroom') targetPos = [0, 0, -84];

    gameStore.set({
      isPreviewMode: true,
      creatorEditPanel: null,
      currentRoom: initialRoom,
      scene: initialRoom,
      playerPos: targetPos,
      cameraOrbit: { yaw: 0, pitch: 0.22, distance: 4.5 },
      nearbyObject: null,
      interactionPrompt: null,
      specialAction: null,
      bedroomStep: 'sitting_on_bed',
    });
  },

  exitPreviewMode: () => {
    gameStore.set({
      isPreviewMode: false,
      creatorEditPanel: 'museum',
      specialAction: null,
      isMusicPlaying: false,
      isSingingPlaying: false,
      isDanceMusicPlaying: false,
      isVoicePlaying: false,
    });
  },

  nextBedroomStep: (step) => {
    gameStore.set({ bedroomStep: step });
  },

  enterBedroom: () => {
    gameStore.navigateToRoom('bedroom');
  },

  revisitMuseum: () => {
    gameStore.navigateToRoom('museum');
  },

  markMemoryRead: (id) => {
    if (!state.memoriesRead.includes(id)) {
      gameStore.set({ memoriesRead: [...state.memoriesRead, id] });
    }
  },

  openMemoryLetter: (memory) => {
    gameStore.markMemoryRead(memory.id);
    gameStore.set({
      activeMemory: memory,
      isLetterModalOpen: true,
      interactionPrompt: null,
    });
  },

  closeMemoryLetter: () => {
    gameStore.set({
      isLetterModalOpen: false,
      activeMemory: null,
    });
  },

  triggerSpecialAction: (actionType, durationSec = 4) => {
    gameStore.set({
      specialAction: actionType,
      specialActionTimeRemaining: durationSec,
    });

    const interval = setInterval(() => {
      const cur = gameStore.get().specialActionTimeRemaining;
      if (cur <= 1) {
        clearInterval(interval);
        gameStore.set({
          specialAction: null,
          specialActionTimeRemaining: 0,
        });
      } else {
        gameStore.set({ specialActionTimeRemaining: cur - 1 });
      }
    }, 1000);
  },

  clearSession: () => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {}
    gameStore.set({
      mode: 'landing',
      roomId: null,
      roomCode: '',
      creatorToken: null,
      isPublished: false,
      currentRoom: 'museum',
      scene: 'museum',
      playerPos: [0, 0, 8],
      specialAction: null,
      isMusicPlaying: false,
      isSingingPlaying: false,
      isDanceMusicPlaying: false,
      isVoicePlaying: false,
    });
  },
};

export function useGameStore(selector = (s) => s) {
  const [slice, setSlice] = useState(() => selector(gameStore.get()));

  useEffect(() => {
    const unsubscribe = gameStore.subscribe((newState) => {
      setSlice(selector(newState));
    });
    return unsubscribe;
  }, [selector]);

  return slice;
}

useGameStore.getState = gameStore.get;

if (typeof window !== 'undefined') {
  window.__gameStore = gameStore;
}
