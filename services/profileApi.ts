import { fetchJson } from './apiClient';
import { User } from '../types';

const API_BASE = '/api/profile';

// プロフィール情報を取得
export async function fetchProfile(): Promise<User> {
    return fetchJson(API_BASE);
}

// プロフィールを更新
export async function updateProfile(data: {
    displayName?: string;
    displayPicture?: string;
}): Promise<User> {
    return fetchJson(API_BASE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}
