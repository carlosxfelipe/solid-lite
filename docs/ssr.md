# Server-Side Rendering (SSR) & Philosophy

Solid Lite is intentionally designed as a **Client-Side Rendering (CSR)** framework. This document outlines why SSR is not included in the core and how this choice aligns with the project's focus.

### 1. Real DOM Focus

The core engine is built to work directly with the **Real DOM**. Our reactivity primitives (`createSignal`, `createEffect`) and the HyperScript function (`h`) use native browser APIs like `document.createElement` and `Node` manipulation.

Since server-side environments (Deno, Node.js, or Edge Workers) lack a native DOM, supporting SSR would require either:

- A heavy DOM simulation (like JSDOM), which impacts performance.
- A secondary rendering engine for string serialization, doubling the library size.

### 2. Avoiding Hydration Complexity

True SSR requires **Hydration**—the process of "attaching" reactivity to pre-rendered HTML. Hydration adds significant complexity, requiring:

- Serialization and transfer of state from server to client.
- Unique identifiers for every DOM node to ensure a correct "match."
- Large amounts of boilerplate code that contradicts the **Lite** philosophy.

### 3. Maintaining "Lite" Architecture

The primary goal of this project is to provide **fine-grained reactivity with zero overhead**. By focusing exclusively on the browser, we keep the bundle size minimal and the mental model simple: what you see in the code is exactly what happens in the DOM.

### 4. Target Use Cases

Solid Lite is optimized for applications where client-side performance and simplicity are the priority:

- Single-Page Applications (SPAs)
- Interactive dashboards and tools
- Dynamic "islands" within existing websites
- Projects where a heavy meta-framework (like Next.js or SolidStart) is overkill

### 5. Backend Agnostic

Because we do not bake SSR into the core, Solid Lite remains completely backend-agnostic. You can serve your `dist` folder from any environment—Nginx, Apache, Cloudflare Pages, or a simple Go/Rust binary—without needing a JavaScript runtime on the server to handle rendering.
