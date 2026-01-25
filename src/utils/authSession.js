const STORAGE_KEY = "evegahAuthSession";

export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

function isBrowser() {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

function safeParse(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getAuthSession() {
  if (!isBrowser()) return null;
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

export function setAuthSession(session) {
  if (!isBrowser()) return;
  if (!session || typeof session !== "object") return;

  const payload = {
    token: typeof session.token === "string" ? session.token : "",
    expiresAt: typeof session.expiresAt === "number" ? session.expiresAt : 0,
    role: session.role || null,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearAuthSession() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getValidAuthSession() {
  const session = getAuthSession();
  if (!session) return null;

  if (typeof session.expiresAt !== "number" || session.expiresAt <= Date.now()) {
    clearAuthSession();
    return null;
  }

  return session;
}
