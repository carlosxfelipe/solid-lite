import { createEffect, createSignal, derived, h } from "@solid/index.ts";
import { StyleSheet } from "@utils/style.ts";

export function Home() {
  const [count, setCount] = createSignal(
    Number(localStorage.getItem("counter") || 3),
  );

  createEffect(() => {
    localStorage.setItem("counter", count().toString());
  });

  return (
    <section style={styles.hero}>
      <div style={styles.glow} aria-hidden="true" />

      <div style={styles.logoWrap}>
        <svg
          width="96"
          height="96"
          viewBox="0 0 96 96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={styles.logo}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="sl-grad" x1="0" y1="0" x2="96" y2="96">
              <stop offset="0%" stop-color="#60a5fa" />
              <stop offset="50%" stop-color="#a78bfa" />
              <stop offset="100%" stop-color="#f472b6" />
            </linearGradient>
          </defs>
          {/* Subtle rounded-square frame */}
          <rect
            x="6"
            y="6"
            width="84"
            height="84"
            rx="22"
            ry="22"
            stroke="url(#sl-grad)"
            stroke-width="2.5"
            fill="none"
            opacity="0.35"
          />
          {/* SL monogram */}
          <text
            x="48"
            y="65"
            text-anchor="middle"
            font-family='ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
            font-size="48"
            font-weight="800"
            letter-spacing="-3"
            fill="url(#sl-grad)"
          >
            SL
          </text>
        </svg>
      </div>

      <h1 style={styles.title}>
        Welcome to <span style={styles.titleAccent}>Solid Lite</span>
      </h1>

      <p style={styles.subtitle}>
        Edit <code style={styles.code}>./src/pages/Home.tsx</code>{" "}
        and save to see your changes instantly.
      </p>

      <div style={styles.counter}>
        <button
          type="button"
          style={styles.counterBtn}
          onClick={() => setCount((c: number) => Math.max(0, c - 1))}
          aria-label="decrement"
        >
          −1
        </button>
        <span style={styles.counterValue}>{count}</span>
        <button
          type="button"
          style={styles.counterBtn}
          onClick={() => setCount((c: number) => c + 1)}
          aria-label="increment"
        >
          +1
        </button>
      </div>

      <div style={styles.derivedBadge}>
        derived: {derived(() => count() * 2)}
      </div>

      <div style={styles.links}>
        <a
          href="https://github.com/carlosxfelipe/solid-lite"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.link}
        >
          GitHub →
        </a>
        <span style={styles.linkSep}>·</span>
        <a
          href="https://docs.deno.com"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.link}
        >
          Deno Docs →
        </a>
      </div>
    </section>
  );
}

const styles = StyleSheet.create({
  hero: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "4rem 1.5rem 5rem",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: "-20%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "600px",
    height: "600px",
    background:
      "radial-gradient(circle, rgba(167,139,250,0.18), transparent 60%)",
    pointerEvents: "none",
    zIndex: "0",
  },
  logoWrap: {
    position: "relative",
    zIndex: "1",
    marginBottom: "1.5rem",
  },
  logo: {
    filter: "drop-shadow(0 4px 16px rgba(167,139,250,0.35))",
  },
  title: {
    position: "relative",
    zIndex: "1",
    fontSize: "clamp(2rem, 5vw, 3rem)",
    fontWeight: "700",
    letterSpacing: "-0.04em",
    margin: "0 0 0.75rem",
    lineHeight: "1.1",
  },
  titleAccent: {
    background: "linear-gradient(90deg, #60a5fa, #a78bfa, #f472b6)",
    backgroundClip: "text",
    webkitBackgroundClip: "text",
    color: "transparent",
    webkitTextFillColor: "transparent",
  },
  subtitle: {
    position: "relative",
    zIndex: "1",
    color: "hsl(var(--muted-foreground))",
    fontSize: "1.05rem",
    margin: "0 0 2.5rem",
    maxWidth: "32rem",
    lineHeight: "1.55",
  },
  code: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "0.9em",
    background: "hsl(var(--muted))",
    color: "hsl(var(--foreground))",
    padding: "0.15rem 0.4rem",
    borderRadius: "0.35rem",
  },
  counter: {
    position: "relative",
    zIndex: "1",
    display: "inline-flex",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "2.5rem",
  },
  counterBtn: {
    width: "2.75rem",
    height: "2.75rem",
    fontSize: "1rem",
    fontWeight: "600",
    border: "1px solid hsl(var(--border))",
    background: "hsl(var(--card))",
    color: "hsl(var(--foreground))",
    borderRadius: "0.6rem",
    cursor: "pointer",
    transition: "transform 120ms ease, border-color 120ms ease",
    userSelect: "none",
    webkitUserSelect: "none",
    webkitTapHighlightColor: "transparent",
    touchAction: "manipulation",
  },
  counterValue: {
    fontSize: "1.75rem",
    fontWeight: "600",
    minWidth: "2.5rem",
    fontVariantNumeric: "tabular-nums",
  },
  links: {
    position: "relative",
    zIndex: "1",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.75rem",
    fontSize: "0.95rem",
    color: "hsl(var(--muted-foreground))",
  },
  link: {
    color: "hsl(var(--foreground))",
    textDecoration: "none",
    fontWeight: "500",
  },
  linkSep: {
    opacity: "0.5",
  },
  derivedBadge: {
    position: "relative",
    zIndex: "1",
    fontSize: "0.9rem",
    fontWeight: "500",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    color: "hsl(var(--muted-foreground))",
    background: "hsl(var(--muted))",
    padding: "0.35rem 0.75rem",
    borderRadius: "0.5rem",
    marginBottom: "2.5rem",
  },
});
