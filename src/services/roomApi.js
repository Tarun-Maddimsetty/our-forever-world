import { DEFAULT_ROOM_DATA } from '../data/defaultRoomData';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const MY_ROOMS_KEY = 'forever_world_my_rooms';

export function getMyRooms() {
  try {
    const raw = localStorage.getItem(MY_ROOMS_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (e) {}
  return [];
}

export function saveMyRoom(roomEntry) {
  if (!roomEntry || !roomEntry.roomCode) return;
  try {
    const list = getMyRooms();
    const code = roomEntry.roomCode.trim().toUpperCase();
    const existingIdx = list.findIndex((r) => r.roomCode.trim().toUpperCase() === code);
    const entry = {
      roomId: roomEntry.roomId,
      roomCode: code,
      creatorKey: roomEntry.creatorKey || roomEntry.creatorToken,
      creatorToken: roomEntry.creatorKey || roomEntry.creatorToken,
      title: roomEntry.title || roomEntry.room?.title || 'Our Forever World',
      createdAt: roomEntry.createdAt || new Date().toISOString(),
      lastOpenedAt: new Date().toISOString(),
    };
    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...entry };
    } else {
      list.unshift(entry);
    }
    localStorage.setItem(MY_ROOMS_KEY, JSON.stringify(list));
  } catch (e) {}
}

export function removeMyRoom(roomCode) {
  if (!roomCode) return;
  try {
    const list = getMyRooms().filter(
      (r) => r.roomCode.trim().toUpperCase() !== roomCode.trim().toUpperCase()
    );
    localStorage.setItem(MY_ROOMS_KEY, JSON.stringify(list));
  } catch (e) {}
}

function getLocalRooms() {
  try {
    return JSON.parse(localStorage.getItem('forever_world_local_rooms') || '{}');
  } catch (e) {
    return {};
  }
}

function saveLocalRoom(roomRecord) {
  try {
    const rooms = getLocalRooms();
    rooms[roomRecord.roomCode] = roomRecord;
    rooms[roomRecord.roomId] = roomRecord;
    localStorage.setItem('forever_world_local_rooms', JSON.stringify(rooms));
  } catch (e) {}
}

