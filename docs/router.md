# Reactive Router Guide

Solid Lite includes a minimalist, signal-based reactive router. This guide covers both a simple manual approach (great for small projects) and the recommended scalable architecture used by the demo app.

---

## Simple Implementation

For small applications or when you prefer explicit declarations, you can define your routes manually within the `App` component. No extra files required.

```tsx
import { h, Show } from "@solid/index.ts";
import { Navbar } from "@components/Navbar.tsx";
import { currentPath, matchPath, Route } from "@router/index.tsx";
import { Home } from "@pages/Home.tsx";
import { About } from "@pages/About.tsx";
import { Contact } from "@pages/Contact.tsx";
import { UserProfile } from "@pages/UserProfile.tsx";
import { NotFound } from "@pages/NotFound.tsx";

// Define all valid paths to handle 404 (NotFound) logic
const routePaths = ["/", "/about", "/contact", "/user/:id"];

export function App() {
  /**
   * anyMatch checks if the current browser path matches
   * any of the defined route patterns.
   */
  const anyMatch = () => {
    const path = currentPath();
    return routePaths.some((p) => !!matchPath(p, path));
  };

  return (
    <div>
      <Navbar />
      <main>
        {/* Render components based on the current path */}
        <Route path="/" component={() => <Home />} />
        <Route path="/about" component={() => <About />} />
        <Route path="/contact" component={() => <Contact />} />
        <Route path="/user/:id" component={() => <UserProfile />} />

        {/* Fallback for undefined routes */}
        <Show when={() => !anyMatch()}>
          <NotFound />
        </Show>
      </main>
    </div>
  );
}
```

---

## Recommended Architecture (Demo App)

The demo app splits routing into three files for better separation of concerns:

```
src/
├── config.ts   ← application-wide constants (port, API base, auth switch)
└── router/
    ├── index.tsx   ← core router primitives (Route, Link, navigate, params…)
    ├── routes.tsx  ← route definitions, AppRoutes component, auth guard
    └── auth.ts     ← JWT auth state and helpers
```

### `router/index.tsx` — Core Primitives

This file exports the low-level building blocks:

| Export                     | Description                                                       |
| -------------------------- | ----------------------------------------------------------------- |
| `currentPath`              | Signal with the current `location.pathname`                       |
| `setCurrentPath`           | Setter for `currentPath`                                          |
| `params`                   | Signal with extracted dynamic params (e.g. `{ id: "42" }`)        |
| `matchPath(pattern, path)` | Converts `/user/:id` to regex and extracts params                 |
| `navigate(path)`           | Pushes a new History entry and updates `currentPath`              |
| `Route`                    | Reactive component — renders `component` only when `path` matches |
| `Link`                     | SPA-aware anchor that calls `navigate` and blocks XSS hrefs       |

#### `<Route />` Component

Renders its `component` only when `path` matches the current location. When a match occurs, it also updates the `params` signal.

```tsx
<Route path="/user/:id" component={() => <UserProfile />} />;
```

#### `<Link />` Component

A drop-in replacement for `<a>` that intercepts left-clicks (without modifier keys) and calls `navigate()` instead of doing a full page reload. It also sanitizes `javascript:`, `data:`, and `vbscript:` hrefs.

```tsx
<Link href="/about" class="nav-link">About</Link>;
```

Props:

| Prop       | Type                         | Description  |
| ---------- | ---------------------------- | ------------ |
| `href`     | `string`                     | Target path  |
| `children` | `unknown`                    | Link content |
| `class`    | `string?`                    | CSS class    |
| `style`    | `string \| JSX.StyleObject?` | Inline style |

#### `navigate(path)`

Programmatically navigates to any path:

```tsx
import { navigate } from "@router/index.tsx";

navigate("/home");
```

Browser back/forward buttons are handled automatically via the `popstate` event.

---

### `router/routes.tsx` — Route Definitions & Auth Guard

This file centralises all route configuration and exposes the `<AppRoutes />` component used by `App.tsx`.

#### Master Auth Switch

```ts
// Located in src/config.ts
export const IS_AUTH_ENABLED = false; // default: public SPA. Set to true to enable login & route guards.
```

When `IS_AUTH_ENABLED` is `false`, the app behaves as a public SPA: `"/"` renders `<Home />`, no routes are protected, and the navbar is always visible.

#### Route Definition

Routes are declared as a `RouteDefinition[]` array. Since the auth switch is now in `src/config.ts`, it is imported as follows:

