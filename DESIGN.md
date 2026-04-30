---
name: shadcn/ui
version: 1.0.0
description: Inspired by shadcn/ui.
colors:
  light:
    background: "#ffffff"
    foreground: "#09090b"
    primary: "#18181b"
    on-primary: "#fafafa"
    secondary: "#f4f4f5"
    on-secondary: "#18181b"
    muted: "#f4f4f5"
    on-muted: "#71717a"
    destructive: "#ef4444"
    on-destructive: "#fafafa"
    border: "#e4e4e7"
    ring: "#18181b"
    disabled: "#f4f4f5"
    on-disabled: "#a1a1aa"
  dark:
    background: "#09090b"
    foreground: "#fafafa"
    primary: "#fafafa"
    on-primary: "#18181b"
    secondary: "#27272a"
    on-secondary: "#fafafa"
    muted: "#27272a"
    on-muted: "#a1a1aa"
    destructive: "#7f1d1d"
    on-destructive: "#fafafa"
    border: "#27272a"
    ring: "#d4d4d8"
    disabled: "#27272a"
    on-disabled: "#52525b"
typography:
  fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
  h1:
    fontSize: 2.25rem
    fontWeight: 700
    letterSpacing: -0.05em
  body:
    fontSize: 1rem
    lineHeight: 1.5
  label:
    fontSize: 0.875rem
    fontWeight: 500
  button:
    fontSize: 0.875rem
    fontWeight: 500
rounded:
  default: 8px
  button: 6px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  card:
    backgroundColor: "{colors.light.background}"
    border: "1px solid {colors.light.border}"
    rounded: "{rounded.default}"
    padding: "{spacing.lg}"
  button-primary:
    backgroundColor: "{colors.light.primary}"
    textColor: "{colors.light.on-primary}"
    rounded: "{rounded.button}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.light.secondary}"
    textColor: "{colors.light.on-secondary}"
    border: "1px solid {colors.light.border}"
    rounded: "{rounded.button}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.light.foreground}"
    hoverBackgroundColor: "{colors.light.secondary}"
    rounded: "{rounded.button}"
  button-disabled:
    backgroundColor: "{colors.light.disabled}"
    textColor: "{colors.light.on-disabled}"
    rounded: "{rounded.button}"
    cursor: "not-allowed"
  input:
    backgroundColor: "transparent"
    border: "1px solid {colors.light.border}"
    rounded: "{rounded.default}"
    padding: "12px 16px"
---

## Overview

This project follows a "Mechanical Minimalist" aesthetic. It prioritizes clarity, speed, and precision, reflecting the underlying reactive engine's philosophy: surgical updates and zero-waste.

The UI should feel lightweight, responsive, and neutral, allowing the content and the performance of the reactivity to take center stage.

## Colors

The palette is strictly high-contrast monochrome with a single functional "destructive" color for critical actions.

- **Background (#ffffff):** A clean, sterile canvas.
- **Primary (#18181b):** Deep obsidian for core interactions and emphasis.
- **Secondary (#f4f4f5):** Soft grey for subtle layering and secondary actions.
- **Destructive:** High-visibility red for danger actions. In Dark mode, this shifts to a deeper, less vibrating tone (#7f1d1d).

## Themes

The system supports system-level theme detection.

- **Light Mode:** The default state, mimicking high-end printed technical documentation.
- **Dark Mode:** Activates via `prefers-color-scheme: dark`. It reverses the luminance while maintaining the same hierarchical relationships. Backgrounds become Obsidian (#09090b) and borders become Zinc-800 (#27272a).

## Typography

Uses system fonts to ensure zero-latency loading and a native OS feel.

- **Headlines:** Bold, tightly tracked (-0.05em) for a modern, "engineered" look.
- **Body:** Readable, standard tracking, focusing on clarity.
- **Labels:** Semi-bold and slightly smaller to create clear hierarchy.

## Components

### Button Component

The `Button` is the core interaction primitive. It is implemented as a functional component to handle:

1. **Reactivity:** Using `getClass()` functions to ensure variants and classes update surgically.
2. **Accessibility:** Native button attributes (type, disabled) are preserved and synced with visual states.
3. **Variants:**
   - **Primary:** High emphasis, solid background.
   - **Secondary:** Medium emphasis, subtle background.
   - **Danger:** High emphasis, warning intent.
   - **Ghost:** Low emphasis, no background until hover. Ideal for utility actions and icon-only buttons.

### Other Elements

- **Cards:** Used for grouping reactive units. They use a subtle 1px border instead of heavy shadows.
- **Inputs:** High focus on states (focus-ring) to provide clear feedback during data entry.
