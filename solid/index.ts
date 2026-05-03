/**
 * @module
 * Solid Lite - A minimalist implementation of the SolidJS reactivity engine.
 *
 * This module provides fine-grained reactivity and a runtime JSX-like (HyperScript)
 * engine that works directly with the real DOM.
 */

import * as SolidCore from "./solid.js";
/**
 * Creates a new reactive root. Computations created inside a root are
 * automatically disposed when the root is disposed.
 *
 * @param fn The function to run inside the root.
 * @returns The value returned by the function.
 */
export const createRoot = SolidCore.createRoot as <T>(
  fn: (dispose: () => void) => T,
) => T;
/**
 * Brand symbol used to tag reactive accessors (signal/memo getters) so the
 * runtime can distinguish them from plain zero-arity functions without relying
 * on the brittle `fn.length === 0` heuristic.
 */
const SIGNAL = Symbol.for("solid-lite.signal");

/**
 * A reactive accessor: a getter function tagged with the SIGNAL symbol. Used
 * for type-level branding so signals/memos can be inferred separately from
 * regular functions.
 */
export type Accessor<T> = (() => T) & { readonly [SIGNAL]?: true };

function tagAccessor<T>(fn: () => T): Accessor<T> {
  (fn as unknown as { [k: symbol]: boolean })[SIGNAL] = true;
  return fn as Accessor<T>;
}

/**
 * Creates a reactive signal.
 *
 * The returned getter is tagged with an internal SIGNAL symbol so the DOM
 * runtime can detect it precisely (no aritygetters heuristics).
 *
 * @param value The initial value of the signal.
 * @param options Optional settings like a custom equality function.
 * @returns A tuple containing a getter and a setter.
 */
export const createSignal = (<T>(
  value: T,
  options?: { equals?: false | ((prev: T, next: T) => boolean) },
): [Accessor<T>, (v: T | ((prev: T) => T)) => T] => {
  const tuple = (
    SolidCore.createSignal as (
      v: T,
      o?: typeof options,
    ) => [() => T, (v: T | ((prev: T) => T)) => T]
  )(value, options);
  return [tagAccessor(tuple[0]), tuple[1]];
}) as <T>(
  value: T,
  options?: { equals?: false | ((prev: T, next: T) => boolean) },
) => [Accessor<T>, (v: T | ((prev: T) => T)) => T];

/**
 * Creates a reactive effect that runs when its dependencies change.
 *
 * @param fn The function to run as an effect.
 * @param value Initial value passed to the function on first run.
 */
export const createEffect = SolidCore.createEffect as <T>(
  fn: (v?: T) => T,
  value?: T,
) => void;

/**
 * Creates a memoized reactive computation. The returned getter is tagged with
 * the SIGNAL symbol so it is treated as reactive in JSX props.
 *
 * @param fn The computation function.
 * @returns A reactive accessor for the computed value.
 */
export const createMemo = (<T>(fn: () => T): Accessor<T> => {
  const m = (SolidCore.createMemo as unknown as (f: () => T) => () => T)(fn);
  return tagAccessor(m);
}) as <T>(fn: () => T) => Accessor<T>;

/**
 * Registers a cleanup function that runs when the current scope is disposed.
 *
 * @param fn The cleanup function.
 */
export const onCleanup = SolidCore.onCleanup as (fn: () => void) => void;

const DISPOSE = Symbol("d");

const HANDLERS = Symbol("h");
type HandlerMap = Record<string, EventListener>;
type NodeWithHandlers = Node & { [HANDLERS]?: HandlerMap };

const delegatedEvents = new Set<string>();

function delegateEvent(
  el: Element,
  eventName: string,
  handler: EventListener,
): void {
  const node = el as NodeWithHandlers;
  if (!node[HANDLERS]) node[HANDLERS] = {};
  node[HANDLERS]![eventName] = handler;

  if (!delegatedEvents.has(eventName)) {
    delegatedEvents.add(eventName);
    document.addEventListener(eventName, (e: Event) => {
      let target = e.target as NodeWithHandlers | null;
      while (target && target !== (document as unknown as NodeWithHandlers)) {
        const h = target[HANDLERS]?.[eventName];
        if (h) {
          h.call(target, e);
          if ((e as Event & { cancelBubble?: boolean }).cancelBubble) break;
        }
        target = (target as Node).parentNode as NodeWithHandlers | null;
      }
    });
  }
}

