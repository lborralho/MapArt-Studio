/**
 * DesignCanvas — DOM rendering layer for the design editor.
 *
 * Each element is positioned with absolute CSS using cx/cy as the center:
 *   left: cx%  top: cy%  transform: translate(-50%, -50%) rotate(Ndeg)
 *
 * After every render each node measures its visual bounds and calls
 * onBoundsUpdate, giving useDesignEditor accurate data for snap and alignment.
 *
 * When `editorHandle` is provided, the canvas becomes fully interactive:
 * pointer-capture drag, rotation, and resize are handled by useDragInteraction,
 * and SelectionHandles renders the control overlay for the active element.
 */

import React, {
  useRef,
  useState,
  useLayoutEffect,
  useEffect,
  memo,
  type CSSProperties,
  type RefObject,
} from "react";
import type { EditorElement, ElementBounds } from "../domain/types";
import type { UseDesignEditorResult } from "../application/useDesignEditor";
import type { ElementHandlers } from "../application/useDragInteraction";
import { applyTextTransform } from "../domain/formatting";
import { useTextMetrics } from "../application/useTextMetrics";
import { useDragInteraction } from "../application/useDragInteraction";
import { SelectionHandles } from "./SelectionHandles";
import { SnapGuides } from "./SnapGuides";
import { DistanceGuides } from "./DistanceGuides";

// ─────────────────────────────────────────────────────────────
// No-op handle — used when isEditing=false or editorHandle is absent
// ─────────────────────────────────────────────────────────────

const NO_OP_HANDLE: UseDesignEditorResult = {
  resolvedElements: [],
  activeElementId: null,
  activeElement: undefined,
  selectElement: () => {},
  applyOverride: () => {},
  clearOverride: () => {},
  setLiveState: () => {},
  commitLiveState: () => {},
  cancelLiveState: () => {},
  reportBounds: () => {},
  getBounds: () => undefined,
  mapBounds: undefined,
};

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

export interface DesignCanvasProps {
  elements: EditorElement[];
  activeElementId: string | null;
  onSelect: (id: string | null) => void;
  onBoundsUpdate: (id: string, bounds: ElementBounds) => void;
  /**
   * Provide the useDesignEditor handle to enable interactive editing.
   * Required when isEditing=true; omit for read-only preview rendering.
   */
  editorHandle?: UseDesignEditorResult;
  fallbackColor?: string;
  fallbackFont?: string;
  isEditing?: boolean;
  className?: string;
}

// ─────────────────────────────────────────────────────────────
// Internal: per-node props
// ─────────────────────────────────────────────────────────────

