import express, { Request, Response } from 'express';
import admin from 'firebase-admin';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const bucket = admin.storage().bucket();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    const blob = bucket.file(`uploads/${uuidv4()}-${req.file.originalname}`);
    const blobStream = blob.createWriteStream({ metadata: { contentType: req.file.mimetype } });
    blobStream.on('error', (err) => res.status(500).json({ error: 'Upload failed' }));
    blobStream.on('finish', async () => {
      await blob.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      res.status(200).json({ url: publicUrl });
    });
    blobStream.end(req.file.buffer);
  } catch (err) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
