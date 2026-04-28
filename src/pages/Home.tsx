import { h } from "@solid/index.ts";
import { Counter } from "@components/Counter.tsx";
import { StyleSheet } from "@utils/style.ts";

export function Home() {
  return (
    <div class="container">
      <h1 class="title">Solid Lite</h1>
      <p class="description">
        A minimalist and high-performance implementation inspired by SolidJS.
      </p>

      <div class="card" style={styles.card}>
        <p style={styles.paragraphBoldSpacing}>
          Tired of "bloatware" in modern web development? Me too.
        </p>
        <p style={styles.paragraphSpacing}>
          Introducing solid-lite: an experiment where I decided to unite the
          best of both worlds: <strong>high-performance reactivity</strong>{" "}
          and a <strong>clean, zero-bloat runtime</strong>.
        </p>
        <p style={styles.paragraphBoldSpacing}>What makes it special?</p>
        <ul style={styles.list}>
          <li>
            <strong>Solid.js Core:</strong>{" "}
            Native reactivity without a Virtual DOM. The performance is insane,
            and the syntax is very familiar if you already know React (TSX), so
            the learning curve is almost zero.
          </li>
          <li>
            <strong>Deno Everywhere:</strong>{" "}
            No Node or Bun. The project runs on Deno—created by the same person
            behind Node, aiming to fix past design issues. Plus, we get access
            to the modern{" "}
            <a
              href="https://jsr.io"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
            >
              jsr.io
            </a>{" "}
            ecosystem, avoiding being locked into npm and its chronic security
            and performance problems.
          </li>
          <li>
            <strong>NPM Ready (but empty):</strong>{" "}
            Full support for npm packages, but by default? Zero. The project
            starts clean, without heavy <code>node_modules</code>{" "}
            cluttering your disk.
          </li>
          <li>
            <strong>Native Hot Reload:</strong>{" "}
            I implemented an instant refresh system using Deno’s native APIs.
            It’s lightweight, fast, and doesn’t choke your CPU.
          </li>
        </ul>
        <p style={styles.paragraphBold}>
          The goal? To prove that we don’t need complex build pipelines to have
          a modern and smooth development experience.
        </p>
      </div>

      <Counter />
    </div>
  );
}

const styles = StyleSheet.create({
  card: {
    textAlign: "left",
    marginTop: "2rem",
    marginBottom: "2rem",
  },
  paragraphBoldSpacing: {
    fontWeight: "bold",
    marginBottom: "1rem",
  },
  paragraphSpacing: {
    marginBottom: "1.5rem",
  },
  paragraphBold: {
    fontWeight: "bold",
  },
  list: {
    listStyleType: "disc",
    marginLeft: "1.5rem",
    marginBottom: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  link: {
    color: "hsl(var(--primary))",
    textDecoration: "underline",
  },
});
