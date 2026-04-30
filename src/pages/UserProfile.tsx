import { h, Show } from "@solid/index.ts";
import { navigate, params } from "@router/index.tsx";
import { NotFound } from "@pages/NotFound.tsx";
import { logout } from "@router/auth.ts";
import { Button } from "@components/Button.tsx";
import { StyleSheet } from "@utils/style.ts";

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
          <p style={styles.profileHeader}>
            Viewing profile for user ID:{" "}
            <strong style={styles.userId}>
              {id}
            </strong>
          </p>
          <p>
            Welcome! This profile was validated synchronously. Only IDs in our
            database ([123, 456, carlos]) are allowed.
          </p>

          <div style={styles.buttonContainer}>
            <Button
              variant="secondary"
              onClick={handleLogout}
              style={styles.logoutButton}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </Show>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    fontSize: "1.25rem",
    marginBottom: "1rem",
  },
  userId: {
    color: "hsl(var(--primary))",
  },
  buttonContainer: {
    marginTop: "2rem",
    textAlign: "center",
  },
  logoutButton: {
    fontSize: "0.875rem",
  },
});
