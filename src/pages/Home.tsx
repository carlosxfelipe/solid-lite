import { h } from "@solid/index.ts";
import { Counter } from "@components/Counter.tsx";

export function Home() {
  return (
    <div class="container">
      <h1 class="title">Solid Lite</h1>
      <p class="description">
        Uma implementação minimalista e performática inspirada no SolidJS.
      </p>

      <Counter />
    </div>
  );
}
