import express from 'express';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import { pipeline, env, RawImage } from '@huggingface/transformers';
import { loadEnvFile } from 'node:process';
import crypto from 'crypto';
import os from 'os';
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

// Muat .env (tidak menimpa env var yang sudah ada di environment)
try {
  loadEnvFile();
} catch {
  console.warn('⚠️  No .env found — S3 config akan dibaca dari environment saja.');
}

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

// --- S3 / konfigurasi ---
const s3Config = {
  bucket: process.env.AWS_S3_BUCKET,
  publicUrl: (process.env.AWS_S3_URL || '').replace(/\/+$/, ''),
};

const REQUIRED_S3 = ['AWS_S3_ENDPOINT', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET', 'AWS_S3_URL'];
const missing = REQUIRED_S3.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`❌ Konfigurasi S3 belum lengkap di .env: ${missing.join(', ')}`);
  process.exit(1);
}

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || 'us-east-1',
  endpoint: process.env.AWS_S3_ENDPOINT,
  forcePathStyle: true, // endpoint ini path-style (minio)
  tls: process.env.AWS_S3_USE_SSL !== 'false',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Prefix untuk foto booth di bucket, dan TTL 30 menit (sama seperti desain lama)
const S3_PHOTO_PREFIX = 'boothlev/';
const PHOTO_TTL_MS = 30 * 60 * 1000;

// Periodic cleanup: hapus foto S3 yang sudah lewat TTL
setInterval(async () => {
  try {
    const { Contents = [] } = await s3Client.send(
      new ListObjectsV2Command({ Bucket: s3Config.bucket, Prefix: S3_PHOTO_PREFIX })
    );
    const now = Date.now();
    const expired = Contents
      .filter((obj) => obj.LastModified && now - obj.LastModified.getTime() > PHOTO_TTL_MS)
      .map((obj) => ({ Key: obj.Key }));

    if (expired.length === 0) return;
    await s3Client.send(new DeleteObjectsCommand({ Bucket: s3Config.bucket, Delete: { Objects: expired } }));
    console.log(`🗑  Cleaned ${expired.length} expired photo(s) from S3 (${S3_PHOTO_PREFIX})`);
  } catch (err) {
    console.error('S3 cleanup error:', err.message);
  }
}, 5 * 60 * 1000);

// Dapatkan IP lokal komputer (bukan localhost)
function getLocalIP() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Configure transformers.js for Node.js environment
// By default, it will download the model to the node_modules cache and use it.
env.allowLocalModels = true; // Use locally cached models

// Singleton pipeline loader
class SegmenterPipeline {
  static task = 'image-segmentation';
  static model = 'Xenova/modnet';
  static instance = null;

  static async getInstance() {
    if (this.instance === null) {
      console.log("Loading AI Model into memory... (This might take a few seconds on first run)");
      this.instance = await pipeline(this.task, this.model);
      console.log("AI Model loaded successfully!");
    }
    return this.instance;
  }
}

// Pre-load model on startup (optional, but good for UX so the first request isn't slow)
SegmenterPipeline.getInstance().catch(console.error);

app.post('/api/remove-bg', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    console.log(`Processing image: ${req.file.originalname} (${req.file.size} bytes)`);

    // Convert the buffer to a Blob that transformers.js can read
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    const image = await RawImage.read(blob);

    const segmenter = await SegmenterPipeline.getInstance();

    // Process image
    const result = await segmenter(image);

    if (!Array.isArray(result) || result.length === 0) {
      throw new Error("Failed to process image mask.");
    }

    // result[0].mask is a RawImage { width, height, data, channels }
    const mask = result[0].mask;

    // Convert Uint8Array/Uint8ClampedArray to Buffer for sharp
    const maskBuffer = Buffer.from(mask.data);

    // Ensure the original image buffer is correctly sized and formatted to match the mask
    const transparentPngBuffer = await sharp(req.file.buffer)
      .resize(mask.width, mask.height, { fit: 'fill' }) // exact match
      .joinChannel(maskBuffer, {
        raw: {
          width: mask.width,
          height: mask.height,
          channels: 1 // grayscale mask
        }
      })
      .png()
      .toBuffer();

    // Send the resulting PNG buffer directly to the client
    res.set('Content-Type', 'image/png');
    res.send(transparentPngBuffer);

    console.log("Successfully generated and sent transparent image.");

  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- Simpan foto ke S3, balikin public URL untuk QR download ---
app.post('/api/upload-photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded' });
    }

    const token = crypto.randomUUID();
    const key = `${S3_PHOTO_PREFIX}${token}.png`;

    await s3Client.send(new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
      Body: req.file.buffer,
      ContentType: 'image/png',
      ContentDisposition: 'attachment; filename="ubharajaya-photo.png"',
      CacheControl: 'public, max-age=600',
    }));

    const url = `${s3Config.publicUrl}/${key}`;
    console.log(`📤 Saved photo -> ${url}`);

    res.json({ token, url });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Bind ke '::' (dual-stack, IPv6 + IPv4) sehingga 'localhost' (::1) dan semua IP LAN bisa konek.
// Browser kadang resolve 'localhost' ke ::1; bind IPv4-only ('0.0.0.0') bikin koneksi ditolak -> "Failed to fetch".
app.listen(port, '::', () => {
  const ip = getLocalIP();
  console.log(`🚀 Boothlev API server running at:`);
  console.log(`   Local:   http://localhost:${port}`);
  console.log(`   Network: http://${ip}:${port}`);
  console.log(`   S3:      ${s3Config.publicUrl}/${S3_PHOTO_PREFIX}`);
});