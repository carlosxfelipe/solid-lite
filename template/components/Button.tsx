import { Child, h } from "@solid/index.ts";

interface ButtonProps extends Record<string, unknown> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | (() => string);
  disabled?: boolean | (() => boolean);
  onClick?: (e: MouseEvent) => void;
  class?: string | (() => string);
  children?: Child;
  type?: "button" | "submit" | "reset";
  style?:
    | string
    | Record<string, string | number>
    | (() => string | Record<string, string | number>);
}

/**
 * Robust, reusable Button component for the Solid Lite design system.
 */
export function Button(props: ButtonProps) {
  const getClass = () => {
    const v = typeof props.variant === "function"
      ? (props.variant as () => string)()
      : (props.variant || "primary");
    const extra = typeof props.class === "function"
      ? (props.class as () => string)()
      : (props.class || "");
    return `btn btn-${v} ${extra}`.trim();
  };

  const otherProps = () => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(props)) {
      if (
        ![
          "variant",
          "class",
          "children",
          "type",
          "disabled",
          "onClick",
          "style",
        ].includes(k)
      ) {
        out[k] = v;
      }
    }
    return out;
  };

  return (
    <button
      type={props.type || "button"}
      class={getClass as unknown as string}
      disabled={props.disabled as unknown as boolean}
      onClick={props.onClick}
      style={props.style as unknown as string}
      {...otherProps()}
    >
      {props.children}
    </button>
  );
}
