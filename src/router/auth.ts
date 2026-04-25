import { createSignal } from "@solid/index.ts";

/**
 * Reactive auth state.
 * Keyed on "authToken" so the shape stays the same when a real backend
 * is introduced — only the TODO blocks below need to change.
 */
export const [isLoggedIn, setIsLoggedIn] = createSignal(
  !!localStorage.getItem("authToken"),
);

/**
 * Authenticates the user with the given credentials.
 *
 * TODO: Replace the mock check with a real API call:
 *   const res = await fetch("/api/auth/login", { ... });
 *   const { token } = await res.json();
 *   localStorage.setItem("authToken", token);
 */
export async function login(email: string, password: string): Promise<void> {
  // MOCK — remove when backend is ready
  await new Promise((r) => setTimeout(r, 0));
  if (email !== "admin@example.com" || password !== "admin123") {
    throw new Error(
      "Invalid email or password. Try admin@example.com / admin123",
    );
  }
  localStorage.setItem("authToken", "mock-token");

  setIsLoggedIn(true);
}

/**
 * Clears the auth token and resets the reactive state.
 *
 * TODO: Optionally call a server invalidation endpoint.
 */
export function logout(): void {
  localStorage.removeItem("authToken");
  setIsLoggedIn(false);
}

/**
 * Fetch wrapper that injects the Authorization header automatically.
 * Use this for every authenticated API request.
 *
 * TODO: Add global 401 handling to auto-logout on expired tokens.
 */
export function authFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = localStorage.getItem("authToken");
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
