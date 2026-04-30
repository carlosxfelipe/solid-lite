# Starting a New Project (Cleanup)

**Solid Lite** is a "batteries-included" framework, which means it comes with several features and examples ready to demonstrate the potential of reactivity and the folder structure.

When you are ready to start your own project from scratch, here are the recommended steps to clean up the examples and get the environment ready for your logic.

## 1. Remove Example Components

The main example component is the `Counter`. You can safely remove it:

- Delete the file: `src/components/Counter.tsx`

## 2. Clean Up Screens (Pages)

The project comes with several demonstration pages. If your project doesn't need them, remove the following files in `src/pages/`:

- `About.tsx`
- `Contact.tsx`
- `UserProfile.tsx`

> [!NOTE]
> Keep `Home.tsx` and `Login.tsx` (if you are using authentication), but feel free to clear the content of `Home.tsx` to start your own interface.

## 3. Adjust Routes

After deleting the page files, you need to update the route definitions to avoid import errors.

Open the file `src/router/routes.tsx` and:

1. Remove the imports of the deleted pages.
2. Remove the corresponding objects from the `routes` array.
3. If you want the Home page to be the initial page without login, set `IS_AUTH_ENABLED` to `false`.

## 4. Update the Navbar

The main and mobile Navbars consume an array of items. Adjust `src/components/Navbar.tsx`:

- In the `navItems` array, remove the links to `About`, `Contact`, and `Profile`.
- Keep only the `Home` link or add your new links.

## 5. Clean Up Styles (Optional)

If you removed components like the `Counter`, there might be specific CSS classes that are no longer needed. Check:

- `src/styles/app.css` for global component styles.
- Inline styles or `StyleSheet` objects within the files you modified.

## 6. Resetting CSS by Layers

Solid Lite organizes its visual architecture into three distinct layers. Understanding them allows for a precise reset without losing basic browser consistency.

### Layer 1: Base (`base.css`)

This is the **foundation**. It contains a modern CSS reset, global typography defaults, and normalization for elements like buttons and inputs.

- **When to reset:** Rarely. Keep this unless you want to implement your own normalize/reset from scratch.

### Layer 2: Layout (`layout.css`)

This layer handles the **skeleton**. It defines structural classes like `.container`, `.container-fluid`, and `.center-viewport`.

- **When to reset:** If you want to change the max-width of your app or switch from a container-based layout to something else (like full-width dashboards).

### Layer 3: App (`app.css`)

This is the **skin and soul**. It contains:

1. **Design Tokens**: HSL variables for the color palette (Light/Dark mode).
2. **Component Styles**: Specific classes for `.btn`, `.card`, `.navbar`, and form elements.

- **When to reset:** This is the most common layer to "clean". You can delete component classes you don't use, but we recommend **keeping the `:root` variables** as they are used by the core logic for theme switching.

## Command Summary

If you are on a Linux/macOS terminal, you can run these commands for a quick cleanup:

```bash
# Remove components and pages
rm src/components/Counter.tsx
rm src/pages/About.tsx src/pages/Contact.tsx src/pages/UserProfile.tsx

# Optional: Reset Home content to a simple initial state
echo 'import { h } from "@solid/index.ts";

export function Home() {
  return (
    <div class="container">
      <h1>My New Project</h1>
      <p>Start editing in src/pages/Home.tsx</p>
    </div>
  );
}' > src/pages/Home.tsx
```

---

After these steps, your framework will be "clean" and ready to receive the soul of your new product!
