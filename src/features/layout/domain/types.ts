export interface PosterRatio {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  unit: "cm" | "px";
  widthCm: number;
  heightCm: number;
  symbol: string;
  categoryId: string;
  categoryName: string;
}

export interface PosterRatioGroup {
  id: string;
  name: string;
  options: PosterRatio[];
}

export const CUSTOM_RATIO_ID = "custom";

/**
 * @deprecated Use `PosterRatio` instead. Kept temporarily for backward-compat.
 */
export type Layout = PosterRatio;

/**
 * @deprecated Use `PosterRatioGroup` instead.
 */
export type LayoutGroup = PosterRatioGroup;

/**
 * @deprecated Use `CUSTOM_RATIO_ID` instead.
 */
export const CUSTOM_LAYOUT_ID = CUSTOM_RATIO_ID;
