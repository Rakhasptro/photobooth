import express from 'express';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import { pipeline, env, RawImage } from '@huggingface/transformers';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

// --- QR Download Storage ---
const PHOTOS_DIR = path.resolve('downloaded-photos');
if (!fs.existsSync(PHOTOS_DIR)) {
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });
}

const photoStore = new Map(); // token -> { filename, createdAt }

// Periodic cleanup: hapus file > 30 menit
setInterval(() => {
  const now = Date.now();
  for (const [token, entry] of photoStore) {
    if (now - entry.createdAt > 30 * 60 * 1000) {
      const fp = path.join(PHOTOS_DIR, entry.filename);
      fs.unlink(fp, () => {});
      photoStore.delete(token);
    }
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
// We don't need browser cache here, but we can set local paths if needed. 
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
    // We use sharp to resize the original image to exactly match the mask dimensions,
    // ensure it has no alpha channel initially, and then join the mask as the alpha channel!
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

// --- QR Code Download Endpoint ---
app.post('/api/upload-photo', upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded' });
    }

    const token = crypto.randomUUID();
    const filename = `${token}.png`;
    const filepath = path.join(PHOTOS_DIR, filename);

    // Simpan PNG ke disk
    fs.writeFileSync(filepath, req.file.buffer);

    photoStore.set(token, { filename, createdAt: Date.now() });

    const ip = getLocalIP();
    const dlUrl = `http://${ip}:${port}/dl/${token}`;

    res.json({ token, url: dlUrl });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Serve halaman download
app.get('/dl/:token', (req, res) => {
  const entry = photoStore.get(req.params.token);
  if (!entry) {
    return res.status(404).send(`
      <!DOCTYPE html><html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f3f4f6">
        <div style="text-align:center;padding:2rem">
          <h1 style="font-size:2rem;margin-bottom:1rem">Foto tidak ditemukan</h1>
          <p style="color:#666">Link sudah kadaluarsa atau token salah.</p>
        </div>
      </body></html>
    `);
  }

  const filepath = path.join(PHOTOS_DIR, entry.filename);
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Download Boothlev Photo</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #111; padding: 1rem; }
        .card { background: #fff; border-radius: 24px; padding: 2rem; max-width: 500px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        img { width: 100%; border-radius: 16px; margin-bottom: 1.5rem; }
        a { display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 1rem 2rem; border-radius: 12px; font-weight: 700; font-size: 1.1rem; transition: background .2s; }
        a:hover { background: #333; }
        footer { margin-top: 1rem; font-size: 0.75rem; color: #999; }
      </style>
    </head>
    <body>
      <div class="card">
        <img src="/dl-img/${req.params.token}" alt="BoothUbhara" />
        <a href="/dl-img/${req.params.token}" download="ubharajaya-photo.png">⬇ Download Foto</a>
        <footer>BoothUbhara — ubharajaya.ac.id</footer>
      </div>
    </body>
    </html>
  `);
});

// Serve raw PNG untuk download
app.get('/dl-img/:token', (req, res) => {
  const entry = photoStore.get(req.params.token);
  if (!entry) {
    return res.status(404).json({ error: 'not found' });
  }
  const filepath = path.join(PHOTOS_DIR, entry.filename);
  res.set('Content-Type', 'image/png');
  res.set('Content-Disposition', 'attachment; filename="ubharajaya-photo.png"');
  res.sendFile(filepath);
});

app.listen(port, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log(`🚀 Boothlev API server running at:`);
  console.log(`   Local:   http://localhost:${port}`);
  console.log(`   Network: http://${ip}:${port}`);
});
