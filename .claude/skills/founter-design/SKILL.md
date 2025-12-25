---
name: founter-design
description: Apply Founter design system when building UI components. Use for React components, pages, and features. Includes dark-first theming, Shadcn UI and Shadcn Studio patterns, and Tailwind v4 conventions.
---

# Founter Design System

## Tech Stack
- **Framework**: Next.js 16 (App Router with proxy.ts in replacement of middleware.ts)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (uses `neutral`/`zinc`, NOT `gray`)
- **UI**: Shadcn UI components and patterns from https://shadcnstudio.com/ 
- **Icons**: Lucide React
- **Fonts**: Geist Sans & Geist Mono

## Color System (Dark Mode Primary)

### CSS Variables (OKLch)
```css
--background: oklch(0.08 0 0)        /* #141414 */
--foreground: oklch(0.98 0 0)        /* Off-white */
--card: lab(5% 0 0)                  /* Very dark elevated surfaces */
--primary: oklch(0.93 0.21 109)      /* #FFEA00 - Fountn Yellow */
--primary-foreground: oklch(0.10 0 0)
--secondary: oklch(0.12 0 0)         /* #262626 */
--muted-foreground: oklch(0.55 0 0)  /* #71717A */
--border: oklch(1 0 0 / 6%)          /* Subtle borders */
--ring: oklch(0.93 0.21 109 / 50%)   /* Yellow focus ring */
```

### Theme Colors (src/lib/colors.ts)
24 predefined theme colors for Newsletter Image Generator backgrounds:
- Artificial Intelligence: #6E494F
- Coding: #59843A
- Design Systems: #515155
- Figma: #475A51
- UI & Visual Design: #496878
- Dark Zinc: #17171A

## Typography

### Fonts
- `font-sans` → Geist Sans (body text)
- `font-mono` → Geist Mono (code, hex inputs)

### Text Patterns
```
text-xs font-semibold uppercase tracking-wider  /* Labels, tabs */
text-sm font-medium                              /* Body text */
text-base                                        /* Default */
text-muted-foreground                            /* Secondary text */
```

## Spacing & Sizing

### Border Radius
```
--radius: 0.625rem (10px)
rounded-sm → 6px
rounded-md → 8px
rounded-lg → 10px
```

### Common Gaps
```
gap-1 gap-1.5 gap-2 gap-3 gap-4 gap-6 gap-8
```

### Shadows
```css
--shadow-inset-emboss-soft: inset 0 1px 0 0 rgba(255, 255, 255, 0.07)
--shadow-inset-emboss: inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
```

## Component Patterns

### Button Variants
- `default` - Yellow bg (#FFEA00), dark text
- `secondary` - neutral-800/50 bg
- `ghost` - Transparent, accent hover
- `outline` - Border only
- `destructive` - Red/error

### Button Sizes
- `sm` → h-8, compact
- `default` → h-10
- `lg` → h-12
- `icon` → 40px square
- `icon-sm` → 32px square

### Card Structure
```tsx
<Card>
  <CardHeader>
    <Icon className="h-5 w-5 text-muted-foreground" />
    <CardTitle>Title</CardTitle>
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
- transition duration-300 ease-out

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
hover:shadow-inset-emboss /* Cards */
```

## Icons (Lucide)

### Sizes
```
className="w-4 h-4"  /* 16px - default in buttons */
className="w-5 h-5"  /* 20px - card headers */
className="h-6 w-6"  /* 24px */
```

### Usage
```tsx
import { Upload, X, Image as ImageIcon } from 'lucide-react';
<ImageIcon className="h-5 w-5 text-muted-foreground" />
```

## Class Organization Order
1. Layout (flex, grid, absolute)
2. Sizing (w-, h-, size-)
3. Spacing (p-, m-, gap-)
4. Typography (text-, font-, uppercase)
5. Colors (bg-, text-, border-)
6. Effects (shadow-, opacity-)
7. States (hover:, focus:, data-[])
8. Responsive (sm:, md:, lg:)

## Utility Function
```tsx
import { cn } from '@/lib/utils';

className={cn(
  'base-classes',
  condition && 'conditional-classes',
  className
)}
```

## Data Attributes
Use `data-slot` for component identification:
```
data-slot="button"
data-slot="card"
data-slot="tabs-trigger"
```

## Key Principles
1. **Dark-first** - Default dark theme
2. **Yellow accent** - #FFEA00 as primary
3. **Subtle borders** - 6% opacity white
4. **Inset emboss** - Soft inner glow on interactive elements
5. **Uppercase labels** - tracking-wider for small caps
6. **Consistent rounding** - rounded-sm (6px) default
7. **Future Changes** - If and when breaking changes are made color, typography, layout, or any other aspect of the design system, update this skill to avoid confusion.
