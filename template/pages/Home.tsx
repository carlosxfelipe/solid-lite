import { h } from "@solid/index.ts";
import { StyleSheet } from "@utils/style.ts";

export function Home() {
  return (
    <div class="container">
      <h1 class="title">Welcome to Solid Lite</h1>
      <p class="description">
        Edit <code style={styles.code}>./src/pages/Home.tsx</code>{" "}
        and save to see your changes instantly.
      </p>
    </div>
  );
}

const styles = StyleSheet.create({
  code: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "0.9em",
    background: "hsl(var(--muted))",
    color: "hsl(var(--foreground))",
    padding: "0.15rem 0.4rem",
    borderRadius: "0.35rem",
  },
});