interface NodeHoverHandlers {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

interface NodeProps {
  element: EditorElement;
  isActive: boolean;
  posterWidth: number;
  posterHeight: number;
  containerRef: RefObject<HTMLDivElement | null>;
  fallbackColor: string;
  fallbackFont: string;
  isEditing: boolean;
  onBoundsUpdate: (id: string, bounds: ElementBounds) => void;
  /** Pointer event handlers from useDragInteraction — replaces onClick selection. */
  interactionHandlers: ElementHandlers | null;
  /** Mouse enter/leave handlers used to track ALT+hover for distance guides. */
  hoverHandlers: NodeHoverHandlers | null;
}

// ─────────────────────────────────────────────────────────────
// Arc path utility (mirrors canvasRenderer logic)
// ─────────────────────────────────────────────────────────────

function buildArcPath(
  cx: number,
  cy: number,
  radius: number,
  midAngleDeg: number,
  spanDeg: number,
): string {
  const half = spanDeg / 2;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const startX = cx + radius * Math.sin(toRad(midAngleDeg - half));
  const startY = cy - radius * Math.cos(toRad(midAngleDeg - half));
  const endX = cx + radius * Math.sin(toRad(midAngleDeg + half));
  const endY = cy - radius * Math.cos(toRad(midAngleDeg + half));
  const largeArc = spanDeg > 180 ? 1 : 0;
  return [
    `M ${startX.toFixed(3)} ${startY.toFixed(3)}`,
    `A ${radius.toFixed(3)} ${radius.toFixed(3)} 0 ${largeArc} 1`,
    `${endX.toFixed(3)} ${endY.toFixed(3)}`,
  ].join(" ");
}

// ─────────────────────────────────────────────────────────────
// Text / coordinates node
// ─────────────────────────────────────────────────────────────

const TextNode = memo(function TextNode({
  element,
  posterHeight,
  containerRef,
  fallbackColor,
  fallbackFont,
  isEditing,
  onBoundsUpdate,
  interactionHandlers,
  hoverHandlers,
}: NodeProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  useTextMetrics(nodeRef, containerRef, element, onBoundsUpdate);

  const fontSizePx = ((element.fontSize ?? 3) / 100) * posterHeight;

  const style: CSSProperties = {
    position: "absolute",
    left: `${element.cx}%`,
    top: `${element.cy}%`,
    transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
    transformOrigin: "center center",
    width: element.width ? `${element.width}%` : undefined,
    maxWidth: element.width ? `${element.width}%` : undefined,
    whiteSpace: element.width ? "pre-wrap" : "pre",
    wordBreak: element.width ? "break-word" : undefined,
    fontSize: posterHeight > 0 ? `${fontSizePx}px` : undefined,
    fontWeight: element.fontWeight ?? 400,
    fontFamily: element.fontFamily
      ? `"${element.fontFamily}", sans-serif`
      : fallbackFont,
    fontStyle: element.fontStyle ?? "normal",
    textAlign: element.textAlign ?? "center",
    letterSpacing: element.letterSpacing != null
      ? `${element.letterSpacing}em`
      : undefined,
    // Compensate for trailing letter-spacing when centering
    paddingLeft: (element.textAlign ?? "center") === "center" && element.letterSpacing != null
      ? `${element.letterSpacing}em`
      : undefined,
    lineHeight: element.lineHeight ?? 1.2,
    textTransform: element.textTransform ?? "none",
    color: element.color ?? fallbackColor,
    opacity: element.opacity ?? 1,
    cursor: isEditing ? (interactionHandlers ? "move" : "pointer") : "default",
    userSelect: "none",
    pointerEvents: isEditing ? "auto" : "none",
    touchAction: "none",
  };

  const content = applyTextTransform(element.content, element.textTransform);

  return (
    <div
      ref={nodeRef}
      style={style}
      onPointerDown={interactionHandlers?.onPointerDown}
      onPointerMove={interactionHandlers?.onPointerMove}
      onPointerUp={interactionHandlers?.onPointerUp}
      onPointerCancel={interactionHandlers?.onPointerCancel}
      onMouseEnter={hoverHandlers?.onMouseEnter}
      onMouseLeave={hoverHandlers?.onMouseLeave}
    >
      {content}
    </div>
  );
});

// ─────────────────────────────────────────────────────────────
// Divider / line node
// ─────────────────────────────────────────────────────────────

const DividerNode = memo(function DividerNode({
  element,
  posterHeight,
  containerRef,
  fallbackColor,
  isEditing,
  onBoundsUpdate,
  interactionHandlers,
  hoverHandlers,
}: NodeProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  useTextMetrics(nodeRef, containerRef, element, onBoundsUpdate);

  const strokePx = Math.max(((element.strokeWidth ?? 0.1) / 100) * posterHeight, 1);

  const style: CSSProperties = {
    position: "absolute",
    left: `${element.cx}%`,
    top: `${element.cy}%`,
    transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
    transformOrigin: "center center",
    width: `${element.width ?? 40}%`,
    height: posterHeight > 0 ? `${strokePx}px` : "1px",
    backgroundColor: element.color ?? fallbackColor,
    opacity: element.opacity ?? 0.5,
    cursor: isEditing ? "move" : "default",
    pointerEvents: isEditing ? "auto" : "none",
    touchAction: "none",
  };

  return (
    <div
      ref={nodeRef}
      style={style}
      onPointerDown={interactionHandlers?.onPointerDown}
      onPointerMove={interactionHandlers?.onPointerMove}
      onPointerUp={interactionHandlers?.onPointerUp}
      onPointerCancel={interactionHandlers?.onPointerCancel}
      onMouseEnter={hoverHandlers?.onMouseEnter}
      onMouseLeave={hoverHandlers?.onMouseLeave}
    />
  );
});

// ─────────────────────────────────────────────────────────────
// Arc text node
// ─────────────────────────────────────────────────────────────

const ArcTextNode = memo(function ArcTextNode({
  element,
  posterWidth,
  posterHeight,
  fallbackColor,
  fallbackFont,
  isEditing,
  onBoundsUpdate,
  interactionHandlers,
  hoverHandlers,
}: NodeProps) {
  useEffect(() => {
    if (!posterWidth || !posterHeight) return;
    const minSide = Math.min(posterWidth, posterHeight);
    const radiusPx = ((element.arcRadius ?? 40) / 100) * minSide;
    onBoundsUpdate(element.id, {
      cx: element.cx,
      cy: element.cy,
      width: (radiusPx * 2 / posterWidth) * 100,
      height: (radiusPx * 2 / posterHeight) * 100,
      rotation: 0,
    });
  }, [element, posterWidth, posterHeight, onBoundsUpdate]);

  if (!posterWidth || !posterHeight) return null;

  const minSide = Math.min(posterWidth, posterHeight);
  const cxPx = (element.cx / 100) * posterWidth;
  const cyPx = (element.cy / 100) * posterHeight;
  const radiusPx = ((element.arcRadius ?? 40) / 100) * minSide;
  const fontSizePx = ((element.fontSize ?? 1.6) / 100) * posterHeight;
  const lsPx = element.letterSpacing ? element.letterSpacing * fontSizePx : 0;
  const color = element.color ?? fallbackColor;
  const family = element.fontFamily
    ? `"${element.fontFamily}", sans-serif`
    : fallbackFont;
  const pathId = `dc-arc-${element.id}`;
  const d = buildArcPath(cxPx, cyPx, radiusPx, element.arcMidAngle ?? 0, element.arcSpan ?? 120);
  const content = applyTextTransform(element.content, element.textTransform);

  return (
    <svg
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        overflow: "visible",
        pointerEvents: isEditing ? "auto" : "none",
        cursor: isEditing ? "move" : "default",
        touchAction: "none",
      }}
      viewBox={`0 0 ${posterWidth} ${posterHeight}`}
      onPointerDown={interactionHandlers?.onPointerDown}
      onPointerMove={interactionHandlers?.onPointerMove}
      onPointerUp={interactionHandlers?.onPointerUp}
      onPointerCancel={interactionHandlers?.onPointerCancel}
      onMouseEnter={hoverHandlers?.onMouseEnter}
      onMouseLeave={hoverHandlers?.onMouseLeave}
    >
      <defs>
        <path id={pathId} d={d} fill="none" />
      </defs>
      <text
        fontFamily={family}
        fontSize={fontSizePx}
        fontWeight={element.fontWeight ?? 400}
        fontStyle={element.fontStyle ?? "normal"}
        fill={color}
        opacity={element.opacity ?? 1}
        letterSpacing={lsPx || undefined}
      >
        <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
          {content}
        </textPath>
      </text>
    </svg>
  );
});

