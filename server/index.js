import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import OpenAI, { toFile } from 'openai';

dotenv.config();

const app = express();
app.use(cors());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024, // 12MB (keeps requests fast/reliable)
  },
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const plushifyPrompt =
  'Transform the subject or image into an adorable plushie-style form with soft textures and rounded proportions. ' +
  'If a person is present, preserve recognizable traits; otherwise, reinterpret the object or animal as a cozy stuffed toy using felt or fleece textures. ' +
  'Give it a cozy felt or fleece texture, simplified shapes, and gentle embroidered details for the eyes, mouth, and features. ' +
  'Use a warm, pastel or neutral color palette with smooth shading and subtle seams, like a handcrafted stuffed toy. ' +
  'Keep the expression friendly and cute, with a slightly oversized head, short limbs, and a cuddly silhouette. ' +
  'The final image should feel like a charming, collectible plush toy — cozy, wholesome, and huggable, while still recognizable as the original subject.';

app.post('/api/plushify', upload.single('image'), async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'Missing OPENAI_API_KEY in server .env file.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded. Use form field name "image".' });
    }

    const mime = req.file.mimetype || 'image/png';
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(mime)) {
      return res.status(400).json({ error: `Unsupported file type: ${mime}` });
    }

    const client = new OpenAI({ apiKey: OPENAI_API_KEY });

    const imageFile = await toFile(req.file.buffer, req.file.originalname || 'upload.png', {
      type: mime,
    });

    const result = await client.images.edit({
      model: 'gpt-image-1',
      image: imageFile,
      prompt: plushifyPrompt,
      size: 'auto',
      n: 1,
      input_fidelity: 'high',
      background: 'auto',
      quality: 'high',
      output_format: 'png',
    });

    const b64_json = result?.data?.[0]?.b64_json;
    if (!b64_json) {
      return res.status(502).json({ error: 'OpenAI did not return base64 image data.' });
    }

    res.json({
      b64_json,
      mimeType: 'image/png',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({
      error: message,
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${PORT}`);
});

