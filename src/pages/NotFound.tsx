import { h } from "@solid/index.ts";
import { Link } from "@router/index.tsx";

export function NotFound() {
  return (
    <div class="container" style={{ textAlign: "center", paddingTop: "4rem" }}>
      <h1
        style={{ fontSize: "6rem", margin: "0", color: "hsl(var(--primary))" }}
      >
        404
      </h1>
      <h2 class="title">Page Not Found</h2>
      <p class="description" style={{ marginBottom: "2rem" }}>
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link href="/" class="btn btn-primary">
        Back to Home
      </Link>
    </div>
  );
}
