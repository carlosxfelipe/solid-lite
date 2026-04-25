import { createSignal } from "@solid/index.ts";

const API_BASE = "";
const TOKEN_KEY = "authToken";

/**
 * Decodes the JWT payload and returns the `exp` claim (Unix timestamp).
 * Returns null if the token is malformed or the claim is missing.
 */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return typeof decoded.exp === "number" ? decoded.exp : null;
  } catch {
    return null;
  }
}

function isTokenValid(): boolean {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token) return false;
  const exp = getTokenExpiry(token);
  if (exp === null) return false;
  return Date.now() / 1000 < exp;
}

/**
 * Reactive auth state. Backed by sessionStorage so the token is
 * automatically cleared when the tab closes, limiting the XSS exposure window.
 */
export const [isLoggedIn, setIsLoggedIn] = createSignal(isTokenValid());

if (sessionStorage.getItem(TOKEN_KEY) && !isTokenValid()) {
  sessionStorage.removeItem(TOKEN_KEY);
}

export async function login(email: string, password: string): Promise<void> {
  // Fallback to mock login if no API_BASE is configured
  if (!API_BASE) {
    if (email === "admin@example.com" && password === "admin123") {
      // Generate a fake JWT payload expiring in 100 years
      const future = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 100;
      const payload = btoa(JSON.stringify({ sub: email, exp: future }));
      const mockToken = `mock.current.${payload}`;

      sessionStorage.setItem(TOKEN_KEY, mockToken);
      setIsLoggedIn(true);
      return;
    }
    throw new Error("Invalid email or password (Mock Mode)");
  }

  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Invalid email or password");
  }

  const { access_token } = await res.json();
  sessionStorage.setItem(TOKEN_KEY, access_token);
  setIsLoggedIn(true);
}

export function logout(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  setIsLoggedIn(false);
}

/**
 * Fetch wrapper that injects the Authorization header.
 * Rejects and calls logout() if the token is expired or the server returns 401.
 */
export async function authFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  if (!isTokenValid()) {
    logout();
    return Promise.reject(new Error("Session expired. Please log in again."));
  }

  const token = sessionStorage.getItem(TOKEN_KEY);

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401) {
    logout();
  }

  return res;
}
