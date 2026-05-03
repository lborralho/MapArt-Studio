/**
 * Pure formatting utilities for design element content.
 * No React, no DOM — safe to call in domain and infrastructure layers.
 */

import type {
  DesignCoordsFormat,
  DesignCoordsPrecision,
  DesignElement,
} from "./types";

// ─────────────────────────────────────────────────────────────
// Coordinate formatting
// ─────────────────────────────────────────────────────────────

function toDMS(value: number, posChar: string, negChar: string): string {
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = Math.round((minFloat - min) * 60);
  const dir = value >= 0 ? posChar : negChar;
  return `${deg}°${String(min).padStart(2, "0")}'${String(sec).padStart(2, "0")}"${dir}`;
}

function toDecimal(
  value: number,
  posChar: string,
  negChar: string,
  precision: DesignCoordsPrecision,
): string {
  return `${Math.abs(value).toFixed(precision)}° ${value >= 0 ? posChar : negChar}`;
}

/**
 * Formats lat/lon into one or two display lines depending on the format.
 *
 * Returns an array of strings — one element for single-line formats,
 * two elements for `decimal-stack`.
 */
export function formatDesignCoordinates(
  lat: number,
  lon: number,
  format: DesignCoordsFormat,
  precision: DesignCoordsPrecision,
  separator: string,
): string[] {
  if (format === "dms") {
    return [`${toDMS(lat, "N", "S")}  ${toDMS(lon, "E", "W")}`];
  }
  const latStr = toDecimal(lat, "N", "S", precision);
  const lonStr = toDecimal(lon, "E", "W", precision);
  if (format === "decimal-stack") return [latStr, lonStr];
  return [`${latStr}${separator}${lonStr}`];
}

// ─────────────────────────────────────────────────────────────
// Text transform
// ─────────────────────────────────────────────────────────────

export function applyTextTransform(
  text: string,
  transform: DesignElement["textTransform"],
): string {
  if (transform === "uppercase") return text.toUpperCase();
  if (transform === "lowercase") return text.toLowerCase();
  return text;
}
