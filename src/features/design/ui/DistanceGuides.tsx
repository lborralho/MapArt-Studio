/**
 * DistanceGuides — Figma-style distance measurements between two elements.
 *
 * Renders dashed lines + pixel labels showing the gap between the active
 * (selected) element and a hovered element while ALT is held. Also outlines
 * the hovered element so the user can see what they're measuring against.
 *
 * Distances are computed from axis-aligned visual bounds and shown in poster
 * pixel space (same convention Figma uses for measurements).
 */

import { type CSSProperties, type ReactElement } from "react";
import type { ElementBounds } from "../domain/types";

interface DistanceGuidesProps {
  active: ElementBounds;
  hovered: ElementBounds;
  posterWidth: number;
  posterHeight: number;
}

const COLOR = "#ef4444";
const LABEL_BG = "#ef4444";
const LABEL_FG = "#ffffff";

const baseLabelStyle: CSSProperties = {
  position: "absolute",
  background: LABEL_BG,
  color: LABEL_FG,
  fontFamily: "monospace",
  fontSize: 10,
  fontWeight: 500,
  lineHeight: 1,
  padding: "2px 4px",
  borderRadius: 2,
  pointerEvents: "none",
  whiteSpace: "nowrap",
};

function hLine(top: number, left: number, length: number, key: string): ReactElement {
  return (
    <div
      key={key}
      style={{
        position: "absolute",
        top: `${top}%`,
        left: `${left}%`,
        width: `${length}%`,
        height: 0,
        borderTop: `1px dashed ${COLOR}`,
        pointerEvents: "none",
      }}
    />
  );
}

function vLine(top: number, left: number, length: number, key: string): ReactElement {
  return (
    <div
      key={key}
      style={{
        position: "absolute",
        top: `${top}%`,
        left: `${left}%`,
        width: 0,
        height: `${length}%`,
        borderLeft: `1px dashed ${COLOR}`,
        pointerEvents: "none",
      }}
    />
  );
}

function hLabel(yPct: number, xPct: number, text: string, key: string): ReactElement {
  return (
    <div
      key={key}
      style={{
        ...baseLabelStyle,
        top: `${yPct}%`,
        left: `${xPct}%`,
        transform: "translate(-50%, calc(-100% - 4px))",
      }}
    >
      {text}
    </div>
  );
}

function vLabel(yPct: number, xPct: number, text: string, key: string): ReactElement {
  return (
    <div
      key={key}
      style={{
        ...baseLabelStyle,
        top: `${yPct}%`,
        left: `${xPct}%`,
        transform: "translate(6px, -50%)",
      }}
    >
      {text}
    </div>
  );
}

export function DistanceGuides({
  active,
  hovered,
  posterWidth,
  posterHeight,
}: DistanceGuidesProps) {
  if (!posterWidth || !posterHeight) return null;
  if (active.width <= 0 || active.height <= 0) return null;
  if (hovered.width <= 0 || hovered.height <= 0) return null;

  const aL = active.cx - active.width / 2;
  const aR = active.cx + active.width / 2;
  const aT = active.cy - active.height / 2;
  const aB = active.cy + active.height / 2;
  const bL = hovered.cx - hovered.width / 2;
  const bR = hovered.cx + hovered.width / 2;
  const bT = hovered.cy - hovered.height / 2;
  const bB = hovered.cy + hovered.height / 2;

  const overlapX = aR > bL && bR > aL;
  const overlapY = aB > bT && bB > aT;

  const xPx = (d: number) => Math.round((d / 100) * posterWidth);
  const yPx = (d: number) => Math.round((d / 100) * posterHeight);

  const items: ReactElement[] = [];

  if (!overlapX || !overlapY) {
    // Gap mode — at least one axis has no overlap → show gap distance(s).
    if (!overlapX) {
      const aIsLeft = aR <= bL;
      const from = aIsLeft ? aR : bR;
      const to = aIsLeft ? bL : aL;
      const dist = Math.abs(to - from);
      const yLine = overlapY
        ? (Math.max(aT, bT) + Math.min(aB, bB)) / 2
        : active.cy;
      const left = Math.min(from, to);
      items.push(hLine(yLine, left, dist, "x-line"));
      items.push(hLabel(yLine, (from + to) / 2, `${xPx(dist)}px`, "x-label"));
    }
    if (!overlapY) {
      const aIsTop = aB <= bT;
      const from = aIsTop ? aB : bB;
      const to = aIsTop ? bT : aT;
      const dist = Math.abs(to - from);
      const xLine = overlapX
        ? (Math.max(aL, bL) + Math.min(aR, bR)) / 2
        : active.cx;
      const top = Math.min(from, to);
      items.push(vLine(top, xLine, dist, "y-line"));
      items.push(vLabel((from + to) / 2, xLine, `${yPx(dist)}px`, "y-label"));
    }
  } else {
    // Overlap mode — show signed offsets between matching edges (top, bottom,
    // left, right). Useful when one element contains or partially overlaps the
    // other (e.g. measuring inset within a container).
    const edges: Array<{
      orientation: "h" | "v";
      a: number;
      b: number;
      cross: number;
      key: string;
    }> = [
      { orientation: "h", a: aL, b: bL, cross: active.cy, key: "left" },
      { orientation: "h", a: aR, b: bR, cross: active.cy, key: "right" },
      { orientation: "v", a: aT, b: bT, cross: active.cx, key: "top" },
      { orientation: "v", a: aB, b: bB, cross: active.cx, key: "bottom" },
    ];

    for (const edge of edges) {
      const dist = Math.abs(edge.a - edge.b);
      if (dist < 0.05) continue;
      const lo = Math.min(edge.a, edge.b);
      const hi = Math.max(edge.a, edge.b);
      const mid = (edge.a + edge.b) / 2;
      if (edge.orientation === "h") {
        items.push(hLine(edge.cross, lo, hi - lo, `${edge.key}-line`));
        items.push(hLabel(edge.cross, mid, `${xPx(dist)}px`, `${edge.key}-label`));
      } else {
        items.push(vLine(lo, edge.cross, hi - lo, `${edge.key}-line`));
        items.push(vLabel(mid, edge.cross, `${yPx(dist)}px`, `${edge.key}-label`));
      }
    }
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 55,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: `${bL}%`,
          top: `${bT}%`,
          width: `${bR - bL}%`,
          height: `${bB - bT}%`,
          border: `1px solid ${COLOR}`,
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
      {items}
    </div>
  );
}
