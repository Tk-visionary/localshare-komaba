import { auth } from './firebase';

export class APIError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

const DEFAULT_TIMEOUT = 15000;

async function timeoutPromise<T>(ms: number, p: Promise<T>) {
  let id: NodeJS.Timeout | number = 0;
  const t = new Promise<never>((_, reject) => {
    id = setTimeout(() => reject(new Error('timeout')), ms);
  });
  try {
    return await Promise.race([p, t]);
  } finally {
    clearTimeout(id);
  }
}

/**
 * Fetch wrapper that automatically includes Firebase ID token in requests
 */
export async function fetchJson(input: RequestInfo, init?: RequestInit, timeout = DEFAULT_TIMEOUT) {
  // Get Firebase ID token if user is authenticated
  let idToken: string | null = null;
  if (auth.currentUser) {
    try {
      idToken = await auth.currentUser.getIdToken();
    } catch {
      // Token retrieval failed, proceed without authentication
    }
  }

  // Prepare headers with Authorization if token is available
  const headers = new Headers(init?.headers);
  if (idToken) {
    headers.set('Authorization', `Bearer ${idToken}`);
  }

  const finalInit: RequestInit = {
    ...init,
    headers,
    credentials: 'include', // Include cookies for CORS
  };

  const res = await timeoutPromise(timeout, fetch(input, finalInit));
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let msg = text || res.statusText || 'API Error';
    try {
      // Try to parse a structured error from the backend
      const jsonError = JSON.parse(text);
      msg = jsonError.error?.message || msg;
      if (jsonError.error?.details) {
        const details = jsonError.error.details.map((d: any) => d.msg).join(', ');
        msg = `${msg}: ${details}`;
      }
    } catch (e) {
      // Not a JSON error, use the text as is
    }
    throw new APIError(msg, res.status);
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return res.text();
}
