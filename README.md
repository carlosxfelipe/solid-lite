# Solid Lite

A minimalist implementation of the SolidJS reactivity engine running natively on
Deno. This project demonstrates how to create a Single Page Application (SPA)
architecture with granular reactivity using the real DOM, without the need for a
complex compiler.

✨ **Custom Zero-Dependency Hot Reload**: As a proof of concept for modern web engineering, this project includes a hand-crafted Development Server featuring instant Hot Reload. Instead of relying on heavy third-party bundlers or WebSocket libraries, it leverages Deno's native `watchFs`, `Server-Sent Events (SSE)`, and dynamic on-the-fly HTML script injection to automatically rebuild and refresh the browser on save.

## Technical Features

- **Fine-grained reactivity**: Uses signals and effects for surgical updates to
  the real DOM.
- **JSX Runtime**: Interface processing via a HyperScript (h) function at
  runtime.
- **No Virtual DOM**: Unlike React, changes are applied directly to browser
  nodes.
- **Native Deno**: Built to leverage Deno's performance and security APIs.

## Requirements

- [Deno](https://deno.land/) installed on your system.
- [Deno extension](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno)
  for VS Code (recommended).

## How to Run

The project uses Deno's task system for automation.

### Development (Hot Reload)

To start the development server with Hot Reload enabled, run:

```bash
deno task dev
```

This command will watch for any changes in your `src/` and `solid/` directories, automatically rebuild the project, and refresh your browser instantly!

### Production Preview

If you want to clean the build cache to test the final, static distribution version (without Hot Reload), use:

```bash
deno task start
```

### Other Commands

To see all available commands, please review the `deno.json` file.

## Code Formatting

This project uses Deno's built-in formatter. To ensure consistent code style across the project, you can run:

```bash
deno fmt
```

Formatting rules and file exclusions are managed in the `deno.json` configuration file.

### VS Code Setup

If you use VS Code and have the **Prettier** extension installed, it may conflict with Deno. To use Deno's formatter automatically on save, ensure your `.vscode/settings.json` is configured as follows:

```json
"[typescript]": {
  "editor.defaultFormatter": "denoland.vscode-deno"
},
"[typescriptreact]": {
  "editor.defaultFormatter": "denoland.vscode-deno"
}
```

## Folder Structure

- `/solid`: Core reactivity logic and runtime.
- `/src`: Application source code (components, pages, styles).
- `/scripts`: Auxiliary automation tools and local server.
- `/public`: Static assets (favicon, redirects, etc.).

---

## Important Note

**SolidJS** is a trademark of its respective owners.

This project, **Solid Lite**, is an independent, minimalist, and **strictly experimental** implementation of a reactive runtime inspired by the principles of SolidJS. It was created solely for educational purposes to demonstrate how fine-grained reactivity and Single Page Application (SPA) architectures can be built using the native DOM on Deno.

**Solid Lite has no commercial or business objectives.** It is a study of architectural concepts and a hobbyist experiment in building lean web runtimes.

## License

MIT
