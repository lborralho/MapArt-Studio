import type {
  DesignCenterMarker,
  DesignElement,
  DesignOverrides,
  ResolvedDesignElement,
} from "@/features/design/domain/types";
import {
  applyTextTransform,
  formatDesignCoordinates,
} from "@/features/design/domain/formatting";
import { getDesignTemplate } from "@/features/design/infrastructure/designRepository";

function resolveTemplateContent(content: string, city: string, country: string): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (key === "city") return city;
    if (key === "country") return country;
    return "";
  });
}

/* ── Background fill ── */

export function fillDesignBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bgColor: string,
): void {
  ctx.save();
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/* ── Mask clip ── */

export interface DesignMaskInfo {
  cx: number;
  cy: number;
}

/**
 * Clips the canvas context to the design template's mask shape (rect, circle, or heart)
 * and returns the pixel center of the masked area.
 * Caller must wrap this in ctx.save() / ctx.restore() to remove the clip when done.
 */
export function clipToDesignMask(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  designId: string,
): DesignMaskInfo {
  const design = getDesignTemplate(designId);
  const padding = design.styles.mapPadding ?? { top: 4, right: 4, bottom: 22, left: 4 };
  const mapAreaW = 100 - padding.left - padding.right;
  const mapAreaH = 100 - padding.top - padding.bottom;
  const cx = ((padding.left + mapAreaW / 2) / 100) * width;
  const cy = ((padding.top + mapAreaH / 2) / 100) * height;

  ctx.beginPath();

  if (design.mask === "circle") {
    const sizePx = Math.min((mapAreaW / 100) * width, (mapAreaH / 100) * height);
    ctx.arc(cx, cy, sizePx / 2, 0, Math.PI * 2);
  } else if (design.mask === "heart") {
    const sizePx =
      Math.min((mapAreaW / 100) * width, (mapAreaH / 100) * height) * 0.96;
    const s = sizePx;
    const ox = cx - s / 2;
    const oy = cy - s / 2;
    // Mirrors the SVG path used in DesignRenderer for the CSS clip-path
    ctx.moveTo(ox + 0.5 * s, oy + 0.9 * s);
    ctx.bezierCurveTo(ox + 0.25 * s, oy + 0.7 * s, ox, oy + 0.5 * s, ox + 0.1 * s, oy + 0.3 * s);
    ctx.bezierCurveTo(ox + 0.18 * s, oy + 0.15 * s, ox + 0.35 * s, oy + 0.2 * s, ox + 0.5 * s, oy + 0.35 * s);
    ctx.bezierCurveTo(ox + 0.65 * s, oy + 0.2 * s, ox + 0.82 * s, oy + 0.15 * s, ox + 0.9 * s, oy + 0.3 * s);
    ctx.bezierCurveTo(ox + s, oy + 0.5 * s, ox + 0.75 * s, oy + 0.7 * s, ox + 0.5 * s, oy + 0.9 * s);
    ctx.closePath();
  } else {
    // rect — clip to the padded map area
    ctx.rect(
      (padding.left / 100) * width,
      (padding.top / 100) * height,
      (mapAreaW / 100) * width,
      (mapAreaH / 100) * height,
    );
  }

  ctx.clip();
  return { cx, cy };
}

/* ── Center marker ── */

async function loadSvgImage(svgContent: string): Promise<HTMLImageElement> {
  const blob = new Blob([svgContent], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("SVG load failed")); };
    img.src = url;
  });
}

/**
 * Draws the design template's center marker onto the canvas at (cx, cy).
 * Must be called while the mask clip is still active so the marker is contained.
 */
