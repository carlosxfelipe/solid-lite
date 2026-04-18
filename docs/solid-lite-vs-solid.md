# solid-lite vs SolidJS: Syntax Differences

This project uses the SolidJS reactive engine (`solid.js`) but with a custom JSX/DOM
runtime (`solid/index.ts`). Component code looks nearly identical to real SolidJS —
but there are important behavioral and syntax differences.

---

## 1. Reading a signal in JSX

**solid-lite**

```tsx
const [count, setCount] = createSignal(0);

// Pass the function directly — the runtime detects it and sets up reactivity
<div>{count}</div>;
```

**SolidJS**

```tsx
// Call the function with ()
<div>{count()}</div>;
```

In solid-lite, `isSignalGetter` in `index.ts` detects zero-arity functions and treats
them as reactive getters automatically. You can pass either `count` or `count()` —
both work, but passing `count` (without calling it) is more efficient because the
runtime wraps the getter in `createEffect`.

---

## 2. The `when` prop in `<Show>`

**solid-lite**

```tsx
// Accepts a getter function directly
<Show when={isUserValid} fallback={<NotFound />}>
  ...
</Show>

// Or an inline arrow function
<Show when={() => !anyMatch()}>
  ...
</Show>
```

**SolidJS**

```tsx
// Expects an already-evaluated value, not a getter
<Show when={isUserValid()} fallback={<NotFound />}>
  ...
</Show>;
```

In SolidJS, `when` receives the value. In solid-lite, `Show` receives `props.when`
as a getter and calls `!!props.when()` internally.

---

## 3. The `each` prop in `<For>`

**solid-lite**

```tsx
// Pass the getter function reference directly
<For each={items}>
  {(item, index) => <li>{index() + 1}: {item.title}</li>}
</For>;
```

**SolidJS**

```tsx
// Call the signal to pass the evaluated array
<For each={items()}>
  {(item, index) => <li>{index() + 1}: {item.title}</li>}
</For>;
```

In solid-lite, `<For>` now uses the same fine-grained logic as SolidJS. The
only syntax difference is that solid-lite expects `props.each` to be the getter
function itself, while SolidJS expects the evaluated value.

---

## 4. Initial mount (`main.tsx`)

**solid-lite**

```tsx
createRoot(() => {
  const root = document.getElementById("app")!;
  render(<App />, root);
});
```

**SolidJS**

```tsx
import { render } from "solid-js/web";

render(() => <App />, document.getElementById("app")!);
```

In SolidJS, `render` creates the reactive root internally. In solid-lite, an
explicit `createRoot` is needed to establish the reactive context for the app.

---

## 5. Style as an object

**solid-lite**

```tsx
// Supports signal getters nested inside the style object
<div style={{ color: someSignal }}>
```

**SolidJS**

```tsx
// The compiler transforms this; syntax requires calling the signal
<div style={{ color: someSignal() }}>
```

In solid-lite, `setAttr` creates a dedicated `createEffect` for each reactive
property found in the style object.

---

## Summary

| Aspect        | solid-lite                       | SolidJS                    |
| ------------- | -------------------------------- | -------------------------- |
| Signal in JSX | `{count}` (getter)               | `{count()}`                |
| `<Show when>` | getter: `when={fn}`              | value: `when={fn()}`       |
| `<For each>`  | getter: `each={fn}`              | value: `each={fn()}`       |
| Mount         | separate `createRoot` + `render` | `render(() => ..., el)`    |
| Style Object  | supports nested getters          | requires called signals    |
| Compiler      | none (pure runtime)              | Babel/Vite plugin required |
