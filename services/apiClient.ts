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

export async function fetchJson(input: RequestInfo, init?: RequestInit, timeout = DEFAULT_TIMEOUT) {
  // Session-based authentication: no need to manually add tokens
  // The session cookie is automatically sent with requests
  const finalInit = {
    ...init,
    credentials: 'include' as RequestCredentials, // Ensure cookies are sent
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
