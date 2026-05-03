/**
 * useDesignEditor — Single Source of Truth for the design canvas editor.
 *
 * Merges three planes of state into a live EditorElement[] array:
 *   1. Template (immutable, from DesignTemplate.elements)
 *   2. Overrides (persisted in PosterContext via the reducer)
 *   3. Ephemeral (in-flight drag/resize — never touches the reducer until commit)
 *
 * The hook exposes a stable API surface that DesignCanvas (Phase 2) and
 * DesignEditor sidebar (Phase 5) bind against.
 */

import { useRef, useState, useMemo, useCallback } from "react";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import type { DesignTemplate, DesignElementOverride, EditorElement, ElementBounds, TemplateVars, MapBounds } from "../domain/types";
import type { DesignElement } from "../domain/types";
import { normalizeElementCoords } from "../domain/coords";
import { applyTextTransform, formatDesignCoordinates } from "../domain/formatting";

// ─────────────────────────────────────────────────────────────
// Public API shape
// ─────────────────────────────────────────────────────────────

/** Ephemeral per-element state during drag/resize/rotate (never hits the reducer). */
export interface LiveElementState {
  cx?: number;
  cy?: number;
  rotation?: number;
  width?: number;
}

export interface UseDesignEditorResult {
  /** All elements with all three state planes merged and template vars resolved. */
  resolvedElements: EditorElement[];
  /** ID of the currently selected element, or null. */
  activeElementId: string | null;
  /** The selected EditorElement, or undefined when nothing is selected. */
  activeElement: EditorElement | undefined;

  // ── Selection ────────────────────────────────────────────
  /** Select an element by ID. Pass null to deselect. */
  selectElement: (id: string | null) => void;

  // ── Overrides (committed immediately to the reducer) ────
  /** Merge partial fields into the persistent override for an element. */
  applyOverride: (id: string, fields: Partial<DesignElementOverride>) => void;
  /** Remove all persisted overrides for an element. */
  clearOverride: (id: string) => void;

  // ── Live state (ephemeral — drag engine writes here at RAF cadence) ──
  /**
   * Merges partial state (cx, cy, rotation, width) into the ephemeral layer.
   * Never touches the reducer. Call this on every requestAnimationFrame tick.
   */
  setLiveState: (id: string, state: LiveElementState) => void;
  /**
   * Flush all ephemeral fields for an element to the reducer as a persisted override.
   * Call this on pointer-up.
   */
  commitLiveState: (id: string) => void;
  /**
   * Discard all ephemeral state for an element and revert to the last committed state.
   * Call this on pointer-cancel or Escape.
   */
  cancelLiveState: (id: string) => void;

  // ── Bounds feedback (Phase 2 canvas nodes) ──────────────
  /**
   * Canvas nodes call this after each render to report their measured visual
   * bounds. Used by snap and alignment math in Phases 4+.
   */
  reportBounds: (id: string, bounds: ElementBounds) => void;
  /** Returns the last reported bounds for an element, or undefined. */
  getBounds: (id: string) => ElementBounds | undefined;

  // ── Map mask bounds (Phase 4 snapping) ──────────────────
  /** Bounding box of the map mask area in normalized poster space (0–100). */
  mapBounds: MapBounds | undefined;
}

// ─────────────────────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────────────────────

/**
 * Resolves element content to a display-ready string.
 * For "coordinates" type: formats lat/lon into the configured display format.
 * For "text" / "text-arc": replaces {{city}}, {{country}}, {{continent}} placeholders.
 */
function resolveContent(
  element: DesignElement,
  override: { content?: string; coordsFormat?: DesignElement["coordsFormat"]; coordsPrecision?: DesignElement["coordsPrecision"]; coordsSeparator?: string } | undefined,
  vars: TemplateVars,
): string {
  if (element.type === "coordinates") {
    const format = override?.coordsFormat ?? element.coordsFormat ?? "dms";
    const precision = override?.coordsPrecision ?? element.coordsPrecision ?? 4;
    const separator = override?.coordsSeparator ?? element.coordsSeparator ?? " / ";
    return formatDesignCoordinates(vars.lat, vars.lon, format, precision, separator).join("\n");
  }

  const raw = override?.content ?? element.content ?? "";
  const transformed = applyTextTransform(raw, element.textTransform);
  return transformed
    .replace(/\{\{city\}\}/gi, vars.city)
    .replace(/\{\{country\}\}/gi, vars.country)
    .replace(/\{\{continent\}\}/gi, vars.continent);
}

/**
 * Merges a template element with its override and live ephemeral state into a
 * single EditorElement. Priority per field:
 *   live > override (cx/cy new format) > legacy override x/y > template normalized
 */
