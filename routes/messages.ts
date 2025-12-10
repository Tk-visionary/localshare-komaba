import express, { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth.js';
import { Conversation, Message } from '../types.js';

const router = express.Router();
const db = () => admin.firestore();

// Helper function to convert Firestore Timestamp to ISO string
const convertTimestamps = (data: any): any => {
    if (!data) return data;
    const converted = { ...data };

    const timestampFields = ['createdAt', 'lastMessageAt'];
    for (const field of timestampFields) {
        if (converted[field]) {
            if (typeof converted[field].toDate === 'function') {
                converted[field] = converted[field].toDate().toISOString();
            }
        }
    }

    return converted;
};

// All routes require authentication
router.use(authMiddleware);

// GET /api/messages/conversations - Get all conversations for current user
router.get('/conversations', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.uid;
        console.log('[Messages API] Fetching conversations for userId:', userId);

        // Query conversations where user is a participant
        // Note: Removed orderBy to avoid index issues, sorting in app instead
        const conversationsSnapshot = await db()
            .collection('conversations')
            .where('participants', 'array-contains', userId)
            .get();

        console.log('[Messages API] Found conversations:', conversationsSnapshot.size);

        const conversations: Conversation[] = [];

        for (const doc of conversationsSnapshot.docs) {
            const data = convertTimestamps(doc.data());

            // Get other participant's info
            const otherUserId = data.participants.find((p: string) => p !== userId);
            let otherUser = null;
            if (otherUserId) {
                const userDoc = await db().collection('users').doc(otherUserId).get();
                const userData = userDoc.exists ? userDoc.data() : null;
                // Use displayName if set, otherwise anonymous ID
                otherUser = {
                    id: otherUserId,
                    name: userData?.displayName || `ユーザー${otherUserId.substring(0, 8)}`,
                    picture: userData?.displayPicture || null, // Only use custom avatar
                };
            }

            // Get item info if itemId exists
            let item = null;
            if (data.itemId) {
                const itemDoc = await db().collection('items').doc(data.itemId).get();
                if (itemDoc.exists) {
                    const itemData = itemDoc.data();
                    item = {
                        name: itemData?.name || 'Unknown Item',
                        imageUrl: itemData?.imageUrl || '',
                        exhibitorName: itemData?.exhibitorName || null,
                    };
                    // Use exhibitorName as display name if available
                    if (otherUser && itemData?.exhibitorName) {
                        otherUser.name = itemData.exhibitorName;
                    }
                }
            }

            // Count unread messages (simplified to avoid index requirement)
            const allMessagesSnapshot = await db()
                .collection('conversations')
                .doc(doc.id)
                .collection('messages')
                .where('read', '==', false)
                .get();

            // Filter to only count messages not sent by current user
            const unreadCount = allMessagesSnapshot.docs.filter(
                msgDoc => msgDoc.data().senderId !== userId
            ).length;

            conversations.push({
                id: doc.id,
                ...data,
                otherUser,
                item,
                unreadCount,
            } as Conversation);
        }

        // Sort by lastMessageAt descending (since we can't use orderBy with array-contains without index)
        conversations.sort((a, b) => {
            const timeA = a.lastMessageAt instanceof Date ? a.lastMessageAt.getTime() : new Date(a.lastMessageAt).getTime() || 0;
            const timeB = b.lastMessageAt instanceof Date ? b.lastMessageAt.getTime() : new Date(b.lastMessageAt).getTime() || 0;
            return timeB - timeA;
        });

        res.json(conversations);
    } catch (error) {
        console.error('[Messages API] Error fetching conversations:', error);
        next(error);
    }
});

