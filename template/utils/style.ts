type StyleScalar = string | number | null | undefined;
type StyleValue = StyleScalar | (() => StyleScalar);

/**
 * CSS properties type with full IntelliSense support.
 * Leverages the native CSSStyleDeclaration browser interface —
 * zero external dependencies.
 *
 * Supports camelCase (e.g. marginTop) and getter functions for reactivity.
 */
export type CSSProperties =
  & { [K in keyof CSSStyleDeclaration]?: StyleValue }
  & Record<string, StyleValue>;

export const StyleSheet = {
  /**
   * Identity function that provides full IntelliSense for CSS properties.
   * Zero runtime overhead — pure TypeScript types only.
   * Similar to React Native's StyleSheet.create(), but for the web.
   *
   * @example
   * const styles = StyleSheet.create({
   *   container: { display: "flex", marginTop: "1rem" },
   * });
   */
  create<T extends Record<string, CSSProperties>>(styles: T): T {
    return styles;
  },
};
