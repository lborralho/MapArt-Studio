import { applyFades } from "./layers";
import { drawPosterText } from "./typography";
import { drawMarkersOnCanvas } from "@/features/markers/infrastructure/rendering";
import {
  clipToDesignMask,
  drawDesignCenterMarker,
  drawDesignElementsOnCanvas,
  fillDesignBackground,
} from "@/features/design/infrastructure/canvasRenderer";
import { getDesignTemplate } from "@/features/design/infrastructure/designRepository";
import type { ExportOptions, CanvasSize } from "../../domain/types";

/**
 * Composites a final poster from a MapLibre snapshot canvas.
 *
 * For non-classic design templates:
 *   1. Fill poster background.
 *   2. Clip to mask shape (heart / circle / rect+padding).
 *   3. Draw map snapshot inside the clip.
 *   4. Draw user markers inside the clip.
 *   5. Draw center marker inside the clip.
 *   6. Restore clip.
 *   7. Draw design text elements over the full canvas.
 *
 * For the classic (legacy) template:
 *   1. Draw map full-bleed.
 *   2. Apply gradient fades.
 *   3. Draw user markers.
 *   4. Draw poster text.
 */
export async function compositeExport(
  mapCanvas: HTMLCanvasElement,
  options: ExportOptions,
): Promise<{ canvas: HTMLCanvasElement; size: CanvasSize }> {
  const {
    theme,
    center,
    widthInches: _wi,
    heightInches: _hi,
    displayCity,
    displayCountry,
    fontFamily,
    showPosterText = true,
    showOverlay = true,
    showFades,
    showMarkers,
    markers = [],
    markerIcons = [],
    markerProjection,
    markerScaleX = 1,
    markerScaleY = 1,
    markerSizeScale = 1,
    designElements,
    designId,
    bgColor,
  } = options;

  const applyFadesLayer = showFades ?? showOverlay ?? true;
  const applyMarkers = showMarkers ?? showOverlay ?? true;

  const width = mapCanvas.width;
  const height = mapCanvas.height;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas rendering is not available.");

  const isDesignActive =
    Boolean(designId) &&
    designId !== "classic" &&
    designElements != null &&
    designElements.length > 0;

  if (isDesignActive && designId) {
    const resolvedBg = bgColor ?? theme.ui.bg;
    const design = getDesignTemplate(designId);

    // 1. Fill poster background
    fillDesignBackground(ctx, width, height, resolvedBg);

    // 2–5. Clip to mask, draw map + markers + center marker inside it
    ctx.save();
    const { cx, cy } = clipToDesignMask(ctx, width, height, designId);

    ctx.drawImage(mapCanvas, 0, 0);

    if (applyMarkers && markers.length > 0 && markerIcons.length > 0 && markerProjection) {
      await drawMarkersOnCanvas(ctx, markers, markerIcons, markerProjection, markerScaleX, markerScaleY, markerSizeScale);
    }

    if (design.centerMarker) {
      await drawDesignCenterMarker(ctx, cx, cy, height, design.centerMarker, theme.ui?.text ?? "#111111");
    }

    ctx.restore(); // remove mask clip

    // 7. Design text elements over the full canvas
    if (showPosterText) {
      await drawDesignElementsOnCanvas(ctx, width, height, designElements!, center.lat, center.lon, theme.ui?.text ?? "#111111", fontFamily);
    }
  } else {
    // Legacy classic rendering
    ctx.drawImage(mapCanvas, 0, 0);

    if (applyFadesLayer) {
      applyFades(ctx, width, height, theme.ui.bg);
    }

    if (applyMarkers && markers.length > 0 && markerIcons.length > 0 && markerProjection) {
      await drawMarkersOnCanvas(ctx, markers, markerIcons, markerProjection, markerScaleX, markerScaleY, markerSizeScale);
    }

    if (designElements && designElements.length > 0 && showPosterText) {
      await drawDesignElementsOnCanvas(ctx, width, height, designElements, center.lat, center.lon, theme.ui?.text ?? "#111111", fontFamily);
    } else {
      drawPosterText(ctx, width, height, theme, center, displayCity, displayCountry, fontFamily, showPosterText);
    }
  }

  const size: CanvasSize = {
    width,
    height,
    requestedWidth: width,
    requestedHeight: height,
    downscaleFactor: 1,
  };

  return { canvas, size };
}

export { resolveCanvasSize } from "./canvas";
export { applyFades } from "./layers";
export { drawPosterText } from "./typography";
