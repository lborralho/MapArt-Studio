import { clamp } from "@/shared/geo/math";
import { CUSTOM_RATIO_ID } from "./types";
import type { PosterRatio } from "./types";

export function matchesRatioSize(
  ratioOption: PosterRatio,
  widthCm: number,
  heightCm: number,
  toleranceCm: number,
): boolean {
  return (
    Math.abs(ratioOption.widthCm - widthCm) <= toleranceCm &&
    Math.abs(ratioOption.heightCm - heightCm) <= toleranceCm
  );
}

export function resolveRatioIdForSize(
  widthCm: number,
  heightCm: number,
  currentRatioId: string,
  toleranceCm: number,
  currentRatio: PosterRatio | null,
  allRatios: PosterRatio[],
): string {
  if (
    currentRatio &&
    matchesRatioSize(currentRatio, widthCm, heightCm, toleranceCm)
  ) {
    return currentRatio.id;
  }

  const matching = allRatios.find((ro) =>
    matchesRatioSize(ro, widthCm, heightCm, toleranceCm),
  );

  return matching?.id ?? CUSTOM_RATIO_ID;
}

export function normalizePosterSizeValue(
  value: unknown,
  fallbackValue: number,
  minCm: number,
  maxCm: number,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return clamp(fallbackValue, minCm, maxCm);
  }
  return clamp(parsed, minCm, maxCm);
}

export function formatRatioCm(value: number): string {
  const rounded = Math.round(Number(value) * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

/**
 * @deprecated Use `matchesRatioSize` instead.
 */
export const matchesLayoutSize = matchesRatioSize;

/**
 * @deprecated Use `resolveRatioIdForSize` instead.
 */
export const resolveLayoutIdForSize = resolveRatioIdForSize;

/**
 * @deprecated Use `formatRatioCm` instead.
 */
export const formatLayoutCm = formatRatioCm;
