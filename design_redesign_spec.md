# MapArt Studio Redesign Specification

## 1. Understanding Summary
* **What is being built:** A visual redesign of the MapArt Studio web application focusing on the CSS and styling layer.
* **Why it exists:** To modernize the interface, making it more attractive and accessible to a broader audience without losing functionality.
* **Who it is for:** Casual and creative users seeking a simple, aesthetically pleasing way to create custom map posters.
* **Key constraints:** Total responsiveness must be maintained. Control panels remain permanently visible. Redesign relies on CSS without significantly altering underlying application logic. 
* **Explicit non-goals:** No new logical features. No migration to complex frameworks (e.g., Tailwind or SCSS).

## 2. Assumptions & Constraints
* **Performance Fallbacks:** Devices with poor hardware acceleration for `backdrop-filter` will fall back gracefully to a solid, semi-transparent white or solid soft color to preserve framerates.
* **Architecture:** The current CSS architecture (`base.css`, `desktop.css`, `mobile.css`, `forms.css`) is maintained but refactored to consume a central set of CSS Variables.

## 3. Decision Log

### 3.1 Design Aesthetic
* **Decided:** Minimalist & Clean merged with Glassmorphism.
* **Considered:** Pure Minimalist, Elegant Dark Premium, Dynamic/Vibrant.
* **Why:** The combination allows the map to be the uncompromised center of attention (minimalist) while bringing a state-of-the-art technological and fluid feel to the UI (glassmorphism).

### 3.2 Primary Color Palette
* **Decided:** Warm & Inviting (Soft Coral / Terracotta tones).
* **Considered:** Cold & Techy (Blues), Monochromatic, Subtle Pastels.
* **Why:** Warm colors make the tool feel more creative, accessible, and human to a broad casual audience, contrasting nicely with the neutral translucent glass.

### 3.3 Layout Refinement
* **Decided:** Refined Current Structure (floating translucent panels permanently visible).
* **Considered:** Retractable drawers/Immersive full-screen overlay.
* **Why:** Retractable drawers could hide discoverability. A refined sidebar ensures tools are always accessible, but making them translucent prevents feeling claustrophobic, preserving screen real-estate perception.

### 3.4 Technical Implementation Approach
* **Decided:** Implementation via Centralized CSS Variables in `base.css`.
* **Considered:** Direct CSS patching of hardcoded values, Complete Framework Migration (Tailwind).
* **Why:** It offers maximum maintainability, allowing one-line tweaks for blur/colors across all viewports without the massive overhead of refactoring the HTML to support a framework.

## 4. Final Design CSS Architecture

The core variable structure in `base.css` will look like this:

```css
:root {
  /* Warm & Inviting Accent Colors */
  --color-primary: #f28b82; /* Soft Coral */
  --color-primary-hover: #e87b72;
  --color-primary-active: #d66a61;

  /* Neutrals for Minimalist UI */
  --color-surface-text: #2f2f2f;
  --color-surface-text-muted: #666666;

  /* Glassmorphism System */
  --glass-bg: rgba(255, 255, 255, 0.75);
  --glass-border: rgba(255, 255, 255, 0.4);
  --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
  --glass-blur: blur(12px);
  --glass-fallback-bg: #fdfdfd;
}
```

This will be applied systematically across `layout.css`, `desktop.css`, and `mobile.css` to update the sidebars, background elements, forms, and primary action buttons.
