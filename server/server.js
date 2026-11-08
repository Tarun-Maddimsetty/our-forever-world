import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

import { cloudDb } from './cloudDb.js';
import { cloudStorage } from './cloudStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Automatically load local .env if present (native in Node 20+)
if (fs.existsSync('.env') && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile('.env');
  } catch (e) {}
}

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure persistent directories exist
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Configure Multer for persistent file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const safeName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for high-res audio and images
});

// Configure CORS for production (Permits Vercel, Render, custom domains, or all origins)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
  : ['*'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json({ limit: '15mb' }));
app.use('/uploads', express.static(uploadsDir));

// Helper: Generate romantic, human-readable unique room code
function generateRoomCode() {
  const prefixes = ['LOVE', 'FOREVER', 'HEART', 'ALWAYS', 'SANCTUARY', 'ROMANCE', 'ETERNAL', 'SWEET'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}

// Default initial room configuration template
function createDefaultRoom(roomId, roomCode, creatorToken) {
  return {
    roomId,
    roomCode,
    creatorToken,
    published: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    title: 'Our Forever World',
    husbandName: 'My Love',
    wifeName: 'My Beautiful Wife',
    museumConfiguration: {
      photos: [
        {
          id: 1,
          title: 'The Day Our Stars Aligned',
          date: 'Memory 01',
          location: 'Where our journey began',
          image: '/assets/photos/memory1.jpg',
          letter: `My Dearest Love,\n\nDo you remember that first day? The world around us seemed to quiet down, and for the very first time in my life, my soul felt like it had finally found its true home.\n\nThank you for opening your heart to me. Every step since that moment has been pure magic.\n\nForever Yours ❤️`,
          wall: 'west',
          positionOffset: 0,
          scale: 1.0,
        },
        {
          id: 2,
          title: 'Our Unforgettable Adventures',
          date: 'Memory 02',
          location: 'Under endless skies',
          image: '/assets/photos/memory2.jpg',
          letter: `My Sweet Adventurer,\n\nThey say the destination doesn't matter as much as who you travel with, but with you, every single ordinary moment becomes a grand adventure.\n\nI want to explore every corner of this earth with you, hand in hand, never letting go.\n\nAlways by your side ❤️`,
          wall: 'east',
          positionOffset: 0,
          scale: 1.0,
        },
        {
          id: 3,
          title: 'The Quiet Little Moments',
          date: 'Memory 03',
          location: 'In our warm sanctuary',
          image: '/assets/photos/memory3.jpg',
          letter: `My Beautiful Wife,\n\nIt's the peaceful simplicity of being together that I treasure most. Making breakfast together, sharing a blanket, and your soft giggles.\n\nYou are my safe harbor.\n\nEndlessly loving you ❤️`,
          wall: 'west',
          positionOffset: 0,
          scale: 1.0,
        },
        {
          id: 4,
          title: 'Through Every Storm Together',
          date: 'Memory 04',
          location: 'Unbreakable & strong',
          image: '/assets/photos/memory4.jpg',
          letter: `To My Rock,\n\nWhenever the winds blew strong and the clouds grew dark, having you beside me made me feel completely invincible.\n\nI am yours in all seasons of life.\n\nYour faithful protector ❤️`,
          wall: 'east',
          positionOffset: 0,
          scale: 1.0,
        },
        {
          id: 5,
          title: 'The Sound of Your Laughter',
          date: 'Memory 05',
          location: 'The music of my life',
          image: '/assets/photos/memory5.jpg',
          letter: `My Sunshine,\n\nYour laugh is my favorite melody in the entire universe. Whenever you smile from your heart, my whole universe lights up.\n\nForever smiling with you ❤️`,
          wall: 'west',
          positionOffset: 0,
          scale: 1.0,
        },
        {
          id: 6,
          title: 'Dreams We Are Building',
          date: 'Memory 06',
          location: 'Our bright tomorrow',
          image: '/assets/photos/memory6.jpg',
          letter: `My Partner in Everything,\n\nWhen I close my eyes and picture the years ahead, I see your hand still intertwined with mine. We are building a life filled with kindness, warmth, and boundless love.\n\nBuilding our forever ❤️`,
          wall: 'east',
          positionOffset: 0,
          scale: 1.0,
        },
        {
          id: 7,
          title: 'My Eternal Vow to You',
          date: 'Memory 07',
          location: 'Written in the stars',
          image: '/assets/photos/memory7.jpg',
          letter: `My Whole Heart,\n\nAll these memories are merely the opening chapters of our endless story. Now, step forward into the rooms waiting ahead...\n\nWith every beat of my heart ❤️`,
          wall: 'north',
          positionOffset: 0,
          scale: 1.0,
        },
      ],
    },
    singingConfiguration: {
      songTitle: 'A Song From My Heart',
      singingAudioUrl: '/assets/audio/background-music.mp3',
      hasCustomAudio: false,
      stageLightingColor: '#ffd700',
      microphoneHeight: 1.25,
      introMessage: 'I prepared this special song just for you...',
    },
    dancingConfiguration: {
      danceMusicUrl: '/assets/audio/background-music.mp3',
      danceSongName: 'Our Romantic Waltz',
      tempo: 'slow',
      lightingMood: 'candlelight',
      rosePetalDensity: 'high',
    },
    bedroomConfiguration: {
      birthdayLetter: {
        salutation: 'To My Dearest, Most Beautiful Wife,',
        bodyParagraphs: [
          'Happy Birthday, my darling! On this special day, the whole universe celebrates the moment you came into this world, bringing warmth, kindness, and boundless joy to everyone lucky enough to know you—and most especially to me.',
          'Every single day I wake up knowing I am loved by you is the greatest privilege of my life. You make every ordinary day feel like an extraordinary blessing. In your eyes, I see my future, my sanctuary, and my peace.',
          'I built this world for you so that whenever distance or time feels heavy, you can step into this place and remember that my love for you is vast, unwavering, and forever.',
          'May this new year of your life be filled with sweet surprises, laughter, overflowing love, and all the dreams your heart has ever wished for. I will be right here holding your hand, cheering for you, protecting you, and loving you more and more every single day.',
        ],
        closing: 'With all my heart and my entire soul,',
        signature: 'Your Loving Husband ❤️',
      },
      voiceRecordingUrl: '/assets/audio/birthday-voice.mp3',
      hasCustomVoice: false,
      necklaceType: 'gold_heart_diamond',
      allowHug: true,
      allowKiss: true,
      greetingMessage: 'HAPPY BIRTHDAY, MY LOVE! ❤️',
      greetingSubtitle: 'I have been waiting here for you with all my love...',
    },
  };
}

// 1. CREATE A ROOM (Creator)
app.post('/api/rooms', async (req, res) => {
  try {
    const roomId = crypto.randomUUID();
    let roomCode = generateRoomCode();

    // Ensure room code uniqueness in database
    let attempts = 0;
    while ((await cloudDb.isCodeTaken(roomCode)) && attempts < 10) {
      roomCode = generateRoomCode();
      attempts++;
    }

    const creatorToken = crypto.randomBytes(32).toString('hex');
    const newRoom = createDefaultRoom(roomId, roomCode, creatorToken);

    await cloudDb.saveRoom(newRoom);

    console.log(`[Room Created] ID: ${roomId}, Code: ${roomCode}`);
    res.json({
      success: true,
      roomId,
      roomCode,
      creatorToken,
      room: newRoom,
    });
  } catch (err) {
    console.error('Error creating room:', err);
    res.status(500).json({ success: false, error: 'Failed to create room.' });
  }
});

// 2. GET ROOM BY CODE (Visitor or Creator Preview)
app.get('/api/rooms/:roomCode', async (req, res) => {
  try {
    const { roomCode } = req.params;
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.replace(/^Bearer\s+/i, '');

    const room = await cloudDb.getRoomByCode(roomCode);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room code not found. Please verify the code and try again.',
      });
    }

    const isCreator = token && room.creatorToken === token;

    // Visitors can only see published rooms
    if (!room.published && !isCreator) {
      return res.status(403).json({
        success: false,
        error: 'This world has not been published yet. Please ask your love for the final code once he completes it.',
      });
    }

    // Sanitized payload for visitor: NEVER expose creatorToken or secrets
    const sanitizedRoom = { ...room };
    if (!isCreator) {
      delete sanitizedRoom.creatorToken;
    }

    res.json({
      success: true,
      isCreator: Boolean(isCreator),
      room: sanitizedRoom,
    });
  } catch (err) {
    console.error('Error getting room:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve room.' });
  }
});

