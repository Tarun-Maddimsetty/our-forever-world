import { useEffect, useRef } from 'react';
import { gameStore, useGameStore } from './useGameStore';

class ControlledAudioManager {
  constructor() {
    this.audioInstances = {
      background: null,
      singing: null,
      dance: null,
      voice: null,
    };
    this.isMuted = false;
    this.currentPlayingChannel = null;
  }

  // Get or initialize audio element for a specific channel
  getAudio(channel, defaultSrc = '/assets/audio/background-music.mp3') {
    if (!this.audioInstances[channel]) {
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.onended = () => {
        this.currentPlayingChannel = null;
        gameStore.set({
          activeAudioTrack: null,
          isMusicPlaying: false,
          isSingingPlaying: false,
          isDanceMusicPlaying: false,
          isVoicePlaying: false,
        });
      };
      this.audioInstances[channel] = audio;
    }
    const inst = this.audioInstances[channel];
    if (defaultSrc && (!inst.src || !inst.src.includes(defaultSrc))) {
      inst.src = defaultSrc;
    }
    inst.muted = this.isMuted;
    return inst;
  }

  // Stop all playing channels to prevent overlapping audio
  stopAllAudio() {
    Object.keys(this.audioInstances).forEach((key) => {
      const a = this.audioInstances[key];
      if (a) {
        a.pause();
        a.currentTime = 0;
      }
    });
    this.currentPlayingChannel = null;
    gameStore.set({
      activeAudioTrack: null,
      isMusicPlaying: false,
      isSingingPlaying: false,
      isDanceMusicPlaying: false,
      isVoicePlaying: false,
    });
  }

  // Toggle Mute across all channels
  toggleMute() {
    this.isMuted = !this.isMuted;
    Object.values(this.audioInstances).forEach((a) => {
      if (a) a.muted = this.isMuted;
    });
    gameStore.set({ isAudioMuted: this.isMuted });
  }

  // 1. Background Music Controls
  playBackgroundMusic(src = '/assets/audio/background-music.mp3') {
    if (this.currentPlayingChannel !== 'background') {
      this.stopAllAudio();
    }
    const audio = this.getAudio('background', src);
    audio.loop = true;
    audio.play().then(() => {
      this.currentPlayingChannel = 'background';
      gameStore.set({ activeAudioTrack: 'background', isMusicPlaying: true });
    }).catch((e) => console.log('Music play request:', e.message));
  }

  pauseBackgroundMusic() {
    const audio = this.audioInstances.background;
    if (audio) audio.pause();
    gameStore.set({ isMusicPlaying: false });
  }

  stopBackgroundMusic() {
    const audio = this.audioInstances.background;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    gameStore.set({ isMusicPlaying: false, activeAudioTrack: null });
  }

  // 2. Singing Room Audio Controls
  playSingingAudio(src) {
    if (this.currentPlayingChannel !== 'singing') {
      this.stopAllAudio();
    }
    const audio = this.getAudio('singing', src || '/assets/audio/background-music.mp3');
    audio.loop = false;
    audio.play().then(() => {
      this.currentPlayingChannel = 'singing';
      gameStore.set({
        activeAudioTrack: 'singing',
        isSingingPlaying: true,
        specialAction: 'singing',
      });
    }).catch((e) => console.log('Singing play request:', e.message));
  }

  pauseSingingAudio() {
    const audio = this.audioInstances.singing;
    if (audio) audio.pause();
    gameStore.set({ isSingingPlaying: false });
  }

  stopSingingAudio() {
    const audio = this.audioInstances.singing;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    gameStore.set({
      isSingingPlaying: false,
      activeAudioTrack: null,
      specialAction: null,
    });
  }

  // 3. Dancing Room Music Controls
  playDanceMusic(src) {
    if (this.currentPlayingChannel !== 'dance') {
      this.stopAllAudio();
    }
    const audio = this.getAudio('dance', src || '/assets/audio/background-music.mp3');
    audio.loop = true;
    audio.play().then(() => {
      this.currentPlayingChannel = 'dance';
      gameStore.set({
        activeAudioTrack: 'dance',
        isDanceMusicPlaying: true,
        specialAction: 'dance',
      });
    }).catch((e) => console.log('Dance play request:', e.message));
  }

  pauseDanceMusic() {
    const audio = this.audioInstances.dance;
    if (audio) audio.pause();
    gameStore.set({ isDanceMusicPlaying: false });
  }

  stopDanceMusic() {
    const audio = this.audioInstances.dance;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    gameStore.set({
      isDanceMusicPlaying: false,
      activeAudioTrack: null,
      specialAction: null,
    });
  }

  // 4. Bedroom Personal Voice Recording Controls
  playVoice(src) {
    if (this.currentPlayingChannel !== 'voice') {
      this.stopAllAudio();
    }
    const audio = this.getAudio('voice', src || '/assets/audio/birthday-voice.mp3');
    audio.loop = false;
    audio.play().then(() => {
      this.currentPlayingChannel = 'voice';
      gameStore.set({ activeAudioTrack: 'voice', isVoicePlaying: true });
    }).catch((e) => console.log('Voice play request:', e.message));
  }

  pauseVoice() {
    const audio = this.audioInstances.voice;
    if (audio) audio.pause();
    gameStore.set({ isVoicePlaying: false });
  }

  replayVoice(src) {
    const audio = this.audioInstances.voice;
    if (audio) audio.currentTime = 0;
    this.playVoice(src);
  }

  stopVoice() {
    const audio = this.audioInstances.voice;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    gameStore.set({ isVoicePlaying: false, activeAudioTrack: null });
  }

  // Audio Context Initialization (Safe, user-gesture friendly)
  init() {
    try {
      if (!this.audioCtx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    } catch (e) {
      console.warn('AudioContext init:', e);
    }
  }

  // Gentle subtle sound cues (NO autoplay loops!)
  playSparkle() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.audioCtx) return;
      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      // Gentle romantic 2-tone chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.18); // E6
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {}
  }

  playDoorSound() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.audioCtx) return;
      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(554.37, now + 0.22);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.46);
    } catch (e) {}
  }
}

export const controlledAudio = new ControlledAudioManager();
export const romanticAudio = controlledAudio; // Universal alias

if (typeof window !== 'undefined') {
  window.__romanticAudio = controlledAudio;
}

export function useAudioManager() {
  const isMuted = useGameStore((s) => s.isAudioMuted);

  useEffect(() => {
    controlledAudio.isMuted = isMuted;
  }, [isMuted]);

  // Clean cleanup on unmount
  useEffect(() => {
    return () => {
      controlledAudio.stopAllAudio();
    };
  }, []);

  return controlledAudio;
}