function undelegateEvent(el: Element, eventName: string): void {
  const node = el as NodeWithHandlers;
  if (node[HANDLERS]) delete node[HANDLERS]![eventName];
}

type Cleanup = () => void;
type NodeWithDispose = Node & { [DISPOSE]?: Cleanup };
type RefObject<T extends Element = Element> = { current: T | null };
type Ref<T extends Element = Element> = ((el: T | null) => void) | RefObject<T>;
type InnerHTML = { __html: string };

function isRefObject(x: unknown): x is RefObject<Element> {
  return !!x && typeof x === "object" && "current" in (x as object);
}

function isInnerHTML(x: unknown): x is InnerHTML {
  return !!x && typeof x === "object" && "__html" in (x as object);
}

/**
 * Represents a valid child node that can be rendered.
 */
export type Child =
  | Node
  | string
  | number
  | boolean
  | null
  | undefined
  | (() => unknown)
  | Array<Child>;

type Key = string | number;
type Renderer<T> = (item: T, index: () => number) => Child;

type MatchNode = {
  condition: () => boolean;
  children: Child;
  __isMatch: true;
};

/**
 * Detects a function used in any reactive JSX position (prop value or child).
 *
 * Solid Lite treats any function as a reactive thunk that will be wrapped in a
 * `createEffect` and re-evaluated when its tracked dependencies change — this
 * mirrors the post-compilation runtime behavior of SolidJS, where every dynamic
 * JSX expression becomes a thunk. Event handlers (`onXxx`) bypass this path
 * because they are dispatched by name before the generic check runs.
 *
 * Functions originating from `createSignal` and `createMemo` are additionally
 * branded as {@link Accessor} for type-level guarantees, but the runtime check
 * intentionally accepts any callable for ergonomic inline reactivity.
 */
function isSignalGetter<T = unknown>(x: unknown): x is () => T {
  return typeof x === "function";
}

const isChildThunk = isSignalGetter;

type StyleScalar = string | number | null | undefined;
type StyleObject = Record<string, StyleScalar>;

const CAMEL_TO_KEBAB = /[A-Z]/g;

function camelToKebab(k: string) {
  return k.startsWith("--")
    ? k
    : k.replace(CAMEL_TO_KEBAB, (m) => "-" + m.toLowerCase());
}

function normalizeStyle(
  input: string | StyleObject | null | undefined,
): Record<string, string> {
  if (!input) return {};
  if (typeof input === "string") {
    const out: Record<string, string> = {};
    for (const decl of input.split(";")) {
      const i = decl.indexOf(":");
      if (i === -1) continue;
      const key = decl.slice(0, i).trim();
      const val = decl.slice(i + 1).trim();
      if (key) out[key] = val;
    }
    return out;
  }
  const out: Record<string, string> = {};
  for (const k in input) {
    const v = input[k];
    out[camelToKebab(k)] = v == null
      ? ""
      : typeof v === "number"
      ? String(v)
      : String(v);
  }
  return out;
}

const PREV_STYLES = new WeakMap<HTMLElement, Record<string, string>>();
const DYN_STYLE_KEYS = new WeakMap<HTMLElement, Set<string>>();

function applyStyle(el: HTMLElement, next: Record<string, string>) {
  const prev = PREV_STYLES.get(el) || {};
  const dyn = DYN_STYLE_KEYS.get(el) || new Set<string>();
  for (const k in prev) {
    if (!(k in next) && !dyn.has(k)) el.style.removeProperty(k);
  }
  for (const k in next) {
    const nv = next[k] ?? "";
    if (prev[k] !== nv) el.style.setProperty(k, String(nv));
  }
  PREV_STYLES.set(el, next);
}

