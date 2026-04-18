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

## 3. Lists — `.map()` instead of `<For>`

**solid-lite**

```tsx
// Plain .map() — no fine-grained reactivity per item
{
  navItems.map((item) => <Link href={item.href}>{item.label}</Link>);
}
```

**SolidJS**

```tsx
// <For> with fine-grained reactivity — only recreates changed items
<For each={navItems()}>
  {(item) => <Link href={item.href}>{item.label}</Link>}
</For>;
```

In solid-lite, `.map()` works fine because `navItems` is a static array (not a
signal). If the list were reactive, `.map()` would recreate all elements on every
change — exactly like React, losing SolidJS's key advantage.

solid-lite does have a custom `<For>` in `index.ts` that accepts `each` as a getter
and performs keyed diffing, but its signature differs from the official `For`.

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

In SolidJS, `render` creates the reactive root internally. In solid-lite, `render`
is a simple function that only calls `container.appendChild(node)` — so an explicit
`createRoot` is needed to establish the reactive ownership context.

---

## 5. Style as an object

**solid-lite**

```tsx
// Accepts a static object or one with signal getters as values
<div style={{ display: "flex", color: someSignal }}>
```

**SolidJS**

```tsx
// Same syntax, but the Babel compiler transforms it into optimized setAttribute calls
<div style={{ display: "flex", color: someSignal() }}>
```

In solid-lite, `setAttr` in `index.ts` inspects each value in the object: if a
value is a zero-arity function, it creates a dedicated `createEffect` for that
single CSS property.

---

## Summary

| Aspect                 | solid-lite                       | SolidJS                    |
| ---------------------- | -------------------------------- | -------------------------- |
| Signal in JSX          | `{count}` (getter without `()`)  | `{count()}`                |
| `<Show when>`          | getter: `when={fn}`              | value: `when={fn()}`       |
| Reactive lists         | `.map()` (OK for static lists)   | `<For each={signal}>`      |
| Mount                  | separate `createRoot` + `render` | `render(() => ..., el)`    |
| Compiler               | none (pure runtime)              | Babel/Vite plugin required |
