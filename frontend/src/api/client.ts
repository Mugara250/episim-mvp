import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from './schema';
import { ApiError, errorMessage, getToken, handleUnauthorized } from './http';

// Typed client generated from the backend OpenAPI schema (see schema.d.ts / `make openapi`).
// Usage: const data = unwrap(await client.GET('/api/scenarios', { params: { query: {...} } }));

const auth: Middleware = {
  onRequest({ request }) {
    const token = getToken();
    if (token) request.headers.set('Authorization', `Bearer ${token}`);
    return request;
  },
  onResponse({ response }) {
    if (response.status === 401 && !response.url.includes('/api/auth/login')) handleUnauthorized();
    return response;
  }
};

export const client = createClient<paths>({ baseUrl: '' });
client.use(auth);

/** Returns `data` or throws ApiError, so results plug straight into TanStack Query. */
export function unwrap<T>(result: {data?: T;error?: unknown;response: Response;}): T {
  if (result.error !== undefined || !result.response.ok) {
    const detail = (result.error as {detail?: unknown;} | undefined)?.detail;
    throw new ApiError(result.response.status, errorMessage(detail, `Request failed (${result.response.status}).`), detail);
  }
  return result.data as T;
}
