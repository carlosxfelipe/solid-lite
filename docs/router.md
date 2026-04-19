# Reactive Router Guide

Solid Lite includes a minimalist, signal-based reactive router. This guide explains how to implement routing in your application, starting with a straightforward manual approach.

## Simple Implementation

For small applications or when you prefer explicit declarations, you can define your routes manually within the `App` component.

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

## Key Concepts

### Route Component

The `<Route />` component is reactive. It listens to the `currentPath()` signal and only renders its `component` when the `path` prop matches the current location.

### matchPath Utility

`matchPath` handles both static paths (e.g., `/about`) and dynamic segments (e.g., `/user/:id`). It uses regex to extract parameters which are then accessible via the `params()` signal.

### Handling 404s

Since `<Route />` components render independently, the `<Show />` component combined with an `anyMatch` helper is used to display a "Not Found" page when no routes are active.
