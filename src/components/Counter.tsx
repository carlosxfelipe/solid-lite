import { createEffect, createSignal, h } from "@solid/index.ts";
import { Icon } from "@components/Icon.tsx";
import { StyleSheet } from "@utils/style.ts";

export function Counter() {
  const [count, setCount] = createSignal(
    Number(localStorage.getItem("counter") || 0),
  );

  createEffect(() => {
    localStorage.setItem("counter", count().toString());
  });

  return (
    <div class="card">
      <div class="label" style={styles.label}>
        <Icon name="Plus" size={16} /> Reactive Counter
      </div>
      <div class="counter-value">{count}</div>
      <div class="button-group">
        <button
          type="button"
          class="btn btn-secondary btn-icon"
          onClick={() => setCount((c: number) => c - 1)}
          style={styles.button}
        >
          <Icon name="Minus" size={16} />
          <span class="btn-label">Decrease</span>
        </button>
        <button
          type="button"
          class="btn btn-primary btn-icon"
          onClick={() => setCount((c: number) => c + 1)}
          style={styles.button}
        >
          <Icon name="Plus" size={16} />
          <span class="btn-label">Increase</span>
        </button>
        <button
          type="button"
          class="btn btn-danger btn-icon"
          style={styles.resetButton}
          onClick={() => setCount(0)}
        >
          <Icon name="RefreshCw" size={16} />
          <span class="btn-label">Reset</span>
        </button>
      </div>
    </div>
  );
}

const styles = StyleSheet.create({
  label: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  button: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  resetButton: {
    marginLeft: "auto",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
  },
});
