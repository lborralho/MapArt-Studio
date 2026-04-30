import { useEffect, useMemo, type CSSProperties, type ReactNode } from "react";
import { getDesignTemplate } from "@/features/design/infrastructure/designRepository";
import { ensureGoogleFont } from "@/core/services";
import type {
  DesignElement,
  DesignOverrides,
  DesignCenterMarker,
  DesignCoordsFormat,
  DesignCoordsPrecision,
} from "@/features/design/domain/types";

/* ────── Helpers ────── */

/** Format a lat/lon pair as degree-minute-second string. */
function formatDMS(lat: number, lon: number): string {
  const toDMS = (value: number, posChar: string, negChar: string): string => {
    const abs = Math.abs(value);
    const deg = Math.floor(abs);
    const minFloat = (abs - deg) * 60;
    const min = Math.floor(minFloat);
    const sec = Math.round((minFloat - min) * 60);
    const dir = value >= 0 ? posChar : negChar;
    return `${deg}°${String(min).padStart(2, "0")}'${String(sec).padStart(2, "0")}"${dir}`;
  };
  return `${toDMS(lat, "N", "S")}  ${toDMS(lon, "E", "W")}`;
}

/** Format a lat/lon pair as decimal degrees (e.g. "38.779° N"). */
function formatDecimalPart(
  value: number,
  posChar: string,
  negChar: string,
  precision: DesignCoordsPrecision,
): string {
  const dir = value >= 0 ? posChar : negChar;
  return `${Math.abs(value).toFixed(precision)}° ${dir}`;
}

interface FormattedCoordinates {
  /** One or two text lines depending on the format. */
  lines: string[];
}

function formatCoordinates(
  lat: number,
  lon: number,
  format: DesignCoordsFormat,
  precision: DesignCoordsPrecision,
  separator: string,
): FormattedCoordinates {
  if (format === "dms") {
    return { lines: [formatDMS(lat, lon)] };
  }

  const latStr = formatDecimalPart(lat, "N", "S", precision);
  const lonStr = formatDecimalPart(lon, "E", "W", precision);

  if (format === "decimal-stack") {
    return { lines: [latStr, lonStr] };
  }
  // decimal-line
  return { lines: [`${latStr}${separator}${lonStr}`] };
}

/** Resolve template variables like `{{city}}` with actual values. */
function resolveContent(
  content: string,
  vars: Record<string, string>,
): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

/**
 * Build a CSS transform string that anchors a positioned box to a given
 * (anchorX, anchorY) instead of the default center.
 */
function anchorTransform(
  anchorX: DesignElement["anchorX"],
  anchorY: DesignElement["anchorY"],
): string {
  const ax = anchorX ?? "center";
  const ay = anchorY ?? "center";
  const tx = ax === "left" ? "0%" : ax === "right" ? "-100%" : "-50%";
  const ty = ay === "top" ? "0%" : ay === "bottom" ? "-100%" : "-50%";
  return `translate(${tx}, ${ty})`;
}

/* ────── Element Renderers ────── */

interface CommonProps {
  textColor: string;
  fontFamily: string;
}

function buildArcPath(
  cx: number,
  cy: number,
  radius: number,
  midAngleDeg: number,
  spanDeg: number,
): string {
  // Convention: midAngleDeg measured clockwise from 12 o'clock.
  // 0 = top, 90 = right, 180 = bottom, 270 = left.
  // SVG y-axis is inverted (y grows downward). Convert to screen coords:
  //   svgX(angle) = cx + r * sin(angleRad)
  //   svgY(angle) = cy - r * cos(angleRad)
  const half = spanDeg / 2;
  const startAngle = midAngleDeg - half;
  const endAngle = midAngleDeg + half;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const startX = cx + radius * Math.sin(toRad(startAngle));
  const startY = cy - radius * Math.cos(toRad(startAngle));
  const endX = cx + radius * Math.sin(toRad(endAngle));
  const endY = cy - radius * Math.cos(toRad(endAngle));

  const largeArc = spanDeg > 180 ? 1 : 0;
  // sweep=1 (clockwise) follows the increasing midAngle direction in our convention.
  const sweep = 1;

  return `M ${startX.toFixed(3)} ${startY.toFixed(3)} A ${radius.toFixed(3)} ${radius.toFixed(3)} 0 ${largeArc} ${sweep} ${endX.toFixed(3)} ${endY.toFixed(3)}`;
}

