import { assertEquals, assertNotEquals } from "@std/assert";
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
  cancelCallback,
  catchError,
  children,
  createComponent,
  createComputed,
  createContext,
  createDeferred,
  createMemo,
  createReaction,
  createRenderEffect,
  createResource,
  createSelector,
  createUniqueId,
  equalFn,
  ErrorBoundary,
  For,
  from,
  getListener,
  getOwner,
  Index,
  indexArray,
  mapArray,
  Match,
  mergeProps,
  observable,
  on,
  onError,
  onMount,
  requestCallback,
  runWithOwner,
  Show,
  splitProps,
  startTransition,
  Switch,
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

Deno.test("Core Reactivity: getOwner & runWithOwner", () => {
  // deno-lint-ignore no-explicit-any
  let owner1: any;
  // deno-lint-ignore no-explicit-any
  let owner2: any;
  let executed = false;

  createRoot((dispose) => {
    owner1 = getOwner();

    createRoot((disposeInner) => {
      owner2 = getOwner();
      disposeInner();
    });

    dispose();
  });

  assertNotEquals(owner1, owner2);
  assertNotEquals(owner1, null);

  runWithOwner(owner1, () => {
    executed = true;
    assertEquals(getOwner(), owner1);
  });

  assertEquals(executed, true);
});

Deno.test("Core Reactivity: mapArray", () => {
  let mappedExecutions = 0;
  const dispose = createRoot((d) => {
    const [list, setList] = createSignal([1, 2, 3]);

    const mapped = mapArray(list, (item: number) => {
      mappedExecutions++;
      return item * 2;
    });

    assertEquals(mapped(), [2, 4, 6]);
    assertEquals(mappedExecutions, 3);

    // Update list: 2 items stay, 1 removed, 1 added
    setList([1, 3, 4]);
    assertEquals(mapped(), [2, 6, 8]);

    // The mapper should only run for the newly added item (4)
    assertEquals(mappedExecutions, 4);

    return d;
  });
  dispose();
});

Deno.test("Core Reactivity: indexArray", () => {
  let mappedExecutions = 0;
  const dispose = createRoot((d) => {
    const [list, setList] = createSignal([1, 2, 3]);

    const mapped = indexArray(list, (item: () => number) => {
      mappedExecutions++;
      return () => item() * 2; // Return an accessor to reflect updates!
    });

    // Evaluate all inner accessors
    assertEquals(mapped().map((fn: () => number) => fn()), [2, 4, 6]);
    assertEquals(mappedExecutions, 3);

    // Update list: value at index 1 changes
    setList([1, 5, 3]);

    // The mapped array itself doesn't re-run the mapper for index 1,
    // but the inner accessor now returns the new doubled value.
    assertEquals(mapped().map((fn: () => number) => fn()), [2, 10, 6]);
    assertEquals(mappedExecutions, 3);

    return d;
  });
  dispose();
});

Deno.test("Core Reactivity: mergeProps", () => {
  const merged = mergeProps({ a: 1, b: 2 }, { b: 3, c: 4 });
  assertEquals(merged.a, 1);
  assertEquals(merged.b, 3); // latter overrides former
  // deno-lint-ignore no-explicit-any
  assertEquals((merged as any).c, 4);
});

Deno.test("Core Reactivity: splitProps", () => {
  const source = { a: 1, b: 2, c: 3, d: 4 };
  const [propsA, propsB, rest] = splitProps(source, ["a", "b"], ["c"]);

  assertEquals(propsA.a, 1);
  assertEquals(propsA.b, 2);
  // deno-lint-ignore no-explicit-any
  assertEquals((propsA as any).c, undefined);

  // deno-lint-ignore no-explicit-any
  assertEquals((propsB as any).c, 3);
  // deno-lint-ignore no-explicit-any
  assertEquals((propsB as any).a, undefined);

  // deno-lint-ignore no-explicit-any
  assertEquals((rest as any).d, 4);
  // deno-lint-ignore no-explicit-any
  assertEquals((rest as any).a, undefined);
});

