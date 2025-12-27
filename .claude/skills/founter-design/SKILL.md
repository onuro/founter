---
name: founter-design
description: Apply Founter design system when building UI components. Use for React components, pages, and features. Includes dark-first theming, Shadcn UI and Shadcn Studio patterns, and Tailwind v4 conventions.
---

# Founter Design System

## Tech Stack (UI-related)
- **Framework**: Next.js 16 (App Router with proxy.ts instead of middleware.ts)
- **Styling**: Tailwind CSS v4 (uses `neutral`/`zinc`, NOT `gray`)
- **UI**: Shadcn UI components (new-york style) + patterns from https://shadcnstudio.com/
- **Icons**: Lucide React
- **Fonts**: Geist Sans & Geist Mono

---

## Cursor Styling (CRITICAL)

**Global cursor-pointer is already applied** in `globals.css` base layer:
```css
button, [role="button"], input[type="button"], input[type="submit"],
input[type="reset"], a, label[for], select {
  cursor: pointer;
}
```

**NEVER add `cursor-auto` to interactive elements.** It overrides the global rule.
- If you're adding a new interactive component type not covered above, add `cursor-pointer` explicitly
- Clickable cards, custom dropdowns, tab triggers should all have `cursor-pointer`

---

## Color System (Dark Mode Primary)

### CSS Variables (OKLch)
```css
--background: oklch(0.08 0 0)        /* #141414 - Deep dark */
--foreground: oklch(0.98 0 0)        /* Off-white */
--surface: color-mix(in srgb, var(--color-neutral-900), black 15%)
--popover: oklch(0.11 0 0)
--primary: oklch(0.93 0.21 109)      /* #FFEA00 - Fountn Yellow */
--primary-foreground: oklch(0.10 0 0)
--secondary: oklch(0.12 0 0)         /* #262626 */
--muted-foreground: oklch(0.55 0 0)  /* #71717A */
--destructive: oklch(0.704 0.191 22.216)
--border: oklch(1 0 0 / 6%)          /* Subtle white borders */
--ring: oklch(0.93 0.21 109 / 50%)   /* Yellow focus ring */
```

### Theme Colors (src/lib/colors.ts)
20 predefined colors for Newsletter Image Generator backgrounds:
- Artificial Intelligence: #6E494F
- Coding: #59843A
- Design Systems: #515155
- Figma: #475A51
- UI & Visual Design: #496878
- UX Design: #8B6CA5
- Dark Zinc: #17171A
- (and more category-based colors)

### Tag Colors (Select Fields)
8 colors for select field options (defined in `src/types/tables.ts`):
```typescript
const TAG_COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'cyan'];

// Styling pattern:
bg-{color}-900/20                    // Background
[color:color-mix(in_oklch,theme(colors.{color}.600),white_30%)]  // Text
border-{color}-500/30                // Border
```

---

## Typography

### Fonts
- `font-sans` → Geist Sans (body text)
- `font-mono` → Geist Mono (code, hex inputs)

### Text Patterns
```
text-xs font-semibold uppercase tracking-wider  /* Labels, card titles, tabs */
text-sm font-medium                              /* Body text */
text-base                                        /* Default */
text-muted-foreground                            /* Secondary text */
```

---

## Spacing & Sizing

### Border Radius
```
--radius: 0.625rem (10px)
rounded-sm → calc(var(--radius) - 4px) = 6px
rounded-md → calc(var(--radius) - 2px) = 8px
rounded-lg → var(--radius) = 10px
rounded-xl → calc(var(--radius) + 4px) = 14px
```

### Row Heights (Tables)
```typescript
type RowHeight = 'small' | 'medium' | 'large';
// small: 40px, medium: 64px, large: 98px
```

### Shadows
```css
--shadow-inset-emboss-soft: inset 0 1px 0 0 rgba(255, 255, 255, 0.07)
--shadow-inset-emboss: inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
```

---

## Component Patterns

### Button Variants
```tsx
variant: {
  default:     "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
  destructive: "bg-destructive text-white hover:bg-destructive/90"
  outline:     "border border-border bg-transparent hover:bg-accent"
  inputlike:   "bg-secondary border-border hover:text-accent-foreground"
  secondary:   "bg-neutral-800 shadow-inset-emboss hover:bg-neutral-700/80"
  ghost:       "hover:bg-accent text-muted-foreground"
  link:        "text-primary underline-offset-4 hover:underline"
}
```

