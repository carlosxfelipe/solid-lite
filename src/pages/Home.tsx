import { h } from "@solid/index.ts";
import { navigate } from "@router/index.tsx";
import { Counter } from "@components/Counter.tsx";
import { CollectionShowcase } from "@components/CollectionShowcase.tsx";
import { logout } from "@router/auth.ts";

export function Home() {
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div class="container">
      <h1 class="title">Solid Lite</h1>
      <p class="description">
        A minimalist and high-performance implementation inspired by SolidJS.
      </p>

      <Counter />
      <CollectionShowcase />

      <div style={{ "margin-top": "2rem", "text-align": "center" }}>
        <button
          type="button"
          onClick={handleLogout}
          class="btn btn-secondary"
          style={{ "font-size": "0.875rem" }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
