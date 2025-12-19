import express, { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { body, validationResult } from 'express-validator';
import { Item } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';

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
      converted.postedAt = new Date().toISOString();
    }
  }

  // Handle lastApplicationAt timestamp
  if (converted.lastApplicationAt) {
    if (typeof converted.lastApplicationAt.toDate === 'function') {
      converted.lastApplicationAt = converted.lastApplicationAt.toDate().toISOString();
    } else if (typeof converted.lastApplicationAt === 'string') {
      // Already a string, keep as is
      converted.lastApplicationAt = converted.lastApplicationAt;
    } else {
      // Remove invalid timestamp
      delete converted.lastApplicationAt;
    }
  }

  // Handle createdAt timestamp (for applications)
  if (converted.createdAt) {
    if (typeof converted.createdAt.toDate === 'function') {
      converted.createdAt = converted.createdAt.toDate().toISOString();
    } else if (typeof converted.createdAt === 'string') {
      converted.createdAt = converted.createdAt;
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
      } catch {
        // Return the item with raw data if conversion fails
        return { id: doc.id, ...doc.data() } as Item;
      }
    });
    res.json(items);
  } catch (error) {
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

router.post('/', authMiddleware, itemValidationRules, async (req: Request<{}, {}, CreateItemBody>, res: Response, next: NextFunction) => {
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

router.put('/:id', authMiddleware, updateItemValidationRules, async (req: Request<{ id: string }, {}, Partial<Item>>, res: Response, next: NextFunction) => {
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

router.delete('/:id', authMiddleware, async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
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


// Purchase Application

// POST /:id/apply
router.post('/:id/apply', authMiddleware, async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const applicantId = req.user!.uid;

    const itemRef = db().collection('items').doc(id);

    await db().runTransaction(async (transaction) => {
      const itemDoc = await transaction.get(itemRef);

      if (!itemDoc.exists) {
        throw new Error('Item not found');
      }

      const itemData = itemDoc.data()!;

      // Cannot apply to own item
      if (itemData.userId === applicantId) {
        throw new Error('Cannot apply to your own item');
      }

      // Check if already applied (Optional: could rely on client state, but good to check)
      // For now, simpler to just allow multiple "pings" or just add without check if that's acceptable.
      // But typically we want to prevent spam. Let's check subcollection.
      const existingApplicationQuery = await transaction.get(
        itemRef.collection('applications').where('applicantId', '==', applicantId)
      );

      if (!existingApplicationQuery.empty) {
        throw new Error('Already applied');
      }

      const userRef = db().collection('users').doc(applicantId);
      const userDoc = await transaction.get(userRef);
      const userData = userDoc.exists ? userDoc.data() : null;

      const applicationData = {
        itemId: id,
        applicantId,
        applicantName: userData?.name || 'Unknown User',
        applicantPicture: userData?.picture || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'pending',
      };

      const applicationRef = itemRef.collection('applications').doc();
      transaction.set(applicationRef, applicationData);

      // Update item with flag
      transaction.update(itemRef, {
        hasApplication: true,
        lastApplicationAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    res.status(201).json({ message: 'Application submitted successfully' });

  } catch (error: any) {
    if (error.message === 'Item not found') {
      res.status(404).json({ error: 'Item not found' });
    } else if (error.message === 'Cannot apply to your own item') {
      res.status(400).json({ error: error.message });
    } else if (error.message === 'Already applied') {
      res.status(409).json({ error: error.message });
    } else {
      next(error);
    }
  }
});

// GET /:id/applications (Owner only)
router.get('/:id/applications', authMiddleware, async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.uid;

    const itemRef = db().collection('items').doc(id);
    const itemDoc = await itemRef.get();

    if (!itemDoc.exists) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Only owner can view applications
    if (itemDoc.data()!.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: Only the owner can view applications.' });
    }

    const applicationsSnapshot = await itemRef.collection('applications').orderBy('createdAt', 'desc').get();
    const applications = applicationsSnapshot.docs.map(doc => {
      const data = convertTimestamps(doc.data());
      return { id: doc.id, ...data };
    });

    res.json(applications);

  } catch (error) {
    next(error);
  }
});

// GET /:id/my-application - Check if current user has applied
router.get('/:id/my-application', authMiddleware, async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.uid;

    const itemRef = db().collection('items').doc(id);
    const itemDoc = await itemRef.get();

    if (!itemDoc.exists) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if user has an application
    const applicationsQuery = await itemRef.collection('applications')
      .where('applicantId', '==', userId)
      .limit(1)
      .get();

    if (applicationsQuery.empty) {
      res.json({ hasApplied: false });
    } else {
      const appDoc = applicationsQuery.docs[0];
      const data = convertTimestamps(appDoc.data());
      res.json({ hasApplied: true, application: { id: appDoc.id, ...data } });
    }

  } catch (error) {
    next(error);
  }
});

// DELETE /:id/apply - Cancel own application
router.delete('/:id/apply', authMiddleware, async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const applicantId = req.user!.uid;
    const { reason } = req.body; // reason is optional, for logging/analytics

    const itemRef = db().collection('items').doc(id);

    await db().runTransaction(async (transaction) => {
      const itemDoc = await transaction.get(itemRef);

      if (!itemDoc.exists) {
        throw new Error('Item not found');
      }

      // Find the user's application
      const applicationsQuery = await transaction.get(
        itemRef.collection('applications').where('applicantId', '==', applicantId)
      );

      if (applicationsQuery.empty) {
        throw new Error('Application not found');
      }

      // Delete the application(s) - should be only one per user
      applicationsQuery.docs.forEach(doc => {
        transaction.delete(doc.ref);
      });

      // Check if there are other applications remaining
      const remainingApplicationsQuery = await transaction.get(
        itemRef.collection('applications').limit(2) // We deleted ours, check if others exist
      );

      // Count applications excluding the one we just deleted
      const remainingCount = remainingApplicationsQuery.docs.filter(
        doc => doc.data().applicantId !== applicantId
      ).length;

      // Update item flag if no applications remain
      if (remainingCount === 0) {
        transaction.update(itemRef, {
          hasApplication: false,
          lastApplicationAt: admin.firestore.FieldValue.delete()
        });
      }

      // Log the cancellation reason (optional - could store in a separate collection for analytics)
      if (reason) {
        console.log(`[Application Cancelled] Item: ${id}, User: ${applicantId}, Reason: ${reason}`);
      }
    });

    res.status(200).json({ message: 'Application cancelled successfully' });

  } catch (error: any) {
    if (error.message === 'Item not found') {
      res.status(404).json({ error: 'Item not found' });
    } else if (error.message === 'Application not found') {
      res.status(404).json({ error: 'Application not found' });
    } else {
      next(error);
    }
  }
});

export default router;