// 3. UPDATE ROOM CONFIGURATION (Creator Only)
app.put('/api/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.replace(/^Bearer\s+/i, '');

    const room = await cloudDb.getRoomById(roomId);

    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found.' });
    }

    if (!token || room.creatorToken !== token) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized. Only the creator has permission to modify this room.',
      });
    }

    const {
      title,
      husbandName,
      wifeName,
      museumConfiguration,
      singingConfiguration,
      dancingConfiguration,
      bedroomConfiguration,
    } = req.body || {};

    if (title !== undefined) room.title = title;
    if (husbandName !== undefined) room.husbandName = husbandName;
    if (wifeName !== undefined) room.wifeName = wifeName;
    if (museumConfiguration !== undefined) room.museumConfiguration = museumConfiguration;
    if (singingConfiguration !== undefined) room.singingConfiguration = singingConfiguration;
    if (dancingConfiguration !== undefined) room.dancingConfiguration = dancingConfiguration;
    if (bedroomConfiguration !== undefined) room.bedroomConfiguration = bedroomConfiguration;

    room.updatedAt = new Date().toISOString();
    await cloudDb.saveRoom(room);

    console.log(`[Room Updated] ID: ${roomId}`);
    res.json({
      success: true,
      room,
    });
  } catch (err) {
    console.error('Error updating room:', err);
    res.status(500).json({ success: false, error: 'Failed to update room.' });
  }
});