// ─────────────────────────────────────────────────────────────
// Router: picks the right node component per element type
// ─────────────────────────────────────────────────────────────

function DesignCanvasNode(props: NodeProps) {
  const { element } = props;

  if (element.type === "text-arc") {
    return <ArcTextNode {...props} />;
  }
  if (element.type === "divider" || element.type === "line") {
    return <DividerNode {...props} />;
  }
  return <TextNode {...props} />;
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

export function DesignCanvas({
  elements,
  activeElementId,
  onSelect,
  onBoundsUpdate,
  editorHandle,
  fallbackColor = "#000000",
  fallbackFont = "sans-serif",
  isEditing = false,
  className,
}: DesignCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [posterWidth, setPosterWidth] = useState(0);
  const [posterHeight, setPosterHeight] = useState(0);

  // ALT-hover distance measurement state.
  // Guides appear only when an element is selected, ALT is held, and the user
  // hovers a different element.
  const [altHeld, setAltHeld] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Track container pixel dimensions for px ↔ % conversion in nodes + handles
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setPosterWidth(width);
      setPosterHeight(height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Window-level ALT key tracking (only while editing).
  useEffect(() => {
    if (!isEditing) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt" || e.altKey) setAltHeld(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt" || !e.altKey) setAltHeld(false);
    };
    const onBlur = () => setAltHeld(false);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [isEditing]);

  // Drag engine — always instantiated; noop when editorHandle is absent
  const effectiveHandle = isEditing && editorHandle ? editorHandle : NO_OP_HANDLE;
  const drag = useDragInteraction(containerRef, effectiveHandle);

  // Active element + its bounds (for SelectionHandles)
  const activeElement = isEditing
    ? elements.find((el) => el.id === activeElementId)
    : undefined;
  const activeBounds = activeElementId
    ? effectiveHandle.getBounds(activeElementId)
    : undefined;

  // Distance guides — active when selection + ALT + hover on a different element.
  const showDistanceGuides =
    isEditing &&
    altHeld &&
    !!activeElementId &&
    !!hoveredId &&
    hoveredId !== activeElementId &&
    drag.activeMode === null;
  const hoveredBounds = showDistanceGuides
    ? effectiveHandle.getBounds(hoveredId)
    : undefined;

  return (
    <div
      ref={containerRef}
      className={`dc${className ? ` ${className}` : ""}`}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        cursor: drag.activeMode === "drag" ? "grabbing" : undefined,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onSelect(null);
      }}
    >
      {/* Element nodes */}
      {elements.map((el) => (
        <DesignCanvasNode
          key={el.id}
          element={el}
          isActive={el.id === activeElementId}
          posterWidth={posterWidth}
          posterHeight={posterHeight}
          containerRef={containerRef}
          fallbackColor={fallbackColor}
          fallbackFont={fallbackFont}
          isEditing={isEditing}
          onBoundsUpdate={onBoundsUpdate}
          interactionHandlers={
            isEditing ? drag.getNodeHandlers(el.id) : null
          }
          hoverHandlers={
            isEditing
              ? {
                  onMouseEnter: () => setHoveredId(el.id),
                  onMouseLeave: () =>
                    setHoveredId((prev) => (prev === el.id ? null : prev)),
                }
              : null
          }
        />
      ))}

      {/* Snap guides — rendered above nodes, below selection handles */}
      {isEditing && <SnapGuides activeSnaps={drag.activeSnaps} />}

      {/* Distance guides — ALT + hover while an element is selected */}
      {showDistanceGuides && activeBounds && hoveredBounds && (
        <DistanceGuides
          active={activeBounds}
          hovered={hoveredBounds}
          posterWidth={posterWidth}
          posterHeight={posterHeight}
        />
      )}

      {/* Selection handles — rendered above all nodes for the active element */}
      {isEditing && activeElement && (
        <SelectionHandles
          element={activeElement}
          bounds={activeBounds}
          posterWidth={posterWidth}
          posterHeight={posterHeight}
          drag={drag}
        />
      )}
    </div>
  );
}
