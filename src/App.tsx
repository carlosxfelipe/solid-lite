import { h, Show } from "@solid/index.ts";
import { Navbar } from "@components/Navbar.tsx";
import { currentPath } from "@router/index.tsx";
import { AppRoutes, hideNavbarPaths, useAuthGuard } from "@router/routes.tsx";

export function App() {
  useAuthGuard();

  const showNavbar = () => !hideNavbarPaths.includes(currentPath());

  return (
    <div>
      <Show when={showNavbar}>{() => <Navbar />}</Show>
      <main>
        <AppRoutes />
      </main>
    </div>
  );
}
