import express, { Request, Response } from 'express';
import admin from 'firebase-admin';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const bucket = () => admin.storage().bucket();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    const blob = bucket().file(`uploads/${uuidv4()}-${req.file.originalname}`);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
        cacheControl: 'public, max-age=31536000'
      }
    });

    blobStream.on('error', (err) => {
      console.error('Upload stream error:', err);
      res.status(500).json({ error: 'Upload failed' });
    });

    blobStream.on('finish', async () => {
      try {
        // Make the file public
        await blob.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket().name}/${blob.name}`;
        res.status(200).json({ url: publicUrl });
      } catch (err) {
        console.error('Error making file public:', err);
        res.status(500).json({ error: 'Failed to set file permissions' });
      }
    });

    blobStream.end(req.file.buffer);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