function ArcTextElement({
  element,
  posterW,
  posterH,
  textColor,
  fontFamily,
}: {
  element: DesignElement;
  posterW: number;
  posterH: number;
} & CommonProps) {
  // Convert percent-based template values to pixel coordinates so the SVG
  // viewBox can match the poster's actual aspect ratio without distortion.
  const safeW = posterW > 0 ? posterW : 1;
  const safeH = posterH > 0 ? posterH : 1;
  const minSide = Math.min(safeW, safeH);

  const cx = ((element.arcCenterX ?? 50) / 100) * safeW;
  const cy = ((element.arcCenterY ?? 50) / 100) * safeH;
  // Arc radius is expressed as a percent of the smaller poster side so the
  // arc visually scales like the map circle.
  const radius = ((element.arcRadius ?? 40) / 100) * minSide;
  const midAngle = element.arcMidAngle ?? 0;
  const span = element.arcSpan ?? 120;
  // Font size is a percent of poster height (matches other elements).
  const fontSizePx = ((element.fontSize ?? 1.6) / 100) * safeH;
  const color = element.color ?? textColor;
  const opacity = element.opacity ?? 1;
  const family = element.fontFamily ?? fontFamily;
  const pathId = `design-arc-${element.id}`;

  const d = buildArcPath(cx, cy, radius, midAngle, span);

  const textStyle: CSSProperties = {
    fontFamily: family || "inherit",
    fontWeight: element.fontWeight ?? 400,
    fontStyle: element.fontStyle ?? "normal",
    fontSize: `${fontSizePx}px`,
    letterSpacing: element.letterSpacing
      ? `${element.letterSpacing}em`
      : undefined,
    textTransform: element.textTransform ?? "none",
    fill: color,
    opacity,
  };

  return (
    <svg
      className="design-element design-element--arc"
      viewBox={`0 0 ${safeW} ${safeH}`}
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "visible",
      }}
      aria-hidden="true"
    >
      <defs>
        <path id={pathId} d={d} fill="none" />
      </defs>
      <text style={textStyle}>
        <textPath
          href={`#${pathId}`}
          startOffset="50%"
          textAnchor="middle"
          style={textStyle}
        >
          {element.content}
        </textPath>
      </text>
    </svg>
  );
}

function TextElement({
  element,
  textColor,
  fontFamily,
}: {
  element: DesignElement;
} & CommonProps) {
  const fontSize = element.fontSize ?? 3;
  const color = element.color ?? textColor;
  const family = element.fontFamily ?? fontFamily;
  const lines = String(element.content ?? "").split(/\r?\n/);

  const style: CSSProperties = {
    position: "absolute",
    left: `${element.x}%`,
    top: `${element.y}%`,
    transform: anchorTransform(element.anchorX, element.anchorY),
    fontSize: `${fontSize}cqh`,
    fontWeight: element.fontWeight ?? 400,
    fontStyle: element.fontStyle ?? "normal",
    fontFamily: family || "inherit",
    textAlign: element.textAlign ?? "center",
    letterSpacing: element.letterSpacing
      ? `${element.letterSpacing}em`
      : undefined,
    textTransform: element.textTransform ?? "none",
    color,
    opacity: element.opacity ?? 1,
    whiteSpace: "pre",
    pointerEvents: "none",
    userSelect: "none",
    lineHeight: element.lineHeight ?? 1.2,
    width: element.width ? `${element.width}%` : undefined,
  };

  return (
    <span className="design-element design-element--text" style={style}>
      {lines.length > 1
        ? lines.map((line, idx) => (
            <span key={idx} style={{ display: "block" }}>
              {line}
            </span>
          ))
        : element.content}
    </span>
  );
}

function DividerElement({
  element,
  textColor,
}: {
  element: DesignElement;
} & Omit<CommonProps, "fontFamily">) {
  const color = element.color ?? textColor;
  const stroke = element.strokeWidth ?? 0.1;

  const style: CSSProperties = {
    position: "absolute",
    left: `${element.x}%`,
    top: `${element.y}%`,
    transform: anchorTransform(element.anchorX, element.anchorY),
    width: `${element.width ?? 40}%`,
    height: `${stroke}cqh`,
    minHeight: 1,
    backgroundColor: color,
    opacity: element.opacity ?? 0.5,
    pointerEvents: "none",
  };

  return (
    <div className="design-element design-element--divider" style={style} />
  );
}