// Client-side image downscaling to max 1600px to keep GPU textures light and uploads fast
export async function resizeImage(file, maxDimension = 1600) {
  if (!file || !file.type || !file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width <= maxDimension && height <= maxDimension) {
        return resolve(file);
      }

      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const cleanName = (file.name || 'photo').replace(/\.[^.]+$/, '.jpg');
          const resizedFile = new File([blob], cleanName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(resizedFile);
        },
        'image/jpeg',
        0.88
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

export const roomApi = {
  // Create a brand new room draft
  async createRoom() {
    try {
      const res = await fetch(`${API_BASE}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        const key = data.creatorKey || data.creatorToken;
        saveLocalRoom({
          roomId: data.roomId,
          roomCode: data.roomCode,
          creatorToken: key,
          creatorKey: key,
          isPublished: true,
          room: data.room,
        });
        saveMyRoom({
          roomId: data.roomId,
          roomCode: data.roomCode,
          creatorKey: key,
          creatorToken: key,
          title: data.room?.title || 'Our Forever World',
          createdAt: data.room?.createdAt || new Date().toISOString(),
        });
        return {
          ...data,
          creatorKey: key,
        };
      }
    } catch (e) {
      console.warn('Backend /api/rooms offline, using offline-ready room creation:', e.message);
    }

    // Resilient local fallback: Guaranteed instant room creation
    const roomId = 'room_' + Date.now();
    const randomCode = 'LOVE-' + Math.floor(1000 + Math.random() * 9000);
    const creatorToken = 'token_' + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
    const newRoom = {
      ...DEFAULT_ROOM_DATA,
      roomId,
      roomCode: randomCode,
      creatorToken,
      creatorKey: creatorToken,
      published: true,
    };
    const localData = {
      roomId,
      roomCode: randomCode,
      creatorToken,
      creatorKey: creatorToken,
      isPublished: true,
      room: newRoom,
    };
    saveLocalRoom(localData);
    saveMyRoom({
      roomId,
      roomCode: randomCode,
      creatorKey: creatorToken,
      creatorToken: creatorToken,
      title: 'Our Forever World',
      createdAt: new Date().toISOString(),
    });
    return localData;
  },

  // Fetch room configuration by room code (with optional creator token for preview)
  async getRoom(roomCode, creatorToken = null) {
    if (!roomCode || typeof roomCode !== 'string') {
      throw new Error('Please enter a valid room code.');
    }
    const code = roomCode.trim().toUpperCase();
    try {
      const headers = {};
      if (creatorToken) {
        headers['Authorization'] = `Bearer ${creatorToken}`;
      }
      const res = await fetch(`${API_BASE}/api/rooms/${encodeURIComponent(code)}`, {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        saveLocalRoom({
          roomId: data.room.roomId,
          roomCode: data.room.roomCode,
          creatorToken: creatorToken || (data.isCreator ? data.room.creatorToken : null),
          isPublished: true,
          room: data.room,
        });
        return data;
      }

      // Backend returned error response (e.g. 404)
      const errData = await res.json().catch(() => ({}));
      const message =
        errData.error ||
        (res.status === 404
          ? `Room code "${code}" not found. Please verify the code and try again.`
          : `Failed to load room (${res.status}).`);
      throw new Error(message);
    } catch (e) {
      // Check local cache if truly offline
      const localRooms = getLocalRooms();
      if (localRooms[code] && localRooms[code].room) {
        console.warn('Network unavailable, served locally cached room:', code);
        return { room: localRooms[code].room, isCreator: Boolean(creatorToken) };
      }
      throw e;
    }
  },

  // Claim unowned room and generate creator key once
  async claimRoom(roomCode) {
    const code = roomCode.trim().toUpperCase();
    const res = await fetch(`${API_BASE}/api/rooms/${encodeURIComponent(code)}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to claim room.');
    }
    const data = await res.json();
    const key = data.creatorKey || data.creatorToken;
    saveMyRoom({
      roomId: data.room.roomId,
      roomCode: data.room.roomCode,
      creatorKey: key,
      creatorToken: key,
      title: data.room?.title || 'Our Forever World',
      createdAt: data.room?.createdAt || new Date().toISOString(),
    });
    return data;
  },

  // Delete room (Creator only)
  async deleteRoom(roomId, creatorToken, roomCode = null) {
    const res = await fetch(`${API_BASE}/api/rooms/${roomId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${creatorToken}`,
      },
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to delete room.');
    }
    if (roomCode) {
      removeMyRoom(roomCode);
    }
    return res.json();
  },

  // Update room data (Creator only)
  async updateRoom(roomId, creatorToken, updates) {
    try {
      const res = await fetch(`${API_BASE}/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${creatorToken}`,
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        saveLocalRoom({
          roomId,
          creatorToken,
          room: data.room,
        });
        return data;
      }
    } catch (e) {
      console.warn('Backend update offline, updating locally:', e.message);
    }

    // Update in local cache
    const localRooms = getLocalRooms();
    const existing = localRooms[roomId] || { room: { ...DEFAULT_ROOM_DATA, roomId } };
    existing.room = { ...existing.room, ...updates };
    saveLocalRoom(existing);
    return { success: true, room: existing.room };
  },

  // Publish room and lock for visitor entry (Creator only)
  async publishRoom(roomId, creatorToken) {
    try {
      const res = await fetch(`${API_BASE}/api/rooms/${roomId}/publish`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${creatorToken}`,
        },
      });
      if (res.ok) {
        return res.json();
      }
    } catch (e) {
      console.warn('Backend publish offline, publishing locally:', e.message);
    }

    const localRooms = getLocalRooms();
    if (localRooms[roomId]) {
      localRooms[roomId].isPublished = true;
      localRooms[roomId].room.isPublished = true;
      saveLocalRoom(localRooms[roomId]);
    }
    return { success: true, isPublished: true };
  },

  // Upload photo or audio file to cloud storage and persist under room
  async uploadMedia(file, creatorToken, options = {}) {
    try {
      const processedFile = await resizeImage(file, 1600);
      const formData = new FormData();
      formData.append('file', processedFile);
      if (options.roomCode) formData.append('roomCode', options.roomCode);
      if (options.roomId) formData.append('roomId', options.roomId);
      if (options.photoIndex !== undefined) formData.append('photoIndex', options.photoIndex);
      if (options.caption) formData.append('caption', options.caption);
      if (options.uploader) formData.append('uploader', options.uploader);
      if (options.room) formData.append('room', options.room);
      if (options.letter) formData.append('letter', options.letter);

      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${creatorToken}`,
        },
        body: formData,
      });

      if (res.ok) {
        return await res.json();
      }

      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Upload failed (${res.status})`);
    } catch (e) {
      console.warn('Backend cloud upload error:', e.message);
      throw e;
    }
  },

  // Delete photo (only with creator token & confirmation)
  async deletePhoto(roomId, creatorToken, photoId) {
    const res = await fetch(`${API_BASE}/api/rooms/${roomId}/photos/${photoId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${creatorToken}`,
      },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to delete photo (${res.status})`);
    }

    return res.json();
  },
};