### Button Sizes
```tsx
size: {
  default:  "h-10 px-5 py-2"
  sm:       "h-8 px-3 text-xs"
  lg:       "h-12 px-8 text-base"
  icon:     "size-10"
  icon-sm:  "size-8"
  icon-lg:  "size-12"
}
```

### Card Structure
```tsx
<Card>  {/* bg-surface p-5 rounded-md flex flex-col gap-5 */}
  <CardHeader>  {/* flex items-center gap-3 */}
    <Icon className="h-5 w-5 text-muted-foreground" />
    <CardTitle>Title</CardTitle>  {/* text-sm font-semibold uppercase tracking-wider */}
    <CardAction>{/* optional */}</CardAction>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>
```

### Input Styling
```
bg-secondary h-10 rounded-sm px-4
hover:ring-white/12 hover:ring-[1.5px] hover:ring-inset
focus-visible:ring-[1.5px] focus-visible:ring-primary focus-visible:ring-inset
```

### Tabs (Animated)
- Animated background slider follows active tab
- Uses MutationObserver for state detection
- `transition duration-300 ease-out`

---

## Table UI Patterns

### Field Type Icons (Lucide)
```typescript
text:     'Type'
number:   'Hash'
url:      'Link'
select:   'Tag'
date:     'Calendar'
boolean:  'CheckSquare'
longText: 'AlignLeft'
image:    'Image'
```

### Orphan Value Styling (deleted select choices)
```tsx
// Red warning styling for values referencing deleted choices
className="bg-red-900/30 text-red-400 border-red-500/30"
```

---

## Layout Patterns

### Page Structure
```tsx
<main className="max-w-[1750px] mx-auto px-4 py-8">
  <div className="grid lg:grid-cols-[400px_1fr] gap-8 items-start">
    {/* Left sidebar - 400px fixed */}
    {/* Right content - responsive */}
  </div>
</main>
```

### Hidden Export Target Pattern
For html-to-image exports, use 1px overflow-hidden wrapper (NOT off-screen positioning):
```tsx
<div className="fixed top-0 left-0 w-px h-px overflow-hidden" aria-hidden="true">
  <div ref={exportRef} className="w-[1440px] h-[900px]">
    {/* Export content at exact dimensions */}
  </div>
</div>
```

### Custom Breakpoint
```
--breakpoint-3xl: 109.375rem (1750px)
```

---

## Interactive States

### Focus
```
focus-visible:ring-2 focus-visible:ring-ring
focus-visible:outline-none
```

### Disabled
```
disabled:pointer-events-none disabled:opacity-50
```

### Hover Effects
```
hover:scale-110          /* Icons, color buttons */
hover:bg-accent          /* Ghost buttons */
hover:shadow-inset-emboss /* Cards, elevated elements */
```

---

## Icons (Lucide)

### Sizes
```
className="w-4 h-4"  /* 16px - default in buttons */
className="w-5 h-5"  /* 20px - card headers */
className="h-6 w-6"  /* 24px - larger icons */
```

### Usage
```tsx
import { Upload, X, Image as ImageIcon, Type, Hash } from 'lucide-react';
<ImageIcon className="h-5 w-5 text-muted-foreground" />
```

---

## Class Organization Order
1. Layout (flex, grid, absolute)
2. Sizing (w-, h-, size-)
3. Spacing (p-, m-, gap-)
4. Typography (text-, font-, uppercase)
5. Colors (bg-, text-, border-)
6. Effects (shadow-, opacity-)
7. States (hover:, focus:, data-[])
8. Responsive (sm:, md:, lg:)

---

## Utility Function
```tsx
import { cn } from '@/lib/utils';

className={cn(
  'base-classes',
  condition && 'conditional-classes',
  className
)}
```

---

## Data Attributes
Use `data-slot` for component identification:
```
data-slot="button"
data-slot="card"
data-slot="card-header"
data-slot="card-title"
```

---

## Key Principles

1. **Dark-first** - Default dark theme
2. **Yellow accent** - #FFEA00 as primary brand color
3. **Cursor pointer** - Global rule applied; NEVER override with cursor-auto
4. **Subtle borders** - 6% opacity white borders
5. **Inset emboss** - Soft inner glow on elevated elements
6. **Uppercase labels** - `tracking-wider` for card titles, tabs
7. **Consistent rounding** - `rounded-sm` (6px) as default
8. **Surface elevation** - Use `bg-surface` for elevated cards/panels

---

## Future Changes
When breaking changes are made to colors, typography, layout, or any other design aspect, update this skill to avoid confusion.
