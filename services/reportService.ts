import { Resend } from 'resend';

// Resend API client (lazy initialization)
let resendClient: Resend | null = null;

function getResend(): Resend {
    if (!resendClient) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            throw new Error('RESEND_API_KEY is not configured');
        }
        resendClient = new Resend(apiKey);
    }
    return resendClient;
}

const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'taishi14ki@gmail.com';

export interface ReportData {
    reporterId: string;
    reporterEmail: string;
    reporterName: string;
    reportedUserId: string;
    reportedUserName: string;
    messageId: string;
    messageText: string;
    conversationId: string;
    itemName?: string;
    reason: string;
    additionalInfo?: string;
}

export async function sendReportEmail(data: ReportData): Promise<{ success: boolean; error?: string }> {
    try {
        const dateText = new Date().toLocaleString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        const result = await getResend().emails.send({
            from: '駒場祭フリマ <onboarding@resend.dev>',
            to: NOTIFICATION_EMAIL,
            subject: `【通報】メッセージが報告されました`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #DC2626; }
            .message-box { background: #FEF2F2; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #FECACA; }
            .label { font-weight: bold; color: #DC2626; display: inline-block; min-width: 100px; }
            .value { color: #333; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 メッセージ通報</h1>
            </div>
            <div class="content">
              <div class="info-box">
                <h3 style="margin-top: 0; color: #DC2626;">通報理由</h3>
                <p style="font-size: 16px; font-weight: bold;">${data.reason}</p>
                ${data.additionalInfo ? `<p style="color: #666;">${data.additionalInfo}</p>` : ''}
              </div>

              <div class="message-box">
                <h3 style="margin-top: 0; color: #DC2626;">報告されたメッセージ</h3>
                <p style="background: white; padding: 10px; border-radius: 4px; font-style: italic;">"${data.messageText}"</p>
              </div>

              <div class="info-box">
                <h3 style="margin-top: 0; color: #333;">詳細情報</h3>
                <p><span class="label">🚩 通報者:</span> <span class="value">${data.reporterName} (${data.reporterEmail})</span></p>
                <p><span class="label">⚠️ 報告対象:</span> <span class="value">${data.reportedUserName}</span></p>
                ${data.itemName ? `<p><span class="label">📦 関連商品:</span> <span class="value">${data.itemName}</span></p>` : ''}
                <p><span class="label">🕒 通報日時:</span> <span class="value">${dateText}</span></p>
                <p><span class="label">💬 会話ID:</span> <span class="value" style="font-family: monospace; font-size: 12px;">${data.conversationId}</span></p>
                <p><span class="label">📝 メッセージID:</span> <span class="value" style="font-family: monospace; font-size: 12px;">${data.messageId}</span></p>
              </div>

              <p style="text-align: center; margin-top: 20px; padding: 15px; background: #FEE2E2; border-radius: 8px; color: #991B1B;">
                ⚠️ この通報を確認し、必要に応じて対応してください
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

        console.log('[ReportService] Report email sent successfully:', result);
        return { success: true };
    } catch (error) {
        console.error('[ReportService] Error sending report email:', error);
        return { success: false, error: String(error) };
    }
}
