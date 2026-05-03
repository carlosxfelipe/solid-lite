# Solid Lite

A minimalist implementation of the SolidJS reactivity engine running natively on
Deno. This project demonstrates how to create a Single Page Application (SPA)
architecture with granular reactivity using the real DOM, without the need for a
complex compiler.

✨ **Custom Zero-Dependency Hot Reload**: As a proof of concept for modern web engineering, this project includes a hand-crafted Development Server featuring instant Hot Reload. Instead of relying on heavy third-party bundlers or WebSocket libraries, it leverages Deno's native `watchFs`, `Server-Sent Events (SSE)`, and dynamic on-the-fly HTML script injection to automatically rebuild and refresh the browser on save.

## Technical Features

- **Fine-grained reactivity**: Uses signals and effects for surgical updates to
  the real DOM.
- **JSX Runtime**: Interface processing via a HyperScript (h) function at
  runtime.
- **No Virtual DOM**: Unlike React, changes are applied directly to browser
  nodes.
- **Native Deno**: Built to leverage Deno's performance and security APIs.
- **Batteries Included**: Comes with a built-in router, auth system, and component examples.

## 🚀 Starting a New Project

Solid Lite ships with a demo inside `src/` (a `Counter`, routed pages like `About`, `Contact`, `UserProfile`, and an enabled auth flow) to showcase the framework. When you are ready to start your own project, run:

```bash
deno task cleanup          # interactive confirmation
deno task cleanup --yes    # skip the prompt (for CI / automation)
```

What this command does:

- **Replaces `src/`** with the contents of the bundled `template/` folder — a minimal starter containing a single `Home` page, a simplified `Navbar`, login disabled (`IS_AUTH_ENABLED = false`), and only the CSS classes actually used.
- **Deletes `template/`** afterwards — this is a one-shot operation.
- **Keeps the framework intact**: `solid/`, `scripts/`, `public/`, `deno.json`, and the CSS layers (`base.css`, `layout.css`, `app.css`) are not touched.

> ⚠️ This action is destructive and cannot be undone. Commit your work first if you want to keep the demo as reference.

## Requirements

- [Deno](https://deno.land/) installed on your system.
- [Deno extension](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno)
  for VS Code (recommended).

## How to Run

The project uses Deno's task system for automation.

### Development (Hot Reload)

To start the development server with Hot Reload enabled, run:

```bash
deno task dev
```

This command will watch for any changes in your `src/` and `solid/` directories, automatically rebuild the project, and refresh your browser instantly!

### Production Preview

If you want to clean the build cache to test the final, static distribution version (without Hot Reload), use:

```bash
deno task start
```

### Other Commands

To see all available commands, run the following command in your terminal:

```bash
deno task
```

## Code Formatting

This project uses Deno's built-in formatter. To ensure consistent code style across the project, you can run:

```bash
deno fmt
```

Formatting rules and file exclusions are managed in the `deno.json` configuration file.

### VS Code Setup

If you use VS Code and have the **Prettier** extension installed, it may conflict with Deno. To use Deno's formatter automatically on save, ensure your `.vscode/settings.json` is configured as follows:

```json
"[typescript]": {
  "editor.defaultFormatter": "denoland.vscode-deno"
},
"[typescriptreact]": {
  "editor.defaultFormatter": "denoland.vscode-deno"
}
```

## Folder Structure

- `/solid`: Core reactivity logic and runtime.
- `/src`: Application source code (components, pages, styles).
- `/scripts`: Auxiliary automation tools and local server.
- `/public`: Static assets (favicon, redirects, etc.).
- `/template`: Clean starter used by `deno task cleanup` to reset `src/`. If you choose to keep the demo inside `src/` and don't plan to run the cleanup task, you can safely delete this folder to avoid clutter.

## Authentication & Security

Solid Lite features a "batteries-included" authentication system that supports both local development (mock mode) and real backend integration.

By default, authentication is **enabled** (`const IS_AUTH_ENABLED = true`) in `src/router/routes.tsx`.

### Quick Test (Mock Mode)

By default, the project is configured in **Mock Mode** (with an empty `API_BASE` in `auth.ts`). You can test the authenticated flow immediately using:

- **Email**: `admin@example.com`
- **Password**: `admin123`

### Real Backend Integration

To connect to a real server (e.g., following the [Backend Specification](./docs/backend-spec.md)):

1. Open `src/router/auth.ts`.
2. Set `API_BASE` to your backend URL (e.g., `https://your-api.com`).
3. The `login` function will automatically switch to performing real `fetch` requests and handling JWT tokens.

### Security Features

- **sessionStorage**: JWT tokens are stored in `sessionStorage` instead of `localStorage`. This ensures tokens are cleared automatically when the tab is closed, reducing the XSS exposure window.
- **Proactive Expiry Check**: The framework decodes the JWT `exp` claim and automatically logs the user out if the token expires, even before sending a request.
- **`authFetch`**: A secure fetch wrapper that:
  - Automatically injects the `Authorization: Bearer <token>` header.
  - Triggers an automatic `logout()` if the server returns a `401 Unauthorized` status.
- **Sync Route Guard**: Prevents UI flashing by blocking protected renders until the reactive auth state is verified.

## 🧪 Testing & Coverage

Solid Lite ships with an extensive automated test suite that exercises both the **reactive core** (signals, effects, memos, resources, lifecycle) and the **DOM-binding layer** (`h`, `render`, `Show`, `For`, `Switch/Match`, `Fragment`, event delegation, refs, `dangerouslySetInnerHTML` sanitization, SVG namespace, cleanup paths, etc.). DOM tests run headlessly via `@b-fuze/deno-dom` — no browser required.

```bash
deno test                  # run all tests
deno task test:coverage    # run tests + generate HTML/LCOV coverage reports
```

Current numbers for the code Solid Lite actually owns and maintains:

| File             | Branch     | Functions | Lines      |
| ---------------- | ---------- | --------- | ---------- |
| `dom_setup.ts`   | **100.0%** | **100%**  | **100.0%** |
| `solid/index.ts` | **94.0%**  | **88.9%** | **99.4%**  |

Totals: **105 tests passing**, with the 99.4% line coverage in `solid/index.ts` only missing three defensive branches that are unreachable through the public API.

> The framework also vendors `solid/solid.js` (the SolidJS reactivity engine). Its numbers are included in the full coverage report but are not part of the Solid Lite implementation.

---

## Important Note

**SolidJS** is a trademark of its respective owners.

This project, **Solid Lite**, is an independent, minimalist, and **strictly experimental** implementation of a reactive runtime inspired by the principles of SolidJS. It was created solely for educational purposes to demonstrate how fine-grained reactivity and Single Page Application (SPA) architectures can be built using the native DOM on Deno.

**Solid Lite has no commercial or business objectives.** It is a study of architectural concepts and a hobbyist experiment in building lean web runtimes.

## License

MIT
