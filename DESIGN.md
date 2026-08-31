# Well Kept Design Contract

This is the canonical design reference for implemented Well Kept product UI. `DESIGN_SYSTEM.md` is planning history; when the documents disagree, follow this file and the implemented tokens in `app/globals.css`.

## Product Character

Well Kept is calm, residential, trustworthy, and direct. The interface uses a warm paper canvas, deep green actions, editorial serif titles for brand-level moments, compact sans-serif UI text, restrained elevation, and obvious mobile actions. It should feel polished without feeling animated, glossy, or ornamental.

## Core Tokens

| Role | Implemented value | Usage |
| --- | --- | --- |
| Background | `oklch(97.2% 0.012 112)` | Warm ivory page canvas; never pure white |
| Card | `oklch(99.2% 0.006 112)` | Primary warm-white surface |
| Foreground | `oklch(22% 0.025 142)` | Warm charcoal headings and primary text |
| Muted foreground | `oklch(49% 0.017 125)` | Olive-gray metadata and helper text |
| Primary | `oklch(39% 0.08 145)` | Deep residential green for forward actions |
| Primary foreground | `oklch(98.8% 0.007 112)` | Warm ivory text on green |
| Border | `oklch(87% 0.018 112)` | Low-contrast sage/stone structure |
| Destructive | `oklch(47% 0.095 27)` | Delete, cancel-danger, and failed states |
| Card radius | `16px` | Default cards and grouped surfaces |
| Control radius | `12px` | Buttons, inputs, and selectors |

Use semantic CSS variables instead of introducing new raw colors. Green communicates forward movement, open work, success, and selection. Amber is reserved for attention. Muted red is reserved for destructive or failed states. Never rely on color alone.

## Typography

- Brand marks and major screen titles use `Baskerville`, `Iowan Old Style`, `Times New Roman`, then `serif`.
- Product UI, labels, forms, and data use the native system sans stack.
- Body text and form controls are at least `16px` on mobile.
- Bid amounts, prices, counters, and timestamps use tabular numerals.
- Keep mobile headings measured and readable at `320px`; avoid more than two lines for routine screen titles.
- Use short, direct labels such as “Bid”, “Post job”, “Show details”, and “Save”.

## Layout and Responsive Behavior

- Design mobile-first for `320px–430px` before widening layouts.
- Default mobile page padding is `16px`; major section gaps are `20px–24px`.
- Controls must be at least `44px` tall; primary actions should be `48px` or taller.
- Bottom navigation and sticky actions must include safe-area padding and must not overlap content.
- Tablet and desktop may widen content but must not introduce a separate product concept.

## Components and Hierarchy

- Cards are action boundaries, not decoration. Avoid nested cards when a divider or spacing is enough.
- Use soft elevation only for tappable job/bid cards and active overlays. Internal chips, metadata, and secondary actions stay flat.
- Selected or recommended cards use a green border plus a very light green background.
- Forms use visible labels, familiar controls, grouped sections, and plain-language errors.
- One action is visually primary in each action area. In the cleaner job view, Bid is the filled dominant action; Pass is a quieter outlined destructive action in a `40/60` layout.
- Primary action components share the `wk-pressable` interaction foundation. Do not add ripple or perpetual pulse effects to routine actions.

## Motion

Motion must explain state, location, or feedback. Do not animate routine navigation merely to make it feel lively.

| Interaction | Duration | Easing |
| --- | ---: | --- |
| Press feedback | `150ms` | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Tooltip/popover enter | `150ms` | `cubic-bezier(0.23, 1, 0.32, 1)` |
| Tooltip/popover exit | `100ms` | `cubic-bezier(0.23, 1, 0.32, 1)` |
| Dialog enter | `180ms` | `cubic-bezier(0.23, 1, 0.32, 1)` |
| Dialog exit | `120–130ms` | `cubic-bezier(0.23, 1, 0.32, 1)` |
| Sheet enter | `220ms` | `cubic-bezier(0.23, 1, 0.32, 1)` |
| Sheet exit | `160ms` | `cubic-bezier(0.23, 1, 0.32, 1)` |

- Pressable controls scale to `0.975` and may slightly adjust color or brightness.
- Never animate an entering UI element from `scale(0)`.
- Entering overlays use ease-out and exit faster than they enter.
- Popovers, dropdowns, and selects transform from their Radix trigger origin. Centered dialogs remain center-origin.
- Do not use perpetual animation for ordinary open, live, selected, or available states. A status may animate once when it changes, then remain static.
- Gate hover movement behind `@media (hover: hover) and (pointer: fine)`.
- Prefer explicit transition properties; never use `transition: all`.

## Reduced Motion

Under `prefers-reduced-motion: reduce`:

- Remove transform-based movement, repeated animation, smooth scrolling, and overlay entrance/exit motion.
- Keep immediate state changes and brief color, border, opacity, or focus feedback.
- Swipe and stacked-card experiences must remain usable through static lists, buttons, or pagination.
- Loading and completion states must remain understandable through text and icons without relying on motion.
