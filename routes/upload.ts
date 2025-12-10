import express, { Request, Response } from 'express';
import admin from 'firebase-admin';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const router = express.Router();
const bucket = () => admin.storage().bucket();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
});

// Image optimization settings
const IMAGE_CONFIG = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 80,
  format: 'webp' as const,
};

async function optimizeImage(buffer: Buffer): Promise<{ buffer: Buffer; contentType: string }> {
  const optimized = await sharp(buffer)
    .resize(IMAGE_CONFIG.maxWidth, IMAGE_CONFIG.maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: IMAGE_CONFIG.quality })
    .toBuffer();

  return {
    buffer: optimized,
    contentType: 'image/webp',
  };
}

router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Optimize image: compress and convert to WebP
    const { buffer: optimizedBuffer, contentType } = await optimizeImage(req.file.buffer);

    // Generate filename with .webp extension
    const originalName = req.file.originalname.replace(/\.[^.]+$/, '');
    const fileName = `uploads/${uuidv4()}-${originalName}.webp`;
    const blob = bucket().file(fileName);

    const blobStream = blob.createWriteStream({
      metadata: {
        contentType,
        cacheControl: 'public, max-age=31536000',
      },
      public: true, // Make file publicly accessible
    });

    blobStream.on('error', () => {
      res.status(500).json({ error: 'Upload failed' });
    });

    blobStream.on('finish', async () => {
      try {
        // Make file publicly accessible (redundant with public:true but ensures ACL is set)
        await blob.makePublic();

        // Generate direct GCS public URL (no token needed, much faster)
        const bucketName = bucket().name;
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

        res.status(200).json({ url: publicUrl });
      } catch {
        res.status(500).json({ error: 'Failed to generate download URL' });
      }
    });

    blobStream.end(optimizedBuffer);
  } catch {
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
