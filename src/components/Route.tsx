import { createEffect, h, Show } from "@solid/index.ts";
import { currentPath, matchPath, setParams } from "@utils/router.ts";

interface RouteProps {
  path: string;
  component: () => JSX.Element;
}

/**
 * Route Component
 * Declaratively defines a route using the reactive <Show /> component.
 * Now supports dynamic path matching (e.g., /user/:id).
 */
export function Route(props: RouteProps) {
  const match = () => matchPath(props.path, currentPath());

  // Update global params signal when this route matches
  createEffect(() => {
    const p = match();
    if (p) setParams(p);
  });

  return <Show when={() => !!match()}>{props.component()}</Show>;
}
