import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'data');
const roomsFile = path.join(dataDir, 'rooms.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export class CloudDbService {
  constructor() {
    this.provider = this.detectProvider();
    console.log(`[Database] Initialized with provider: ${this.provider}`);
  }

  detectProvider() {
    if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY)) {
      return 'supabase';
    }
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      return 'upstash';
    }
    if (process.env.MONGODB_DATA_API_URL && process.env.MONGODB_API_KEY) {
      return 'mongodb_data_api';
    }
    return 'local_file';
  }

  getDbStatus() {
    return {
      provider: this.provider,
      isCloud: this.provider !== 'local_file',
      details:
        this.provider === 'supabase'
          ? `Supabase PostgreSQL (URL: ${process.env.SUPABASE_URL})`
          : this.provider === 'upstash'
          ? 'Upstash Serverless Redis'
          : this.provider === 'mongodb_data_api'
          ? 'MongoDB Atlas Data API'
          : 'Local File Database (server/data/rooms.json)',
    };
  }

  // --- Local File Implementation ---
  _readLocalRooms() {
    if (!fs.existsSync(roomsFile)) {
      fs.writeFileSync(roomsFile, JSON.stringify({}, null, 2));
      return {};
    }
    try {
      const raw = fs.readFileSync(roomsFile, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {
      console.error('[Database:Local] Error reading rooms.json:', e);
      return {};
    }
  }

  _writeLocalRooms(rooms) {
    const tmpFile = `${roomsFile}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(rooms, null, 2));
    fs.renameSync(tmpFile, roomsFile);
  }

  // --- Core CRUD Interface ---

  async getRoomByCode(roomCode) {
    if (!roomCode) return null;
    const cleanCode = roomCode.trim().toUpperCase();

    // 1. Supabase
    if (this.provider === 'supabase') {
      try {
        const url = process.env.SUPABASE_URL.replace(/\/+$/, '');
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
        const res = await fetch(`${url}/rest/v1/rooms?room_code=eq.${encodeURIComponent(cleanCode)}&select=*`, {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            Accept: 'application/json',
          },
        });
        if (res.ok) {
          const list = await res.json();
          if (list && list.length > 0) {
            return list[0].room_data || list[0];
          }
        }
      } catch (err) {
        console.error('[Database:Supabase] getRoomByCode error:', err);
      }
    }

    // 2. Upstash Redis
    if (this.provider === 'upstash') {
      try {
        const url = process.env.UPSTASH_REDIS_REST_URL.replace(/\/+$/, '');
        const token = process.env.UPSTASH_REDIS_REST_TOKEN;
        const res = await fetch(`${url}/get/room:${encodeURIComponent(cleanCode)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.result) {
            return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
          }
        }
      } catch (err) {
        console.error('[Database:Upstash] getRoomByCode error:', err);
      }
    }

    // 3. Fallback: Local File
    const rooms = this._readLocalRooms();
    const found = Object.values(rooms).find(
      (r) => r.roomCode && r.roomCode.toUpperCase() === cleanCode
    );
    return found || null;
  }

  async getRoomById(roomId) {
    if (!roomId) return null;

    if (this.provider === 'supabase') {
      try {
        const url = process.env.SUPABASE_URL.replace(/\/+$/, '');
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
        const res = await fetch(`${url}/rest/v1/rooms?room_id=eq.${encodeURIComponent(roomId)}&select=*`, {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            Accept: 'application/json',
          },
        });
        if (res.ok) {
          const list = await res.json();
          if (list && list.length > 0) {
            return list[0].room_data || list[0];
          }
        }
      } catch (err) {
        console.error('[Database:Supabase] getRoomById error:', err);
      }
    }

    if (this.provider === 'upstash') {
      try {
        const url = process.env.UPSTASH_REDIS_REST_URL.replace(/\/+$/, '');
        const token = process.env.UPSTASH_REDIS_REST_TOKEN;
        const res = await fetch(`${url}/get/room_id:${encodeURIComponent(roomId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.result) {
            return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
          }
        }
      } catch (err) {
        console.error('[Database:Upstash] getRoomById error:', err);
      }
    }

    const rooms = this._readLocalRooms();
    return rooms[roomId] || null;
  }

  async saveRoom(room) {
    if (!room || !room.roomId) throw new Error('Cannot save room without roomId.');

    // Always mirror to local file for backup and instant local access
    const localRooms = this._readLocalRooms();
    localRooms[room.roomId] = room;
    this._writeLocalRooms(localRooms);

    // 1. Supabase Persistence
    if (this.provider === 'supabase') {
      try {
        const url = process.env.SUPABASE_URL.replace(/\/+$/, '');
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
        await fetch(`${url}/rest/v1/rooms`, {
          method: 'POST',
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            room_id: room.roomId,
            room_code: room.roomCode.toUpperCase(),
            published: Boolean(room.published),
            creator_token: room.creatorToken,
            room_data: room,
            updated_at: new Date().toISOString(),
          }),
        });
        console.log(`[Database:Supabase] Upserted room ${room.roomCode}`);
      } catch (err) {
        console.error('[Database:Supabase] saveRoom error:', err);
      }
    }

    // 2. Upstash Redis Persistence
    if (this.provider === 'upstash') {
      try {
        const url = process.env.UPSTASH_REDIS_REST_URL.replace(/\/+$/, '');
        const token = process.env.UPSTASH_REDIS_REST_TOKEN;
        const serialized = JSON.stringify(room);
        await Promise.all([
          fetch(`${url}/set/room:${encodeURIComponent(room.roomCode.toUpperCase())}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: serialized,
          }),
          fetch(`${url}/set/room_id:${encodeURIComponent(room.roomId)}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: serialized,
          }),
        ]);
        console.log(`[Database:Upstash] Stored room ${room.roomCode}`);
      } catch (err) {
        console.error('[Database:Upstash] saveRoom error:', err);
      }
    }

    return room;
  }

  async isCodeTaken(code) {
    const existing = await this.getRoomByCode(code);
    return Boolean(existing);
  }
}

export const cloudDb = new CloudDbService();
