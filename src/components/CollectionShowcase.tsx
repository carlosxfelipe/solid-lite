import { createSignal, h } from "@solid/index.ts";
import { sample, sortBy } from "@std/collections";
import { Icon } from "@components/Icon.tsx";
import { IconName } from "@utils/icons.tsx";

interface Feature {
  name: string;
  priority: number;
  icon: IconName;
}

export function CollectionShowcase() {
  const features: Feature[] = [
    { name: "Fine-grained Reactivity", priority: 1, icon: "Zap" },
    { name: "No Virtual DOM", priority: 2, icon: "Cpu" },
    { name: "Native Deno", priority: 3, icon: "Binary" },
    { name: "TypeScript", priority: 4, icon: "Code" },
    { name: "JSX Runtime", priority: 1, icon: "Layout" },
  ];

  const tips = [
    "Use signals for values that change frequently.",
    "Solid Lite doesn't need a Babel compiler.",
    "The real DOM is your friend!",
    "Deno is secure by default.",
  ];

  // Using sortBy from @std/collections
  const sortedFeatures = sortBy(features, (it) => it.name);

  const [randomTip, setRandomTip] = createSignal(sample(tips) || tips[0]);

  const refreshTip = () => {
    setRandomTip(sample(tips) || tips[0]);
  };

  return (
    <div class="card" style={{ marginTop: "2rem" }}>
      <div
        class="label"
        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
      >
        <Icon name="Box" size={16} /> Deno Standard Collections
      </div>
      <h3
        style={{
          marginBottom: "1rem",
          color: "hsl(var(--primary))",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <Icon name="ListOrdered" size={20} /> Ordered Features
      </h3>

      <ul style={{ marginBottom: "1.5rem" }}>
        {sortedFeatures.map((f) => (
          <li
            style={{
              fontSize: "0.875rem",
              marginBottom: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Icon name={f.icon} size={14} color="hsl(var(--primary))" />
            <span>
              {f.name} (Priority: {f.priority})
            </span>
          </li>
        ))}
      </ul>

      <hr
        style={{ borderTop: "1px solid hsl(var(--border))", margin: "1rem 0" }}
      />

      <div
        class="label"
        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
      >
        <Icon name="Lightbulb" size={16} /> Random Tip (sample)
      </div>
      <p style={{ fontStyle: "italic", marginBottom: "1rem" }}>"{randomTip}"</p>

      <button
        type="button"
        class="btn btn-secondary"
        onClick={refreshTip}
        style={{ gap: "0.5rem" }}
      >
        <Icon name="RefreshCw" size={16} /> Draw New Tip
      </button>
    </div>
  );
}
