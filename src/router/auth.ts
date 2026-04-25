import { createSignal } from "@solid/index.ts";

/**
 * Reactive auth signal — shared across the app so route guards
 * fire immediately when login state changes.
 */
export const [isLoggedIn, setIsLoggedIn] = createSignal(
  localStorage.getItem("isLoggedIn") === "true",
);

/**
 * Logs the user in by persisting state and updating the reactive signal.
 */
export function login() {
  localStorage.setItem("isLoggedIn", "true");
  setIsLoggedIn(true);
}

/**
 * Logs the user out by clearing state and updating the reactive signal.
 */
export function logout() {
  localStorage.removeItem("isLoggedIn");
  setIsLoggedIn(false);
}
