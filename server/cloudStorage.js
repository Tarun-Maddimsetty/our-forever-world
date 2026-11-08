import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

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

/**
 * Cloud Media Storage Service
 * Supports:
 * 1. Cloudinary (Direct REST API with zero dependencies, works with either API Key+Secret or unsigned preset)
 * 2. Supabase Storage (REST API)
 * 3. Local/Server Disk (with absolute/relative URL serving)
 */

export class CloudStorageService {
  constructor() {
    this.parseCloudinaryUrl();
    this.provider = this.detectProvider();
    console.log(`[Storage] Initialized with provider: ${this.provider}`);
  }

  parseCloudinaryUrl() {
    const rawUrl = cleanEnv(process.env.CLOUDINARY_URL);
    if (rawUrl) {
      try {
        const urlToParse = rawUrl.replace(/\/+$/, '');
        const parsed = new URL(urlToParse);
        if (parsed.protocol === 'cloudinary:') {
          if (!process.env.CLOUDINARY_API_KEY && parsed.username) {
            process.env.CLOUDINARY_API_KEY = parsed.username;
          }
          if (!process.env.CLOUDINARY_API_SECRET && parsed.password) {
            process.env.CLOUDINARY_API_SECRET = parsed.password;
          }
          if (!process.env.CLOUDINARY_CLOUD_NAME && parsed.hostname) {
            process.env.CLOUDINARY_CLOUD_NAME = parsed.hostname;
          }
        }
      } catch (e) {
        const match = rawUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@([^/?#]+)/i);
        if (match) {
          if (!process.env.CLOUDINARY_API_KEY) process.env.CLOUDINARY_API_KEY = match[1];
          if (!process.env.CLOUDINARY_API_SECRET) process.env.CLOUDINARY_API_SECRET = match[2];
          if (!process.env.CLOUDINARY_CLOUD_NAME) process.env.CLOUDINARY_CLOUD_NAME = match[3];
        }
      }
    }
  }

  detectProvider() {
    this.parseCloudinaryUrl();
    const cloudName = cleanEnv(process.env.CLOUDINARY_CLOUD_NAME);
    const apiKey = cleanEnv(process.env.CLOUDINARY_API_KEY);
    const uploadPreset = cleanEnv(process.env.CLOUDINARY_UPLOAD_PRESET);
    const cloudinaryUrl = cleanEnv(process.env.CLOUDINARY_URL);

    if (cloudinaryUrl || (cloudName && (apiKey || uploadPreset))) {
      return 'cloudinary';
    }
    const supabaseUrl = cleanEnv(process.env.SUPABASE_URL);
    const supabaseKey = cleanEnv(process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
    const supabaseBucket = cleanEnv(process.env.SUPABASE_BUCKET);
    if (supabaseUrl && supabaseKey && supabaseBucket) {
      return 'supabase';
    }
    return 'local';
  }

  ensureProvider() {
    if (this.provider === 'local') {
      const detected = this.detectProvider();
      if (detected !== 'local') {
        this.provider = detected;
        console.log(`[Storage] Dynamically upgraded provider to: ${this.provider}`);
      }
    }
    return this.provider;
  }

  getStorageStatus() {
    const p = this.ensureProvider();
    const cloudName = cleanEnv(process.env.CLOUDINARY_CLOUD_NAME);
    const bucket = cleanEnv(process.env.SUPABASE_BUCKET) || 'memories';
    return {
      provider: p,
      isCloud: p !== 'local',
      details:
        p === 'cloudinary'
          ? `Cloudinary (Cloud: "${cloudName || 'configured'}")`
          : p === 'supabase'
          ? `Supabase Storage (Bucket: "${bucket}")`
          : 'Local Server Disk (/uploads)',
    };
  }

  /**
   * Upload file to active storage provider
   * @param {Object} file - Multer file object
   * @returns {Promise<{ url: string, provider: string, originalName: string, size: number }>}
   */
  async uploadFile(file) {
    if (!file) throw new Error('No file provided for upload.');
    this.ensureProvider();

    // 1. Cloudinary Upload
    if (this.provider === 'cloudinary') {
      try {
        const cloudName = cleanEnv(process.env.CLOUDINARY_CLOUD_NAME);
        const apiKey = cleanEnv(process.env.CLOUDINARY_API_KEY);
        const apiSecret = cleanEnv(process.env.CLOUDINARY_API_SECRET);
        const uploadPreset = cleanEnv(process.env.CLOUDINARY_UPLOAD_PRESET);

        const fileBuffer = fs.readFileSync(file.path);
        const base64Data = `data:${file.mimetype};base64,${fileBuffer.toString('base64')}`;

        const formData = new URLSearchParams();
        formData.append('file', base64Data);

        // Sign request if API key and Secret are present
        if (apiKey && apiSecret) {
          const timestamp = Math.floor(Date.now() / 1000).toString();
          formData.append('timestamp', timestamp);
          formData.append('api_key', apiKey);

          const paramsToSign = `timestamp=${timestamp}${apiSecret}`;
          const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');
          formData.append('signature', signature);
        } else if (uploadPreset) {
          formData.append('upload_preset', uploadPreset);
        }

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Cloudinary upload failed: ${res.status} ${errText}`);
        }

        const data = await res.json();
        console.log(`[Storage:Cloudinary] Successfully uploaded ${file.originalname} -> ${data.secure_url}`);

        // Clean up temporary local upload file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        return {
          url: data.secure_url,
          provider: 'cloudinary',
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        };
      } catch (err) {
        console.error('[Storage:Cloudinary] Error uploading, falling back to local storage:', err);
      }
    }

    // 2. Supabase Storage Upload
    if (this.provider === 'supabase') {
      try {
        const supabaseUrl = cleanEnv(process.env.SUPABASE_URL).replace(/\/+$/, '');
        const supabaseKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY);
        const bucket = cleanEnv(process.env.SUPABASE_BUCKET) || 'memories';
        const fileExt = path.extname(file.originalname) || '';
        const storagePath = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${fileExt}`;

        const fileBuffer = fs.readFileSync(file.path);
        const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${storagePath}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${supabaseKey}`,
            apikey: supabaseKey,
            'Content-Type': file.mimetype,
          },
          body: fileBuffer,
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Supabase upload failed: ${res.status} ${errText}`);
        }

        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;
        console.log(`[Storage:Supabase] Successfully uploaded ${file.originalname} -> ${publicUrl}`);

        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        return {
          url: publicUrl,
          provider: 'supabase',
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        };
      } catch (err) {
        console.error('[Storage:Supabase] Error uploading, falling back to local storage:', err);
      }
    }

    // 3. Local/Persistent Disk Fallback
    const baseUrl = process.env.SERVER_PUBLIC_URL
      ? cleanEnv(process.env.SERVER_PUBLIC_URL).replace(/\/+$/, '')
      : '';
    const fileUrl = `${baseUrl}/uploads/${file.filename}`;

    console.log(`[Storage:Local] File saved to disk: ${fileUrl}`);
    return {
      url: fileUrl,
      provider: 'local',
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}

export const cloudStorage = new CloudStorageService();
