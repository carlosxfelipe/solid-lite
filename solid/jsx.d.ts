export {};

declare global {
  namespace JSX {
    type StyleScalar = string | number | null | undefined;
    type StyleValue = StyleScalar | (() => StyleScalar);
    type StyleObject = Record<string, StyleValue>;

    type Element = Node;

    interface ElementChildrenAttribute {
      children: unknown;
    }

    interface IntrinsicAttributes {
      key?: unknown;
      ref?:
        | ((el: globalThis.Element | null) => void)
        | { current: globalThis.Element | null }
        | null;
    }

    interface DOMProps {
      class?: string;
      className?: string;
      id?: string;
      style?: string | StyleObject | (() => string | StyleObject);
      dangerouslySetInnerHTML?: { __html: string };
      onClick?: (e: MouseEvent) => unknown;
      onDblClick?: (e: MouseEvent) => unknown;
      onMouseOver?: (e: MouseEvent) => unknown;
      onMouseOut?: (e: MouseEvent) => unknown;
      onMouseDown?: (e: MouseEvent) => unknown;
      onMouseUp?: (e: MouseEvent) => unknown;
      onContextMenu?: (e: MouseEvent) => unknown;
      onInput?: (e: InputEvent) => unknown;
      onChange?: (e: Event) => unknown;
      onSubmit?: (e: SubmitEvent) => unknown;
      onReset?: (e: Event) => unknown;
      onKeyDown?: (e: KeyboardEvent) => unknown;
      onKeyUp?: (e: KeyboardEvent) => unknown;
      onKeyPress?: (e: KeyboardEvent) => unknown;
      onFocus?: (e: FocusEvent) => unknown;
      onBlur?: (e: FocusEvent) => unknown;
      onWheel?: (e: WheelEvent) => unknown;
      onScroll?: (e: Event) => unknown;
      onDrag?: (e: DragEvent) => unknown;
      onDragStart?: (e: DragEvent) => unknown;
      onDragOver?: (e: DragEvent) => unknown;
      onDragEnd?: (e: DragEvent) => unknown;
      onDrop?: (e: DragEvent) => unknown;
      [k: `on${string}`]: unknown;
      [attr: string]: unknown;
    }

    interface IntrinsicElements {
      [elemName: string]: DOMProps;
    }
  }
}