export async function drawDesignCenterMarker(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  height: number,
  marker: DesignCenterMarker,
  fallbackColor: string,
): Promise<void> {
  if (marker.type === "none") return;

  const color = marker.color ?? fallbackColor;
  const sizePct = marker.size ?? (marker.type === "dot" ? 1.6 : marker.type === "heart" ? 6 : 7);
  const sizePx = (sizePct / 100) * height;

  if (marker.type === "dot") {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, sizePx / 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    if (marker.outlineColor) {
      ctx.strokeStyle = marker.outlineColor;
      ctx.lineWidth = marker.outlineWidth ?? 1;
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (marker.type === "ring") {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, sizePx / 2, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = marker.outlineWidth ?? 1.5;
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (marker.type === "heart") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${sizePx}" height="${sizePx}"><path d="M12 21s-7.5-4.6-7.5-10.5C4.5 7 7 4.5 9.8 4.5c1.7 0 3.2.9 4.2 2.3 1-1.4 2.5-2.3 4.2-2.3 2.8 0 5.3 2.5 5.3 6 0 5.9-7.5 10.5-7.5 10.5h-4Z" fill="${color}"/></svg>`;
    const img = await loadSvgImage(svg);
    ctx.drawImage(img, cx - sizePx / 2, cy - sizePx / 2, sizePx, sizePx);
    return;
  }

  if (marker.type === "pin") {
    const pinW = sizePx * 0.75;
    const pinH = sizePx;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="${pinW}" height="${pinH}"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0Z" fill="${color}"/><circle cx="12" cy="12" r="4" fill="#ffffff" opacity="0.9"/></svg>`;
    const img = await loadSvgImage(svg);
    // Match CSS transform: translate(-50%, -75%) — pin tip (bottom-center) lands at cy + 25% of pinH
    ctx.drawImage(img, cx - pinW / 2, cy - pinH * 0.75, pinW, pinH);
    return;
  }
}

/* ── Public: resolve design template elements ── */

export function resolveDesignElements(
  designId: string,
  overrides: DesignOverrides,
  city: string,
  country: string,
): ResolvedDesignElement[] {
  const design = getDesignTemplate(designId);
  return design.elements.map((el) => {
    const override = overrides[el.id] ?? {};

    // When the editor has stored a cx/cy (drag-based position), convert back to
    // x/y with center anchors so the canvas renderer positions correctly.
    const positionPatch: Partial<DesignElement> =
      override.cx !== undefined && override.cy !== undefined
        ? { x: override.cx, y: override.cy, anchorX: "center", anchorY: "center" }
        : {};

    const merged: DesignElement = { ...el, ...override, ...positionPatch };
    const rawContent =
      el.type === "text" || el.type === "text-arc"
        ? (override.content ?? el.content ?? "")
        : el.content ?? "";
    const content =
      el.type === "text" || el.type === "text-arc"
        ? resolveTemplateContent(rawContent, city, country)
        : rawContent;
    return { ...merged, content };
  });
}

/* ── Arc text via Canvas 2D (character-by-character along the arc) ── */

/**
 * Draws arc text directly using Canvas 2D transforms.
 * Unlike the SVG blob approach, this always uses the page's already-loaded fonts
 * so web fonts (Google Fonts) render correctly in export canvases.
 *
 * Angle convention: 0° = top (12 o'clock), clockwise — matches DesignRenderer.
 */
function drawArcTextOnCanvas(
  ctx: CanvasRenderingContext2D,
  el: ResolvedDesignElement,
  width: number,
  height: number,
  fallbackTextColor: string,
  fallbackFontFamily: string,
): void {
  const minSide = Math.min(width, height);
  const cx = ((el.arcCenterX ?? 50) / 100) * width;
  const cy = ((el.arcCenterY ?? 50) / 100) * height;
  const radius = ((el.arcRadius ?? 40) / 100) * minSide;
  const fontSizePx = ((el.fontSize ?? 1.6) / 100) * height;
  const color = el.color ?? fallbackTextColor;
  const family = el.fontFamily ?? fallbackFontFamily;
  const midAngleDeg = el.arcMidAngle ?? 0;
  const letterSpacingPx = (el.letterSpacing ?? 0) * fontSizePx;
  const content = applyTextTransform(el.content ?? "", el.textTransform);

  ctx.save();
  ctx.font = `${el.fontStyle ?? "normal"} ${el.fontWeight ?? 400} ${fontSizePx}px "${family}", sans-serif`;
  ctx.fillStyle = color;
  ctx.globalAlpha = el.opacity ?? 1;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const chars = Array.from(content);
  // Measure each character; add letter-spacing between all but the last.
  const charWidths = chars.map((c) => ctx.measureText(c).width);
  const totalWidth =
    charWidths.reduce((a, b) => a + b, 0) +
    letterSpacingPx * Math.max(chars.length - 1, 0);

  // Map total pixel width to a total arc angle (radians).
  // Arc length = radius × angle, so angle = width / radius.
  const midAngleRad = (midAngleDeg * Math.PI) / 180;
  const totalSpanRad = totalWidth / radius;
  let angleRad = midAngleRad - totalSpanRad / 2;

  for (let i = 0; i < chars.length; i++) {
    const charAngle = angleRad + (charWidths[i] / 2) / radius;

    // Position on arc: 0°=top, clockwise — (sin θ, -cos θ) unit vector.
    const x = cx + radius * Math.sin(charAngle);
    const y = cy - radius * Math.cos(charAngle);

    ctx.save();
    ctx.translate(x, y);
    // Rotate so the character's baseline is tangent to the arc.
    ctx.rotate(charAngle);
    ctx.fillText(chars[i], 0, 0);
    ctx.restore();

    angleRad += (charWidths[i] + letterSpacingPx) / radius;
  }

  ctx.restore();
}

/* ── Mask capture info ── */

/**
 * Given a design template and final poster pixel dimensions, returns the
 * dimensions and poster-space offset at which the map should be captured.
 *
 * For circle/heart masks the bounding square is used so the live MapLibre
 * container (which equals the mask area in the preview) maps 1-to-1 to the
 * capture canvas with no aspect-ratio distortion.
 */
export interface MaskCaptureInfo {
  capWidth: number;
  capHeight: number;
  offsetX: number;
  offsetY: number;
}

export function computeMaskCaptureInfo(
  designId: string,
  posterWidth: number,
  posterHeight: number,
): MaskCaptureInfo {
  const design = getDesignTemplate(designId);
  const padding = design.styles.mapPadding ?? { top: 4, right: 4, bottom: 22, left: 4 };
  const mapAreaW = ((100 - padding.left - padding.right) / 100) * posterWidth;
  const mapAreaH = ((100 - padding.top - padding.bottom) / 100) * posterHeight;
  const cx = ((padding.left + (100 - padding.left - padding.right) / 2) / 100) * posterWidth;
  const cy = ((padding.top + (100 - padding.top - padding.bottom) / 2) / 100) * posterHeight;

  if (design.mask === "circle") {
    const d = Math.min(mapAreaW, mapAreaH);
    const s = Math.round(d);
    return { capWidth: s, capHeight: s, offsetX: Math.round(cx - d / 2), offsetY: Math.round(cy - d / 2) };
  }

  if (design.mask === "heart") {
    const d = Math.min(mapAreaW, mapAreaH) * 0.96;
    const s = Math.round(d);
    return { capWidth: s, capHeight: s, offsetX: Math.round(cx - d / 2), offsetY: Math.round(cy - d / 2) };
  }

  // rect — capture exactly the padded map area
  return {
    capWidth: Math.round(mapAreaW),
    capHeight: Math.round(mapAreaH),
    offsetX: Math.round((padding.left / 100) * posterWidth),
    offsetY: Math.round((padding.top / 100) * posterHeight),
  };
}

/* ── Public: draw resolved design elements onto a canvas ── */

export async function drawDesignElementsOnCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  elements: ResolvedDesignElement[],
  lat: number,
  lon: number,
  textColor: string,
  fontFamily: string,
): Promise<void> {
  for (const el of elements) {
    if (el.type === "text-arc") {
      drawArcTextOnCanvas(ctx, el, width, height, textColor, fontFamily);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = el.opacity ?? (el.type === "divider" || el.type === "line" ? 0.5 : 1);

    const color = el.color ?? textColor;
    const family = el.fontFamily ?? fontFamily;
    const xPx = (el.x / 100) * width;
    const yPx = (el.y / 100) * height;
    const anchorX = el.anchorX ?? "center";
    const anchorY = el.anchorY ?? "center";
    const rotation = el.rotation ?? 0;

    // Translate to element position and apply rotation around that point
    ctx.translate(xPx, yPx);
    if (rotation !== 0) ctx.rotate((rotation * Math.PI) / 180);

    if (el.type === "text" || el.type === "coordinates") {
      const defaultFontSize = el.type === "text" ? 3 : 1.4;
      const fontSizePx = ((el.fontSize ?? defaultFontSize) / 100) * height;
      const fontStr = `${el.fontStyle ?? "normal"} ${el.fontWeight ?? 400} ${fontSizePx}px ${family ? `"${family}", sans-serif` : "sans-serif"}`;
      ctx.font = fontStr;
      ctx.fillStyle = color;

      // letter-spacing: modern Canvas API (Chrome 99+, FF 116+)
      if (el.letterSpacing != null && "letterSpacing" in ctx) {
        (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
          `${el.letterSpacing}em`;
      }

      // Map anchorX → ctx.textAlign (positions text relative to the translated origin)
      ctx.textAlign = anchorX === "left" ? "left" : anchorX === "right" ? "right" : "center";
      ctx.textBaseline = anchorY === "top" ? "top" : anchorY === "bottom" ? "bottom" : "middle";

      const lineHeightPx = (el.lineHeight ?? 1.2) * fontSizePx;

      const lines: string[] =
        el.type === "coordinates"
          ? formatDesignCoordinates(
              lat,
              lon,
              el.coordsFormat ?? "dms",
              el.coordsPrecision ?? 4,
              el.coordsSeparator ?? " / ",
            )
          : String(el.content ?? "")
              .split(/\r?\n/)
              .map((l) => applyTextTransform(l, el.textTransform));

      // Multi-line vertical offset — draw relative to (0, 0) after translation
      const blockHeight = lines.length * lineHeightPx;
      let startY = 0;
      if (anchorY === "center") startY = -(blockHeight - lineHeightPx) / 2;
      else if (anchorY === "bottom") startY = -(blockHeight - lineHeightPx);

      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], 0, startY + i * lineHeightPx);
      }

      if ("letterSpacing" in ctx) {
        (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";
      }
    } else if (el.type === "divider" || el.type === "line") {
      const strokePx = Math.max(((el.strokeWidth ?? 0.1) / 100) * height, 1);
      const lineWidthPx = ((el.width ?? 40) / 100) * width;

      // Draw centered at the translated origin
      let startX: number;
      let endX: number;
      if (anchorX === "left") {
        startX = 0;
        endX = lineWidthPx;
      } else if (anchorX === "right") {
        startX = -lineWidthPx;
        endX = 0;
      } else {
        startX = -lineWidthPx / 2;
        endX = lineWidthPx / 2;
      }

      const lineY = anchorY === "top" ? strokePx / 2 : anchorY === "bottom" ? -strokePx / 2 : 0;

      ctx.strokeStyle = color;
      ctx.lineWidth = strokePx;
      ctx.beginPath();
      ctx.moveTo(startX, lineY);
      ctx.lineTo(endX, lineY);
      ctx.stroke();
    }

    ctx.restore();
  }
}