function setAttr(el: Element, name: string, value: unknown) {
  if (name === "className") name = "class";

  if (name === "dangerouslySetInnerHTML" && isInnerHTML(value)) {
    const rawHtml = value.__html == null ? "" : String(value.__html);

    // Sanitize HTML securely using DOMParser (native browser API)
    const doc = new DOMParser().parseFromString(rawHtml, "text/html");

    // Strip scripts
    const scripts = doc.querySelectorAll("script");
    for (let i = 0; i < scripts.length; i++) {
      scripts[i].parentNode?.removeChild(scripts[i]);
    }

    // Strip malicious inline events and links
    const all = doc.querySelectorAll("*");
    for (let i = 0; i < all.length; i++) {
      const node = all[i];
      for (let j = node.attributes.length - 1; j >= 0; j--) {
        const attr = node.attributes[j];
        if (attr.name.toLowerCase().startsWith("on")) {
          node.removeAttribute(attr.name);
        }
        if (
          attr.name.toLowerCase() === "href" ||
          attr.name.toLowerCase() === "src"
        ) {
          const val = attr.value.trim().toLowerCase();
          if (
            val.startsWith("javascript:") ||
            val.startsWith("data:") ||
            val.startsWith("vbscript:")
          ) {
            node.setAttribute(attr.name, "about:blank");
          }
        }
      }
    }

    (el as HTMLElement).innerHTML = doc.body.innerHTML;
    return;
  }

  if (name === "ref") {
    const r = value as Ref<Element>;
    if (typeof r === "function") {
      r(el);
      onCleanup(() => r(null));
    } else if (isRefObject(r)) {
      r.current = el;
      onCleanup(() => {
        r.current = null;
      });
    }
    return;
  }

  if (name === "style") {
    const elh = el as HTMLElement;

    if (isSignalGetter(value)) {
      createEffect(() => {
        const v = (value as () => unknown)();
        applyStyle(elh, normalizeStyle(v as string | StyleObject));
      });
      return;
    }

    if (typeof value === "string") {
      applyStyle(elh, normalizeStyle(value));
      return;
    }

    if (typeof value === "object" && value !== null) {
      const obj = value as Record<string, unknown>;
      const dyn = DYN_STYLE_KEYS.get(elh) || new Set<string>();
      DYN_STYLE_KEYS.set(elh, dyn);

      const staticObj: Record<string, StyleScalar> = {};
      for (const k in obj) {
        const v = obj[k] as unknown;
        if (isSignalGetter(v)) {
          const name = camelToKebab(k);
          dyn.add(name);
          createEffect(() => {
            const nv = (v as () => unknown)();
            if (nv == null) elh.style.removeProperty(name);
            else elh.style.setProperty(name, String(nv));
          });
        } else {
          staticObj[k] = v as StyleScalar;
        }
      }
      applyStyle(elh, normalizeStyle(staticObj));
      return;
    }
  }

  if (/^on[A-Z]/.test(name) && typeof value === "function") {
    const ev = name.slice(2).toLowerCase();
    const handler = value as EventListener;
    delegateEvent(el, ev, handler);
    onCleanup(() => undelegateEvent(el, ev));
    return;
  }

  if (name === "value") {
    if (
      el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement
    ) {
      if (isSignalGetter(value)) {
        createEffect(() => {
          const v = (value as () => unknown)();
          el.value = v == null ? "" : String(v);
        });
      } else {
        el.value = value == null ? "" : String(value);
      }
      return;
    }
  }

  if (name === "checked" && el instanceof HTMLInputElement) {
    if (isSignalGetter(value)) {
      createEffect(() => {
        el.checked = Boolean((value as () => unknown)());
      });
    } else {
      el.checked = Boolean(value);
    }
    return;
  }

  if (typeof value === "boolean") {
    if (value) el.setAttribute(name, "");
    else el.removeAttribute(name);
    return;
  }

  if (isSignalGetter(value)) {
    createEffect(() => {
      const v = (value as () => unknown)();
      if (v == null || v === false) el.removeAttribute(name);
      else el.setAttribute(name, v === true ? "" : String(v));
    });
  } else {
    if (value == null || value === false) el.removeAttribute(name);
    else el.setAttribute(name, value === true ? "" : String(value));
  }
}

function normalizeToNodes(value: unknown): Node[] {
  if (value == null || value === false || value === true) return [];
  if (value instanceof Node) return [value];
  if (typeof value === "function") return normalizeToNodes(value());
  if (Array.isArray(value)) {
    const out: Node[] = [];
    for (const v of (value as unknown[]).flat()) {
      out.push(...normalizeToNodes(v));
    }
    return out;
  }
  return [document.createTextNode(String(value))];
}

function disposeNode(n: Node) {
  const d = (n as NodeWithDispose)[DISPOSE];
  if (d) {
    try {
      d();
    } catch {
      // ignore
    }
  }
}