Deno.test("Core Reactivity: onMount", () => {
  let mounted = 0;
  const dispose = createRoot((d) => {
    const [a, setA] = createSignal(1);

    onMount(() => {
      mounted++;
      a(); // accessing 'a' inside onMount should not track it because onMount untracks
    });

    setA(2);
    setA(3);

    return d;
  });

  assertEquals(mounted, 1); // Only runs once, didn't re-run when 'a' changed
  dispose();
});

Deno.test("Core Reactivity: createUniqueId", () => {
  let id1 = "";
  let id2 = "";
  const dispose = createRoot((d) => {
    id1 = createUniqueId();
    id2 = createUniqueId();
    return d;
  });

  assertNotEquals(id1, id2);
  assertNotEquals(id1, "");
  dispose();
});

Deno.test("Core Reactivity: children", () => {
  // deno-lint-ignore no-explicit-any
  let resolved: any;
  const dispose = createRoot((d) => {
    // children takes a getter that returns children
    const resolvedChildren = children(() => [1, 2, 3]);
    resolved = resolvedChildren();
    return d;
  });

  // Solid's children() returns the unwrapped array or elements
  // Depending on how it's structured, might be the array itself
  assertEquals(resolved, [1, 2, 3]);
  dispose();
});

Deno.test("Core Reactivity: createComponent", () => {
  const MyComp = (props: { msg: string }) => {
    return props.msg;
  };

  const result = createComponent(MyComp, { msg: "hello" });
  assertEquals(result, "hello");
});

Deno.test("Core Reactivity: getListener", () => {
  let hasListenerInsideEffect = false;
  let hasListenerOutside = false;

  const dispose = createRoot((d) => {
    hasListenerOutside = getListener() !== null;

    createEffect(() => {
      hasListenerInsideEffect = getListener() !== null;
    });
    return d;
  });

  assertEquals(hasListenerOutside, false);
  assertEquals(hasListenerInsideEffect, true);
  dispose();
});

Deno.test("Core Reactivity: equalFn", () => {
  assertEquals(equalFn(1, 1), true);
  assertEquals(equalFn(1, 2), false);
  const obj = {};
  assertEquals(equalFn(obj, obj), true);
  assertEquals(equalFn({}, {}), false);
});

Deno.test("Core Reactivity: Show", () => {
  const dispose = createRoot((d) => {
    const [show, setShow] = createSignal(true);
    const render = Show({
      get when() {
        return show();
      },
      get children() {
        return "Shown";
      },
      fallback: "Hidden",
    });

    assertEquals(render(), "Shown");

    setShow(false);
    assertEquals(render(), "Hidden");

    return d;
  });
  dispose();
});

Deno.test("Core Reactivity: Switch & Match", () => {
  const dispose = createRoot((d) => {
    const [val, setVal] = createSignal(1);

    const render = Switch({
      fallback: "Fallback",
      get children() {
        return [
          Match({
            get when() {
              return val() === 1;
            },
            get children() {
              return "One";
            },
          }),
          Match({
            get when() {
              return val() === 2;
            },
            get children() {
              return "Two";
            },
          }),
        ];
      },
    });

    assertEquals(render(), "One");

    setVal(2);
    assertEquals(render(), "Two");

    setVal(3);
    assertEquals(render(), "Fallback");

    return d;
  });
  dispose();
});

Deno.test("Core Reactivity: For", () => {
  const dispose = createRoot((d) => {
    const [list, setList] = createSignal([1, 2]);
    const render = For({
      get each() {
        return list();
      },
      children: (item: number) => item * 2,
      fallback: "Empty",
    });

    assertEquals(render(), [2, 4]);

    setList([]);
    assertEquals(render(), ["Empty"]);

    return d;
  });
  dispose();
});

