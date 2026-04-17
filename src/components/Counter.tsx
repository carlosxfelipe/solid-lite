import { createEffect, createSignal, h } from "@solid/index.ts";

export function Counter() {
  const [count, setCount] = createSignal(
    Number(localStorage.getItem("counter") || 0),
  );

  createEffect(() => {
    localStorage.setItem("counter", count().toString());
  });

  return (
    <div class="card">
      <div class="label">Contador Reativo</div>
      <div class="counter-value">{count}</div>
      <div class="button-group">
        <button
          type="button"
          class="btn btn-secondary"
          onClick={() => setCount((c: number) => c - 1)}
        >
          Diminuir
        </button>
        <button
          type="button"
          class="btn btn-primary"
          onClick={() => setCount((c: number) => c + 1)}
        >
          Incrementar
        </button>
        <button
          type="button"
          class="btn btn-danger"
          style={{ marginLeft: "auto" }}
          onClick={() => setCount(0)}
        >
          Zerar
        </button>
      </div>
    </div>
  );
}
