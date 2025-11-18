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

    const fileName = `uploads/${uuidv4()}-${req.file.originalname}`;
    const blob = bucket().file(fileName);

    // Generate a download token for public access
    const downloadToken = uuidv4();

    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
        cacheControl: 'public, max-age=31536000',
        metadata: {
          firebaseStorageDownloadTokens: downloadToken
        }
      }
    });

    blobStream.on('error', () => {
      res.status(500).json({ error: 'Upload failed' });
    });

    blobStream.on('finish', async () => {
      try {
        // Generate public URL with download token
        const bucketName = bucket().name;
        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(fileName)}?alt=media&token=${downloadToken}`;

        res.status(200).json({ url: publicUrl });
      } catch {
        res.status(500).json({ error: 'Failed to generate download URL' });
      }
    });

    blobStream.end(req.file.buffer);
  } catch {
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
