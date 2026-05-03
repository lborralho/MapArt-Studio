import {
  useCallback,
  useEffect,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from "react";
import { getDesignTemplate } from "@/features/design/infrastructure/designRepository";
import { ensureGoogleFont } from "@/core/services";
import type {
  DesignCenterMarker,
  DesignElementOverride,
  DesignOverrides,
  MapBounds,
  TemplateVars,
} from "@/features/design/domain/types";
import { useDesignEditor } from "@/features/design/application/useDesignEditor";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import type { ElementBounds } from "@/features/design/domain/types";
import { DesignCanvas } from "./DesignCanvas";

/* ────── Center marker ────── */

function CenterMarker({
  marker,
  textColor,
}: {
  marker: DesignCenterMarker;
  textColor: string;
}) {
  if (marker.type === "none") return null;
  const color = marker.color ?? textColor;
  const size = marker.size ?? (marker.type === "dot" ? 1.6 : marker.type === "heart" ? 6 : 7);
  const stroke = marker.outlineColor;
  const strokeWidth = marker.outlineWidth ?? 0;
  const baseStyle: CSSProperties = {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    zIndex: 3,
  };
  if (marker.type === "dot") {
    return (
      <div
        className="design-center-marker design-center-marker--dot"
        style={{
          ...baseStyle,
          width: `${size}cqh`,
          height: `${size}cqh`,
          borderRadius: "50%",
          backgroundColor: color,
          boxShadow: stroke
            ? `0 0 0 ${strokeWidth}px ${stroke}`
            : "0 1px 4px rgba(0,0,0,0.25)",
        }}
        aria-hidden="true"
      />
    );
  }
  if (marker.type === "ring") {
    const ringW = strokeWidth || 1.5;
    return (
      <div
        className="design-center-marker design-center-marker--ring"
        style={{
          ...baseStyle,
          width: `${size}cqh`,
          height: `${size}cqh`,
          borderRadius: "50%",
          border: `${ringW}px solid ${color}`,
          backgroundColor: stroke ?? "transparent",
        }}
        aria-hidden="true"
      />
    );
  }
  if (marker.type === "heart") {
    return (
      <svg
        className="design-center-marker design-center-marker--heart"
        viewBox="0 0 24 24"
        style={{
          ...baseStyle,
          width: `${size}cqh`,
          height: `${size}cqh`,
          filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.25))",
        }}
        aria-hidden="true"
      >
        <path
          d="M12 21s-7.5-4.6-7.5-10.5C4.5 7 7 4.5 9.8 4.5c1.7 0 3.2.9 4.2 2.3 1-1.4 2.5-2.3 4.2-2.3 2.8 0 5.3 2.5 5.3 6 0 5.9-7.5 10.5-7.5 10.5h-4Z"
          fill={color}
          stroke={stroke ?? "none"}
          strokeWidth={stroke ? 1 : 0}
        />
      </svg>
    );
  }
  return (
    <svg
      className="design-center-marker design-center-marker--pin"
      viewBox="0 0 24 32"
      style={{
        ...baseStyle,
        width: `${size * 0.75}cqh`,
        height: `${size}cqh`,
        transform: "translate(-50%, -75%)",
        filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.25))",
      }}
      aria-hidden="true"
    >
      <path
        d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0Z"
        fill={color}
        stroke={stroke ?? "none"}
        strokeWidth={stroke ? 1 : 0}
      />
      <circle cx="12" cy="12" r="4" fill="#ffffff" opacity="0.9" />
    </svg>
  );
}

/* ────── Props ────── */

export interface DesignRendererProps {
  designId: string;
  overrides: DesignOverrides;
  width: number;
  height: number;
  lat: number;
  lon: number;
  city: string;
  country: string;
  textColor: string;
  bgColor: string;
  fontFamily: string;
  showText: boolean;
  children: ReactNode;
  isDesignEditing?: boolean;
  activeElementId?: string | null;
  onElementSelect?: (id: string | null) => void;
  onElementDrag?: (id: string, override: Partial<DesignElementOverride>) => void;
}

/* ────── Main component ────── */

