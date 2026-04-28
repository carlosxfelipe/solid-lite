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
import {
  batch,
  catchError,
  createComputed,
  createContext,
  createDeferred,
  createMemo,
  createReaction,
  createRenderEffect,
  createResource,
  createSelector,
  on,
  startTransition,
  untrack,
  useContext,
  useTransition,
} from "./solid.js";

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

Deno.test("Core Reactivity: on (explicit dependencies)", () => {
  let executions = 0;
  let setAExt: (v: number) => void = () => {};
  let setBExt: (v: number) => void = () => {};

  const dispose = createRoot((d) => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(2);
    setAExt = setA;
    setBExt = setB;

    createEffect(
      on(a, (_aVal: number) => {
        executions++;
        b(); // This shouldn't track since it's not in the dependencies!
      }),
    );

    return d;
  });

  assertEquals(executions, 1);
  setBExt(3); // Should not trigger
  assertEquals(executions, 1);
  setAExt(5); // Should trigger
  assertEquals(executions, 2);

  dispose();
});

Deno.test("Core Reactivity: catchError", () => {
  let errorCaught: Error | null = null;
  let setShouldThrowExt: (v: boolean) => void = () => {};

  const dispose = createRoot((d) => {
    const [shouldThrow, setShouldThrow] = createSignal(false);
    setShouldThrowExt = setShouldThrow;

    catchError(
      () => {
        createEffect(() => {
          if (shouldThrow()) {
            throw new Error("Test error!");
          }
        });
      },
      (err: unknown) => {
        errorCaught = err as Error;
      },
    );

    return d;
  });

  assertEquals(errorCaught, null);
  setShouldThrowExt(true);

  if (errorCaught === null) {
    throw new Error("errorCaught is null when it should have caught an error");
  }
  assertEquals((errorCaught as Error).message, "Test error!");

  dispose();
});

Deno.test("Core Reactivity: createSelector", () => {
  let effect1Fired = 0;
  let effect2Fired = 0;
  let setSelectedExt: (v: number) => void = () => {};

  const dispose = createRoot((d) => {
    const [selected, setSelected] = createSignal(1);
    setSelectedExt = setSelected;
    const isSelected = createSelector(selected);

    createEffect(() => {
      isSelected(1); // true initially
      effect1Fired++;
    });

    createEffect(() => {
      isSelected(2); // false initially
      effect2Fired++;
    });

    return d;
  });

  assertEquals(effect1Fired, 1);
  assertEquals(effect2Fired, 1);

  setSelectedExt(1); // Same value, should not trigger
  assertEquals(effect1Fired, 1);
  assertEquals(effect2Fired, 1);

  setSelectedExt(2); // Now 1 becomes false, 2 becomes true
  assertEquals(effect1Fired, 2);
  assertEquals(effect2Fired, 2);

  setSelectedExt(3); // Now 2 becomes false, 3 becomes true (but no one listens to 3)
  assertEquals(effect1Fired, 2);
  assertEquals(effect2Fired, 3); // effect2 fires because isSelected(2) changed from true to false!

  dispose();
});

Deno.test("Core Reactivity: createRenderEffect", () => {
  let executions = 0;
  let setAExt: (v: number) => void = () => {};

  const dispose = createRoot((d) => {
    const [a, setA] = createSignal(1);
    setAExt = setA;

    createRenderEffect(() => {
      a();
      executions++;
    });
    // createRenderEffect runs immediately (synchronously)
    assertEquals(executions, 1);
    return d;
  });

  setAExt(2);
  assertEquals(executions, 2);
  dispose();
});

Deno.test("Core Reactivity: createReaction", () => {
  let reactionFired = 0;
  let setAExt: (v: number) => void = () => {};

  const dispose = createRoot((d) => {
    const [a, setA] = createSignal(1);
    setAExt = setA;

    const track = createReaction(() => {
      reactionFired++;
    });

    // Manually track the signal
    track(() => {
      a();
    });

    return d;
  });

  assertEquals(reactionFired, 0); // Reaction body doesn't run initially

  setAExt(2);
  assertEquals(reactionFired, 1); // Reaction fires when dependency updates

  setAExt(3);
  assertEquals(reactionFired, 1); // Reaction only fires ONCE per track call!

  dispose();
});

Deno.test("Core Reactivity: startTransition & useTransition", async () => {
  let setAExt: (v: number) => void = () => {};
  let isPendingExt: () => boolean = () => false;

  const dispose = createRoot((d) => {
    const [a, setA] = createSignal(1);
    setAExt = setA;
    const [isPending] = useTransition();
    isPendingExt = isPending;

    createEffect(() => {
      a();
    });

    return d;
  });

  assertEquals(isPendingExt(), false);

  const transitionPromise = startTransition(() => {
    setAExt(2);
  });

  // Depending on whether scheduling is enabled, it may or may not be pending.
  // We just wait for it to complete.
  await transitionPromise;

  assertEquals(isPendingExt(), false);

  dispose();
});

Deno.test("Core Reactivity: createContext & useContext", () => {
  const MyContext = createContext(10);
  let valueExt = 0;

  createRoot((dispose) => {
    // Should be default value since there is no provider in the parent hierarchy
    assertEquals(useContext(MyContext), 10);

    // Provide the value to a child scope
    MyContext.Provider({
      value: 20,
      children: () => {
        valueExt = useContext(MyContext);
        return "";
      },
    });

    dispose();
  });

  assertEquals(valueExt, 20);
});

Deno.test({
  name: "Core Reactivity: createDeferred",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    let setAExt: (v: number) => void = () => {};
    let getDeferred: () => number = () => 0;

    const dispose = createRoot((d) => {
      const [a, setA] = createSignal(1);
      setAExt = setA;
      const deferredA = createDeferred(a, { timeoutMs: 50 });
      getDeferred = deferredA;

      assertEquals(deferredA(), 1);

      return d;
    });

    setAExt(2);
    // deferredA should still be 1 synchronously after setA
    assertEquals(getDeferred(), 1);

    // Wait for deferred to update
    await new Promise((r) => setTimeout(r, 100));

    assertEquals(getDeferred(), 2);

    dispose();
  },
});

Deno.test("Core Reactivity: createResource", async () => {
  let resolveResource: (v: string) => void = () => {};
  // deno-lint-ignore no-explicit-any
  let getData: any;

  const fetcher = (_id: string) =>
    new Promise<string>((resolve) => {
      resolveResource = resolve;
    });

  const dispose = createRoot((d) => {
    const [source] = createSignal("id-1");
    const [data] = createResource(source, fetcher);
    getData = data;

    assertEquals(getData(), undefined);
    assertEquals(getData.loading, true);

    return d;
  });

  resolveResource("Data 1");
  await new Promise((r) => setTimeout(r, 10)); // give it a moment

  assertEquals(getData(), "Data 1");
  assertEquals(getData.loading, false);

  dispose();
});
