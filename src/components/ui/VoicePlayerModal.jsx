import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Square, Volume2, Heart, Sparkles, X } from 'lucide-react';
import { gameStore, useGameStore } from '../../hooks/useGameStore';
import { BIRTHDAY_CONTENT } from '../../data/birthdayContent';
import confetti from 'canvas-confetti';

export default function VoicePlayerModal() {
  // Completely removed per user instructions — voice playback is cleanly housed in Bedroom HUD toolbar
  return null;
}
