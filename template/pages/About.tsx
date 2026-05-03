import { h } from "@solid/index.ts";

export function About() {
  return (
    <div class="container">
      <h1 class="title">About</h1>
      <p class="description">
        This is a demonstration of the reactive router in Solid Lite.
      </p>
      <div class="card">
        <p>
          You navigated here without a full page refresh using our custom
          reactive signal-based routing!
        </p>
      </div>
    </div>
  );
}
