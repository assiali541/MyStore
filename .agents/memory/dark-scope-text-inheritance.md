---
name: Dark-scope CSS variable inheritance gotcha
description: Why text can appear invisible in a themed dark section even though the CSS variables and colors look correct
---

When a `.dark` (or similar theme) class is applied to a `<div>` nested partway down the tree — not on `<html>`/`<body>` — any descendant element that has **no explicit color utility/class** does not automatically pick up the re-scoped theme color.

**Why:** The `color` CSS property is inherited as an already-resolved value. `<body>` typically has a base rule like `body { color: hsl(var(--foreground)); }`. That declaration resolves once, using whatever `--foreground` value is in scope at `<body>` (usually the light/root theme, since `<body>` sits outside the nested `.dark` div). Descendants inside the `.dark` div that don't declare their own `color` just inherit `<body>`'s already-resolved (light-theme) color — they do not re-evaluate `var(--foreground)` against the closer `.dark` scope. Only elements with an explicit `text-foreground` (or equivalent) class re-resolve the variable correctly, because that declaration lives inside the `.dark` subtree.

Symptom: shared components like a bare `<h2>` or a `Label` with no explicit text color render **near-invisible / wrong-contrast text** in a themed section (e.g. a dark admin panel), even though sibling elements with explicit `text-foreground` classes look fine right next to them.

**How to apply:** When a design system nests a theme class deep in the tree instead of on `<html>`/`<body>`, always give shared low-level components (`Label`, headings, etc.) an explicit `text-foreground` (or theme-equivalent) class rather than relying on inheritance. Don't assume "no color class = inherits the right theme color" — verify by logging in / rendering the actual themed page, not just by reading the CSS variable definitions.
