/**
 * useDragInteraction — pointer-event state machine for the design canvas.
 *
 * Handles three interaction modes, all sharing the same RAF update loop:
 *
 *  drag   — translates cx/cy. Delta computed from snapshot to avoid drift.
 *  rotate — updates rotation angle using atan2 from element center.
 *  resize — projects screen delta onto the element's LOCAL axis (R⁻¹(θ) matrix)
 *           to compute width change and compensating center shift.
 *
 * Stability contract:
 *  - All shared handlers (handlePointerMove, handlePointerUp, handlePointerCancel)
 *    and scheduleUpdate are STABLE across renders — they read the latest handle
 *    via handleRef instead of closing over it. This prevents the callback
 *    recreation chain that occurred 60×/sec during drags when handle changed.
 *  - latestPointerRef: written on every pointermove, read once per RAF.
 *  - setPointerCapture ensures drag continuity even if pointer leaves element.
 */

import { useRef, useCallback, useState } from "react";
import type { RefObject } from "react";
import type { UseDesignEditorResult, LiveElementState } from "./useDesignEditor";
import { clampToCanvas } from "../domain/coords";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

/** Drag doesn't start until the pointer moves beyond this threshold (px). */
const DRAG_THRESHOLD = 4;

/** Snap attraction radius in screen pixels. */
const SNAP_PX = 5;

export type ResizeHandle = "left" | "right";

type DragMode = "pending" | "drag" | "rotate" | ResizeHandle;

interface DragSnapshot {
  cx: number;
  cy: number;
  rotation: number;
  width: number;
  /**
   * Offset from element.cx (CSS center) to bounds.cx (visual ink center).
   * Non-zero for text with letterSpacing — the trailing gap shifts bounds.cx left.
   * Constant during drag since font properties don't change.
   */
  visualOffsetX: number;
}

interface DragState {
  mode: DragMode;
  elementId: string;
  pointerId: number;
  /** Screen-space pointer position at interaction start (for delta computation). */
  pointerStart: { x: number; y: number };
  /** Element state at interaction start — always computed from snapshot, never incrementally. */
  snapshot: DragSnapshot;
  /** Element center in screen px at drag start (for rotation angle calculation). */
  centerScreen: { x: number; y: number };
}

export interface ElementHandlers {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
}

export interface ActiveSnaps {
  x?: number;
  y?: number;
}