Deno.test("Core Reactivity: Index", () => {
  const dispose = createRoot((d) => {
    const [list, setList] = createSignal([1, 2]);
    const render = Index({
      get each() {
        return list();
      },
      children: (item: () => number) => () => item() * 2,
      fallback: "Empty",
    });

    // deno-lint-ignore no-explicit-any
    const evaluate = (arr: any) =>
      Array.isArray(arr)
        ? arr.map((fn) => typeof fn === "function" ? fn() : fn)
        : arr;

    assertEquals(evaluate(render()), [2, 4]);

    setList([]);
    assertEquals(evaluate(render()), ["Empty"]);

    return d;
  });
  dispose();
});

Deno.test("Core Reactivity: ErrorBoundary", async () => {
  let result;
  let setShouldThrowExt: (v: boolean) => void = () => {};

  const dispose = createRoot((d) => {
    const [shouldThrow, setShouldThrow] = createSignal(false);
    setShouldThrowExt = setShouldThrow;

    const render = ErrorBoundary({
      get children() {
        if (shouldThrow()) throw new Error("Boom");
        return "Safe";
      },
      // deno-lint-ignore no-explicit-any
      fallback: (err: any) => err.message,
    });

    createEffect(() => {
      result = render();
    });

    return d;
  });

  assertEquals(result, "Safe");

  setShouldThrowExt(true);

  // Wait for the effect and error state to stabilize
  await new Promise((r) => setTimeout(r, 10));

  assertEquals(result, "Boom");

  dispose();
});

Deno.test("Core Reactivity: observable & from", async () => {
  let sub: { unsubscribe: () => void } = { unsubscribe: () => {} };
  let lastVal = -1;
  let setCountExt: (v: number) => void = () => {};
  let sigExt: () => number | undefined = () => undefined;
  const listeners = new Set<(v: number) => void>();

  const dispose = createRoot((d) => {
    const [count, setCount] = createSignal(0);
    setCountExt = setCount;
    const obs = observable(count);

    sub = obs.subscribe({
      next: (v: number) => lastVal = v,
    });

    const mockObs = {
      // deno-lint-ignore no-explicit-any
      subscribe(observer: any) {
        const next = typeof observer === "function" ? observer : observer.next;
        listeners.add(next);
        return {
          unsubscribe() {
            listeners.delete(next);
          },
        };
      },
    };

    // deno-lint-ignore no-explicit-any
    sigExt = from(mockObs as any);

    return d;
  });

  // observable uses createEffect, which runs async
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(lastVal, 0);

  setCountExt(1);
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(lastVal, 1);

  sub.unsubscribe();
  setCountExt(2);
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(lastVal, 1); // no longer tracks

  // test from
  assertEquals(sigExt(), undefined);
  listeners.forEach((fn) => fn(10));
  assertEquals(sigExt(), 10);

  dispose();
});

Deno.test("Core Reactivity: onError", () => {
  // deno-lint-ignore no-explicit-any
  let caughtError: any;
  const dispose = createRoot((d) => {
    // deno-lint-ignore no-explicit-any
    onError((err: any) => caughtError = err);

    // handleError is triggered by throwing inside a scheduled computation, like createRenderEffect
    createRenderEffect(() => {
      throw new Error("Oops");
    });

    return d;
  });

  assertEquals(caughtError?.message, "Oops");
  dispose();
});

Deno.test({
  name: "Core Reactivity: requestCallback & cancelCallback",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    let executed = false;

    const task = requestCallback(() => {
      executed = true;
    });

    cancelCallback(task);

    // Wait some time to ensure it wasn't executed
    await new Promise((r) => setTimeout(r, 50));
    assertEquals(executed, false);

    // Now test a successful callback
    let executed2 = false;
    requestCallback(() => {
      executed2 = true;
    });

    await new Promise((r) => setTimeout(r, 50));
    assertEquals(executed2, true);
  },
});
