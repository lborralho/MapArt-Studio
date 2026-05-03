/* ────── Design Template Types ────── */

/**
 * Shape used to mask the map within the poster.
 * - `rect`: Standard rectangular (no mask).
 * - `circle`: Circular mask centered in the poster.
 * - `heart`: Heart-shaped SVG path mask.
 */
export type DesignMaskShape = "rect" | "circle" | "heart";

/**
 * Element kinds that a design template can render on top of the map.
 */
export type DesignElementType =
  | "text"
  | "line"
  | "divider"
  | "coordinates"
  | "text-arc";

/**
 * Coordinate display format.
 * - `dms`: degree-minute-second with hemisphere letter.
 * - `decimal-line`: decimal degrees on a single line ("38.779° N / 9.268° W").
 * - `decimal-stack`: decimal degrees split onto two lines.
 */
export type DesignCoordsFormat = "dms" | "decimal-line" | "decimal-stack";

/**
 * Decimal precision for coordinate display.
 */
export type DesignCoordsPrecision = 3 | 4 | 5;

/**
 * A single overlay element positioned on the poster.
 * Coordinates are normalized (0–100) relative to the poster dimensions.
 */
export interface DesignElement {
  /** Unique key for this element within its template. */
  id: string;

  /** The kind of element. */
  type: DesignElementType;

  /** Normalized X position (0 = left, 100 = right). */
  x: number;
  /** Normalized Y position (0 = top, 100 = bottom). */
  y: number;

  /** Normalized width (0–100). Used by lines/dividers and to constrain text. */
  width?: number;

  /**
   * How the element is anchored relative to (x, y).
   * Defaults to "center" on both axes.
   */
  anchorX?: "left" | "center" | "right";
  anchorY?: "top" | "center" | "bottom";

  /** Text content or template variable like `{{city}}`. */
  content?: string;

  /** Font size relative to poster height (percentage). */
  fontSize?: number;

  /** Font weight (e.g. 300, 400, 700). */
  fontWeight?: number;

  /** Per-element font family override (defaults to template/global font). */
  fontFamily?: string;

  /** Italic / normal toggle. */
  fontStyle?: "normal" | "italic";

  /** Text alignment. */
  textAlign?: "left" | "center" | "right";

  /** Letter spacing in em units. */
  letterSpacing?: number;

  /** Text transform. */
  textTransform?: "none" | "uppercase" | "lowercase";

  /** Line height multiplier (defaults to 1.2). */
  lineHeight?: number;

  /** Per-element opacity (0–1). */
  opacity?: number;

  /** Explicit color override (any CSS color). Falls back to theme text color. */
  color?: string;

  /** Line/divider thickness relative to poster height (percentage). */
  strokeWidth?: number;

  /**
   * If true, the user can edit this element's content in the sidebar.
   * Defaults to false.
   */
  editable?: boolean;

  /** Friendly label shown in the override editor (defaults to a humanized id). */
  editLabel?: string;

  /** Coordinate display format (only relevant for `coordinates`). */
  coordsFormat?: DesignCoordsFormat;

  /** Decimal precision for `decimal-*` formats. */
  coordsPrecision?: DesignCoordsPrecision;

  /** Optional separator between lat/lon for `decimal-line`. Defaults to " / ". */
  coordsSeparator?: string;

  /* ── text-arc only ── */

  /** Arc radius in % of poster min(width,height). */
  arcRadius?: number;

  /** Arc center X in % (defaults to 50). */
  arcCenterX?: number;

  /** Arc center Y in % (defaults to 50). */
  arcCenterY?: number;

  /**
   * Mid-angle of the arc in degrees, measured clockwise from 12 o'clock.
   * 0 = top, 90 = right, 180 = bottom, 270 = left. Defaults to 0 (top).
   */
  arcMidAngle?: number;

  /** Total angular span of the arc in degrees. Defaults to 120. */
  arcSpan?: number;

  /** Rotation in degrees clockwise. 0 = upright. Defaults to 0. */
  rotation?: number;
}

/**
 * Visual effects applied to the map or mask.
 */
export interface DesignEffects {
  /** Gaussian blur glow around the mask edge (px relative to poster). */
  glowRadius?: number;
  /** Glow color (defaults to theme background). */
  glowColor?: string;
  /** Drop shadow on the map area. */
  shadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
}

/**
 * Default style overrides for a design template.
 */
