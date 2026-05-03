/**
 * Application-wide constants.
 */

/** Port used by the dev server and preview server. */
export const PORT = 3000;

/**
 * Base URL for API requests. Empty string = mock mode (no real backend).
 * Do not use a trailing slash (/) to avoid double slashes (//) in routes
 * (e.g., API_BASE/api/auth).
 */
export const API_BASE = "";

/** Set to false to disable all login requirements and make Home the root page. */
export const IS_AUTH_ENABLED = false;
