/**
 * useTextMetrics — visual bounding box measurement for rendered elements.
 *
 * Strategy (two-pass hybrid):
 *
 *  Pass 1 — DOM:
 *    getBoundingClientRect() on the rendered node gives the full CSS layout
 *    box. This handles multi-line text-wrap, letter-spacing, and kerning
 *    natively — no need to reimplement CSS text layout.
 *
 *  Pass 2 — OffscreenCanvas:
 *    measureText('Ag') with the matching font spec returns
 *    actualBoundingBoxAscent + actualBoundingBoxDescent — the real ink
 *    metrics, independent of line-height.
 *    halfLeading = (lineHeightPx - inkHeightPx) / 2 is removed from the
 *    top and bottom of the CSS box.
 *
 *  Result: a bounding box that wraps the visible ink, not the line-height
 *  cage. Since topTrim === bottomTrim (symmetric half-leading), the visual
 *  center equals the CSS center — so translate(-50%, -50%) positioning
 *  remains correct without any extra offset.
 */

import { useLayoutEffect } from "react";
import type { RefObject } from "react";
import type { EditorElement, ElementBounds } from "../domain/types";

// ─────────────────────────────────────────────────────────────
// Pure ink-trim calculation
// ─────────────────────────────────────────────────────────────

interface InkTrim {
  topPercent: number;
  bottomPercent: number;
}

/**
 * Calculates the half-leading to trim from the CSS box.
 *
 * Returns { topPercent, bottomPercent } in normalized poster space (0–100).
 * Returns zeros on any error (font not loaded, OffscreenCanvas unsupported).
 */
export function computeInkTrim(
  element: EditorElement,
  posterHeightPx: number,
): InkTrim {
  const zero: InkTrim = { topPercent: 0, bottomPercent: 0 };
  if (posterHeightPx <= 0) return zero;
  // Dividers have no line-height leading — skip trim
  if (element.type === "divider" || element.type === "line") return zero;

  const fontSizePx = ((element.fontSize ?? 3) / 100) * posterHeightPx;
  const lineHeightMultiplier = element.lineHeight ?? 1.2;
  const lineHeightPx = lineHeightMultiplier * fontSizePx;

  try {
    const canvas = new OffscreenCanvas(1, 1);
    const ctx = canvas.getContext("2d");
    if (!ctx) return zero;

    // Build font spec matching the element's CSS
    const parts: string[] = [];
    if (element.fontStyle === "italic") parts.push("italic");
    parts.push(String(element.fontWeight ?? 400));
    parts.push(`${fontSizePx}px`);
    parts.push(`"${element.fontFamily ?? "sans-serif"}", sans-serif`);
    ctx.font = parts.join(" ");

    // 'Ag' measures both ascenders (A) and descenders (g)
    const m = ctx.measureText("Ag");
    const inkHeightPx = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    const halfLeadingPx = Math.max(0, (lineHeightPx - inkHeightPx) / 2);

    const trimPercent = (halfLeadingPx / posterHeightPx) * 100;
    return { topPercent: trimPercent, bottomPercent: trimPercent };
  } catch {
    return zero;
  }
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

/**
 * Measures the visual bounding box of `element` after every DOM update
 * and reports it via `onBounds`.
 *
 * Must be called with refs to the element's DOM node and the poster
 * container node. Both must be mounted before the measurement fires.
 */
export function useTextMetrics(
  nodeRef: RefObject<HTMLElement | SVGElement | null>,
  containerRef: RefObject<HTMLElement | null>,
  element: EditorElement,
  onBounds: (id: string, bounds: ElementBounds) => void,
): void {
  useLayoutEffect(() => {
    const node = nodeRef.current;
    const container = containerRef.current;
    if (!node || !container) return;

    const nodeRect = node.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    if (nodeRect.width === 0 || nodeRect.height === 0) return;

    // ── Convert CSS pixel box → normalized poster % ──────
    const cssLeft =
      ((nodeRect.left - containerRect.left) / containerRect.width) * 100;
    const cssTop =
      ((nodeRect.top - containerRect.top) / containerRect.height) * 100;
    const cssWidth = (nodeRect.width / containerRect.width) * 100;
    const cssHeight = (nodeRect.height / containerRect.height) * 100;

    // ── Right-trim phantom trailing letter-spacing ────────
    // CSS letter-spacing adds a gap AFTER the last character, making
    // getBoundingClientRect() wider than the actual ink. Subtract it.
    let visualWidth = cssWidth;
    if (element.letterSpacing != null && element.letterSpacing !== 0) {
      const fontSizePx = ((element.fontSize ?? 3) / 100) * containerRect.height;
      const trailingPx = element.letterSpacing * fontSizePx;
      visualWidth = Math.max(0.01, cssWidth - (trailingPx / containerRect.width) * 100);
    }

    // ── Remove half-leading from top and bottom ───────────
    const trim = computeInkTrim(element, containerRect.height);
    const visualHeight = Math.max(0.01, cssHeight - trim.topPercent - trim.bottomPercent);

    // topTrim === bottomTrim → visual center === CSS center (no cy correction).
    // The trailing space is right-only, so cx shifts left by half the trimmed amount.
    const cx = cssLeft + visualWidth / 2;
    const cy = cssTop + trim.topPercent + visualHeight / 2;

    onBounds(element.id, {
      cx,
      cy,
      width: visualWidth,
      height: visualHeight,
      rotation: element.rotation,
    });
  });
}
