---
name: Skull King Scorer
description: A minimalist, distraction-free score keeping application for the Skull King card game.
colors:
  neutral-bg: "#041424" # Abyssal Deep
  neutral-card: "#1b2b3b" # Cabin Slate
  neutral-dark: "#0c1d2c" # Dark Void
  accent-gold: "#fabd04" # Skull King Gold
  accent-apricot: "#f0bd8b" # Apricot Amber
  neutral-ice: "#d3e4fa" # Icy Mist
  neutral-slate: "#c4c6cc" # Slate Mist
  accent-coral: "#ffb3ae" # Rose Coral
typography:
  display:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.5rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.1em"
rounded:
  sm: "6px"
  md: "12px"
  lg: "16px"
  xl: "24px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent-gold}"
    textColor: "#261a00"
    rounded: "{rounded.lg}"
    padding: "16px 20px"
  button-primary-hover:
    backgroundColor: "#ffc61a"
  button-secondary:
    backgroundColor: "{colors.neutral-card}"
    textColor: "{colors.neutral-ice}"
    rounded: "{rounded.lg}"
    padding: "16px 20px"
  card:
    backgroundColor: "{colors.neutral-card}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: Skull King Scorer

## 1. Overview

**Creative North Star: "Abyssal Precision"**

Abyssal Precision represents a design philosophy where visual clutter is completely eliminated to focus on high-speed, distraction-free scoring. The interface is optimized for ambient low-light face-to-face game settings, adopting a premium, native-feeling iOS dark mode. 

Every design decision is built to minimize cognitive load during game sessions. The system completely rejects heavy decorative pirate illustrations, paper/parchment textures, and generic, bright-colored SaaS layouts in favor of clean geometric structures, strong functional color accents, and crisp typography.

**Key Characteristics:**
* **True Dark Focus:** Deep dark blues and blacks for ultimate eye comfort during late-night gaming.
* **Typographic Order:** A clean contrast between high-character headings and highly readable sans-serif labels.
* **Tactile Interactions:** Subtle spring physics and instant active scaling on press states to build a physical connection with the user.

## 2. Colors

The color palette is built on deep maritime darks with rich gold and coral highlights representing game concepts.

### Primary
* **Skull King Gold** (`#fabd04`): Represents gold coins and main primary actions. Used exclusively for primary buttons, confirm states, and first-place metrics.

### Neutral
* **Abyssal Deep** (`#041424`): Canonical body background. Deep navy-black.
* **Cabin Slate** (`#1b2b3b`): Primary surface for cards, collapsible blocks, and modals.
* **Dark Void** (`#0c1d2c`): Deep slate-black for input background fields.
* **Icy Mist** (`#d3e4fa`): Soft ice blue for primary readable body text.
* **Slate Mist** (`#c4c6cc`): Medium-contrast gray for secondary labels, hints, and borders.

### Accents
* **Apricot Amber** (`#f0bd8b`): Warm amber for warning subtitles, game context variables, and round numbers.
* **Rose Coral** (`#ffb3ae`): Soft coral-red for negative metrics, destructive elements (leaving rooms, kicking players), or the Kraken.

### Named Rules
**The 10% Accent Rule.** Skull King Gold is reserved for primary actions. The total surface area of Gold on any given screen must not exceed 10% to ensure it acts as a visual anchor rather than a distraction.

## 3. Typography

**Display Font:** Plus Jakarta Sans (with system-serif fallback)
**Body Font:** Inter (with system-sans fallback)
**Label/Mono Font:** JetBrains Mono (with system-monospace fallback)

**Character:** Plus Jakarta Sans provides geometric, bold display characteristics, while Inter serves as a highly legible, clean text face. JetBrains Mono is used for slash counts, player points, and slash-zero room codes.

### Hierarchy
* **Display** (ExtraBold (800), `clamp(2rem, 5vw, 3.5rem)`, `1.1` line-height): Used for game titles, screen titles, and final leaderboard totals.
* **Headline** (Bold (700), `1.875rem` (30px), `1.25` line-height): Section headers.
* **Title** (SemiBold (600), `1.25rem` (20px), `1.35` line-height): Card headings, player list names.
* **Body** (Regular (400), `1rem` (16px), `1.5` line-height): General paragraphs, rules text. Limit line length to 65ch.
* **Label** (Medium (500), `0.75rem` (12px), `0.1em` letter-spacing, uppercase): Auxiliary headers, game metadata labels.

## 4. Elevation

The system utilizes structural layering with soft ambient drop shadows to establish visual hierarchy.

### Shadow Vocabulary
* **Modal Glow** (`box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(250,189,4,0.15)`): Used on floating modals to isolate them from the gameplay sheet.
* **Card Glow** (`box-shadow: 0 4px 15px rgba(0,0,0,0.2)`): Used on interactive elements at rest.

### Named Rules
**State-Based Elevation Rule.** Tarjeta elements stay flat at rest, with depth indicated purely by border outlines. Shadow elevation emerges dynamically as a feedback response to user hovers or state changes.

## 5. Components

### Buttons
* **Shape:** Rounded-lg (`16px` border radius)
* **Primary:** Saturated Skull King Gold gradient background, dark text (`#261a00`), padding (`16px 20px`).
* **Active State:** Scale down to `0.97` with a spring response.
* **Secondary:** Cabin Slate background (`#1b2b3b`), Icy Mist text, border (`1px solid #44474c`).

### Cards / Containers
* **Corner Style:** Rounded-lg (`16px` border-radius).
* **Background:** Cabin Slate background (`#1b2b3b`).
* **Border:** Thin boundary outline (`1px solid #44474c/30`).
* **Internal Padding:** `24px` on mobile, scaling to `32px` on tablet viewports.

### Inputs / Fields
* **Style:** Cabin Slate (`#1b2b3b`) or Dark Void (`#0c1d2c`) backgrounds, thin border, Icy Mist text.
* **Focus State:** Thick border outline highlight and high contrast text focus ring.

### Navigation
* **Mobile Menu Drawer:** Slides from the right with a full viewport height, utilizing a spring curve (`damping: 25, stiffness: 200`).

## 6. Do's and Don'ts

### Do:
* **Do** use `active:scale-[0.97]` on pressable interactive components.
* **Do** keep display headings line letter-spacing at or above `-0.02em`.
* **Do** write room codes with slashed-zero typography to prevent player readability errors.

### Don't:
* **Don't** use card border radii larger than `24px` to avoid "insanely rounded" appearance.
* **Don't** use sketchy SVG doodles or hand-drawn illustrations.
* **Don't** add side-stripe colored accent borders on cards or list alerts.
* **Don't** use text gradient fill properties (`background-clip: text`).
* **Don't** use warm cream (`#faf7f2`), parchment, or beige colors for backgrounds.
