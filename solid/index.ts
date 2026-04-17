export * from "./solid.js";
import { createEffect, createRoot, onCleanup } from "./solid.js";

const DISPOSE = Symbol("d");

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

function isSignalGetter<T = unknown>(x: unknown): x is () => T {
  return (
    typeof x === "function" &&
    (x as (...args: unknown[]) => unknown).length === 0
  );
}

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
    const html = value.__html;
    (el as HTMLElement).innerHTML = html == null ? "" : String(html);
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
    el.addEventListener(ev, handler);
    onCleanup(() => el.removeEventListener(ev, handler));
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
    (node as NodeWithDispose)[DISPOSE] = dispose;
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
    if (isSignalGetter(c)) appendDynamic(el, c as () => unknown);
    else appendStatic(el, c as Exclude<Child, () => unknown>);
  }

  return el;
}

export function Fragment(props: { children?: Child[] } = {}, ...kids: Child[]) {
  const list = (props.children ?? kids) as Child[];
  const f = document.createDocumentFragment();
  for (const k of (list ?? []).flat()) {
    if (isSignalGetter(k)) appendDynamic(f, k as () => unknown);
    else appendStatic(f, k as Exclude<Child, () => unknown>);
  }
  return f;
}

export function render(node: Node, container: Element) {
  container.textContent = "";
  container.appendChild(node);
}

export function Show(props: { when: () => unknown; children: Child }) {
  const start = document.createComment("show-start");
  const end = document.createComment("show-end");
  const frag = document.createDocumentFragment();
  frag.appendChild(start);
  frag.appendChild(end);
  let prev = false;
  createEffect(() => {
    const next = !!props.when();
    if (next === prev) return;
    prev = next;
    clearRange(start, end);
    if (next) {
      const nodes = normalizeToNodes(props.children);
      const f = document.createDocumentFragment();
      for (const n of nodes) f.appendChild(n);
      end.parentNode!.insertBefore(f, end);
    }
  });
  return frag;
}

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
  const blocks = new Map<
    Key,
    { start: Comment; end: Comment; index: () => number }
  >();
  let prevList: T[] | undefined;
  const idxMap = new Map<Key, number>();

  createEffect(() => {
    const render = typeof props.children === "function"
      ? props.children as Renderer<T>
      : (Array.isArray(props.children) &&
          typeof props.children[0] === "function"
        ? props.children[0] as Renderer<T>
        : undefined);
    if (!render) return;
    const list = props.each();
    const kf = props.key;
    if (!kf) {
      if (
        prevList && prevList.length === list.length &&
        list.every((it, i) => it === (prevList as T[])[i])
      ) return;
      clearRange(start, end);
      const f = document.createDocumentFragment();
      list.forEach((item, i) => {
        const nodes = normalizeToNodes(render(item, () => i));
        for (const n of nodes) f.appendChild(n);
      });
      end.parentNode!.insertBefore(f, end);
      prevList = list.slice();
      return;
    }
    const nextOrder = list.map(kf);
    idxMap.clear();
    nextOrder.forEach((k, i) => idxMap.set(k, i));
    let cursor: Node = start;
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const k = nextOrder[i];
      let blk = blocks.get(k);
      if (!blk) {
        const s = document.createComment(`for-item-start:${String(k)}`);
        const e = document.createComment(`for-item-end:${String(k)}`);
        const indexGetter = (): number => idxMap.get(k) ?? 0;
        const f = document.createDocumentFragment();
        f.appendChild(s);
        const nodes = normalizeToNodes(render(item, indexGetter));
        for (const n of nodes) f.appendChild(n);
        f.appendChild(e);
        const after = cursor.nextSibling;
        if (after) start.parentNode!.insertBefore(f, after);
        else start.parentNode!.appendChild(f);
        blk = { start: s, end: e, index: indexGetter };
        blocks.set(k, blk);
      } else {
        if (blk.start.previousSibling !== cursor) {
          const range = document.createRange();
          range.setStartBefore(blk.start);
          range.setEndAfter(blk.end);
          const frag = range.extractContents();
          const after = cursor.nextSibling;
          if (after) cursor.parentNode!.insertBefore(frag, after);
          else cursor.parentNode!.appendChild(frag);
        }
      }
      cursor = blk.end;
    }
    const toRemove = new Set(blocks.keys());
    nextOrder.forEach((k) => toRemove.delete(k));
    toRemove.forEach((k) => {
      const blk = blocks.get(k)!;
      clearRange(blk.start, blk.end);
      blk.start.parentNode?.removeChild(blk.start);
      blk.end.parentNode?.removeChild(blk.end);
      blocks.delete(k);
    });
  });
  return frag;
}

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
          const nodes = normalizeToNodes(matchNode.children);
          const f = document.createDocumentFragment();
          for (const n of nodes) f.appendChild(n);
          end.parentNode!.insertBefore(f, end);
          matched = true;
          break;
        }
      }
    }
    if (!matched && props.fallback) {
      const nodes = normalizeToNodes(props.fallback);
      const f = document.createDocumentFragment();
      for (const n of nodes) f.appendChild(n);
      end.parentNode!.insertBefore(f, end);
    }
  });
  return frag;
}

export function Match(props: { when: () => unknown; children: Child }) {
  return {
    condition: () => !!props.when(),
    children: props.children,
    __isMatch: true,
  };
}
