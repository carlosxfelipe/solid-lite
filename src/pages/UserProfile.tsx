import { h, Show } from "@solid/index.ts";
import { params } from "@router/index.tsx";
import { NotFound } from "@pages/NotFound.tsx";

// Mock list of "existing" IDs in our system
const VALID_USERS = ["123", "456", "carlos"];

export function UserProfile() {
  const id = () => params().id;
  const isUserValid = () => VALID_USERS.includes(id());

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
        </div>
      </div>
    </Show>
  );
}
