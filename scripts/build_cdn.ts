import { bundle } from "emit";
import { ensureDir } from "@std/fs";
import { dirname, fromFileUrl, join } from "@std/path";

interface BuildOptions {
  input: string;
  output: string;
}

async function buildLibrary(options: BuildOptions) {
  const { input, output } = options;

  await ensureDir(dirname(output));

  console.log(`Building ${output}...`);

  try {
    // Resolve the input path relative to this script
    const inputUrl = new URL(join("file://", input));
    const result = await bundle(inputUrl);
    let code = result.code;

    // Add module documentation and type reference to improve JSR score
    const header = `/**
 * @module
 * Solid Lite - A minimalist implementation of the SolidJS reactivity engine.
 * 
 * This module provides fine-grained reactivity and a runtime JSX-like (HyperScript)
 * engine that works directly with the real DOM.
 */

// @ts-self-types="./solid-lite.d.ts"\n\n`;

    // Remove any existing module doc from code to avoid duplication
    code = code.replace(/^\/\*\*[\s\S]*?@module[\s\S]*?\*\/\s*/, "");
    code = header + code;

    await Deno.writeTextFile(output, code);

    // Generate .d.ts file to provide full documentation and types to JSR
    const dtsOutput = output.replace(/\.js$/, ".d.ts");
    const dtsCode = `/**
 * @module
 * Solid Lite - A minimalist implementation of the SolidJS reactivity engine.
 * 
 * This module provides fine-grained reactivity and a runtime JSX-like (HyperScript)
 * engine that works directly with the real DOM.
 */

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

export type Component<P = Record<string, unknown>> = (
  props: P & { children?: Child[] },
) => Node;

/**
 * Creates a new reactive root. Computations created inside a root are
 * automatically disposed when the root is disposed.
 */
export declare function createRoot<T>(fn: (dispose: () => void) => T): T;

/**
 * Creates a reactive signal.
 */
export declare function createSignal<T>(
  value: T,
  options?: { equals?: false | ((prev: T, next: T) => boolean) },
): [() => T, (v: T | ((prev: T) => T)) => T];

/**
 * Creates a reactive effect that runs when its dependencies change.
 */
export declare function createEffect<T>(fn: (v?: T) => T, value?: T): void;

/**
 * Registers a cleanup function that runs when the current scope is disposed.
 */
export declare function onCleanup(fn: () => void): void;

/**
 * The HyperScript function for creating DOM nodes or components.
 */
export declare function h(
  tag: string | Component<any>,
  props: Record<string, any> | null | undefined,
  ...children: Child[]
): Node;

/**
 * A virtual component that groups multiple children without adding a parent DOM node.
 */
export declare function Fragment(props?: { children?: Child[] }, ...kids: Child[]): DocumentFragment;

/**
 * Renders a Node into a container, clearing the container's previous content.
 */
export declare function render(node: Node, container: Element): void;

/**
 * A component for conditional rendering.
 */
export declare function Show(props: {
  when: () => unknown;
  children: Child;
  fallback?: Child;
}): DocumentFragment;

/**
 * A component for rendering lists with efficient DOM reuse.
 */
export declare function For<T>(props: {
  each: () => T[];
  key?: (item: T) => string | number;
  children?: (item: T, index: () => number) => Child;
}): DocumentFragment;

/**
 * A component for rendering the first Match that satisfies its condition.
 */
export declare function Switch(props: {
  children: Child[];
  fallback?: Child;
}): DocumentFragment;

/**
 * A child component for Switch that specifies a condition and its content.
 */
export declare function Match(props: {
  when: () => unknown;
  children: Child;
}): {
  condition: () => boolean;
  children: Child;
  __isMatch: true;
};
`;

    await Deno.writeTextFile(dtsOutput, dtsCode);

    console.log(`✅ Bundle created: ${output}`);
    console.log(`✅ Types created: ${dtsOutput}`);
    return true;
  } catch (error) {
    console.error(`❌ Build failed for ${output}:`, error);
    return false;
  }
}

async function main() {
  const currentDir = dirname(fromFileUrl(import.meta.url));
  const inputFile = join(currentDir, "../solid/index.ts");
  const outputDir = join(currentDir, "../dist");

  try {
    console.log("🔨 Building ESM development version...\n");

    // Build ESM version (development)
    const devOutput = join(outputDir, "solid-lite.js");
    const success = await buildLibrary({
      input: inputFile,
      output: devOutput,
    });

    if (!success) {
      console.error("❌ Development build failed. Aborting.");
      Deno.exit(1);
    }

    console.log("✅ Development version built successfully!");
    console.log("🔄 Now creating minified version...\n");

    // Create minified version using Deno's built-in minification if available
    const minOutput = join(outputDir, "solid-lite.min.js");

    const minifyCommand = new Deno.Command(Deno.execPath(), {
      args: ["bundle", "--minify", devOutput],
      stdout: "piped",
      stderr: "piped",
    });

    try {
      const minifyResult = await minifyCommand.output();
      if (minifyResult.success) {
        const minifiedCode = new TextDecoder().decode(minifyResult.stdout);
        await Deno.writeTextFile(minOutput, minifiedCode);
        console.log(`✅ Bundle created: ${minOutput}`);
      } else {
        const error = new TextDecoder().decode(minifyResult.stderr);
        console.error("❌ Minification failed:", error);
        console.log(
          "⚠️ Falling back to copying development version to .min.js",
        );
        await Deno.copyFile(devOutput, minOutput);
      }
    } catch (_e) {
      console.warn("⚠️ Could not run 'deno bundle' (likely Deno 2.0+).");
      console.log("⚠️ Falling back to copying development version to .min.js");
      await Deno.copyFile(devOutput, minOutput);
    }

    console.log("\n🎉 All builds completed successfully!");
    console.log("\nGenerated files:");
    console.log(`- dist/solid-lite.js (ESM development)`);
    console.log(`- dist/solid-lite.min.js (ESM production)`);
    console.log("\nUsage:");
    console.log('<script type="module">');
    console.log(
      '  import { createSignal, h, render } from "./dist/solid-lite.js";',
    );
    console.log("  // Your code here");
    console.log("</script>");
  } catch (error) {
    console.error("Build failed:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
