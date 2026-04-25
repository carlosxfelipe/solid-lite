import { createEffect, For, h, Show } from "@solid/index.ts";
import { Navbar } from "@components/Navbar.tsx";
import { currentPath, matchPath, navigate, Route } from "@router/index.tsx";
import { Home } from "@pages/Home.tsx";
import { About } from "@pages/About.tsx";
import { Contact } from "@pages/Contact.tsx";
import { UserProfile } from "@pages/UserProfile.tsx";
import { Login } from "@pages/Login.tsx";
import { NotFound } from "@pages/NotFound.tsx";

interface RouteDefinition {
  path: string;
  component: (props: Record<string, unknown>) => Node;
  props?: Record<string, unknown>;
}

const routes: RouteDefinition[] = [
  { path: "/", component: Login },
  { path: "/home", component: Home },
  { path: "/about", component: About },
  { path: "/contact", component: Contact },
  { path: "/user/:id", component: UserProfile },
];

const hideNavbarPaths = ["/"];

export function App() {
  createEffect(() => {
    const path = currentPath();
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (path === "/" && isLoggedIn) {
      navigate("/home");
    }
  });

  const anyMatch = () => {
    const path = currentPath();
    return routes.some((r) => !!matchPath(r.path, path));
  };

  const showNavbar = () => !hideNavbarPaths.includes(currentPath());

  return (
    <div>
      <Show when={showNavbar}>{() => <Navbar />}</Show>
      <main>
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

        <Show when={() => !anyMatch()}>{() => <NotFound />}</Show>
      </main>
    </div>
  );
}
