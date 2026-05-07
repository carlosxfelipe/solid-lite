import { Accessor, createEffect, onCleanup } from "./index.ts";

export interface PersistenceOptions<T> {
  /** The key to use in the storage */
  name: string;
  /** The storage object to use. Defaults to localStorage */
  storage?: Storage;
  /** Function to serialize the value. Defaults to JSON.stringify */
  serialize?: (value: T) => string;
  /** Function to deserialize the value. Defaults to JSON.parse */
  deserialize?: (value: string) => T;
  /** If true, it will listen to storage events to sync across tabs. Defaults to true */
  sync?: boolean;
}

/**
 * Persists a signal or store to a storage API (like localStorage).
 *
 * @param signal The signal tuple to persist: [getter, setter]
 * @param options Configuration for persistence
 * @returns The same signal tuple
 *
 * @example
 * const [count, setCount] = makePersisted(createSignal(0), { name: "counter" });
 */
export function makePersisted<T>(
  signal: [Accessor<T>, (v: T | ((prev: T) => T)) => T],
  options: PersistenceOptions<T>,
): [Accessor<T>, (v: T | ((prev: T) => T)) => T] {
  const {
    name,
    storage = localStorage,
    serialize = (v: T) => JSON.stringify(v),
    deserialize = (v: string) => JSON.parse(v) as T,
    sync = true,
  } = options;

  const [getter, setter] = signal;

  // 1. Initial Load
  const storedValue = storage.getItem(name);
  if (storedValue !== null) {
    try {
      setter(() => deserialize(storedValue));
    } catch (err) {
      console.warn(`[makePersisted] Failed to deserialize "${name}":`, err);
    }
  }

  // 2. Save on changes
  createEffect(() => {
    try {
      const value = getter();
      storage.setItem(name, serialize(value));
    } catch (err) {
      console.error(`[makePersisted] Failed to save "${name}":`, err);
    }
  });

  // 3. Optional: Sync across tabs
  if (sync && typeof window !== "undefined" && storage === localStorage) {
    const onStorage = (e: StorageEvent) => {
      if (e.key === name && e.newValue !== null && e.storageArea === storage) {
        try {
          setter(() => deserialize(e.newValue!));
        } catch (err) {
          console.warn(`[makePersisted] Failed to sync "${name}":`, err);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    onCleanup(() => window.removeEventListener("storage", onStorage));
  }

  return signal;
}
