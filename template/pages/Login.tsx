import { createSignal, h, Show } from "@solid/index.ts";
import { navigate } from "@router/index.tsx";
import { Icon } from "@components/Icon.tsx";
import { Button } from "@components/Button.tsx";
import { login } from "@router/auth.ts";
import { StyleSheet } from "@utils/style.ts";

export function Login() {
  const [showPassword, setShowPassword] = createSignal(false);
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    try {
      await login(email(), password());
      navigate("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    }
  };

  return (
    <div class="container" style={styles.container}>
      <div class="card" style={styles.card}>
        <h1 class="title" style={styles.title}>Login</h1>
        <p class="description" style={styles.title}>
          Welcome back to Solid Lite.
        </p>

        <Show when={() => !!error()}>
          {() => (
            <div style={styles.error}>
              {error()}
            </div>
          )}
        </Show>

        <form onSubmit={handleSubmit}>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input
              type="email"
              class="form-input"
              placeholder="admin@example.com"
              value={email}
              onInput={(e: Event) =>
                setEmail((e.target as HTMLInputElement).value)}
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <div style={styles.passwordWrapper}>
              <input
                type={() => (showPassword() ? "text" : "password")}
                class="form-input"
                style={styles.passwordInput}
                placeholder="admin123"
                value={password}
                onInput={(e: Event) =>
                  setPassword((e.target as HTMLInputElement).value)}
                required
              />
              <Button
                variant="ghost"
                onClick={() => setShowPassword(!showPassword())}
                style={styles.eyeButton}
              >
                {() => (
                  <Icon name={showPassword() ? "EyeOff" : "Eye"} size={18} />
                )}
              </Button>
            </div>
          </div>

          <Button type="submit" variant="primary" class="btn-large">
            Sign In
          </Button>
        </form>

        <div style={styles.footer}>
          Don't have an account?{" "}
          <span style={styles.signUpLink}>
            Sign up
          </span>
        </div>
      </div>
    </div>
  );
}

const styles = StyleSheet.create({
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
  },
  title: {
    textAlign: "center",
  },
  error: {
    color: "red",
    marginBottom: "1rem",
    textAlign: "center",
    fontSize: "0.875rem",
  },
  passwordWrapper: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: "2.5rem",
  },
  eyeButton: {
    position: "absolute",
    right: "0.75rem",
    top: "50%",
    transform: "translateY(-50%)",
    padding: "4px",
    height: "auto",
    color: "hsl(var(--muted-foreground))",
    display: "flex",
    alignItems: "center",
  },
  footer: {
    marginTop: "1.5rem",
    textAlign: "center",
    fontSize: "0.875rem",
    color: "hsl(var(--muted-foreground))",
  },
  signUpLink: {
    color: "hsl(var(--foreground))",
    cursor: "pointer",
  },
});
