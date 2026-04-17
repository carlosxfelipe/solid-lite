import { h } from "@solid/index.ts";
import { navigate } from "@utils/router.ts";

interface LinkProps {
  href: string;
  children: unknown;
  class?: string;
  style?: string | JSX.StyleObject;
}

/**
 * Link Component
 * Intercepts clicks to use the reactive navigate helper instead of page reloads.
 */
export function Link(props: LinkProps) {
  const handleClick = (e: MouseEvent) => {
    // Check if it's a normal left click without modifiers
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
    navigate(props.href);
  };

  return (
    <a
      href={props.href}
      class={props.class}
      style={props.style}
      onClick={handleClick}
    >
      {props.children}
    </a>
  );
}
