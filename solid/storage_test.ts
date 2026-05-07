import { assertEquals } from "@std/assert";
import { createRoot, createSignal } from "./index.ts";
import { makePersisted } from "./storage.ts";

// Mock localStorage
const mockStorage = {
  data: {} as Record<string, string>,
  getItem(key: string) {
    return this.data[key] || null;
  },
  setItem(key: string, value: string) {
    this.data[key] = value;
  },
  removeItem(key: string) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  },
  key(_index: number) {
    return null;
  },
  get length() {
    return Object.keys(this.data).length;
  },
} as Storage;

Deno.test("makePersisted: should initialize from storage", () => {
  mockStorage.setItem("test-key", JSON.stringify(42));

  createRoot(() => {
    const [count] = makePersisted(createSignal(0), {
      name: "test-key",
      storage: mockStorage,
    });

    assertEquals(count(), 42);
  });

  mockStorage.clear();
});

Deno.test("makePersisted: should save to storage on change", () => {
  createRoot(() => {
    const [count, setCount] = makePersisted(createSignal(10), {
      name: "save-key",
      storage: mockStorage,
    });

    setCount(20);
    assertEquals(count(), 20);
  });

  // Now it should be saved
  assertEquals(mockStorage.getItem("save-key"), JSON.stringify(20));
  mockStorage.clear();
});

Deno.test("makePersisted: should work with custom serialize/deserialize", () => {
  createRoot(() => {
    const [count, setCount] = makePersisted(createSignal(10), {
      name: "custom-key",
      storage: mockStorage,
      serialize: (v) => (v * 2).toString(),
      deserialize: (v) => parseInt(v) / 2,
    });

    setCount(30);
  });

  assertEquals(mockStorage.getItem("custom-key"), "60");
  mockStorage.clear();
});
