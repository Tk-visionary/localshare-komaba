import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';

// Initialize Firebase Admin
admin.initializeApp();

// Email configuration from environment variables
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'taishi14ki@gmail.com';

// Get Resend instance (lazy initialization)
function getResend() {
  const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
  return new Resend(RESEND_API_KEY);
}

// Firestore trigger: When a new item is created
export const onItemCreated = onDocumentCreated(
  {
    document: 'items/{itemId}',
    region: 'asia-northeast1', // Tokyo region
    secrets: ['RESEND_API_KEY'], // Use Secret Manager
  },
  async (event) => {
    const snap = event.data;
    if (!snap) {
      console.log('[onItemCreated] No data in event');
      return { success: false };
    }

    const item = snap.data();
    const itemId = event.params.itemId;

    console.log('[onItemCreated] New item created:', itemId);

    try {
      // Get user information
      let userName = 'Unknown User';
      let userEmail = 'N/A';

      if (item.userId) {
        try {
          const userDoc = await admin.firestore().collection('users').doc(item.userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            userName = userData?.name || 'Unknown User';
            userEmail = userData?.email || 'N/A';
          }
        } catch (error) {
          console.warn('[onItemCreated] Failed to fetch user data:', error);
        }
      }

      // Format price
      const priceText = item.price === 0 ? '無料' : `¥${item.price.toLocaleString()}`;

      // Format date
      const postedAt = item.postedAt?.toDate?.() || new Date();
      const dateText = postedAt.toLocaleString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Send email via Resend
      const result = await getResend().emails.send({
        from: '駒場祭フリマ <onboarding@resend.dev>',
        to: NOTIFICATION_EMAIL,
        subject: `【新商品登録】${item.name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
              .item-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
              .label { font-weight: bold; color: #FF6B35; display: inline-block; width: 120px; }
              .value { color: #333; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              .badge { background: #FF6B35; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; display: inline-block; margin-top: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 新商品が登録されました</h1>
              </div>
              <div class="content">
                <div class="item-info">
                  <h2 style="margin-top: 0; color: #FF6B35;">${item.name}</h2>

                  ${item.imageUrl ? `<div style="text-align: center; margin: 15px 0;">
                    <img src="${item.imageUrl}" alt="${item.name}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  </div>` : ''}

                  <p><span class="label">💰 価格:</span> <span class="value" style="font-size: 18px; font-weight: bold;">${priceText}</span></p>

                  <p><span class="label">📦 カテゴリ:</span> <span class="value">${item.category}</span></p>

                  <p><span class="label">📝 説明:</span></p>
                  <p style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin: 5px 0;">${item.description || 'なし'}</p>

                  <p><span class="label">🏪 出店団体:</span> <span class="value">${item.exhibitorName || 'なし'}</span></p>

                  <p><span class="label">📍 エリア:</span> <span class="value">${item.boothArea || 'なし'}</span></p>

                  <p><span class="label">🎯 詳細場所:</span> <span class="value">${item.boothDetail || 'なし'}</span></p>

                  <p><span class="label">👤 登録者:</span> <span class="value">${userName}</span></p>

                  <p><span class="label">📧 メール:</span> <span class="value">${userEmail}</span></p>

                  <p><span class="label">🕒 登録日時:</span> <span class="value">${dateText}</span></p>

                  ${item.isSoldOut ? '<p><span class="badge">売り切れ</span></p>' : ''}
                </div>

                <p style="text-align: center; margin-top: 20px;">
                  <a href="https://komabasai.local-share.net"
                     style="display: inline-block; background: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                    アプリで確認
                  </a>
                </p>
              </div>
              <div class="footer">
                <p>このメールは駒場祭フリマアプリから自動送信されています</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      console.log('[onItemCreated] Email sent successfully via Resend:', result);

      return { success: true, emailId: result.data?.id };
    } catch (error) {
      console.error('[onItemCreated] Error sending email:', error);
      // Don't throw error - we don't want to fail the function
      return { success: false, error: String(error) };
    }
  }
);
