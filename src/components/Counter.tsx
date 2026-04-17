import { createEffect, createSignal, h } from "@solid/index.ts";
import { Icon } from "@components/Icon.tsx";

export function Counter() {
  const [count, setCount] = createSignal(
    Number(localStorage.getItem("counter") || 0),
  );

  createEffect(() => {
    localStorage.setItem("counter", count().toString());
  });

  return (
    <div class="card">
      <div
        class="label"
        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
      >
        <Icon name="Plus" size={16} /> Reactive Counter
      </div>
      <div class="counter-value">{count}</div>
      <div class="button-group">
        <button
          type="button"
          class="btn btn-secondary"
          onClick={() => setCount((c: number) => c - 1)}
          style={{ gap: "0.5rem" }}
        >
          <Icon name="Minus" size={16} /> Decrease
        </button>
        <button
          type="button"
          class="btn btn-primary"
          onClick={() => setCount((c: number) => c + 1)}
          style={{ gap: "0.5rem" }}
        >
          <Icon name="Plus" size={16} /> Increase
        </button>
        <button
          type="button"
          class="btn btn-danger"
          style={{ marginLeft: "auto", gap: "0.5rem" }}
          onClick={() => setCount(0)}
        >
          <Icon name="RefreshCw" size={16} /> Reset
        </button>
      </div>
    </div>
  );
}
