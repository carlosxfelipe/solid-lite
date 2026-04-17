# Solid Lite

A minimalist implementation of the SolidJS reactivity engine running natively on
Deno. This project demonstrates how to create a Single Page Application (SPA)
architecture with granular reactivity using the real DOM, without the need for a
complex compiler.

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

### Start Application

To clean the previous build, compile the files, and start the preview server:

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
