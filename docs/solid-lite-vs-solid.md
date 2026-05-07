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

> ⚠️ **Do not use the SolidJS syntax `{count()}` directly in solid-lite — you
> will lose reactivity.**

**Why:** SolidJS relies on a compiler (Babel/Vite plugin) that rewrites
`{count()}` into a thunk before the runtime ever sees it. Solid-lite has no
compile step — what you write is what runs. So `{count()}` evaluates the
signal **immediately** in plain JavaScript, and only the resulting value (e.g.
`0`) is handed to the runtime. There is nothing left to track, and the DOM
node freezes at the initial value.

**The rule:** in solid-lite, the runtime tracks **functions**, not values. Pass
the getter directly, or wrap derived expressions in a thunk:

```tsx
const [count, setCount] = createSignal(0);

<div>{count}</div>; // ✅ getter passed → reactive
<div>{() => `count is ${count()}`}</div>; // ✅ thunk → reactive
<div>{count()}</div>; // ❌ value passed → frozen at 0
```

`createSignal` and `createMemo` getters are additionally branded with the
`Accessor<T>` type for compile-time guarantees. Event handlers (`onClick`,
`onInput`, etc.) bypass this rule because they are dispatched by name.

### Cases where solid-lite requires an extra thunk

**SolidJS (with compiler)** can make any expression inside `{...}` reactive:

```tsx
<div>{count() * 2}</div>
<div>{count() > 5 ? "big" : "small"}</div>
<div>{`Total: ${count()}`}</div>
<p>{a() + b()}</p>
```

**solid-lite** requires an explicit arrow function:

```tsx
<div>{() => count() * 2}</div>
<div>{() => count() > 5 ? "big" : "small"}</div>
<div>{() => `Total: ${count()}`}</div>
<p>{() => a() + b()}</p>
```

Functionally equivalent. Cost: **3 extra characters** (`() =>`) per derived
expression. Reactivity is identical.

> **Idiomatic alternative:** use `createMemo` for frequently derived values,
> exactly as in SolidJS — usage becomes `{doubled}` (no `()`).

### The `derived` helper (solid-lite extension)

solid-lite ships an optional `derived` helper that brands an inline thunk as
an `Accessor<T>`. It is a zero-cost wrapper — equivalent in runtime behavior
to a plain `() => ...` thunk — but more self-documenting and friendlier to
type inference:

```tsx
import { derived } from "@solid/index.ts";

<div>{derived(() => count() * 2)}</div>
<Show when={derived(() => count() > 5)}>...</Show>
```

Use `derived` for **cheap, one-off** inline expressions and `createMemo` for
**cached, reused** derivations.

> ⚠️ `derived` does **not** exist in SolidJS. It is a solid-lite extension to
> make the explicit-thunk pattern more ergonomic. Code that needs to remain
> portable to SolidJS should stick with `createMemo` or plain `() => ...`.

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

In solid-lite, `<For>` is key-based (it reuses DOM nodes by their stable key)
but uses a simpler reorder algorithm than SolidJS — there is no Longest
Increasing Subsequence optimization, so heavy reorderings may perform slightly
more `insertBefore` calls. The syntax difference is that solid-lite expects
`props.each` to be the getter function itself, while SolidJS expects the
evaluated value.

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

## 6. Persistence: `makePersisted`

**solid-lite**

`makePersisted` is built directly into the core package. It allows easy
persistence of signals to `localStorage` or other storage APIs.

```tsx
import { createSignal, makePersisted } from "@solid/index.ts";

const [count, setCount] = makePersisted(createSignal(0), { name: "counter" });
```

**SolidJS**

SolidJS core does **not** include persistence. It is provided by the official
ecosystem via the `@solid-primitives/storage` package.

```tsx
import { createSignal } from "solid-js";
import { makePersisted } from "@solid-primitives/storage";

const [count, setCount] = makePersisted(createSignal(0), { name: "counter" });
```

In **solid-lite**, we've integrated this primitive directly to provide a
"batteries-included" experience for minimalist web apps.

---

## Summary

| Aspect          | solid-lite                       | SolidJS                              |
| --------------- | -------------------------------- | ------------------------------------ |
| Signal in JSX   | `{count}` (getter)               | `{count()}`                          |
| `<Show when>`   | getter: `when={fn}`              | value: `when={fn()}`                 |
| `<For each>`    | getter: `each={fn}`              | value: `each={fn()}`                 |
| Mount           | separate `createRoot` + `render` | `render(() => ..., el)`              |
| Style Object    | supports nested getters          | requires called signals              |
| `makePersisted` | **Built-in**                     | Requires `@solid-primitives/storage` |
| Compiler        | none (pure runtime)              | Babel/Vite plugin required           |
