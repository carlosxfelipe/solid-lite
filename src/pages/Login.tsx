import { createSignal, h, Show } from "@solid/index.ts";
import { navigate } from "@router/index.tsx";
import { Icon } from "@components/Icon.tsx";
import { login } from "@router/auth.ts";

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
    <div
      class="container"
      style={{
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
        "min-height": "100vh",
      }}
    >
      <div class="card" style={{ width: "100%", "max-width": "400px" }}>
        <h1 class="title" style={{ "text-align": "center" }}>Login</h1>
        <p class="description" style={{ "text-align": "center" }}>
          Welcome back to Solid Lite.
        </p>

        <Show when={() => !!error()}>
          {() => (
            <div
              style={{
                color: "red",
                "margin-bottom": "1rem",
                "text-align": "center",
                "font-size": "0.875rem",
              }}
            >
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
            <div style={{ position: "relative" }}>
              <input
                type={() => (showPassword() ? "text" : "password")}
                class="form-input"
                style={{ "padding-right": "2.5rem" }}
                placeholder="admin123"
                value={password}
                onInput={(e: Event) =>
                  setPassword((e.target as HTMLInputElement).value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword())}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  padding: "4px",
                  cursor: "pointer",
                  color: "hsl(var(--muted-foreground))",
                  display: "flex",
                  "align-items": "center",
                }}
              >
                {() => (
                  <Icon name={showPassword() ? "EyeOff" : "Eye"} size={18} />
                )}
              </button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-large">
            Sign In
          </button>
        </form>

        <div
          style={{
            "margin-top": "1.5rem",
            "text-align": "center",
            "font-size": "0.875rem",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          Don't have an account?{" "}
          <span style={{ color: "hsl(var(--foreground))", cursor: "pointer" }}>
            Sign up
          </span>
        </div>
      </div>
    </div>
  );
}