```tsx
import { IS_AUTH_ENABLED } from "@src/config.ts";

export interface RouteDefinition {
  path: string;
  component: (props: Record<string, unknown>) => Node;
  props?: Record<string, unknown>;
  protected?: boolean; // requires login when IS_AUTH_ENABLED is true
}

export const routes: RouteDefinition[] = [
  { path: "/", component: IS_AUTH_ENABLED ? Login : Home },
  { path: "/home", component: Home, protected: IS_AUTH_ENABLED },
  { path: "/about", component: About, protected: IS_AUTH_ENABLED },
  { path: "/contact", component: Contact, protected: IS_AUTH_ENABLED },
  { path: "/user/:id", component: UserProfile, protected: IS_AUTH_ENABLED },
];
```

#### Hiding the Navbar on Certain Paths

```ts
export const hideNavbarPaths = IS_AUTH_ENABLED ? ["/", "/login"] : [];
```

`App.tsx` uses this to conditionally show the `<Navbar />`:

```tsx
const showNavbar = () => !hideNavbarPaths.includes(currentPath());
```

#### `useAuthGuard()`

A `createEffect`-based hook that redirects users reactively:

- Logged-in users visiting `"/"` are sent to `"/home"`.
- Unauthenticated users visiting a `protected` route are sent to `"/"`.

```tsx
export function useAuthGuard() {
  createEffect(() => {
    if (!IS_AUTH_ENABLED) return;

    const path = currentPath();
    const loggedIn = isLoggedIn();

    if (path === "/" && loggedIn) {
      navigate("/home");
      return;
    }

    const currentRoute = routes.find((r) => !!matchPath(r.path, path));
    if (currentRoute?.protected && !loggedIn) navigate("/");
  });
}
```

Call it once at the top of `App()`:

```tsx
export function App() {
  useAuthGuard();
  // …
}
```

#### `<AppRoutes />`

Renders every route in the array via `<For>` and appends a `<NotFound />` fallback:

```tsx
export function AppRoutes() {
  return (
    <>
      <For each={() => routes}>
        {(route) => {
          const Comp = route.component;
          return (
            <Route
              path={route.path}
              component={() => {
                if (IS_AUTH_ENABLED && route.protected && !isLoggedIn()) {
                  return null; // sync guard (belt-and-suspenders)
                }
                return <Comp {...(route.props || {})} />;
              }}
            />
          );
        }}
      </For>

      <Show when={() => !anyRouteMatch()}>{() => <NotFound />}</Show>
    </>
  );
}
```

---

### `router/auth.ts` — JWT Auth State

Manages authentication using `sessionStorage` (token is cleared when the tab closes).

| Export                    | Description                                                    |
| ------------------------- | -------------------------------------------------------------- |
| `isLoggedIn`              | Reactive signal — `true` if a valid, non-expired JWT is stored |
| `setIsLoggedIn`           | Setter (use `login` / `logout` instead in most cases)          |
| `login(email, password)`  | Calls the API (or a mock) and stores the token                 |
| `logout()`                | Removes the token and sets `isLoggedIn` to `false`             |
| `authFetch(url, options)` | `fetch` wrapper that injects `Authorization: Bearer <token>`   |

#### Mock Mode

When `API_BASE` (defined in `src/config.ts`) is an empty string, `login()` falls back to a built-in mock:

- **Email:** `admin@example.com`
- **Password:** `admin123`

This lets you develop the full auth flow without a backend.

#### `authFetch`

Use this instead of `fetch` for any authenticated API call:

```ts
import { authFetch } from "@router/auth.ts";

const res = await authFetch("/api/profile");
```

It automatically:

1. Rejects immediately (and calls `logout()`) if the local token is expired.
2. Calls `logout()` if the server responds with `401`.

---

## Key Concepts Summary

### `matchPath(pattern, path)`

Handles both static paths (`/about`) and dynamic segments (`/user/:id`). Returns `null` on no match, or a `Record<string, string>` of extracted params. Matched params are stored in the `params()` signal automatically by `<Route />`.

### Handling 404s

`anyRouteMatch()` returns `true` if any route in the array matches the current path. Wrapping `<NotFound />` in a `<Show when={() => !anyRouteMatch()}>` ensures it appears only when nothing else matches.

### Reactive Navigation

All routing state lives in signals. Any component reading `currentPath()` or `params()` will automatically re-render on navigation — no context providers or wrappers required.
