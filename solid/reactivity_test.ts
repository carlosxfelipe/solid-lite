import { assertEquals } from "@std/assert";
import { createEffect, createRoot, createSignal, onCleanup } from "./index.ts";

Deno.test("Core Reactivity: createSignal", () => {
  createRoot((dispose) => {
    const [count, setCount] = createSignal(0);
    assertEquals(count(), 0);
    setCount(5);
    assertEquals(count(), 5);
    setCount((prev) => prev + 10);
    assertEquals(count(), 15);
    dispose();
  });
});

Deno.test("Core Reactivity: createEffect reacting to changes", () => {
  let effectInvocations = 0;
  let lastSeenName = "";
  let setNameExt: (v: string) => void = () => {};

  const disposeRoot = createRoot((dispose) => {
    const [name, setName] = createSignal("Alice");
    setNameExt = setName;

    createEffect(() => {
      effectInvocations++;
      lastSeenName = name();
    });

    return dispose;
  });

  // In SolidJS/SolidLite, Effects run immediately after the createRoot setup block finishes.
  assertEquals(effectInvocations, 1);
  assertEquals(lastSeenName, "Alice");

  // Mutation triggers reactivity
  setNameExt("Bob");
  // Assertion
  assertEquals(effectInvocations, 2);
  assertEquals(lastSeenName, "Bob");

  setNameExt("Bob"); // Same string should not trigger reactivity!
  assertEquals(effectInvocations, 2);

  disposeRoot();
});

Deno.test("Core Reactivity: Effect Batching", () => {
  let executions = 0;
  let setAExt: (v: number) => void = () => {};
  let setBExt: (v: number) => void = () => {};

  const disposeRoot = createRoot((dispose) => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(2);
    setAExt = setA;
    setBExt = setB;

    createEffect(() => {
      executions++;
      a() + b();
    });
    return dispose;
  });

  assertEquals(executions, 1);

  setAExt(10);
  assertEquals(executions, 2);

  setBExt(20);
  assertEquals(executions, 3);

  disposeRoot();
});

Deno.test("Core Reactivity: onCleanup lifecycle", () => {
  let cleanupsFired = 0;
  let setSignalExt: (v: number) => void = () => {};

  const disposeRoot = createRoot((dispose) => {
    const [count, setCount] = createSignal(0);
    setSignalExt = setCount;

    createEffect(() => {
      count();
      onCleanup(() => cleanupsFired++);
    });

    return dispose;
  });

  // When effect initially runs, onCleanup is registered but NOT executed.
  assertEquals(cleanupsFired, 0);

  // When state mutates, the old effect is destroyed (triggering cleanup) AND re-run.
  setSignalExt(1);
  assertEquals(cleanupsFired, 1);

  // When state mutates again, cleanup fires again.
  setSignalExt(2);
  assertEquals(cleanupsFired, 2);

  // Disposing the root completely eliminates active effects and fires final cleanup!
  disposeRoot();
  assertEquals(cleanupsFired, 3);
});

// Import additional reactivity tools directly from core for testing
import { batch, createComputed, createMemo, untrack } from "./solid.js";

Deno.test("Core Reactivity: createMemo", () => {
  createRoot((dispose) => {
    const [count, setCount] = createSignal(0);
    let memoExecutions = 0;

    const double = createMemo(() => {
      memoExecutions++;
      return count() * 2;
    });

    assertEquals(double(), 0);
    assertEquals(memoExecutions, 1);

    setCount(2);
    assertEquals(double(), 4);
    assertEquals(memoExecutions, 2);

    // Reading memo multiple times shouldn't trigger re-execution
    double();
    double();
    assertEquals(memoExecutions, 2);

    dispose();
  });
});

Deno.test("Core Reactivity: untrack", () => {
  let executions = 0;
  let setAExt: (v: number) => void = () => {};
  let setBExt: (v: number) => void = () => {};

  const dispose = createRoot((d) => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(2);
    setAExt = setA;
    setBExt = setB;

    createEffect(() => {
      executions++;
      a(); // tracked
      untrack(() => b()); // untracked
    });

    return d;
  });

  assertEquals(executions, 1);

  setAExt(5);
  assertEquals(executions, 2);

  setBExt(10); // should NOT trigger effect
  assertEquals(executions, 2);

  dispose();
});

Deno.test("Core Reactivity: batch", () => {
  let executions = 0;
  let setAExt: (v: number) => void = () => {};
  let setBExt: (v: number) => void = () => {};
  let aValue = 0;
  let bValue = 0;

  const dispose = createRoot((d) => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(2);
    setAExt = setA;
    setBExt = setB;

    createEffect(() => {
      executions++;
      aValue = a();
      bValue = b();
    });

    return d;
  });

  assertEquals(executions, 1);

  batch(() => {
    setAExt(10);
    setBExt(20);
  });

  // Batching should result in only one execution despite two signals changing
  assertEquals(executions, 2);
  assertEquals(aValue, 10);
  assertEquals(bValue, 20);

  dispose();
});

Deno.test("Core Reactivity: createComputed", () => {
  createRoot((dispose) => {
    const [count, setCount] = createSignal(0);
    let computedFired = 0;

    createComputed(() => {
      count();
      computedFired++;
    });

    assertEquals(computedFired, 1);
    setCount(1);
    assertEquals(computedFired, 2);

    dispose();
  });
});