export default function DesignRenderer({
  designId,
  overrides: _overrides,
  width: posterW,
  height: posterH,
  lat,
  lon,
  city,
  country,
  textColor,
  bgColor,
  fontFamily,
  showText,
  children,
  isDesignEditing = false,
  activeElementId: _activeElementId,
  onElementSelect: _onElementSelect,
  onElementDrag: _onElementDrag,
}: DesignRendererProps) {
  const design = useMemo(() => getDesignTemplate(designId), [designId]);

  useEffect(() => {
    const families = new Set<string>();
    if (design.styles.fontFamily) families.add(design.styles.fontFamily);
    for (const el of design.elements) {
      if (el.fontFamily) families.add(el.fontFamily);
    }
    for (const family of families) {
      void ensureGoogleFont(family).catch(() => {});
    }
  }, [design]);

  const templateVars: TemplateVars = useMemo(
    () => ({ city, country, continent: "", lat, lon }),
    [city, country, lat, lon],
  );

  const padding = design.styles.mapPadding ?? {
    top: 4,
    right: 4,
    bottom: 22,
    left: 4,
  };

  const mapBounds: MapBounds = useMemo(() => {
    const mapAreaW = 100 - padding.left - padding.right;
    const mapAreaH = 100 - padding.top - padding.bottom;
    const centerX = padding.left + mapAreaW / 2;
    const centerY = padding.top + mapAreaH / 2;

    if (design.mask === "circle" || design.mask === "heart") {
      const safeW = posterW > 0 ? posterW : 1;
      const safeH = posterH > 0 ? posterH : 1;
      const mult = design.mask === "heart" ? 0.96 : 1;
      const sizePx = Math.min((mapAreaW / 100) * safeW, (mapAreaH / 100) * safeH) * mult;
      const radiusXPct = (sizePx / 2 / safeW) * 100;
      const radiusYPct = (sizePx / 2 / safeH) * 100;
      return {
        top: centerY - radiusYPct,
        bottom: centerY + radiusYPct,
        left: centerX - radiusXPct,
        right: centerX + radiusXPct,
        cx: centerX,
        cy: centerY,
      };
    }

    return {
      top: padding.top,
      bottom: 100 - padding.bottom,
      left: padding.left,
      right: 100 - padding.right,
      cx: centerX,
      cy: centerY,
    };
  }, [design, padding, posterW, posterH]);

  const editorHandle = useDesignEditor(design, templateVars, mapBounds);

  const { designElementBoundsRef } = usePosterContext();
  const handleBoundsUpdate = useCallback(
    (id: string, bounds: ElementBounds) => {
      editorHandle.reportBounds(id, bounds);
      designElementBoundsRef.current.set(id, bounds);
    },
    [editorHandle.reportBounds, designElementBoundsRef],
  );

  const maskStyle: CSSProperties = useMemo(() => {
    if (design.mask === "rect") {
      return {
        position: "absolute",
        top: `${padding.top}%`,
        left: `${padding.left}%`,
        width: `${100 - padding.left - padding.right}%`,
        height: `${100 - padding.top - padding.bottom}%`,
        overflow: "hidden",
        borderRadius: 0,
      };
    }
    if (design.mask === "circle") {
      const mapAreaW = 100 - padding.left - padding.right;
      const mapAreaH = 100 - padding.top - padding.bottom;
      const cx = padding.left + mapAreaW / 2;
      const cy = padding.top + mapAreaH / 2;
      const safeW = posterW > 0 ? posterW : 1;
      const safeH = posterH > 0 ? posterH : 1;
      const diameterPx = Math.min(
        (mapAreaW / 100) * safeW,
        (mapAreaH / 100) * safeH,
      );
      return {
        position: "absolute",
        top: `${cy}%`,
        left: `${cx}%`,
        transform: "translate(-50%, -50%)",
        width: `${diameterPx}px`,
        height: `${diameterPx}px`,
        overflow: "hidden",
        borderRadius: "50%",
        boxShadow: design.effects.glowRadius
          ? `0 0 ${design.effects.glowRadius * 2}px ${design.effects.glowRadius}px ${design.effects.glowColor || bgColor}44`
          : undefined,
      };
    }
    if (design.mask === "heart") {
      const mapAreaW = 100 - padding.left - padding.right;
      const mapAreaH = 100 - padding.top - padding.bottom;
      const cx = padding.left + mapAreaW / 2;
      const cy = padding.top + mapAreaH / 2;
      const safeW = posterW > 0 ? posterW : 1;
      const safeH = posterH > 0 ? posterH : 1;
      const sizePx =
        Math.min((mapAreaW / 100) * safeW, (mapAreaH / 100) * safeH) * 0.96;
      const s = sizePx;
      const heartPath = `M ${0.5 * s} ${0.9 * s} C ${0.25 * s} ${0.7 * s}, 0 ${0.5 * s}, ${0.1 * s} ${0.3 * s} C ${0.18 * s} ${0.15 * s}, ${0.35 * s} ${0.2 * s}, ${0.5 * s} ${0.35 * s} C ${0.65 * s} ${0.2 * s}, ${0.82 * s} ${0.15 * s}, ${0.9 * s} ${0.3 * s} C ${1.0 * s} ${0.5 * s}, ${0.75 * s} ${0.7 * s}, ${0.5 * s} ${0.9 * s} Z`;
      return {
        position: "absolute",
        top: `${cy}%`,
        left: `${cx}%`,
        transform: "translate(-50%, -50%)",
        width: `${sizePx}px`,
        height: `${sizePx}px`,
        overflow: "hidden",
        clipPath: `path('${heartPath}')`,
      };
    }
    return {};
  }, [design, padding, bgColor, posterW, posterH]);

  useEffect(() => {
    if (!isDesignEditing) return;
    const handleKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "Escape") {
        editorHandle.selectElement(null);
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        const els = editorHandle.resolvedElements;
        if (els.length === 0) return;
        const activeId = editorHandle.activeElementId;
        if (!activeId) {
          editorHandle.selectElement(els[0].id);
          return;
        }
        const idx = els.findIndex((el) => el.id === activeId);
        const next = e.shiftKey
          ? (idx - 1 + els.length) % els.length
          : (idx + 1) % els.length;
        editorHandle.selectElement(els[next].id);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isDesignEditing, editorHandle]);

  return (
    <div
      className="design-renderer"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: bgColor,
        overflow: "hidden",
        containerType: "size",
      }}
    >
      <div className="design-map-area" style={maskStyle}>
        {children}
        {design.centerMarker ? (
          <CenterMarker marker={design.centerMarker} textColor={textColor} />
        ) : null}
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: isDesignEditing ? "auto" : "none",
        }}
      >
        <DesignCanvas
          elements={showText ? editorHandle.resolvedElements : []}
          activeElementId={editorHandle.activeElementId}
          onSelect={editorHandle.selectElement}
          onBoundsUpdate={handleBoundsUpdate}
          editorHandle={editorHandle}
          fallbackColor={textColor}
          fallbackFont={fontFamily}
          isEditing={isDesignEditing}
        />
      </div>
    </div>
  );
}
