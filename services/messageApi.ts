import { fetchJson } from './apiClient';
import { Conversation, Message } from '../types';

const API_BASE = '/api/messages';

// 会話一覧を取得
export async function fetchConversations(): Promise<Conversation[]> {
    return fetchJson(`${API_BASE}/conversations`);
}

// 特定の会話とメッセージを取得
export async function fetchConversation(conversationId: string): Promise<{
    conversation: Conversation;
    messages: Message[];
}> {
    return fetchJson(`${API_BASE}/conversations/${conversationId}`);
}

// 新規会話を作成（既存の場合はそれを返す）
export async function createConversation(recipientId: string, itemId?: string): Promise<Conversation & { isNew: boolean }> {
    return fetchJson(`${API_BASE}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, itemId }),
    });
}

// メッセージを送信
export async function sendMessage(conversationId: string, text: string): Promise<Message> {
    return fetchJson(`${API_BASE}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    });
}

// 未読メッセージ数を取得
export async function fetchUnreadCount(): Promise<{ unreadCount: number }> {
    return fetchJson(`${API_BASE}/unread-count`);
}

// メッセージを通報
export async function reportMessage(data: {
    conversationId: string;
    messageId: string;
    reason: string;
    additionalInfo?: string;
}): Promise<{ success: boolean; message: string }> {
    return fetchJson(`${API_BASE}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}