function resolveElement(
  template: DesignElement,
  override: DesignElementOverride | undefined,
  live: LiveElementState | undefined,
  vars: TemplateVars,
  boundsMap: Map<string, ElementBounds>,
): EditorElement {
  const merged = override ? { ...template, ...filterDefined(override) } : template;

  let cx: number;
  let cy: number;

  if (live?.cx !== undefined && live?.cy !== undefined) {
    cx = live.cx;
    cy = live.cy;
  } else if (override?.cx !== undefined && override?.cy !== undefined) {
    cx = override.cx;
    cy = override.cy;
  } else if (override?.x !== undefined || override?.y !== undefined) {
    ({ cx, cy } = normalizeElementCoords({
      x: override.x ?? template.x,
      y: override.y ?? template.y,
      anchorX: template.anchorX,
      anchorY: template.anchorY,
      width: template.width,
    }));
  } else {
    ({ cx, cy } = normalizeElementCoords(template));
  }

  // Strip legacy positional fields; keep everything else from merged.
  // The cast is safe: EditorElement = Omit<DesignElement, x|y|anchorX|anchorY|content> + overrides.
  const { x: _x, y: _y, anchorX: _aX, anchorY: _aY, content: _c, ...rest } = merged as DesignElement & { x: number; y: number };

  return {
    ...rest,
    cx,
    cy,
    rotation: live?.rotation ?? merged.rotation ?? 0,
    width: live?.width ?? merged.width,
    content: resolveContent(template, override, vars),
    bounds: boundsMap.get(template.id),
  } as EditorElement;
}

/** Strips undefined values from an override so spread doesn't clobber template fields. */
function filterDefined<T extends object>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (obj[key] !== undefined) result[key] = obj[key];
  }
  return result;
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

export function useDesignEditor(
  template: DesignTemplate | undefined,
  templateVars: TemplateVars,
  mapBounds?: MapBounds,
): UseDesignEditorResult {
  const { state, dispatch } = usePosterContext();
  const { designOverrides, activeDesignElementId } = state;

  // Plane 3: ephemeral state during drag/resize/rotate.
  // Written synchronously on every RAF tick — never triggers React reconciliation.
  // liveTick is the sole trigger for re-renders; the RAF loop increments it once per frame.
  const liveStateRef = useRef<Map<string, LiveElementState>>(new Map());
  const [liveTick, setLiveTick] = useState(0);

  // Visual bounds reported by canvas nodes after each render (Phase 2).
  // Also a ref — bounds don't need to trigger re-renders themselves.
  const boundsRef = useRef<Map<string, ElementBounds>>(new Map());

  // ── Element resolution ───────────────────────────────────
  const resolvedElements = useMemo((): EditorElement[] => {
    if (!template) return [];
    return template.elements.map((el) =>
      resolveElement(
        el,
        designOverrides[el.id],
        liveStateRef.current.get(el.id),
        templateVars,
        boundsRef.current,
      ),
    );
    // liveTick intentionally included: forces recompute when live positions change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, designOverrides, templateVars, liveTick]);

  const activeElement = resolvedElements.find(
    (el) => el.id === activeDesignElementId,
  );

  // ── Selection ────────────────────────────────────────────
  const selectElement = useCallback(
    (id: string | null) => {
      dispatch({ type: "SET_ACTIVE_DESIGN_ELEMENT", elementId: id });
    },
    [dispatch],
  );

  // ── Persistent overrides ─────────────────────────────────
  const applyOverride = useCallback(
    (id: string, fields: Partial<DesignElementOverride>) => {
      dispatch({ type: "SET_DESIGN_OVERRIDE", elementId: id, override: fields });
    },
    [dispatch],
  );

  const clearOverride = useCallback(
    (id: string) => {
      dispatch({ type: "CLEAR_DESIGN_ELEMENT_OVERRIDE", elementId: id });
    },
    [dispatch],
  );

  // ── Ephemeral live state (written at RAF cadence by useDragInteraction) ─
  const setLiveState = useCallback((id: string, state: LiveElementState) => {
    const existing = liveStateRef.current.get(id) ?? {};
    liveStateRef.current.set(id, { ...existing, ...state });
    setLiveTick((t) => t + 1);
  }, []);

  const commitLiveState = useCallback(
    (id: string) => {
      const live = liveStateRef.current.get(id);
      if (!live) return;
      // Only commit fields that are actually set (don't clobber with undefined)
      const override: Partial<DesignElementOverride> = {};
      if (live.cx !== undefined) override.cx = live.cx;
      if (live.cy !== undefined) override.cy = live.cy;
      if (live.rotation !== undefined) override.rotation = live.rotation;
      if (live.width !== undefined) override.width = live.width;
      if (Object.keys(override).length > 0) {
        dispatch({ type: "SET_DESIGN_OVERRIDE", elementId: id, override });
      }
      liveStateRef.current.delete(id);
      // No tick update — reducer change triggers re-render
    },
    [dispatch],
  );

  const cancelLiveState = useCallback((id: string) => {
    if (!liveStateRef.current.has(id)) return;
    liveStateRef.current.delete(id);
    setLiveTick((t) => t + 1);
  }, []);

  // ── Bounds feedback (Phase 2) ────────────────────────────
  const reportBounds = useCallback((id: string, bounds: ElementBounds) => {
    boundsRef.current.set(id, bounds);
    // Bounds updates don't need a re-render here; they're read on the next
    // drag frame or snap calculation.
  }, []);

  const getBounds = useCallback(
    (id: string) => boundsRef.current.get(id),
    [],
  );

  return {
    resolvedElements,
    activeElementId: activeDesignElementId,
    activeElement,
    selectElement,
    applyOverride,
    clearOverride,
    setLiveState,
    commitLiveState,
    cancelLiveState,
    reportBounds,
    getBounds,
    mapBounds,
  };
}