function clearRange(start: Comment, end: Comment) {
  let n = start.nextSibling;
  while (n && n !== end) {
    const next = n.nextSibling;
    disposeNode(n);
    n.parentNode?.removeChild(n);
    n = next;
  }
}

function insertNodesAfter(ref: Node, nodes: Node[]) {
  let cursor: Node | null = ref;
  for (const n of nodes) {
    if (cursor.nextSibling) ref.parentNode!.insertBefore(n, cursor.nextSibling);
    else ref.parentNode!.appendChild(n);
    cursor = n;
  }
}

function insertNodes(nodes: Node[], before: Node): void {
  if (nodes.length === 0) return;
  const parent = before.parentNode!;
  if (nodes.length === 1) {
    parent.insertBefore(nodes[0], before);
    return;
  }
  const f = document.createDocumentFragment();
  for (const n of nodes) f.appendChild(n);
  parent.insertBefore(f, before);
}

function appendDynamic(parent: Node, getter: () => unknown) {
  const start = document.createComment("");
  const end = document.createComment("");
  parent.appendChild(start);
  parent.appendChild(end);
  createEffect(() => {
    const v = getter();
    const nodes = normalizeToNodes(v);
    clearRange(start, end);
    insertNodesAfter(start, nodes);
  });
}

function appendStatic(parent: Node, child: Exclude<Child, () => unknown>) {
  if (child == null || child === false || child === true) return;
  if (Array.isArray(child)) {
    for (const c of child) {
      appendStatic(parent, c as Exclude<Child, () => unknown>);
    }
    return;
  }
  if (child instanceof Node) {
    parent.appendChild(child);
  } else {
    parent.appendChild(document.createTextNode(String(child)));
  }
}

type Component<P = Record<string, unknown>> = (
  props: P & { children?: Child[] },
) => Node;

const SVG_NS = "http://www.w3.org/2000/svg";
const SVG_TAGS = new Set([
  "svg",
  "path",
  "g",
  "defs",
  "clipPath",
  "mask",
  "pattern",
  "linearGradient",
  "radialGradient",
  "stop",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "rect",
  "use",
  "symbol",
  "marker",
  "text",
  "tspan",
  "textPath",
  "foreignObject",
  "filter",
  "feGaussianBlur",
  "feOffset",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "title",
  "desc",
]);

/**
 * The HyperScript function for creating DOM nodes or components.
 *
 * @param tag The tag name (string) or a Component function.
 * @param props The attributes or props for the element/component.
 * @param children The children nodes/elements.
 * @returns A DOM Node.
 */
export function h(
  tag: string | Component<Record<string, unknown>>,
  props: Record<string, unknown> | null | undefined,
  ...children: Child[]
): Node {
  if (typeof tag === "function") {
    let dispose: Cleanup = () => {};
    const node = createRoot((d: Cleanup) => {
      dispose = d;
      return (tag as Component<Record<string, unknown>>)({
        ...(props || {}),
        children,
      });
    }) as Node;
    if (node) (node as NodeWithDispose)[DISPOSE] = dispose;
    return node;
  }

  const isSvg = SVG_TAGS.has(tag as string);
  const el = isSvg
    ? document.createElementNS(SVG_NS, tag as string)
    : document.createElement(tag as string);

  if (props) {
    for (const [k, v] of Object.entries(props)) setAttr(el, k, v);
  }

  for (const c of children.flat()) {
    if (isChildThunk(c)) appendDynamic(el, c);
    else appendStatic(el, c as Exclude<Child, () => unknown>);
  }

  return el;
}

/**
 * A virtual component that groups multiple children without adding a parent DOM node.
 */
export function Fragment(props: { children?: Child[] } = {}, ...kids: Child[]) {
  const list = (props.children ?? kids) as Child[];
  const f = document.createDocumentFragment();
  for (const k of (list ?? []).flat()) {
    if (isChildThunk(k)) appendDynamic(f, k);
    else appendStatic(f, k as Exclude<Child, () => unknown>);
  }
  return f;
}

/**
 * Renders a Node into a container, clearing the container's previous content.
 *
 * @param node The node to render.
 * @param container The DOM element to render into.
 */
export function render(node: Node, container: Element) {
  container.textContent = "";
  container.appendChild(node);
}

/**
 * A component for conditional rendering.
 *
 * @param props.when A function that returns a truthy value to show children.
 * @param props.children The content to show when true.
 * @param props.fallback The content to show when false.
 */