function CoordinatesElement({
  element,
  lat,
  lon,
  textColor,
  fontFamily,
}: {
  element: DesignElement;
  lat: number;
  lon: number;
} & CommonProps) {
  const fontSize = element.fontSize ?? 1.4;
  const color = element.color ?? textColor;
  const family = element.fontFamily ?? fontFamily;

  const formatted = formatCoordinates(
    lat,
    lon,
    element.coordsFormat ?? "dms",
    element.coordsPrecision ?? 4,
    element.coordsSeparator ?? " / ",
  );

  const style: CSSProperties = {
    position: "absolute",
    left: `${element.x}%`,
    top: `${element.y}%`,
    transform: anchorTransform(element.anchorX, element.anchorY),
    fontSize: `${fontSize}cqh`,
    fontWeight: element.fontWeight ?? 400,
    fontFamily: family || "inherit",
    textAlign: element.textAlign ?? "center",
    letterSpacing: element.letterSpacing
      ? `${element.letterSpacing}em`
      : undefined,
    textTransform: element.textTransform ?? "none",
    color,
    opacity: element.opacity ?? 0.7,
    whiteSpace: "pre",
    pointerEvents: "none",
    userSelect: "none",
    lineHeight: element.lineHeight ?? 1.2,
  };

  return (
    <span className="design-element design-element--coordinates" style={style}>
      {formatted.lines.map((line, idx) => (
        <span key={idx} style={{ display: "block" }}>
          {line}
        </span>
      ))}
    </span>
  );
}

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

  // pin
  return (
    <svg
      className="design-center-marker design-center-marker--pin"
      viewBox="0 0 24 32"
      style={{
        ...baseStyle,
        width: `${size * 0.75}cqh`,
        height: `${size}cqh`,
        // Anchor pin tip at center: shift up by half height so tip = center
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

/* ────── Main Renderer ────── */

interface DesignRendererProps {
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
  /** The map + markers content to render inside the masked area. */
  children: ReactNode;
}

export default function DesignRenderer({
  designId,
  overrides,
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
}: DesignRendererProps) {
  const design = useMemo(() => getDesignTemplate(designId), [designId]);

  const templateVars: Record<string, string> = useMemo(
    () => ({ city, country }),
    [city, country],
  );

  /* Load any custom Google Fonts referenced by the template. */
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

  const resolvedElements = useMemo(() => {
    return design.elements.map((el) => {
      const rawContent =
        el.type === "text" || el.type === "text-arc"
          ? overrides[el.id] ?? el.content ?? ""
          : el.content ?? "";
      const content =
        el.type === "text" || el.type === "text-arc"
          ? resolveContent(rawContent, templateVars)
          : rawContent;
      return { ...el, content };
    });
  }, [design.elements, overrides, templateVars]);

  const padding = design.styles.mapPadding ?? {
    top: 4,
    right: 4,
    bottom: 22,
    left: 4,
  };

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

      // Compute the largest diameter that fits both axes in physical pixels,
      // then convert back to a single value to use for both width and height
      // so the result is a perfect circle regardless of poster aspect ratio.
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
      {/* Masked map area */}
      <div className="design-map-area" style={maskStyle}>
        {children}
        {design.centerMarker ? (
          <CenterMarker marker={design.centerMarker} textColor={textColor} />
        ) : null}
      </div>

      {/* Text overlays */}
      {showText
        ? resolvedElements.map((el) => {
            if (el.type === "text") {
              return (
                <TextElement
                  key={el.id}
                  element={el}
                  textColor={textColor}
                  fontFamily={fontFamily}
                />
              );
            }
            if (el.type === "text-arc") {
              return (
                <ArcTextElement
                  key={el.id}
                  element={el}
                  posterW={posterW}
                  posterH={posterH}
                  textColor={textColor}
                  fontFamily={fontFamily}
                />
              );
            }
            if (el.type === "divider" || el.type === "line") {
              return (
                <DividerElement
                  key={el.id}
                  element={el}
                  textColor={textColor}
                />
              );
            }
            if (el.type === "coordinates") {
              return (
                <CoordinatesElement
                  key={el.id}
                  element={el}
                  lat={lat}
                  lon={lon}
                  textColor={textColor}
                  fontFamily={fontFamily}
                />
              );
            }
            return null;
          })
        : null}
    </div>
  );
}
