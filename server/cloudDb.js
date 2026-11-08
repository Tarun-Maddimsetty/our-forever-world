import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Automatically load local .env if present (native in Node 20+)
if (fs.existsSync('.env') && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile('.env');
  } catch (e) {}
}

function cleanEnv(val) {
  if (!val) return '';
  return String(val).trim().replace(/^["']|["']$/g, '').trim();
}

const dataDir = path.join(__dirname, 'data');
const roomsFile = path.join(dataDir, 'rooms.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let MongoClient = null;

export class CloudDbService {
  constructor() {
    this.provider = this.detectProvider();
    this.mongoClient = null;
    this.mongoDb = null;
    this.mongoCollection = null;
    this.mongoConnecting = null;

    console.log(`[Database] Initialized with provider: ${this.provider}`);
    if (this.provider === 'mongodb') {
      this.initMongo().catch((err) => {
        console.warn('[Database:MongoDB] Initial connection error (will retry on request):', err.message);
      });
    }
  }

  detectProvider() {
    const mongoUri = cleanEnv(process.env.MONGO_URI || process.env.MONGODB_URI);
    if (mongoUri) {
      return 'mongodb';
    }
    const dataApiUrl = cleanEnv(process.env.MONGODB_DATA_API_URL);
    const dataApiKey = cleanEnv(process.env.MONGODB_API_KEY);
    if (dataApiUrl && dataApiKey) {
      return 'mongodb_data_api';
    }
    const supabaseUrl = cleanEnv(process.env.SUPABASE_URL);
    const supabaseKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY);
    if (supabaseUrl && supabaseKey) {
      return 'supabase';
    }
    const upstashUrl = cleanEnv(process.env.UPSTASH_REDIS_REST_URL);
    const upstashToken = cleanEnv(process.env.UPSTASH_REDIS_REST_TOKEN);
    if (upstashUrl && upstashToken) {
      return 'upstash';
    }
    return 'local_file';
  }

  ensureProvider() {
    if (this.provider === 'local_file') {
      const detected = this.detectProvider();
      if (detected !== 'local_file') {
        this.provider = detected;
        console.log(`[Database] Dynamically upgraded provider to: ${this.provider}`);
        if (this.provider === 'mongodb' && !this.mongoCollection && !this.mongoConnecting) {
          this.initMongo().catch(() => {});
        }
      }
    }
    return this.provider;
  }

  async initMongo() {
    if (this.mongoCollection && this.mongoClient) {
      return this.mongoCollection;
    }
    if (this.mongoConnecting) return this.mongoConnecting;

    this.mongoConnecting = (async () => {
      try {
        if (!MongoClient) {
          const mongoPkg = await import('mongodb');
          MongoClient = mongoPkg.MongoClient;
        }
        const rawUri = process.env.MONGO_URI || process.env.MONGODB_URI;
        const uri = cleanEnv(rawUri);
        if (!uri) {
          throw new Error('Neither MONGO_URI nor MONGODB_URI is provided.');
        }

        const explicitDbName = cleanEnv(process.env.MONGODB_DB_NAME);

        this.mongoClient = new MongoClient(uri, {
          serverSelectionTimeoutMS: 6000,
          connectTimeoutMS: 8000,
          maxPoolSize: 10,
        });

        await this.mongoClient.connect();
        
        // Pick explicit db name or db from URI or default to 'our_forever_world'
        this.mongoDb = explicitDbName ? this.mongoClient.db(explicitDbName) : this.mongoClient.db();
        if (!this.mongoDb.databaseName || this.mongoDb.databaseName === 'test') {
          this.mongoDb = this.mongoClient.db(explicitDbName || 'our_forever_world');
        }

        this.mongoCollection = this.mongoDb.collection('rooms');

        // Ensure unique index on roomCode for fast lookup and collision prevention
        await this.mongoCollection.createIndex({ roomCode: 1 }, { unique: true }).catch((e) => {
          console.warn('[Database:MongoDB] Notice on roomCode index:', e.message);
        });

        console.log(`[Database:MongoDB] Connected successfully to Atlas database: "${this.mongoDb.databaseName}"`);
        return this.mongoCollection;
      } catch (err) {
        console.error('[Database:MongoDB] Connection failed, falling back to local file storage:', err.message);
        this.mongoConnecting = null;
        this.mongoCollection = null;
        this.mongoClient = null;
        return null;
      }
    })();

    return this.mongoConnecting;
  }

  getDbStatus() {
    const p = this.ensureProvider();
    return {
      provider: p,
      isCloud: p !== 'local_file',
      details:
        p === 'mongodb'
          ? `MongoDB Atlas (Database: "${this.mongoDb?.databaseName || cleanEnv(process.env.MONGODB_DB_NAME) || 'our_forever_world'}", Connected: ${Boolean(this.mongoCollection)})`
          : p === 'mongodb_data_api'
          ? 'MongoDB Atlas Data API'
          : p === 'supabase'
          ? `Supabase PostgreSQL (URL: ${cleanEnv(process.env.SUPABASE_URL)})`
          : p === 'upstash'
          ? 'Upstash Serverless Redis'
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
    this.ensureProvider();
    const cleanCode = roomCode.trim().toUpperCase();

    // 1. MongoDB Atlas
    if (this.provider === 'mongodb') {
      try {
        const col = await this.initMongo();
        if (col) {
          const doc = await col.findOne({ roomCode: cleanCode });
          if (doc) {
            delete doc._id;
            return doc;
          }
        }
      } catch (err) {
        console.error('[Database:MongoDB] getRoomByCode error:', err.message);
      }
    }

    // 2. Supabase
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

    // 3. Upstash Redis
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

    // 4. Fallback: Local File
    const rooms = this._readLocalRooms();
    const found = Object.values(rooms).find(
      (r) => r.roomCode && r.roomCode.toUpperCase() === cleanCode
    );
    return found || null;
  }

  async getRoomById(roomId) {
    if (!roomId) return null;
    this.ensureProvider();

    // 1. MongoDB Atlas
    if (this.provider === 'mongodb') {
      try {
        const col = await this.initMongo();
        if (col) {
          const doc = await col.findOne({ roomId: roomId });
          if (doc) {
            delete doc._id;
            return doc;
          }
        }
      } catch (err) {
        console.error('[Database:MongoDB] getRoomById error:', err.message);
      }
    }

    // 2. Supabase
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

    // 3. Upstash Redis
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

    // 4. Fallback: Local File
    const rooms = this._readLocalRooms();
    return rooms[roomId] || null;
  }

  async saveRoom(room) {
    if (!room || !room.roomId) throw new Error('Cannot save room without roomId.');
    this.ensureProvider();

    // Always mirror to local file for backup and instant local access
    const localRooms = this._readLocalRooms();
    localRooms[room.roomId] = room;
    this._writeLocalRooms(localRooms);

    // 1. MongoDB Atlas Persistence
    if (this.provider === 'mongodb') {
      try {
        const col = await this.initMongo();
        if (col) {
          await col.updateOne(
            { roomId: room.roomId },
            { $set: { ...room, updatedAt: new Date().toISOString() } },
            { upsert: true }
          );
          console.log(`[Database:MongoDB] Persisted room ${room.roomCode} in Atlas`);
        }
      } catch (err) {
        console.error('[Database:MongoDB] saveRoom error:', err.message);
      }
    }

    // 2. Supabase Persistence
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

    // 3. Upstash Redis Persistence
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

  async deleteRoom(roomId) {
    if (!roomId) return false;
    this.ensureProvider();

    // 1. Local file
    const localRooms = this._readLocalRooms();
    const target = localRooms[roomId];
    if (localRooms[roomId]) {
      delete localRooms[roomId];
      this._writeLocalRooms(localRooms);
    }

    // 2. MongoDB Atlas
    if (this.provider === 'mongodb') {
      try {
        const col = await this.initMongo();
        if (col) {
          await col.deleteOne({ roomId });
        }
      } catch (err) {
        console.error('[Database:MongoDB] deleteRoom error:', err.message);
      }
    }

    // 3. Supabase
    if (this.provider === 'supabase') {
      try {
        const url = process.env.SUPABASE_URL.replace(/\/+$/, '');
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
        await fetch(`${url}/rest/v1/rooms?room_id=eq.${encodeURIComponent(roomId)}`, {
          method: 'DELETE',
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        });
      } catch (err) {
        console.error('[Database:Supabase] deleteRoom error:', err);
      }
    }

    // 4. Upstash Redis
    if (this.provider === 'upstash') {
      try {
        const url = process.env.UPSTASH_REDIS_REST_URL.replace(/\/+$/, '');
        const token = process.env.UPSTASH_REDIS_REST_TOKEN;
        const keysToDelete = [`room_id:${roomId}`];
        if (target?.roomCode) {
          keysToDelete.push(`room:${target.roomCode.toUpperCase()}`);
        }
        await Promise.all(
          keysToDelete.map((k) =>
            fetch(`${url}/del/${encodeURIComponent(k)}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          )
        );
      } catch (err) {
        console.error('[Database:Upstash] deleteRoom error:', err);
      }
    }

    return true;
  }
}

export const cloudDb = new CloudDbService();
