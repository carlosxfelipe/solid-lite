import { createSignal, h } from "@solid/index.ts";
import { navigate } from "@router/index.tsx";
import { Icon } from "@components/Icon.tsx";

export function Login() {
  const [showPassword, setShowPassword] = createSignal(false);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    navigate("/");
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

        <form onSubmit={handleSubmit}>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input
              type="email"
              class="form-input"
              placeholder="name@example.com"
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
                placeholder="••••••••"
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
