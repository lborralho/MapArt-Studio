/**
 * SelectionHandles — visual overlay for the selected element.
 *
 * Renders a dashed selection border plus three interaction handles:
 *  - Rotation handle:  above the top-center edge (circular, with a stem line)
 *  - Left resize:      mid-left edge (square)
 *  - Right resize:     mid-right edge (square)
 *
 * The overlay container is positioned and rotated identically to the element
 * it wraps, so all child handle positions are automatically in the correct
 * rotated space — no trigonometry needed in CSS.
 *
 * Handles only appear for elements that support the interaction:
 *  - Rotation: all elements
 *  - Resize (L/R): elements with a `width` property (text, divider)
 */

import React, { type CSSProperties } from "react";
import type { EditorElement, ElementBounds } from "../domain/types";
import type {
  UseDragInteractionResult,
} from "../application/useDragInteraction";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const HANDLE_SIZE = 8; // px
const ROTATION_STEM = 24; // px — gap between selection border and rotation handle center
const BORDER_COLOR = "rgba(59,130,246,0.85)";
const HANDLE_BG = "#ffffff";

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

export interface SelectionHandlesProps {
  element: EditorElement;
  bounds: ElementBounds | undefined;
  posterWidth: number;
  posterHeight: number;
  drag: UseDragInteractionResult;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function SelectionHandles({
  element,
  bounds,
  posterWidth,
  posterHeight,
  drag,
}: SelectionHandlesProps) {
  if (!bounds || posterWidth === 0 || posterHeight === 0) return null;

  // Convert poster-% bounds to screen-px dimensions for the handle container
  const widthPx = (bounds.width / 100) * posterWidth;
  const heightPx = (bounds.height / 100) * posterHeight;

  const supportsResize = element.type !== "text-arc";

  const containerStyle: CSSProperties = {
    position: "absolute",
    left: `${bounds.cx}%`,
    top: `${bounds.cy}%`,
    width: `${widthPx}px`,
    height: `${heightPx}px`,
    transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
    transformOrigin: "center center",
    pointerEvents: "none",
    // Sit above canvas nodes (z-index relative to the .dc container)
    zIndex: 100,
  };

  const borderStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    border: `2px dashed ${BORDER_COLOR}`,
    borderRadius: 2,
    pointerEvents: "none",
  };

  // Rotation stem — a vertical line connecting the border to the handle
  const stemStyle: CSSProperties = {
    position: "absolute",
    left: "50%",
    bottom: "100%",
    width: 1,
    height: ROTATION_STEM,
    backgroundColor: BORDER_COLOR,
    transform: "translateX(-50%)",
    pointerEvents: "none",
  };

  // Base handle style (shared)
  const handleBase: CSSProperties = {
    position: "absolute",
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    backgroundColor: HANDLE_BG,
    border: `2px solid ${BORDER_COLOR}`,
    pointerEvents: "auto",
    boxSizing: "border-box",
    touchAction: "none",
  };

  const rotationHandleStyle: CSSProperties = {
    ...handleBase,
    borderRadius: "50%",
    left: "50%",
    bottom: `calc(100% + ${ROTATION_STEM}px)`,
    transform: "translateX(-50%)",
    cursor: "crosshair",
  };

  const resizeLeftStyle: CSSProperties = {
    ...handleBase,
    borderRadius: 2,
    left: 0,
    top: "50%",
    transform: "translate(-50%, -50%)",
    cursor: "ew-resize",
  };

  const resizeRightStyle: CSSProperties = {
    ...handleBase,
    borderRadius: 2,
    right: 0,
    top: "50%",
    transform: "translate(50%, -50%)",
    cursor: "ew-resize",
  };

  const rotHandlers = drag.getRotationHandleHandlers(element.id);
  const resizeLeftHandlers = drag.getResizeHandleHandlers(element.id, "left");
  const resizeRightHandlers = drag.getResizeHandleHandlers(element.id, "right");

  return (
    <div style={containerStyle}>
      {/* Selection border */}
      <div style={borderStyle} />

      {/* Rotation stem */}
      <div style={stemStyle} />

      {/* Rotation handle */}
      <div
        style={rotationHandleStyle}
        onPointerDown={rotHandlers.onPointerDown}
        onPointerMove={rotHandlers.onPointerMove}
        onPointerUp={rotHandlers.onPointerUp}
        onPointerCancel={rotHandlers.onPointerCancel}
      />

      {/* Resize handles */}
      {supportsResize && (
        <>
          <div
            style={resizeLeftStyle}
            onPointerDown={resizeLeftHandlers.onPointerDown}
            onPointerMove={resizeLeftHandlers.onPointerMove}
            onPointerUp={resizeLeftHandlers.onPointerUp}
            onPointerCancel={resizeLeftHandlers.onPointerCancel}
          />
          <div
            style={resizeRightStyle}
            onPointerDown={resizeRightHandlers.onPointerDown}
            onPointerMove={resizeRightHandlers.onPointerMove}
            onPointerUp={resizeRightHandlers.onPointerUp}
            onPointerCancel={resizeRightHandlers.onPointerCancel}
          />
        </>
      )}
    </div>
  );
}
