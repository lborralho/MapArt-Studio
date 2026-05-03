import type { ResolvedTheme } from "@/features/theme/domain/types";
import type {
  MarkerIconDefinition,
  MarkerItem,
  MarkerProjectionInput,
} from "@/features/markers/domain/types";
import type { ResolvedDesignElement } from "@/features/design/domain/types";

export interface CanvasSize {
  width: number;
  height: number;
  requestedWidth: number;
  requestedHeight: number;
  downscaleFactor: number;
}

/** Options passed to the export compositor (map snapshot + text overlay). */
export interface ExportOptions {
  theme: ResolvedTheme;
  center: { lat: number; lon: number };
  widthInches: number;
  heightInches: number;
  displayCity: string;
  displayCountry: string;
  displayContinent?: string;
  fontFamily: string;
  showPosterText: boolean;
  /** @deprecated Use showFades + showMarkers instead. */
  showOverlay?: boolean;
  /** Whether to draw gradient fades/vignette (theme effect). Defaults to true. */
  showFades?: boolean;
  /** Whether to draw markers (user toggle). Defaults to showOverlay when omitted. */
  showMarkers?: boolean;
  markers?: MarkerItem[];
  markerIcons?: MarkerIconDefinition[];
  markerProjection?: MarkerProjectionInput;
  markerScaleX?: number;
  markerScaleY?: number;
  markerSizeScale?: number;
  /** Design elements to render on the export canvas (replaces legacy drawPosterText). */
  designElements?: ResolvedDesignElement[];
  /** Active design template ID — used to apply background fill and mask shape. */
  designId?: string;
  /** Resolved background color for the poster (theme bg or user override). */
  bgColor?: string;
  /**
   * Final poster dimensions in pixels. When set, the output canvas is sized to
   * these dimensions rather than to mapCanvas.width/height. Required when the
   * map was captured at mask dimensions (smaller than the full poster).
   */
  exportWidth?: number;
  exportHeight?: number;
  /**
   * Pixel offset of the map area's top-left corner in the full poster canvas.
   * Non-zero when the map was captured at mask dimensions (circle/heart/padded rect).
   */
  mapOffsetX?: number;
  mapOffsetY?: number;
}

export interface Typography {
  displayCity: string;
  displayCountry: string;
  displayContinent?: string;
  fontFamily: string;
  showPosterText: boolean;
}
