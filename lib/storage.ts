/**
 * Client-side storage layer.
 *
 * Persistence strategies:
 *  - Credentials: in-memory by default.
 *    When "remember me" is enabled, also persisted to sessionStorage
 *    (survives refresh, lost on tab close — password never hits disk).
 *  - Auth token:  memory + localStorage (survives page reload)
 *  - User ID:     localStorage only (allows "welcome back" UX)
 *  - Remember me: localStorage flag (persists across sessions)
 */
import type { StoredCredentials } from "./schemas";

// ── Credentials (memory + optional sessionStorage) ──────────────────────

const CREDENTIALS_KEY = "citadelle_credentials";
let storedCredentials: StoredCredentials | null = null;

export function storeCredentials(credentials: StoredCredentials) {
  storedCredentials = credentials;
  if (typeof window !== "undefined" && getRememberMe()) {
    sessionStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
  }
}

/**
 * Returns credentials, checking memory first then sessionStorage.
 * Hydrates memory from sessionStorage on first call after a page reload.
 */
export function getStoredCredentials(): StoredCredentials | null {
  if (storedCredentials) return storedCredentials;
  if (typeof window !== "undefined" && getRememberMe()) {
    const raw = sessionStorage.getItem(CREDENTIALS_KEY);
    if (raw) {
      try {
        storedCredentials = JSON.parse(raw) as StoredCredentials;
        return storedCredentials;
      } catch {
        sessionStorage.removeItem(CREDENTIALS_KEY);
      }
    }
  }
  return null;
}

export function clearCredentials() {
  storedCredentials = null;
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(CREDENTIALS_KEY);
  }
}

// ── Remember me (localStorage — persists user preference) ───────────────

const REMEMBER_KEY = "citadelle_remember_me";

export function setRememberMe(enabled: boolean) {
  if (typeof window !== "undefined") {
    if (enabled) {
      localStorage.setItem(REMEMBER_KEY, "true");
    } else {
      localStorage.removeItem(REMEMBER_KEY);
      sessionStorage.removeItem(CREDENTIALS_KEY);
    }
  }
}

export function getRememberMe(): boolean {
  if (typeof window !== "undefined") {
    return localStorage.getItem(REMEMBER_KEY) === "true";
  }
  return false;
}

// ── Auth token (memory + localStorage for persistence across reloads) ───

const TOKEN_KEY = "citadelle_auth_token";
let authToken: string | null = null;

export function setAuthToken(token: string) {
  authToken = token;
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

/** Returns the JWT, checking memory first then localStorage. */
export function getAuthToken(): string | null {
  if (authToken) return authToken;
  if (typeof window !== "undefined") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

export function clearAuthToken() {
  authToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// ── User ID (localStorage — enables session restoration UI) ─────────────

const USER_ID_KEY = "citadelle_user_id";

export function setStoredUserId(userId: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_ID_KEY, userId);
  }
}

export function getStoredUserId(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(USER_ID_KEY);
  }
  return null;
}

export function clearStoredUserId() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(USER_ID_KEY);
  }
}

/** True when a JWT exists (memory or localStorage). */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}
