/** Cookie name read by Next.js middleware; localStorage key used by Axios (existing). */
export const AUTH_COOKIE_NAME = "token";
export const AUTH_LS_KEY = "erforge_jwt";

const MAX_AGE_SEC = 7 * 24 * 60 * 60;

export function safeRedirectPath(path: string | null | undefined, fallback = "/dashboard"): string {
  if (path == null || path === "") return fallback;
  const p = path.trim();
  if (!p.startsWith("/") || p.startsWith("//")) return fallback;
  if (p.includes("..") || p.includes("\\")) return fallback;
  if (p.length > 512) return fallback;
  return p;
}

export function setSessionToken(jwt: string): void {
  if (typeof document === "undefined") return;
  const v = encodeURIComponent(jwt);
  document.cookie = `${AUTH_COOKIE_NAME}=${v}; path=/; max-age=${MAX_AGE_SEC}; SameSite=Lax`;
  localStorage.setItem(AUTH_LS_KEY, jwt);
}

export function clearSessionToken(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`;
  localStorage.removeItem(AUTH_LS_KEY);
}

/** If JWT exists in localStorage but cookie is missing (e.g. legacy tab), restore cookie for middleware. */
export function syncCookieFromStorage(): void {
  if (typeof document === "undefined") return;
  const jwt = localStorage.getItem(AUTH_LS_KEY);
  if (!jwt) return;
  if (document.cookie.includes(`${AUTH_COOKIE_NAME}=`)) return;
  setSessionToken(jwt);
}