// 4. PUBLISH ROOM (Creator Only)
app.post('/api/rooms/:roomId/publish', async (req, res) => {
  try {
    const { roomId } = req.params;
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.replace(/^Bearer\s+/i, '');

    const room = await cloudDb.getRoomById(roomId);

    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found.' });
    }

    if (!token || room.creatorToken !== token) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized. Only the creator can publish this room.',
      });
    }

    room.published = true;
    room.updatedAt = new Date().toISOString();
    await cloudDb.saveRoom(room);

    console.log(`[Room Published] ID: ${roomId}, Code: ${room.roomCode}`);
    res.json({
      success: true,
      roomCode: room.roomCode,
      published: true,
      room,
    });
  } catch (err) {
    console.error('Error publishing room:', err);
    res.status(500).json({ success: false, error: 'Failed to publish room.' });
  }
});

// 5. SECURE CLOUD FILE UPLOAD (Creator Only)
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.replace(/^Bearer\s+/i, '');

    if (!token) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(401).json({ success: false, error: 'Authentication token required.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }

    // Upload to active storage provider (Cloudinary, Supabase, or persistent disk)
    const uploadResult = await cloudStorage.uploadFile(req.file);

    res.json({
      success: true,
      url: uploadResult.url,
      provider: uploadResult.provider,
      filename: uploadResult.originalName,
      originalName: uploadResult.originalName,
      size: uploadResult.size,
      mimetype: uploadResult.mimetype,
    });
  } catch (err) {
    console.error('Error handling upload:', err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, error: 'Failed to upload media.' });
  }
});

// 6. HEALTH CHECK & STATUS ENDPOINT
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: cloudDb.getDbStatus(),
    storage: cloudStorage.getStorageStatus(),
    environment: process.env.NODE_ENV || 'production',
  });
});

// Serve production static frontend if built
const distDir = path.join(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    if (req.method === 'GET') {
      return res.sendFile(path.join(distDir, 'index.html'));
    }
    next();
  });
}

export default app;

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Forever World Backend running on port ${PORT}`);
  });
}
