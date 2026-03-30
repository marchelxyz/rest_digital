import { getAccessToken } from "@/lib/iiko/client";

const cache = new Map<string, { token: string; expiresAt: number }>();
const DEFAULT_TTL_MS = 10 * 60 * 1000;
const SAFETY_MS = 5000;

/**
 * Кэширует access token iiko в памяти процесса (как ensureAccessToken в mariko).
 */
export async function getCachedAccessToken(
  apiLogin: string,
  options?: { forceFresh?: boolean }
): Promise<string> {
  const key = apiLogin.trim();
  if (!options?.forceFresh) {
    const c = cache.get(key);
    if (c && c.expiresAt > Date.now() + SAFETY_MS) {
      return c.token;
    }
  }
  const token = await getAccessToken(key);
  cache.set(key, { token, expiresAt: Date.now() + DEFAULT_TTL_MS });
  return token;
}
