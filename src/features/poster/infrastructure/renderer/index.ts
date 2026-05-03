import { applyFades } from "./layers";
import { drawPosterText } from "./typography";
import { drawMarkersOnCanvas } from "@/features/markers/infrastructure/rendering";
import { drawDesignElementsOnCanvas } from "@/features/design/infrastructure/canvasRenderer";
import type { ExportOptions, CanvasSize } from "../../domain/types";

/**
 * Composites a final poster from a MapLibre snapshot canvas.
 *
 * 1. Draws the captured map image.
 * 2. Applies gradient fades (top + bottom).
 * 3. Draws poster text (city, country, coords).
 *
 * Returns the composited canvas + its size metadata.
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
  } = options;

  // showFades defaults to true (it is a theme effect, not tied to markers).
  // Falls back to legacy showOverlay if the new flag isn't provided.
  const applyFadesLayer = showFades ?? showOverlay ?? true;
  // showMarkers falls back to legacy showOverlay for backwards compatibility.
  const applyMarkers = showMarkers ?? showOverlay ?? true;

  const width = mapCanvas.width;
  const height = mapCanvas.height;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas rendering is not available.");

  // 1. Draw map snapshot
  ctx.drawImage(mapCanvas, 0, 0);

  // 2. Gradient fades
  if (applyFadesLayer) {
    applyFades(ctx, width, height, theme.ui.bg);
  }

  // 3. Markers
  if (applyMarkers && markers.length > 0 && markerIcons.length > 0 && markerProjection) {
    await drawMarkersOnCanvas(
      ctx,
      markers,
      markerIcons,
      markerProjection,
      markerScaleX,
      markerScaleY,
      markerSizeScale,
    );
  }

  // 4. Poster text — use design canvas renderer when elements are provided,
  //    otherwise fall back to the legacy hardcoded layout.
  if (designElements && designElements.length > 0 && showPosterText) {
    await drawDesignElementsOnCanvas(
      ctx,
      width,
      height,
      designElements,
      center.lat,
      center.lon,
      theme.ui?.text ?? "#111111",
      fontFamily,
    );
  } else {
    drawPosterText(
      ctx,
      width,
      height,
      theme,
      center,
      displayCity,
      displayCountry,
      fontFamily,
      showPosterText,
    );
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