// GET /api/messages/conversations/:id - Get messages for a conversation
router.get('/conversations/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.uid;
        const { id } = req.params;

        // Check if user is participant
        const conversationRef = db().collection('conversations').doc(id);
        const conversationDoc = await conversationRef.get();

        if (!conversationDoc.exists) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        const conversationData = conversationDoc.data();
        if (!conversationData?.participants.includes(userId)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get messages
        const messagesSnapshot = await conversationRef
            .collection('messages')
            .orderBy('createdAt', 'asc')
            .get();

        const messages: Message[] = messagesSnapshot.docs.map(doc => {
            const data = convertTimestamps(doc.data());
            return { id: doc.id, conversationId: id, ...data } as Message;
        });

        // Mark messages as read
        const batch = db().batch();
        for (const doc of messagesSnapshot.docs) {
            if (doc.data().senderId !== userId && !doc.data().read) {
                batch.update(doc.ref, { read: true });
            }
        }
        await batch.commit();

        // Return conversation with messages
        const conversation = convertTimestamps(conversationData);

        // Get other user info
        const otherUserId = conversation.participants.find((p: string) => p !== userId);
        let otherUser = null;
        if (otherUserId) {
            const userDoc = await db().collection('users').doc(otherUserId).get();
            const userData = userDoc.exists ? userDoc.data() : null;
            // Use displayName if set, otherwise anonymous ID
            otherUser = {
                id: otherUserId,
                name: userData?.displayName || `ユーザー${otherUserId.substring(0, 8)}`,
                picture: userData?.displayPicture || null, // Only use custom avatar
            };
        }

        // Get item info
        let item = null;
        if (conversation.itemId) {
            const itemDoc = await db().collection('items').doc(conversation.itemId).get();
            if (itemDoc.exists) {
                const itemData = itemDoc.data();
                item = {
                    name: itemData?.name || 'Unknown Item',
                    imageUrl: itemData?.imageUrl || '',
                    exhibitorName: itemData?.exhibitorName || null,
                };
                // Use exhibitorName as display name if available
                if (otherUser && itemData?.exhibitorName) {
                    otherUser.name = itemData.exhibitorName;
                }
            }
        }

        res.json({
            conversation: { id, ...conversation, otherUser, item },
            messages,
        });
    } catch (error) {
        console.error('[Messages API] Error fetching messages:', error);
        next(error);
    }
});

// POST /api/messages/conversations - Create or get existing conversation
router.post('/conversations', [
    body('recipientId').notEmpty().isString(),
    body('itemId').optional().isString(),
], async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
    }

    try {
        const userId = req.user!.uid;
        const { recipientId, itemId } = req.body;

        if (userId === recipientId) {
            return res.status(400).json({ error: 'Cannot start conversation with yourself' });
        }

        // Check if conversation already exists for this item
        let existingConversation = null;
        if (itemId) {
            const existingSnapshot = await db()
                .collection('conversations')
                .where('participants', 'array-contains', userId)
                .where('itemId', '==', itemId)
                .get();

            existingConversation = existingSnapshot.docs.find(doc => {
                const data = doc.data();
                return data.participants.includes(recipientId);
            });
        }

        if (existingConversation) {
            const data = convertTimestamps(existingConversation.data());
            return res.json({ id: existingConversation.id, ...data, isNew: false });
        }

        // Create new conversation
        const newConversation = {
            participants: [userId, recipientId],
            itemId: itemId || null,
            lastMessage: '',
            lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await db().collection('conversations').add(newConversation);
        const createdDoc = await docRef.get();
        const createdData = convertTimestamps(createdDoc.data());

        res.status(201).json({ id: docRef.id, ...createdData, isNew: true });
    } catch (error) {
        console.error('[Messages API] Error creating conversation:', error);
        next(error);
    }
});

// POST /api/messages/conversations/:id/messages - Send a message
router.post('/conversations/:id/messages', [
    body('text').notEmpty().isString().trim(),
], async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
    }

    try {
        const userId = req.user!.uid;
        const { id } = req.params;
        const { text } = req.body;

        // Check if user is participant
        const conversationRef = db().collection('conversations').doc(id);
        const conversationDoc = await conversationRef.get();

        if (!conversationDoc.exists) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        const conversationData = conversationDoc.data();
        if (!conversationData?.participants.includes(userId)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Create message
        const newMessage = {
            senderId: userId,
            text: text.trim(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            read: false,
        };

        const messageRef = await conversationRef.collection('messages').add(newMessage);

        // Update conversation's last message
        await conversationRef.update({
            lastMessage: text.trim().substring(0, 100),
            lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        const createdMessage = await messageRef.get();
        const messageData = convertTimestamps(createdMessage.data());

        res.status(201).json({ id: messageRef.id, conversationId: id, ...messageData });
    } catch (error) {
        console.error('[Messages API] Error sending message:', error);
        next(error);
    }
});

// GET /api/messages/unread-count - Get total unread message count
router.get('/unread-count', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.uid;

        const conversationsSnapshot = await db()
            .collection('conversations')
            .where('participants', 'array-contains', userId)
            .get();

        let totalUnread = 0;
        for (const doc of conversationsSnapshot.docs) {
            const unreadSnapshot = await db()
                .collection('conversations')
                .doc(doc.id)
                .collection('messages')
                .where('senderId', '!=', userId)
                .where('read', '==', false)
                .get();
            totalUnread += unreadSnapshot.size;
        }

        res.json({ unreadCount: totalUnread });
    } catch (error) {
        console.error('[Messages API] Error getting unread count:', error);
        next(error);
    }
});

