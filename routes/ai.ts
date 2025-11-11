import express, { Request, Response } from 'express';
import admin from 'firebase-admin';
import { generateProductDescription, GenerateDescriptionInput } from '../services/aiService.js';

const router = express.Router();

// Lazy initialization of Firestore to avoid initialization errors
const getDb = () => admin.firestore();

const MAX_GENERATIONS_PER_DAY = 3;

interface GenerateRequest extends Request {
  body: {
    name: string;
    category: string;
    price: number;
    exhibitorName?: string;
    boothDetail?: string;
  };
  user?: {
    uid: string;
  };
}

// Check and update usage limit
async function checkUsageLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const usageRef = getDb().collection('ai_usage').doc(`${userId}_${today}`);

  const doc = await usageRef.get();

  if (!doc.exists) {
    // First use today
    await usageRef.set({
      userId,
      date: today,
      count: 1,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { allowed: true, remaining: MAX_GENERATIONS_PER_DAY - 1 };
  }

  const data = doc.data();
  const currentCount = data?.count || 0;

  if (currentCount >= MAX_GENERATIONS_PER_DAY) {
    return { allowed: false, remaining: 0 };
  }

  // Increment count
  await usageRef.update({
    count: admin.firestore.FieldValue.increment(1),
  });

  return { allowed: true, remaining: MAX_GENERATIONS_PER_DAY - currentCount - 1 };
}

// POST /api/ai/generate-description
router.post('/generate-description', async (req: GenerateRequest, res: Response) => {
  try {
    // Check authentication
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.uid;

    // Check usage limit
    const { allowed, remaining } = await checkUsageLimit(userId);

    if (!allowed) {
      return res.status(429).json({
        error: '本日の生成回数の上限に達しました。明日また利用できます。',
        remaining: 0,
      });
    }

    // Validate request body
    const { name, category, price, exhibitorName, boothDetail } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ error: '商品名、カテゴリ、価格は必須です' });
    }

    // Generate description
    const input: GenerateDescriptionInput = {
      name,
      category,
      price,
      exhibitorName,
      boothDetail,
    };

    const description = await generateProductDescription(input);

    res.json({
      description,
      remaining,
    });
  } catch (error) {
    console.error('[AI Route] Error:', error);
    res.status(500).json({ error: '商品説明の生成中にエラーが発生しました' });
  }
});

// GET /api/ai/usage - Check remaining generations for today
router.get('/usage', async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.uid;
    const today = new Date().toISOString().split('T')[0];
    const usageRef = getDb().collection('ai_usage').doc(`${userId}_${today}`);

    const doc = await usageRef.get();

    if (!doc.exists) {
      return res.json({
        remaining: MAX_GENERATIONS_PER_DAY,
        used: 0,
        limit: MAX_GENERATIONS_PER_DAY,
      });
    }

    const data = doc.data();
    const used = data?.count || 0;

    res.json({
      remaining: Math.max(0, MAX_GENERATIONS_PER_DAY - used),
      used,
      limit: MAX_GENERATIONS_PER_DAY,
    });
  } catch (error) {
    console.error('[AI Route] Error checking usage:', error);
    res.status(500).json({ error: 'エラーが発生しました' });
  }
});

export default router;
