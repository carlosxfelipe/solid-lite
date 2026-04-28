# Styling Best Practices: `class` vs `style`

**The Golden Rule:**
Handle all layout and design in CSS using the `class` attribute (including dynamic classes that toggle based on state). Reserve the `style` attribute exclusively for injecting numerical values or colors generated dynamically by JavaScript in real-time.

## When to use `class` (Most of the time)

Use classes for all your static and state-driven styles. It allows you to leverage CSS features like media queries, pseudo-classes (`:hover`, `:focus`), and keeps your rendering performant.

**Dynamic Classes Example:**

```tsx
// Toggling a class based on state is encouraged!
// Note: In solid-lite, you MUST use a getter `() => ...` for reactivity!
<button class={() => isActive() ? "btn-active" : "btn-inactive"}>
  Submit
</button>;
```

## When to use `style` (Exceptions)

Only use inline styles when a value changes frequently or is calculated arbitrarily by JavaScript (like coordinates, percentages, or user-defined colors).

**Dynamic Styles Example:**

```tsx
// Only the dynamic value is handled by 'style'.
// The overall look (borders, transitions, etc.) should still be in a CSS class.
// Note: In solid-lite, you MUST use a getter `() => ...` inside the style object!
<div class="progress-bar" style={{ width: () => `${progress()}%` }}></div>;
```

> **Attribute Order:** Always declare `class` before `style` in JSX. Since inline `style` has higher CSS specificity than class-based rules, placing it last makes it clear it is an intentional override — not the primary source of styling.

```tsx
// Correct: class first (base styles), style second (dynamic exception)
<div class="card" style={{ marginTop: "2rem" }}></div>

// Avoid: style first hides the intent
<div style={{ marginTop: "2rem" }} class="card"></div>
```

---

## Organizing Styles: `StyleSheet` utility

For complex components, writing many inline styles directly in the JSX can make the code hard to read. To solve this, we use a `StyleSheet` utility (inspired by React Native).

### Usage in `solid-lite`

Define your styles at the bottom of the file, outside the component function. This ensures the style objects are created only once when the module loads, rather than on every component execution.

```tsx
import { StyleSheet } from "@utils/style.ts";

export function MyComponent() {
  return <div style={styles.container}>...</div>;
}

const styles = StyleSheet.create({
  container: {
    display: "flex",
    marginTop: "2rem",
    textAlign: "left",
  },
});
```

### Key Differences

| Feature        | `solid-lite` StyleSheet                               | React Native StyleSheet       |
| :------------- | :---------------------------------------------------- | :---------------------------- |
| **Execution**  | Pure JS Object (Runtime)                              | Optimized ID / Native mapping |
| **Reactivity** | Requires `() => getter`                               | Static (needs re-render)      |
| **Access**     | Static (Module Scope)                                 | Static (Module Scope)         |
| **Naming**     | CamelCase (IntelliSense) or Kebab-case (runtime only) | CamelCase only                |

### When to use `.css` files instead

While `StyleSheet` is great for organizing layout-specific inline styles, you should still prefer **`.css` files** (and CSS Variables) for:

1. **Theming & Colors:** Use CSS Variables (`var(--primary-color)`) in your CSS. It's more performant and handles theme changes (Dark/Light mode) natively without JS overhead.
2. **Pseudo-classes:** `:hover`, `:active`, and `:focus` **only** work in CSS files or classes.
3. **Media Queries:** Responsiveness should always be handled in `.css` files via `@media`.
4. **Shared Design Systems:** Global styles and utility classes should live in the main CSS bundle for consistency and caching.

---

## CSS Architecture

The project currently uses three main CSS files to keep styling organized:

- **base.css:** A CSS reset/normalization layer. It ensures a consistent baseline across different browsers by resetting default margins, paddings, and setting `box-sizing: border-box`.
- **layout.css:** Focuses on the application's structural layout. It provides reusable utility classes for containers (`.container`), alignment, and viewport-wide positioning.
- **app.css:** The heart of the design system. It defines the color palette via CSS Variables (with native Dark Mode support), typography, and specific styles for components like buttons, cards, and forms.
