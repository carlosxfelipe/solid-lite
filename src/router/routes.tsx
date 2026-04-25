import { createEffect, For, Fragment, h, Show } from "@solid/index.ts";
import { currentPath, matchPath, navigate, Route } from "@router/index.tsx";
import { isLoggedIn } from "@router/auth.ts";
import { Home } from "@pages/Home.tsx";
import { About } from "@pages/About.tsx";
import { Contact } from "@pages/Contact.tsx";
import { UserProfile } from "@pages/UserProfile.tsx";
import { Login } from "@pages/Login.tsx";
import { NotFound } from "@pages/NotFound.tsx";

export interface RouteDefinition {
  path: string;
  component: (props: Record<string, unknown>) => Node;
  props?: Record<string, unknown>;
}

/** All registered application routes */
export const routes: RouteDefinition[] = [
  { path: "/", component: Login },
  { path: "/home", component: Home },
  { path: "/about", component: About },
  { path: "/contact", component: Contact },
  { path: "/user/:id", component: UserProfile },
];

/** Public routes that don't require authentication */
const publicPaths = ["/"];

/** Paths where the navbar should be hidden */
export const hideNavbarPaths = ["/"];

/**
 * Auth Route Guard — call inside a reactive root (e.g. App).
 * - If logged in and on login page → redirect to /home
 * - If NOT logged in and on a protected page → redirect to /
 */
export function useAuthGuard() {
  createEffect(() => {
    const path = currentPath();
    const loggedIn = isLoggedIn();

    if (path === "/" && loggedIn) {
      navigate("/home");
      return;
    }

    if (!loggedIn && !publicPaths.includes(path)) {
      navigate("/");
    }
  });
}

/**
 * Checks if the current path matches any registered route.
 */
export const anyRouteMatch = () => {
  const path = currentPath();
  return routes.some((r) => !!matchPath(r.path, path));
};

/**
 * AppRoutes — renders all routes and the 404 fallback.
 */
export function AppRoutes() {
  return (
    <>
      <For each={() => routes}>
        {(route) => {
          const Comp = route.component;
          return (
            <Route
              path={route.path}
              component={() => <Comp {...(route.props || {})} />}
            />
          );
        }}
      </For>

      <Show when={() => !anyRouteMatch()}>{() => <NotFound />}</Show>
    </>
  );
}
