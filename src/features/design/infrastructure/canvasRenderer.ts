import type {
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

/* ── Arc text via SVG rasterization ── */

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildArcPath(cx: number, cy: number, radius: number, midAngleDeg: number, spanDeg: number): string {
  const half = spanDeg / 2;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const startX = cx + radius * Math.sin(toRad(midAngleDeg - half));
  const startY = cy - radius * Math.cos(toRad(midAngleDeg - half));
  const endX = cx + radius * Math.sin(toRad(midAngleDeg + half));
  const endY = cy - radius * Math.cos(toRad(midAngleDeg + half));
  const largeArc = spanDeg > 180 ? 1 : 0;
  return `M ${startX.toFixed(3)} ${startY.toFixed(3)} A ${radius.toFixed(3)} ${radius.toFixed(3)} 0 ${largeArc} 1 ${endX.toFixed(3)} ${endY.toFixed(3)}`;
}

async function drawArcTextOnCanvas(
  ctx: CanvasRenderingContext2D,
  el: ResolvedDesignElement,
  width: number,
  height: number,
  fallbackTextColor: string,
  fallbackFontFamily: string,
): Promise<void> {
  const minSide = Math.min(width, height);
  const cx = ((el.arcCenterX ?? 50) / 100) * width;
  const cy = ((el.arcCenterY ?? 50) / 100) * height;
  const radius = ((el.arcRadius ?? 40) / 100) * minSide;
  const fontSizePx = ((el.fontSize ?? 1.6) / 100) * height;
  const color = el.color ?? fallbackTextColor;
  const family = el.fontFamily ?? fallbackFontFamily;
  const pathId = `arc-${el.id}`;
  const d = buildArcPath(cx, cy, radius, el.arcMidAngle ?? 0, el.arcSpan ?? 120);

  // letter-spacing in SVG is in user units; convert from em
  const lsPx = el.letterSpacing ? el.letterSpacing * fontSizePx : 0;

  const content = applyTextTransform(el.content ?? "", el.textTransform);

  const svgStr = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`,
    `<defs><path id="${pathId}" d="${escapeXml(d)}" fill="none"/></defs>`,
    `<text`,
    `  font-family="${escapeXml(family || "sans-serif")}"`,
    `  font-size="${fontSizePx}"`,
    `  font-weight="${el.fontWeight ?? 400}"`,
    `  font-style="${el.fontStyle ?? "normal"}"`,
    `  fill="${escapeXml(color)}"`,
    `  opacity="${el.opacity ?? 1}"`,
    `  letter-spacing="${lsPx.toFixed(3)}"`,
    `>`,
    `<textPath href="#${pathId}" startOffset="50%" textAnchor="middle">${escapeXml(content)}</textPath>`,
    `</text></svg>`,
  ].join("\n");

  const blob = new Blob([svgStr], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  try {
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        resolve();
      };
      img.onerror = () => reject(new Error(`Failed to render arc text element "${el.id}"`));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
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
      await drawArcTextOnCanvas(ctx, el, width, height, textColor, fontFamily);
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