// Admin email for contact feature
const ADMIN_EMAIL = process.env.NOTIFICATION_EMAIL || 'taishi14ki@gmail.com';

// POST /api/messages/contact-admin - Start conversation with admin
router.post('/contact-admin', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.uid;

        // Find admin user by email
        const adminSnapshot = await db()
            .collection('users')
            .where('email', '==', ADMIN_EMAIL)
            .limit(1)
            .get();

        if (adminSnapshot.empty) {
            return res.status(404).json({ error: '運営ユーザーが見つかりません' });
        }

        const adminDoc = adminSnapshot.docs[0];
        const adminId = adminDoc.id;

        if (userId === adminId) {
            return res.status(400).json({ error: '運営自身には連絡できません' });
        }

        // Check if conversation already exists with admin (no itemId)
        const existingSnapshot = await db()
            .collection('conversations')
            .where('participants', 'array-contains', userId)
            .where('itemId', '==', null)
            .get();

        const existingConversation = existingSnapshot.docs.find(doc => {
            const data = doc.data();
            return data.participants.includes(adminId);
        });

        if (existingConversation) {
            const data = convertTimestamps(existingConversation.data());
            return res.json({ id: existingConversation.id, ...data, isNew: false });
        }

        // Create new conversation with admin
        const newConversation = {
            participants: [userId, adminId],
            itemId: null,
            lastMessage: '',
            lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await db().collection('conversations').add(newConversation);
        const createdDoc = await docRef.get();
        const createdData = convertTimestamps(createdDoc.data());

        res.status(201).json({ id: docRef.id, ...createdData, isNew: true });
    } catch (error) {
        console.error('[Messages API] Error contacting admin:', error);
        next(error);
    }
});

// POST /api/messages/report - Report a message
router.post('/report', [
    body('conversationId').notEmpty().isString(),
    body('messageId').notEmpty().isString(),
    body('reason').notEmpty().isString(),
    body('additionalInfo').optional().isString(),
], async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
    }

    try {
        const userId = req.user!.uid;
        const { conversationId, messageId, reason, additionalInfo } = req.body;

        // Get conversation and verify user is participant
        const conversationRef = db().collection('conversations').doc(conversationId);
        const conversationDoc = await conversationRef.get();

        if (!conversationDoc.exists) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        const conversationData = conversationDoc.data();
        if (!conversationData?.participants.includes(userId)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get the message
        const messageRef = conversationRef.collection('messages').doc(messageId);
        const messageDoc = await messageRef.get();

        if (!messageDoc.exists) {
            return res.status(404).json({ error: 'Message not found' });
        }

        const messageData = messageDoc.data();

        // Get reporter info
        const reporterDoc = await db().collection('users').doc(userId).get();
        const reporterData = reporterDoc.exists ? reporterDoc.data() : null;

        // Get reported user info
        const reportedUserId = messageData?.senderId;
        const reportedUserDoc = await db().collection('users').doc(reportedUserId).get();
        const reportedUserData = reportedUserDoc.exists ? reportedUserDoc.data() : null;

        // Get item info if exists
        let itemName = undefined;
        if (conversationData.itemId) {
            const itemDoc = await db().collection('items').doc(conversationData.itemId).get();
            if (itemDoc.exists) {
                itemName = itemDoc.data()?.name;
            }
        }

        // Send report email
        const { sendReportEmail } = await import('../services/reportService.js');
        const result = await sendReportEmail({
            reporterId: userId,
            reporterEmail: reporterData?.email || req.user?.email || 'Unknown',
            reporterName: reporterData?.name || 'Unknown User',
            reportedUserId: reportedUserId,
            reportedUserName: reportedUserData?.name || 'Unknown User',
            messageId: messageId,
            messageText: messageData?.text || '',
            conversationId: conversationId,
            itemName: itemName,
            reason: reason,
            additionalInfo: additionalInfo,
        });

        if (!result.success) {
            console.error('[Messages API] Failed to send report email:', result.error);
            // Still save the report even if email fails
        }

        // Save report to Firestore for record keeping
        await db().collection('reports').add({
            reporterId: userId,
            reportedUserId: reportedUserId,
            conversationId: conversationId,
            messageId: messageId,
            messageText: messageData?.text,
            reason: reason,
            additionalInfo: additionalInfo || null,
            emailSent: result.success,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log('[Messages API] Report submitted successfully');
        res.status(201).json({ success: true, message: '通報を受け付けました' });
    } catch (error) {
        console.error('[Messages API] Error submitting report:', error);
        next(error);
    }
});

export default router;

