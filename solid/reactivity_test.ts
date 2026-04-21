import { assertEquals } from "jsr:@std/assert@^1.0.19";
import { createSignal, createEffect, createRoot, onCleanup } from "./index.ts";

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
      setAExt = setA; setBExt = setB;
  
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
