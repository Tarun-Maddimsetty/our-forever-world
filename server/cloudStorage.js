import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

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
    if (process.env.CLOUDINARY_URL) {
      try {
        const parsed = new URL(process.env.CLOUDINARY_URL);
        if (parsed.protocol === 'cloudinary:') {
          process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || parsed.username;
          process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || parsed.password;
          process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || parsed.hostname;
        }
      } catch (e) {
        const match = process.env.CLOUDINARY_URL.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
        if (match) {
          process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || match[1];
          process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || match[2];
          process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || match[3];
        }
      }
    }
  }

  detectProvider() {
    this.parseCloudinaryUrl();
    if (process.env.CLOUDINARY_CLOUD_NAME && (process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_UPLOAD_PRESET)) {
      return 'cloudinary';
    }
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY && process.env.SUPABASE_BUCKET) {
      return 'supabase';
    }
    return 'local';
  }

  getStorageStatus() {
    return {
      provider: this.provider,
      isCloud: this.provider !== 'local',
      details:
        this.provider === 'cloudinary'
          ? `Cloudinary (Cloud: ${process.env.CLOUDINARY_CLOUD_NAME})`
          : this.provider === 'supabase'
          ? `Supabase Storage (Bucket: ${process.env.SUPABASE_BUCKET})`
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

    // 1. Cloudinary Upload
    if (this.provider === 'cloudinary') {
      try {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;
        const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

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
        const supabaseUrl = process.env.SUPABASE_URL.replace(/\/+$/, '');
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
        const bucket = process.env.SUPABASE_BUCKET || 'memories';
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
      ? process.env.SERVER_PUBLIC_URL.replace(/\/+$/, '')
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
