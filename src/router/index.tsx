import { createSignal, h, Show } from "@solid/index.ts";

/**
 * Basic Reactive Router State
 */
export const [currentPath, setCurrentPath] = createSignal(
  globalThis.location?.pathname || "/",
);

/**
 * Signal to hold extracted route parameters (e.g., { id: "123" })
 */
export const [params, setParams] = createSignal({} as Record<string, string>);

/**
 * Poor man's path regex matcher.
 * Converts "/user/:id" to a regex and extracts "id".
 */
export function matchPath(pattern: string, path: string) {
  const paramNames: string[] = [];
  const regexPath = pattern.replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
    paramNames.push(name);
    return "([^/]+)";
  });

  const regex = new RegExp(`^${regexPath}$`);
  const match = path.match(regex);

  if (!match) return null;

  const result: Record<string, string> = {};
  paramNames.forEach((name, i) => {
    result[name] = match[i + 1];
  });

  return result;
}

/**
 * Navigates to a new path using History API and updates the reactive state.
 */
export function navigate(path: string) {
  globalThis.history.pushState({}, "", path);
  setCurrentPath(path);
}

/**
 * Handle browser Back/Forward navigation
 */
if (globalThis.addEventListener) {
  globalThis.addEventListener("popstate", () => {
    setCurrentPath(globalThis.location.pathname);
  });
}

/**
 * Route Component
 */
interface RouteProps {
  path: string;
  component: () => JSX.Element;
}

export function Route(props: RouteProps) {
  const match = () => matchPath(props.path, currentPath());

  return (
    <Show when={() => !!match()}>
      {() => {
        const m = match();
        if (m) setParams(m);
        return props.component();
      }}
    </Show>
  );
}

/**
 * Link Component
 */
interface LinkProps {
  href: string;
  children: unknown;
  class?: string;
  style?: string | JSX.StyleObject;
}

export function Link(props: LinkProps) {
  const isMalicious = (href: string) => {
    const lower = href.trim().toLowerCase();
    return lower.startsWith("javascript:") || lower.startsWith("data:") ||
      lower.startsWith("vbscript:");
  };

  const safeHref = () => isMalicious(props.href) ? "about:blank" : props.href;

  const handleClick = (e: MouseEvent) => {
    if (
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }

    e.preventDefault();
    if (!isMalicious(props.href)) {
      navigate(props.href);
    }
  };

  return (
    <a
      href={safeHref()}
      class={props.class}
      style={props.style}
      onClick={handleClick}
    >
      {props.children}
    </a>
  );
}
