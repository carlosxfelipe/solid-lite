import { h, Show } from "@solid/index.ts";
import { navigate, params } from "@router/index.tsx";
import { NotFound } from "@pages/NotFound.tsx";
import { logout } from "@router/auth.ts";

// Mock list of "existing" IDs in our system
const VALID_USERS = ["123", "456", "carlos"];

export function UserProfile() {
  const id = () => params().id;
  const isUserValid = () => VALID_USERS.includes(id());

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <Show when={isUserValid} fallback={<NotFound />}>
      <div class="container">
        <h1 class="title">User Profile</h1>
        <div class="card">
          <p style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
            Viewing profile for user ID:{" "}
            <strong style={{ color: "hsl(var(--primary))" }}>
              {id}
            </strong>
          </p>
          <p>
            Welcome! This profile was validated synchronously. Only IDs in our
            database ([123, 456, carlos]) are allowed.
          </p>

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
      </div>
    </Show>
  );
}
