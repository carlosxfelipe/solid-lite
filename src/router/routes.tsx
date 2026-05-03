import { createEffect, For, Fragment, h, Show } from "@solid/index.ts";
import { currentPath, matchPath, navigate, Route } from "@router/index.tsx";
import { isLoggedIn } from "@router/auth.ts";

import { Home } from "@pages/Home.tsx";
import { About } from "@pages/About.tsx";
import { Contact } from "@pages/Contact.tsx";
import { UserProfile } from "@pages/UserProfile.tsx";
import { Login } from "@pages/Login.tsx";
import { NotFound } from "@pages/NotFound.tsx";

/**
 * MASTER AUTH SWITCH
 * Set to false to disable all login requirements and make Home the root page.
 */
const IS_AUTH_ENABLED = false;

export interface RouteDefinition {
  path: string;
  component: (props: Record<string, unknown>) => Node;
  props?: Record<string, unknown>;
  protected?: boolean;
}

/**
 * Routes definition.
 * Automatically adjusts based on IS_AUTH_ENABLED flag.
 */
export const routes: RouteDefinition[] = [
  {
    path: "/",
    component: IS_AUTH_ENABLED ? Login : Home,
  },
  {
    path: "/home",
    component: Home,
    protected: IS_AUTH_ENABLED,
  },
  {
    path: "/about",
    component: About,
    protected: IS_AUTH_ENABLED,
  },
  {
    path: "/contact",
    component: Contact,
    protected: IS_AUTH_ENABLED,
  },
  {
    path: "/user/:id",
    component: UserProfile,
    protected: IS_AUTH_ENABLED,
  },
];

/** Paths where the navbar should be hidden */
export const hideNavbarPaths = IS_AUTH_ENABLED ? ["/", "/login"] : [];

/**
 * Auth Route Guard.
 */
export function useAuthGuard() {
  createEffect(() => {
    if (!IS_AUTH_ENABLED) return; // Exit early if auth is disabled

    const path = currentPath();
    const loggedIn = isLoggedIn();

    // Redirect logged-in users away from login page
    if (path === "/" && loggedIn) {
      navigate("/home");
      return;
    }

    // Dynamic check for protected routes
    const currentRoute = routes.find((r) => !!matchPath(r.path, path));
    if (currentRoute?.protected && !loggedIn) {
      navigate("/");
    }
  });
}

export const anyRouteMatch = () => {
  const path = currentPath();
  return routes.some((r) => !!matchPath(r.path, path));
};

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
                // Sync guard
                if (IS_AUTH_ENABLED && route.protected && !isLoggedIn()) {
                  return null;
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
