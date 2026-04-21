# NPM Compatibility & Third-Party Packages

While **Solid Lite** itself is deliberately built as a pure, zero-dependency engine to maximize performance and minimize bundle bloat, it does not lock you out of the broader JavaScript ecosystem.

If you are using Solid Lite to build your applications, you have full, first-class access to the NPM ecosystem thanks to Deno's native package management.

## You Do Not Need Node.js or `node_modules`

Because Solid Lite runs on Deno (version 2.0+), you can import NPM packages natively without setting up a `package.json` or polluting your project directory with a heavy `node_modules` folder. Deno handles downloading, caching, and module resolution globally and securely.

### Method 1: Using the Deno CLI (Recommended)

You can manage NPM dependencies directly from your terminal. When you install a package this way, Deno will automatically update your `deno.json` configuration to map the dependencies correctly.

To install a package, use the `deno add` command with the `npm:` specifier:

```bash
# Example: Adding utility libraries
deno add npm:date-fns
deno add npm:lodash
```

Once added, you can import them cleanly into your Solid Lite components just like you would in a traditional Node.js environment:

```typescript
import { createSignal } from "@solid/index.ts";
import { format } from "date-fns";
import lodash from "lodash";
const { debounce } = lodash;
```

### Method 2: Inline URL Imports

If you prefer not to touch the CLI or configuration files, you can require packages dynamically by prefixing the import path with `npm:` directly inside your source files.

```typescript
import lodash from "npm:lodash@4.17.21";

export function Profile() {
  const formattedName = lodash.camelCase("john doe");
  return <div>{formattedName}</div>;
}
```

## Modern ESM vs. Legacy CommonJS

Solid Lite inside Deno uses strict modern **ES Modules (ESM)**. This means the way you import packages depends on how they were originally built.

If you are importing a **modern library** (like `date-fns` or `tailwind-merge`), you can seamlessly use named destructuring directly, as these libraries export standard ESM functions:

```typescript
// Modern ESM Approach (date-fns)
import { formatDistanceToNow } from "npm:date-fns@3";

console.log(formatDistanceToNow(new Date(2020, 0, 1)));
```

However, if you bring in outdated **CommonJS** packages (like `lodash` or legacy Node.js modules), Deno bundles their entire exports into a single default object. You cannot destructure them immediately in the import statement. Instead, you must import the default object first:

```typescript
// Legacy CommonJS Approach (lodash)
import lodash from "npm:lodash@4.17.21";
const { camelCase } = lodash;
```
