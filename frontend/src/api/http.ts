// Minimal fetch wrapper for the EpiSim API: bearer token, JSON bodies and typed errors.
// All requests go to /api, which Vite proxies to the backend in development.

const TOKEN_KEY = 'episim.token';
export const UNAUTHORIZED_EVENT = 'episim:unauthorized';

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);else
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage blocked (private window): the session lasts until reload.
  }
}

export class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

/** Turns a FastAPI error body ({detail: string | validation errors[]}) into one readable sentence. */
export function errorMessage(detail: unknown, fallback: string): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length) {
    return detail.
    map((d) => typeof d === 'object' && d && 'msg' in d ? String((d as {msg: unknown;}).msg) : String(d)).
    join(' ');
  }
  return fallback;
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Clears the token and tells the app to go to /login. */
export function handleUnauthorized() {
  setToken(null);
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}

type Body = BodyInit | Record<string, unknown> | unknown[] | null | undefined;

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: Body;
  /** Query parameters; undefined and null values are dropped. */
  query?: Record<string, string | number | boolean | null | undefined>;
}

export async function apiFetch<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, query, headers, ...rest } = opts;
  let url = path.startsWith('/api') ? path : `/api${path.startsWith('/') ? '' : '/'}${path}`;
  if (query) {
    const qs = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) qs.set(k, String(v));
    });
    const s = qs.toString();
    if (s) url += `${url.includes('?') ? '&' : '?'}${s}`;
  }
  const isRaw = body instanceof FormData || body instanceof Blob || typeof body === 'string';
  const res = await fetch(url, {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined && !isRaw ? { 'Content-Type': 'application/json' } : {}),
      ...authHeaders(),
      ...headers
    },
    body: body === undefined || body === null ? undefined : isRaw ? body as BodyInit : JSON.stringify(body)
  });
  if (res.status === 401 && !url.startsWith('/api/auth/login')) handleUnauthorized();
  if (!res.ok) {
    let detail: unknown = undefined;
    try {
      detail = (await res.json()).detail;
    } catch {
      // Non-JSON error body.
    }
    throw new ApiError(res.status, errorMessage(detail, `Request failed (${res.status}).`), detail);
  }
  if (res.status === 204) return undefined as T;
  const type = res.headers.get('content-type') ?? '';
  if (type.includes('application/json')) return (await res.json()) as T;
  return (await res.blob()) as unknown as T;
}

export const api = {
  get: <T,>(path: string, opts?: RequestOptions) => apiFetch<T>(path, { ...opts, method: 'GET' }),
  post: <T,>(path: string, body?: Body, opts?: RequestOptions) => apiFetch<T>(path, { ...opts, method: 'POST', body }),
  put: <T,>(path: string, body?: Body, opts?: RequestOptions) => apiFetch<T>(path, { ...opts, method: 'PUT', body }),
  patch: <T,>(path: string, body?: Body, opts?: RequestOptions) => apiFetch<T>(path, { ...opts, method: 'PATCH', body }),
  delete: <T,>(path: string, opts?: RequestOptions) => apiFetch<T>(path, { ...opts, method: 'DELETE' })
};
