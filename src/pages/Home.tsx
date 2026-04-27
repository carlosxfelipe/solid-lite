import { h } from "@solid/index.ts";
import { Counter } from "@components/Counter.tsx";

export function Home() {
  return (
    <div class="container">
      <h1 class="title">Solid Lite</h1>
      <p class="description">
        A minimalist and high-performance implementation inspired by SolidJS.
      </p>

      <Counter />
    </div>
  );
}