export interface DesignStyles {
  /** Default font family for text elements (can be overridden per-element). */
  fontFamily?: string;
  /** Whether to use theme text color for all elements. */
  useThemeTextColor?: boolean;
  /** Background padding around the map area (0–100 normalized). */
  mapPadding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Decorative marker rendered at the visual center of the map area.
 * Independent from user-added geo markers (those live in the markers feature).
 */
export type DesignCenterMarkerType = "none" | "dot" | "ring" | "heart" | "pin";

export interface DesignCenterMarker {
  type: DesignCenterMarkerType;
  /** CSS color. Falls back to theme text color when omitted. */
  color?: string;
  /** Outer size in % of poster height. Defaults vary by marker type. */
  size?: number;
  /** Optional outline for contrast (px relative to poster). */
  outlineColor?: string;
  outlineWidth?: number;
}

/**
 * A complete design template configuration.
 * Each template defines how the poster looks: mask shape,
 * text overlays, and visual effects.
 */
export interface DesignTemplate {
  /** Unique identifier for this design. */
  id: string;
  /** Human-readable name shown in the UI. */
  name: string;
  /** Short description for the UI. */
  description: string;
  /** SVG thumbnail for the design selector (inline SVG string). */
  thumbnail: string;
  /** Map mask shape. */
  mask: DesignMaskShape;
  /** Overlay elements (text, lines, dividers). */
  elements: DesignElement[];
  /** Visual effects (glow, shadow). */
  effects: DesignEffects;
  /** Default style configuration. */
  styles: DesignStyles;
  /** Optional decorative marker at the visual center of the map. */
  centerMarker?: DesignCenterMarker;
}

/**
 * Per-element overrides the user can apply in the design editor.
 * Every field is optional — only the keys that differ from the template are stored.
 */
export interface DesignElementOverride {
  content?: string;
  x?: number;
  y?: number;
  color?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  letterSpacing?: number;
  opacity?: number;
  width?: number;
  strokeWidth?: number;
  arcRadius?: number;
  arcMidAngle?: number;
  arcSpan?: number;
  arcCenterX?: number;
  arcCenterY?: number;
  coordsFormat?: DesignCoordsFormat;
  coordsPrecision?: DesignCoordsPrecision;
  textAlign?: "left" | "center" | "right";
  textTransform?: "none" | "uppercase" | "lowercase";
  fontStyle?: "normal" | "italic";
  lineHeight?: number;

  /**
   * Center X override — canonical editor format.
   * Takes precedence over legacy `x` field when both are present.
   */
  cx?: number;
  /**
   * Center Y override — canonical editor format.
   * Takes precedence over legacy `y` field when both are present.
   */
  cy?: number;
  /** Rotation override in degrees clockwise. */
  rotation?: number;
}

/**
 * User overrides for a specific design's elements.
 * Maps element IDs to their override values.
 */
export type DesignOverrides = Record<string, DesignElementOverride>;

/** A DesignElement with template variables resolved to their actual values. */
export type ResolvedDesignElement = DesignElement & { content: string };

// ─────────────────────────────────────────────────────────────
// Editor runtime types (Phase 1+)
// ─────────────────────────────────────────────────────────────

/**
 * Visual bounding box of a rendered element in normalized poster space (0–100).
 * Populated by canvas nodes after first render (Phase 2).
 */
export interface ElementBounds {
  /** Center X of the visual box (0–100% of poster width). */
  cx: number;
  /** Center Y of the visual box (0–100% of poster height). */
  cy: number;
  /** Visual width (0–100% of poster width). */
  width: number;
  /** Visual height (0–100% of poster height). */
  height: number;
  /** Rotation in degrees clockwise. */
  rotation: number;
}

/**
 * Template variable values used to resolve {{city}}, {{country}}, etc.
 * in element content strings at render time.
 */
export interface TemplateVars {
  city: string;
  country: string;
  continent: string;
  lat: number;
  lon: number;
}

/**
 * Bounding box of the map mask area, in normalized poster space (0–100%).
 * Used to generate snap lines at the mask's edges and center.
 */
export interface MapBounds {
  top: number;
  bottom: number;
  left: number;
  right: number;
  cx: number;
  cy: number;
}

/**
 * Canonical runtime representation of a design element inside the editor.
 *
 * Key invariants:
 * - cx/cy are the VISUAL CENTER in normalized poster space (0–100).
 * - The legacy x/y/anchorX/anchorY fields are stripped — all positional
 *   math goes through cx/cy from this point forward.
 * - content is always resolved (no {{vars}} placeholders remain).
 * - bounds is populated after the first DOM render (Phase 2).
 */
export type EditorElement = Omit<
  DesignElement,
  "x" | "y" | "anchorX" | "anchorY" | "content"
> & {
  /** Visual center X (0–100% of poster width). */
  cx: number;
  /** Visual center Y (0–100% of poster height). */
  cy: number;
  /** Rotation in degrees clockwise. Always defined (defaults to 0). */
  rotation: number;
  /** Content with template variables resolved to their actual values. */
  content: string;
  /** Computed visual bounds — populated after first render by the canvas node. */
  bounds?: ElementBounds;
};