export interface UseDragInteractionResult {
  /** Current interaction mode — used to set cursor styles in the canvas. */
  activeMode: DragMode | null;
  /** Active snap lines during a drag — used to render SnapGuides. */
  activeSnaps: ActiveSnaps;
  /** Spread onto each draggable element node. */
  getNodeHandlers: (elementId: string) => ElementHandlers;
  /** Spread onto the rotation handle. */
  getRotationHandleHandlers: (elementId: string) => ElementHandlers;
  /** Spread onto left/right resize handles. */
  getResizeHandleHandlers: (elementId: string, side: ResizeHandle) => ElementHandlers;
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

export function useDragInteraction(
  containerRef: RefObject<HTMLDivElement | null>,
  handle: UseDesignEditorResult,
): UseDragInteractionResult {
  const dragStateRef = useRef<DragState | null>(null);
  const [activeMode, setActiveMode] = useState<DragMode | null>(null);
  const [activeSnaps, setActiveSnaps] = useState<ActiveSnaps>({});

  // Always-current handle — prevents stale closure issues in stable callbacks.
  // Every render writes the latest handle here; stable callbacks read through it.
  const handleRef = useRef(handle);
  handleRef.current = handle;

  // Latest pointer position — written on every pointermove, read once per RAF
  const latestPointerRef = useRef({ x: 0, y: 0 });
  // Pending RAF id — prevents scheduling more than one frame at a time
  const rafRef = useRef(0);

  // ── Container helper ─────────────────────────────────────
  const getContainerRect = useCallback(
    () => containerRef.current?.getBoundingClientRect() ?? null,
    [containerRef],
  );

  // ── RAF update ─────────────────────────────────────────────
  // Stable: depends only on getContainerRect (not handle).
  // Reads handle through handleRef to always use the latest version.
  const scheduleUpdate = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const drag = dragStateRef.current;
      if (!drag || drag.mode === "pending") return;

      const rect = getContainerRect();
      if (!rect) return;

      const W = rect.width;
      const H = rect.height;
      if (W === 0 || H === 0) return;

      const ptr = latestPointerRef.current;

      // All deltas computed from the SNAPSHOT (not incremental) to eliminate drift
      const dx = ptr.x - drag.pointerStart.x; // screen px delta
      const dy = ptr.y - drag.pointerStart.y;

      let update: LiveElementState = {};

      if (drag.mode === "drag") {
        const { cx: rawCx, cy: rawCy } = clampToCanvas(
          drag.snapshot.cx + (dx / W) * 100,
          drag.snapshot.cy + (dy / H) * 100,
        );

        // ── Build X and Y snap line sets ──────────────────────────────
        // Always include the canvas centre. Add map mask edges + centre.
        // Add left / centre / right of every inactive element.
        const xLines: number[] = [50];
        const yLines: number[] = [50];

        const h = handleRef.current;
        const mb = h.mapBounds;
        if (mb) {
          xLines.push(mb.left, mb.cx, mb.right);
          yLines.push(mb.top, mb.cy, mb.bottom);
        }
        for (const el of h.resolvedElements) {
          if (el.id === drag.elementId) continue;
          const b = h.getBounds(el.id);
          if (!b) continue;
          xLines.push(b.cx - b.width / 2, b.cx, b.cx + b.width / 2);
          yLines.push(b.cy - b.height / 2, b.cy, b.cy + b.height / 2);
        }

        // ── Active element half-extents (poster %) ────────────────────
        const ab = h.getBounds(drag.elementId);
        const halfW = (ab?.width ?? drag.snapshot.width) / 2;
        const halfH = (ab?.height ?? 2) / 2;

        // ── Visual center may differ from rawCx due to letter-spacing trim ─
        // bounds.cx is the ink center; element.cx (rawCx) is the CSS center.
        // The offset is constant for this element (font props don't change during drag).
        const vOff = drag.snapshot.visualOffsetX;
        const visualCx = rawCx + vOff;

        // ── Threshold in poster % (pixel-space, so scale by container) ─
        const xThresh = (SNAP_PX / W) * 100;
        const yThresh = (SNAP_PX / H) * 100;

        // ── Find best snap on each axis (left edge | centre | right edge) ─
        // Compare against visualCx so guides fire at the correct ink boundary.
        // When snapping, write back element.cx = snapped_visual_cx - vOff.
        const snaps: ActiveSnaps = {};
        let snappedCx = rawCx;
        let snappedCy = rawCy;

        let bestX = xThresh;
        for (const line of xLines) {
          const dL = Math.abs((visualCx - halfW) - line);
          if (dL < bestX) { bestX = dL; snaps.x = line; snappedCx = line + halfW - vOff; }
          const dC = Math.abs(visualCx - line);
          if (dC < bestX) { bestX = dC; snaps.x = line; snappedCx = line - vOff; }
          const dR = Math.abs((visualCx + halfW) - line);
          if (dR < bestX) { bestX = dR; snaps.x = line; snappedCx = line - halfW - vOff; }
        }

        let bestY = yThresh;
        for (const line of yLines) {
          const dT = Math.abs((rawCy - halfH) - line);
          if (dT < bestY) { bestY = dT; snaps.y = line; snappedCy = line + halfH; }
          const dC = Math.abs(rawCy - line);
          if (dC < bestY) { bestY = dC; snaps.y = line; snappedCy = line; }
          const dB = Math.abs((rawCy + halfH) - line);
          if (dB < bestY) { bestY = dB; snaps.y = line; snappedCy = line - halfH; }
        }

        setActiveSnaps(snaps);
        update = { cx: snappedCx, cy: snappedCy };

      } else if (drag.mode === "rotate") {
        // Angle from element center to current pointer vs. angle to initial pointer.
        // Both measured in screen-pixel space so CSS rotation stays consistent.
        const currentAngle = Math.atan2(
          ptr.y - drag.centerScreen.y,
          ptr.x - drag.centerScreen.x,
        );
        const startAngle = Math.atan2(
          drag.pointerStart.y - drag.centerScreen.y,
          drag.pointerStart.x - drag.centerScreen.x,
        );
        const rotation =
          drag.snapshot.rotation + (currentAngle - startAngle) * (180 / Math.PI);
        update = { rotation };

      } else if (drag.mode === "left" || drag.mode === "right") {
        // ── Resize: project screen delta onto element's LOCAL X axis ──
        //
        // The inverse rotation matrix R(-θ) maps global screen deltas into
        // the element's local coordinate frame:
        //
        //   localDX = dx·cos θ + dy·sin θ
        //   localDY = -dx·sin θ + dy·cos θ
        //
        // We only need localDX for left/right handle resize.
        const θ = (drag.snapshot.rotation * Math.PI) / 180;
        const cosθ = Math.cos(θ);
        const sinθ = Math.sin(θ);

        // Screen-pixel projection onto element's local X axis
        const localDX = dx * cosθ + dy * sinθ;

        // Right handle: width grows in the +local-X direction; left handle: inverted
        const sign = drag.mode === "right" ? 1 : -1;
        const deltaWidthPercent = sign * (localDX / W) * 100;
        const newWidth = Math.max(2, drag.snapshot.width + deltaWidthPercent);

        // Center shifts by HALF the width delta along the element's local X direction
        // so the OPPOSITE edge stays fixed.
        // localDX/2 px in local X → rotate back to global screen px → convert to poster%
        const halfDeltaPx = (sign * localDX) / 2;
        const newCx = drag.snapshot.cx + (halfDeltaPx * cosθ / W) * 100;
        const newCy = drag.snapshot.cy + (halfDeltaPx * sinθ / H) * 100;

        update = { cx: newCx, cy: newCy, width: newWidth };
      }

      handleRef.current.setLiveState(drag.elementId, update);
    });
  }, [getContainerRect, setActiveSnaps]); // setActiveSnaps is stable (React guarantee)

  // ── Shared pointer-move handler ───────────────────────────
  // Stable: depends only on scheduleUpdate (which is also stable).
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragStateRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;

      // Prevent browser pan/scroll from stealing the pointer on touch devices
      e.preventDefault();

      // Upgrade 'pending' → 'drag' once the threshold is exceeded
      if (drag.mode === "pending") {
        const dist = Math.hypot(
          e.clientX - drag.pointerStart.x,
          e.clientY - drag.pointerStart.y,
        );
        if (dist < DRAG_THRESHOLD) return;
        dragStateRef.current = { ...drag, mode: "drag" };
        setActiveMode("drag");
      }

      latestPointerRef.current = { x: e.clientX, y: e.clientY };
      scheduleUpdate();
    },
    [scheduleUpdate],
  );

  // ── Shared pointer-up handler — stable (reads handle through ref) ─
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragStateRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;

      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;

      if (drag.mode === "pending") {
        // No movement beyond threshold → this was a selection click
        handleRef.current.selectElement(drag.elementId);
      } else {
        handleRef.current.commitLiveState(drag.elementId);
      }

      dragStateRef.current = null;
      setActiveMode(null);
      setActiveSnaps({});
    },
    [setActiveSnaps], // stable — reads handle through handleRef; setActiveSnaps is stable
  );

  // ── Shared pointer-cancel handler — stable ───────────────
  const handlePointerCancel = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragStateRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;

      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;

      handleRef.current.cancelLiveState(drag.elementId);
      dragStateRef.current = null;
      setActiveMode(null);
      setActiveSnaps({});
    },
    [setActiveSnaps], // stable — reads handle through handleRef; setActiveSnaps is stable
  );

  // ── Snapshot helper — stable (reads resolvedElements through ref) ─
  const buildSnapshot = useCallback(
    (elementId: string): DragSnapshot | null => {
      const el = handleRef.current.resolvedElements.find((e) => e.id === elementId);
      if (!el) return null;
      const bounds = handleRef.current.getBounds(elementId);
      return {
        cx: el.cx,
        cy: el.cy,
        rotation: el.rotation,
        width: el.width ?? 50,
        visualOffsetX: bounds ? bounds.cx - el.cx : 0,
      };
    },
    [], // stable — reads resolvedElements through handleRef
  );

  const buildCenterScreen = useCallback(
    (snapshot: DragSnapshot): { x: number; y: number } => {
      const rect = getContainerRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: rect.left + (snapshot.cx / 100) * rect.width,
        y: rect.top + (snapshot.cy / 100) * rect.height,
      };
    },
    [getContainerRect],
  );

  // ── Public handler factories ──────────────────────────────
  // These are now stable because all their dependencies are stable.

  const getNodeHandlers = useCallback(
    (elementId: string): ElementHandlers => ({
      onPointerDown: (e: React.PointerEvent) => {
        // Only respond to primary pointer (left button / first touch)
        if (e.button !== 0 && e.pointerType === "mouse") return;
        e.stopPropagation();
        e.preventDefault();

        const snapshot = buildSnapshot(elementId);
        if (!snapshot) return;

        (e.currentTarget as Element).setPointerCapture(e.pointerId);

        dragStateRef.current = {
          mode: "pending", // upgrades to "drag" after DRAG_THRESHOLD
          elementId,
          pointerId: e.pointerId,
          pointerStart: { x: e.clientX, y: e.clientY },
          snapshot,
          centerScreen: buildCenterScreen(snapshot),
        };
        setActiveMode("pending");
        latestPointerRef.current = { x: e.clientX, y: e.clientY };
      },
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    }),
    [buildSnapshot, buildCenterScreen, handlePointerMove, handlePointerUp, handlePointerCancel],
  );

  const getRotationHandleHandlers = useCallback(
    (elementId: string): ElementHandlers => ({
      onPointerDown: (e: React.PointerEvent) => {
        if (e.button !== 0 && e.pointerType === "mouse") return;
        e.stopPropagation();
        e.preventDefault();

        const snapshot = buildSnapshot(elementId);
        if (!snapshot) return;

        (e.currentTarget as Element).setPointerCapture(e.pointerId);

        dragStateRef.current = {
          mode: "rotate", // immediately active — no threshold for handles
          elementId,
          pointerId: e.pointerId,
          pointerStart: { x: e.clientX, y: e.clientY },
          snapshot,
          centerScreen: buildCenterScreen(snapshot),
        };
        setActiveMode("rotate");
        latestPointerRef.current = { x: e.clientX, y: e.clientY };
      },
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    }),
    [buildSnapshot, buildCenterScreen, handlePointerMove, handlePointerUp, handlePointerCancel],
  );

  const getResizeHandleHandlers = useCallback(
    (elementId: string, side: ResizeHandle): ElementHandlers => ({
      onPointerDown: (e: React.PointerEvent) => {
        if (e.button !== 0 && e.pointerType === "mouse") return;
        e.stopPropagation();
        e.preventDefault();

        const snapshot = buildSnapshot(elementId);
        if (!snapshot) return;

        (e.currentTarget as Element).setPointerCapture(e.pointerId);

        dragStateRef.current = {
          mode: side, // "left" or "right" — immediately active
          elementId,
          pointerId: e.pointerId,
          pointerStart: { x: e.clientX, y: e.clientY },
          snapshot,
          centerScreen: buildCenterScreen(snapshot),
        };
        setActiveMode(side);
        latestPointerRef.current = { x: e.clientX, y: e.clientY };
      },
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    }),
    [buildSnapshot, buildCenterScreen, handlePointerMove, handlePointerUp, handlePointerCancel],
  );

  return { activeMode, activeSnaps, getNodeHandlers, getRotationHandleHandlers, getResizeHandleHandlers };
}