export function Show(props: {
  when: () => unknown;
  children: Child;
  fallback?: Child;
}) {
  const start = document.createComment("show-start");
  const end = document.createComment("show-end");
  const frag = document.createDocumentFragment();
  frag.appendChild(start);
  frag.appendChild(end);
  createEffect(() => {
    const next = !!props.when();
    clearRange(start, end);
    const content = next ? props.children : props.fallback;
    const contentToRender = typeof content === "function" ? content() : content;
    if (contentToRender && end.parentNode) {
      insertNodes(normalizeToNodes(contentToRender), end);
    }
  });
  return frag;
}

type IndexBlock = { start: Comment; end: Comment };

/**
 * A component for rendering lists with efficient DOM reuse.
 *
 * @param props.each A function that returns an array to iterate over.
 * @param props.key An optional function to provide a unique key for each item.
 * @param props.children A renderer function that receives the item and an index signal.
 */
export function For<T>(props: {
  each: () => T[];
  key?: (item: T) => Key;
  children?: Renderer<T> | unknown[];
}) {
  const start = document.createComment("for-start");
  const end = document.createComment("for-end");
  const frag = document.createDocumentFragment();
  frag.appendChild(start);
  frag.appendChild(end);

  const renderFn = typeof props.children === "function"
    ? (props.children as Renderer<T>)
    : Array.isArray(props.children) && typeof props.children[0] === "function"
    ? (props.children[0] as Renderer<T>)
    : undefined;

  if (!renderFn) return frag;

  const cache = new Map<
    Key,
    {
      nodes: Node[];
      dispose: () => void;
      setIndex: (i: number) => void;
    }
  >();

  createEffect(() => {
    const list = props.each() || [];
    const keyFn = props.key || ((item: T) => item as unknown as Key);
    const parent = end.parentNode;
    if (!parent) return;

    const newKeys = list.map(keyFn);
    const newKeySet = new Set(newKeys);

    for (const [key, cached] of cache.entries()) {
      if (!newKeySet.has(key)) {
        cached.dispose();
        cached.nodes.forEach((n) => {
          disposeNode(n);
          n.parentNode?.removeChild(n);
        });
        cache.delete(key);
      }
    }

    let cursor: Node = start;
    newKeys.forEach((key, i) => {
      const item = list[i];
      let cached = cache.get(key);

      if (!cached) {
        let setIndex: (i: number) => void = () => {};
        let dispose: () => void = () => {};

        const nodes = createRoot((d: Cleanup) => {
          dispose = d;
          const [index, _setIndex] = createSignal(i);
          setIndex = _setIndex;
          return normalizeToNodes(renderFn(item, index));
        }) as Node[];

        cached = { nodes, dispose, setIndex };
        cache.set(key, cached);
      } else {
        cached.setIndex(i);
      }

      const firstNode = cached.nodes[0];
      if (firstNode && firstNode.previousSibling !== cursor) {
        const next = cursor.nextSibling;
        cached.nodes.forEach((n) => {
          if (next) parent.insertBefore(n, next);
          else parent.appendChild(n);
        });
      }

      if (cached.nodes.length > 0) {
        cursor = cached.nodes[cached.nodes.length - 1];
      }
    });
  });

  return frag;
}

/**
 * A component for rendering the first Match that satisfies its condition.
 */
export function Switch(props: { children: Child[]; fallback?: Child }) {
  const start = document.createComment("switch-start");
  const end = document.createComment("switch-end");
  const frag = document.createDocumentFragment();
  frag.appendChild(start);
  frag.appendChild(end);
  createEffect(() => {
    clearRange(start, end);
    let matched = false;
    for (const child of props.children) {
      const matchNode = child as unknown as MatchNode;
      if (matchNode?.__isMatch) {
        if (matchNode.condition()) {
          insertNodes(normalizeToNodes(matchNode.children), end);
          matched = true;
          break;
        }
      }
    }
    if (!matched && props.fallback) {
      insertNodes(normalizeToNodes(props.fallback), end);
    }
  });
  return frag;
}

/**
 * A child component for Switch that specifies a condition and its content.
 */
export function Match(props: { when: () => unknown; children: Child }) {
  return {
    condition: () => !!props.when(),
    children: props.children,
    __isMatch: true,
  };
}
