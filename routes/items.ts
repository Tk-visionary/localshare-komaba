import express, { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { body, validationResult } from 'express-validator';
import { Item } from '../types.js';

const router = express.Router();
const db = () => admin.firestore();

// Helper function to convert Firestore Timestamp to ISO string
const convertTimestamps = (data: any): any => {
  if (!data) return data;
  const converted = { ...data };

  // Handle postedAt timestamp
  if (converted.postedAt) {
    if (typeof converted.postedAt.toDate === 'function') {
      converted.postedAt = converted.postedAt.toDate().toISOString();
    } else if (typeof converted.postedAt === 'string') {
      // Already a string, keep as is
      converted.postedAt = converted.postedAt;
    } else {
      // Fallback to current date if timestamp is invalid
      console.warn('Invalid postedAt timestamp:', converted.postedAt);
      converted.postedAt = new Date().toISOString();
    }
  }

  return converted;
};

type CreateItemBody = Omit<Item, 'id' | 'postedAt' | 'isSoldOut' | 'user'>;

const itemValidationRules = [
  body('name').notEmpty().isString(),
  body('description').notEmpty().isString(),
  body('category').isIn(['飲食物', '物品', 'その他']),
  body('price').isInt({ min: 0 }),
  body('imageUrl').isURL(),
  body('boothArea').isString(),
  body('boothDetail').isString(),
  body('exhibitorName').notEmpty().isString(),
];

router.get('/', async (req: Request, res: Response<Item[] | { error: string }>, next: NextFunction) => {
  try {
    const { userId } = req.query;
    let query: admin.firestore.Query = db().collection('items');
    if (userId && typeof userId === 'string') {
      query = query.where('userId', '==', userId);
    }
    const itemsSnapshot = await query.orderBy('postedAt', 'desc').get();
    const items: Item[] = itemsSnapshot.docs.map(doc => {
      try {
        const data = convertTimestamps(doc.data());
        return { id: doc.id, ...data } as Item;
      } catch (err) {
        console.error(`Error converting timestamps for item ${doc.id}:`, err);
        // Return the item with raw data if conversion fails
        return { id: doc.id, ...doc.data() } as Item;
      }
    });
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response<Item | { error: string }>, next: NextFunction) => {
  try {
    const { id } = req.params;
    const itemRef = db().collection('items').doc(id);
    const doc = await itemRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const data = convertTimestamps(doc.data());
    res.json({ id: doc.id, ...data } as Item);
  } catch (error) {
    next(error);
  }
});

router.post('/', itemValidationRules, async (req: Request<{}, {}, CreateItemBody>, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
  }
  try {
    const itemData = req.body;
    const userId = req.user!.uid; // Get user ID from authenticated session

    const userRef = db().collection('users').doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.exists ? userDoc.data() : null;

    const newItem = {
        ...itemData,
        userId,
        user: {
          name: userData?.name || 'Unknown User',
          picture: userData?.picture || null,
        },
        postedAt: admin.firestore.FieldValue.serverTimestamp(),
        isSoldOut: false,
    };

    const docRef = await db().collection('items').add(newItem);

    // Fetch the newly created document to get the resolved timestamp
    const createdDoc = await docRef.get();
    const createdData = convertTimestamps(createdDoc.data());

    res.status(201).json({ id: docRef.id, ...createdData });
  } catch (error) {
    next(error);
  }
});

const updateItemValidationRules = [
  body('name').optional().notEmpty().isString(),
  body('description').optional().notEmpty().isString(),
  body('category').optional().isIn(['飲食物', '物品', 'その他']),
  body('price').optional().isInt({ min: 0 }),
  body('imageUrl').optional().isURL(),
  body('boothArea').optional().isString(),
  body('boothDetail').optional().isString(),
  body('exhibitorName').optional().notEmpty().isString(),
  body('isSoldOut').optional().isBoolean(),
];

router.put('/:id', updateItemValidationRules, async (req: Request<{ id: string }, {}, Partial<Item>>, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
    }
    try {
        const { id } = req.params;
        const itemRef = db().collection('items').doc(id);
        const doc = await itemRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Ownership check
        if (doc.data()!.userId !== req.user!.uid) {
            return res.status(403).json({ error: { message: 'Forbidden: You do not own this item.' } });
        }

        // Only include fields that are present in the request body
        const cleanedData: { [key: string]: any } = {};
        const allowedFields = ['name', 'description', 'category', 'price', 'imageUrl', 'boothArea', 'boothDetail', 'exhibitorName', 'isSoldOut'];
        for (const field of allowedFields) {
            if (req.body[field as keyof Item] !== undefined) {
                cleanedData[field] = req.body[field as keyof Item];
            }
        }

        if (Object.keys(cleanedData).length === 0) {
            return res.status(400).json({ error: 'No fields to update provided.' });
        }

        await itemRef.update(cleanedData);

        const updatedDoc = await itemRef.get();
        const updatedData = convertTimestamps(updatedDoc.data());
        res.json({ id: updatedDoc.id, ...updatedData } as Item);
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const itemRef = db().collection('items').doc(id);
        const doc = await itemRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Ownership check
        if (doc.data()!.userId !== req.user!.uid) {
            return res.status(403).json({ error: { message: 'Forbidden: You do not own this item.' } });
        }

        await itemRef.delete();
        res.status(204).end();
    } catch (error) {
        next(error);
    }
});

export default router;