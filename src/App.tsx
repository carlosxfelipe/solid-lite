import { h } from "@solid/index.ts";
import { Home } from "@pages/Home.tsx";
import { Navbar } from "@components/Navbar.tsx";

export function App() {
  // Esse é o componente raiz. Aqui futuramente você pode adicionar
  // Roteamento, Context Providers, Menus Globais, etc.
  return (
    <div>
      <Navbar />
      <main>
        <Home />
      </main>
    </div>
  );
}
