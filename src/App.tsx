import { h, Show } from "@solid/index.ts";
import { Navbar } from "@components/Navbar.tsx";
import { currentPath, matchPath, Route } from "@router/index.tsx";
import { Home } from "@pages/Home.tsx";
import { About } from "@pages/About.tsx";
import { Contact } from "@pages/Contact.tsx";
import { UserProfile } from "@pages/UserProfile.tsx";
import { NotFound } from "@pages/NotFound.tsx";

const routePaths = ["/", "/about", "/contact", "/user/:id"];

export function App() {
  const anyMatch = () => {
    const path = currentPath();
    return routePaths.some((p) => !!matchPath(p, path));
  };

  return (
    <div>
      <Navbar />
      <main>
        <Route path="/" component={() => <Home />} />
        <Route path="/about" component={() => <About />} />
        <Route path="/contact" component={() => <Contact />} />
        <Route path="/user/:id" component={() => <UserProfile />} />

        <Show when={() => !anyMatch()}>
          <NotFound />
        </Show>
      </main>
    </div>
  );
}
