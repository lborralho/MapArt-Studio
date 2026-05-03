/**
 * Pure coordinate math for the design editor.
 *
 * All functions operate in normalized poster space: 0–100 on both axes,
 * where (0,0) is the top-left corner and (100,100) is the bottom-right.
 * The canonical reference point for every element is its VISUAL CENTER.
 */

import type { DesignElement } from "./types";

// ─────────────────────────────────────────────────────────────
// Legacy → center conversion
// ─────────────────────────────────────────────────────────────

/**
 * Converts a legacy x/y/anchor element to a center-based (cx, cy) position.
 *
 * `estimatedHeightPercent` is required for accurate Y conversion when
 * anchorY is "top" or "bottom". Pass 0 when height is unknown — the
 * canvas node corrects cy after measuring the rendered bounds (Phase 2).
 */
export function normalizeElementCoords(
  element: Pick<DesignElement, "x" | "y" | "anchorX" | "anchorY" | "width">,
  estimatedHeightPercent = 0,
): { cx: number; cy: number } {
  const { x, y, anchorX = "center", anchorY = "center", width = 0 } = element;

  const cx =
    anchorX === "left" ? x + width / 2 :
    anchorX === "right" ? x - width / 2 :
    x;

  const cy =
    anchorY === "top" ? y + estimatedHeightPercent / 2 :
    anchorY === "bottom" ? y - estimatedHeightPercent / 2 :
    y;

  return { cx, cy };
}

// ─────────────────────────────────────────────────────────────
// Center → legacy conversion (export / canvas renderer compat)
// ─────────────────────────────────────────────────────────────

/**
 * Inverse of normalizeElementCoords.
 *
 * Used when writing cx/cy back to the legacy x/y format required by the
 * canvas export renderer (canvasRenderer.ts). Both widthPercent and
 * heightPercent must be known at call time (available after Phase 2 bounds
 * measurement).
 */
export function denormalizeElementCoords(
  cx: number,
  cy: number,
  anchorX: DesignElement["anchorX"] = "center",
  anchorY: DesignElement["anchorY"] = "center",
  widthPercent = 0,
  heightPercent = 0,
): { x: number; y: number } {
  const x =
    anchorX === "left" ? cx - widthPercent / 2 :
    anchorX === "right" ? cx + widthPercent / 2 :
    cx;

  const y =
    anchorY === "top" ? cy - heightPercent / 2 :
    anchorY === "bottom" ? cy + heightPercent / 2 :
    cy;

  return { x, y };
}

// ─────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────

/**
 * Clamps cx/cy so the element center stays within the poster canvas.
 * `margin` can push the valid zone inward (e.g. 5 keeps the center at least
 * 5% from each edge).
 */
export function clampToCanvas(
  cx: number,
  cy: number,
  margin = 0,
): { cx: number; cy: number } {
  return {
    cx: Math.max(margin, Math.min(100 - margin, cx)),
    cy: Math.max(margin, Math.min(100 - margin, cy)),
  };
}

/**
 * Converts a delta in poster-percentage units to the element's local space,
 * accounting for rotation. Used during drag to convert pointer movement into
 * the correct axis-aligned displacement (Phase 3).
 */
export function applyRotatedDelta(
  cx: number,
  cy: number,
  dx: number,
  dy: number,
  rotationDeg: number,
): { cx: number; cy: number } {
  if (rotationDeg === 0) return { cx: cx + dx, cy: cy + dy };
  const r = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  return {
    cx: cx + dx * cos + dy * sin,
    cy: cy - dx * sin + dy * cos,
  };
}

// ─────────────────────────────────────────────────────────────
// Snap engine (Phase 4)
// ─────────────────────────────────────────────────────────────

/** Distance (in poster %) within which a coordinate is pulled to a snap target. */
export const SNAP_THRESHOLD_PERCENT = 1.5;

/** Snap targets for the X axis — currently just the canvas center. */
const SNAP_TARGETS_X = [50] as const;

/** Snap targets for the Y axis — currently just the canvas center. */
const SNAP_TARGETS_Y = [50] as const;

export interface SnapResult {
  /** Possibly-snapped X coordinate. */
  cx: number;
  /** Possibly-snapped Y coordinate. */
  cy: number;
  /** The X target that was snapped to, or undefined. */
  snappedX?: number;
  /** The Y target that was snapped to, or undefined. */
  snappedY?: number;
}

/**
 * Applies center-axis snap to a candidate (cx, cy) position.
 *
 * Each axis is checked independently against its target list; the first
 * target within SNAP_THRESHOLD_PERCENT wins and the coordinate is pulled
 * exactly to that target.
 *
 * Pure function: no DOM access, no side effects.
 */
export function applyCanvasCenterSnap(cx: number, cy: number): SnapResult {
  let outCx = cx;
  let outCy = cy;
  let snappedX: number | undefined;
  let snappedY: number | undefined;

  for (const t of SNAP_TARGETS_X) {
    if (Math.abs(cx - t) <= SNAP_THRESHOLD_PERCENT) {
      outCx = t;
      snappedX = t;
      break;
    }
  }
  for (const t of SNAP_TARGETS_Y) {
    if (Math.abs(cy - t) <= SNAP_THRESHOLD_PERCENT) {
      outCy = t;
      snappedY = t;
      break;
    }
  }

  return { cx: outCx, cy: outCy, snappedX, snappedY };
}

/**
 * Computes the four corner points of a rotated bounding box.
 * All values in normalized poster space. Used by the snap engine (Phase 4).
 */
export function getRotatedCorners(
  cx: number,
  cy: number,
  width: number,
  height: number,
  rotationDeg: number,
): [
  topLeft: { x: number; y: number },
  topRight: { x: number; y: number },
  bottomRight: { x: number; y: number },
  bottomLeft: { x: number; y: number },
] {
  const hw = width / 2;
  const hh = height / 2;
  const r = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);

  const rotate = (lx: number, ly: number) => ({
    x: cx + lx * cos - ly * sin,
    y: cy + lx * sin + ly * cos,
  });

  return [
    rotate(-hw, -hh),
    rotate(+hw, -hh),
    rotate(+hw, +hh),
    rotate(-hw, +hh),
  ];
}
