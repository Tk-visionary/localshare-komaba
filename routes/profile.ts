import express, { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const db = () => admin.firestore();

// All routes require authentication
router.use(authMiddleware);

// GET /api/profile - Get current user's profile
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.uid;

        const userDoc = await db().collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();
        res.json({
            id: userId,
            name: userData?.name || '',
            email: userData?.email || '',
            picture: userData?.picture || null,
            displayName: userData?.displayName || null,
            displayPicture: userData?.displayPicture || null,
        });
    } catch (error) {
        console.error('[Profile API] Error fetching profile:', error);
        next(error);
    }
});

// PUT /api/profile - Update current user's profile
router.put('/', [
    body('displayName').optional().isString().trim().isLength({ max: 50 }),
    body('displayPicture').optional().isString().trim(),
], async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
    }

    try {
        const userId = req.user!.uid;
        const { displayName, displayPicture } = req.body;

        const updateData: Record<string, string | null> = {};

        // Only update fields that are provided
        if (displayName !== undefined) {
            updateData.displayName = displayName || null;
        }
        if (displayPicture !== undefined) {
            updateData.displayPicture = displayPicture || null;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        await db().collection('users').doc(userId).update(updateData);

        // Fetch updated user
        const userDoc = await db().collection('users').doc(userId).get();
        const userData = userDoc.data();

        res.json({
            id: userId,
            name: userData?.name || '',
            email: userData?.email || '',
            picture: userData?.picture || null,
            displayName: userData?.displayName || null,
            displayPicture: userData?.displayPicture || null,
        });
    } catch (error) {
        console.error('[Profile API] Error updating profile:', error);
        next(error);
    }
});

export default router;
