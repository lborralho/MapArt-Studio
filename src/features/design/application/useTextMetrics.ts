/**
 * useTextMetrics — visual bounding box measurement for rendered elements.
 *
 * Strategy (two-pass hybrid):
 *
 *  Pass 1 — DOM:
 *    getBoundingClientRect() on the rendered node gives the full CSS layout
 *    box. We then read the computed paddingLeft / paddingRight to find the
 *    inner content area, and subtract trailing letter-spacing from the right
 *    edge to get the actual ink extent.
 *
 *    Why paddingLeft matters: TextNode applies `padding-left: ${ls}em` for
 *    text-align:center + letter-spacing as a visual-centering hack. Without
 *    accounting for it here, bounds.cx is off by trailing/2 and alignment
 *    buttons + snap guides place text off-center.
 *
 *  Pass 2 — OffscreenCanvas:
 *    measureText('Ag') with the matching font spec returns
 *    actualBoundingBoxAscent + actualBoundingBoxDescent — the real ink
 *    metrics, independent of line-height. Half-leading is removed from
 *    the top and bottom of the CSS box symmetrically, so the visual
 *    vertical center equals the CSS box vertical center.
 *
 *  Result: a bounding box that wraps the visible ink. Both the X and Y
 *  centers are reported in normalized poster space (0-100%) so alignment
 *  and snap math can compensate via vOffX/Y = bounds.cx/y - element.cx/y.
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
    if (containerRect.width === 0 || containerRect.height === 0) return;

    // ── Read computed paddings (TextNode adds padding-left for centered
    //     text with letter-spacing as a visual-centering hack) ─────────
    let padLeftPx = 0;
    let padRightPx = 0;
    if (node instanceof Element) {
      const cs = window.getComputedStyle(node);
      padLeftPx = parseFloat(cs.paddingLeft) || 0;
      padRightPx = parseFloat(cs.paddingRight) || 0;
    }

    // ── Trailing letter-spacing in pixels (CSS adds gap after EVERY char,
    //     including the last — getBoundingClientRect includes that gap) ─
    const fontSizePx = ((element.fontSize ?? 3) / 100) * containerRect.height;
    const trailingPx =
      element.letterSpacing != null && element.letterSpacing !== 0
        ? element.letterSpacing * fontSizePx
        : 0;

    // ── Compute visual ink bounds in pixels ──────────────────
    // inkLeft   = boxLeft + paddingLeft           (text starts after padding)
    // inkRight  = boxRight - paddingRight - trail (last char's trailing gap is invisible)
    const inkLeftPx = nodeRect.left + padLeftPx;
    const inkRightPx = nodeRect.right - padRightPx - trailingPx;
    const inkWidthPx = Math.max(0.01, inkRightPx - inkLeftPx);

    // ── Convert pixels → normalized poster % ─────────────────
    const cssTop = ((nodeRect.top - containerRect.top) / containerRect.height) * 100;
    const cssHeight = (nodeRect.height / containerRect.height) * 100;
    const inkLeftPct = ((inkLeftPx - containerRect.left) / containerRect.width) * 100;
    const visualWidth = (inkWidthPx / containerRect.width) * 100;

    // ── Remove half-leading from top and bottom ──────────────
    const trim = computeInkTrim(element, containerRect.height);
    const visualHeight = Math.max(0.01, cssHeight - trim.topPercent - trim.bottomPercent);

    // topTrim === bottomTrim → visual vertical center === CSS box center.
    const cx = inkLeftPct + visualWidth / 2;
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
