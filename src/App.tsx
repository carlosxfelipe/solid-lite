import { h, Show } from "@solid/index.ts";
import { Navbar } from "@components/Navbar.tsx";
import { currentPath } from "@router/index.tsx";
import { isLoggedIn } from "@router/auth.ts";
import { AppRoutes, hideNavbarPaths, useAuthGuard } from "@router/routes.tsx";
import { IS_AUTH_ENABLED } from "@src/config.ts";

export function App() {
  useAuthGuard();

  const showNavbar = () => {
    if (IS_AUTH_ENABLED && !isLoggedIn()) return false;
    return !hideNavbarPaths.includes(currentPath());
  };

  return (
    <div>
      <Show when={showNavbar}>{() => <Navbar />}</Show>
      <main>
        <AppRoutes />
      </main>
    </div>
  );
}
