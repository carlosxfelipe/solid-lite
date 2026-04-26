# Security Guide

Solid Lite is a Client-Side Rendering (CSR) framework. Its application code runs entirely in the browser — a public and inherently untrusted environment. This guide is split into two parts: what the framework already handles for you, and what you are responsible for when building on top of it.

> **Note:** Security vulnerabilities happen at every scale — including platforms that host SSR frameworks, CDN infrastructure, and server-side environments. In April 2026, Vercel disclosed a [security incident](https://vercel.com/kb/bulletin/vercel-april-2026-security-incident) in which an attacker compromised a third-party AI tool used by a Vercel employee, pivoted into internal systems, and was able to enumerate and decrypt customer environment variables stored on the platform. The attacker was described as "highly sophisticated." The takeaway: storing secrets server-side does not make them immune — it just changes where the risk lives. Good practices around secret rotation, MFA, and access scope matter regardless of your rendering strategy.

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

Despite this, avoid `dangerouslySetInnerHTML` with raw user input whenever possible.

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

Client-side route guards (like `useAuthGuard`) are a **UX convenience**, not a security mechanism. They prevent navigation in the UI, but they do not prevent a user from calling your API directly. All authorization logic must be enforced on the server.

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

Start restrictive and loosen only where necessary. A well-configured CSP is one of the most effective defenses against XSS.

### 5. Dependency Hygiene

Solid Lite has zero runtime dependencies. When you add packages to your project, apply these rules:

- Pin versions explicitly in `deno.json`; avoid open-ended ranges in production.
- Prefer `jsr:` packages or well-maintained `npm:` packages.
- Audit your dependency tree periodically for known vulnerabilities.

### 6. Build Output

- Never commit secrets or environment-specific credentials to your repository.
- Ensure your `dist/` directory is not served with directory listing enabled.
- Serve `index.html` with `Cache-Control: no-store` to prevent stale versions from being cached — but be aware: `no-store` disables the browser's [bfcache](https://web.dev/bfcache/), meaning the back button triggers a full page reload. In SPAs with client-side auth guards, this can cause a brief flash of the login screen before the guard redirects. Weigh this trade-off before applying it. Static assets (`.js`, `.css`) with content hashes can and should be cached aggressively.

---

## Quick Checklist

- [ ] No API keys or secrets in any client-side file (any code the bundler processes is public)
- [ ] Authorization enforced server-side, not just in route guards
- [ ] Auth tokens in `sessionStorage` (or `HttpOnly` cookies if backend supports it)
- [ ] CSP header configured for production
- [ ] `dangerouslySetInnerHTML` avoided or used only with trusted, pre-sanitized data
- [ ] Dependencies pinned and audited
- [ ] `index.html` cache policy reviewed (see note below)
