# Founter - Project Documentation

## Overview

**Founter** is an internal tools application for the Fountn.design team. The first tool is a **Newsletter Image Generator** that creates beautiful mockups for newsletter content.

<instructions>
- You are very nice and clever dog and your name is "Hilmi".
- Remember, you will always address me as "guzel abim". For example, when job done, you will say "Job done guzel abim".
- When I ask you about something and it is something you can build, you will start by "Hallederiz guzel abim".
- When you're planning anything related to NextJs, always remember with version 16 App Router and proxy.ts in replacement of middleware.ts.
- When you're planning anything related to Tailwind, always remember with version 4.
</instructions>

### What It Does
- Upload a screenshot
- Place it inside a CSS-built monitor frame (Apple Pro Display XDR style)
- Customize background color (presets + custom hex)
- Export as PNG or WebP at 1440x900px (2x resolution)

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (uses `neutral`/`zinc` instead of `gray`)
- **UI Components**: Shadcn UI
- **Export Library**: html-to-image
- **Icons**: Lucide React

---

## Project Structure

```
founter/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with Geist fonts
│   │   ├── page.tsx                # Redirects to /generator
│   │   ├── globals.css
│   │   └── generator/
│   │       └── page.tsx            # Generator page
│   ├── components/
│   │   ├── ui/                     # Shadcn components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── slider.tsx
│   │   │   └── tabs.tsx
│   │   └── generator/
│   │       ├── GeneratorLayout.tsx # Main orchestrator
│   │       ├── ImageUploader.tsx   # Drag-and-drop upload
│   │       ├── MonitorFrame.tsx    # Fixed-size for export
│   │       ├── MonitorFramePreview.tsx # Responsive preview
│   │       ├── ColorPicker.tsx     # Color selection UI
│   │       └── ExportControls.tsx  # PNG/WebP export buttons
│   ├── hooks/
│   │   ├── useImageUpload.ts       # File upload logic
│   │   └── useImageExport.ts       # Export functionality
│   ├── lib/
│   │   ├── utils.ts                # cn() utility
│   │   └── colors.ts               # Predefined color palette
│   └── types/
│       └── generator.ts            # TypeScript interfaces
├── components.json                  # Shadcn config
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

---

## Architecture Decisions

### Dual Monitor Components

The app uses **two separate monitor components** to handle responsive preview while maintaining exact export dimensions:

1. **MonitorFrame** (`MonitorFrame.tsx`)
   - Fixed dimensions: 1440x900 canvas with 1200x675 screen
   - Used for export only
   - Hidden in an overflow-hidden wrapper

2. **MonitorFramePreview** (`MonitorFramePreview.tsx`)
   - Uses percentages and absolute positioning
   - Fully responsive
   - Displayed to the user

### Hidden Export Target Pattern

The export target is hidden using a **1px overflow-hidden wrapper**:

```tsx
<div className="fixed top-0 left-0 w-px h-px overflow-hidden" aria-hidden="true">
  <div ref={exportRef} className="w-[1440px] h-[900px]" style={{ backgroundColor }}>
    <MonitorFrame screenshotUrl={image?.dataUrl} />
  </div>
</div>
```

**Why not off-screen positioning?**
Using `-left-[9999px]` causes browsers to skip painting the element, resulting in blank exports. The overflow-hidden wrapper keeps the element rendered while visually hidden.

### Monitor Frame Specifications

Based on 1440x900 canvas:
- **Top padding**: 100px (11.11%)
- **Side padding**: 108px each (7.5%)
- **Screen area**: 1200x675px (83.33% x 75%)
- **Monitor body with bezel**: ~1224x699px
- **Stand**: 240x120px (16.67% x 13.33%)

### Pro Display XDR Stand Styling

```css
background: linear-gradient(180deg, #C1C1C3 0%, #D9D9DB 100%);
box-shadow: 0px 13px 20px -10px rgba(0, 0, 0, 0.3) inset;
```

---

## Color Palette

Predefined colors in `src/lib/colors.ts`:

| Name | Hex |
|------|-----|
| Royal Purple | #735AC2 |
| Teal Green | #75B09C |
| Warm Brown | #816F63 |
| Ocean Blue | #4A90D9 |
| Coral | #E57373 |
| Sunset Orange | #F5A623 |
| Soft Lavender | #C4B5FD |
| Mint | #A7F3D0 |
| Sky Blue | #BAE6FD |
| Zinc Dark | #27272A |
| Zinc Light | #A1A1AA |

Default background: **#735AC2** (Royal Purple)

---

## Key Implementation Details

### Image Upload

- Accepts: PNG, JPG, JPEG, WebP
- Max size: 10MB
- Stores as data URL for immediate display
- Drag-and-drop support with visual feedback

### Export Process

Uses `html-to-image` library:

```typescript
// PNG Export
const dataUrl = await toPng(elementRef.current, { pixelRatio: 2 });

// WebP Export (via canvas conversion)
const blob = await toBlob(elementRef.current, { pixelRatio: 2 });
// Convert blob to canvas, then to WebP
canvas.toDataURL('image/webp', quality);
```

Export resolution: **2880x1800** (2x for retina)

### Z-Index Layering (MonitorFramePreview)

```
z-12: Monitor body (bezel)
z-10: Screen area
z-0:  Stand (behind monitor)
```

---

## Problems Solved

### 1. Responsive Preview Issue
**Problem**: 1440px fixed canvas unusable on smaller screens.
**Solution**: Created separate responsive preview component using percentage-based positioning.

### 2. Monitor Height Changing on Image Upload
**Problem**: Monitor body grew when image loaded due to `flex-1`.
**Solution**: Changed to absolute positioning with fixed percentage heights.

### 3. Blank Export Images
**Problem**: Off-screen elements (`-left-[9999px]`) not painted by browser.
**Solution**: Use 1px overflow-hidden wrapper instead of off-screen positioning.

### 4. Stand Behind Monitor
**Problem**: Stand appearing in front of monitor body.
**Solution**: Added z-index layering (z-12 for body, z-0 for stand).

---

## Dependencies

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "html-to-image": "^1.11.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.400.0"
  }
}
```

---

## Running the Project

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The app redirects `/` to `/generator` automatically.

---

## Future Considerations

- Additional mockup frames (MacBook, iPhone, etc.)
- Batch export functionality
- Custom frame colors
- More export formats (SVG, JPEG)
- Save/load presets
