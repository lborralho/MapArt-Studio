import layoutsManifest from "@/data/layouts.json";
import { toPositiveNumber } from "@/shared/utils/number";
import type { PosterRatio, PosterRatioGroup } from "../domain/types";

const fallbackSymbol =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 40'><rect x='2' y='2' width='60' height='36' rx='5' fill='none' stroke='#9CC3DA' stroke-width='2'/><rect x='14' y='8' width='36' height='24' rx='3' fill='#4B91B7'/></svg>";

const fallbackRatio: PosterRatio = {
  id: "print_poster_20x30",
  name: "Poster 20 x 30 cm",
  description: "Classic portrait poster size (2:3 ratio).",
  width: 20,
  height: 30,
  unit: "cm",
  widthCm: 20,
  heightCm: 30,
  symbol: fallbackSymbol,
  categoryId: "print",
  categoryName: "Print",
};

function normalizeUnit(value: unknown): "cm" | "px" {
  const unit = String(value ?? "")
    .trim()
    .toLowerCase();
  return unit === "px" ? "px" : "cm";
}

function formatDecimal(value: number): string {
  const rounded = Math.round(Number(value) * 100) / 100;
  return String(rounded);
}

function createSymbolFromRatio(width: number, height: number): string {
  const ratio = Math.max(0.15, Math.min(6, width / height));
  const maxInnerWidth = 50;
  const maxInnerHeight = 30;

  let innerWidth = maxInnerWidth;
  let innerHeight = innerWidth / ratio;

  if (innerHeight > maxInnerHeight) {
    innerHeight = maxInnerHeight;
    innerWidth = innerHeight * ratio;
  }

  const x = (64 - innerWidth) / 2;
  const y = (40 - innerHeight) / 2;
  const roundedX = Number(x.toFixed(2));
  const roundedY = Number(y.toFixed(2));
  const roundedWidth = Number(innerWidth.toFixed(2));
  const roundedHeight = Number(innerHeight.toFixed(2));

  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 40'><rect x='2' y='2' width='60' height='36' rx='5' fill='none' stroke='#9CC3DA' stroke-width='2'/><rect x='${roundedX}' y='${roundedY}' width='${roundedWidth}' height='${roundedHeight}' rx='3' fill='#4B91B7'/></svg>`;
}

function normalizeRatio(
  category: { id: string; name: string },
  layout: any,
  fallbackIdSuffix: string | number,
): PosterRatio {
  const width = toPositiveNumber(layout?.width, fallbackRatio.width);
  const height = toPositiveNumber(layout?.height, fallbackRatio.height);
  const unit = normalizeUnit(layout?.unit);

  const widthCm = toPositiveNumber(
    layout?.posterWidthCm,
    unit === "cm" ? width : fallbackRatio.widthCm,
  );
  const heightCm = toPositiveNumber(
    layout?.posterHeightCm,
    unit === "cm" ? height : fallbackRatio.heightCm,
  );

  const rawSymbol = String(layout?.symbol ?? "").trim();

  return {
    id: String(layout?.id ?? `${category.id}_${fallbackIdSuffix}`),
    name: String(layout?.name ?? "Unnamed Ratio"),
    description: String(layout?.description ?? "").trim(),
    width,
    height,
    unit,
    widthCm,
    heightCm,
    symbol: rawSymbol || createSymbolFromRatio(width, height),
    categoryId: category.id,
    categoryName: category.name,
  };
}

const rawCategories = Array.isArray((layoutsManifest as any)?.categories)
  ? (layoutsManifest as any).categories
  : [];

export const ratioGroups: PosterRatioGroup[] = rawCategories
  .map((category: any, categoryIndex: number) => {
    const categoryId = String(category?.id ?? `category_${categoryIndex}`);
    const categoryName = String(category?.name ?? categoryId);
    const rawLayouts = Array.isArray(category?.layouts) ? category.layouts : [];
    const options = rawLayouts.map((layout: any, layoutIndex: number) =>
      normalizeRatio(
        { id: categoryId, name: categoryName },
        layout,
        layoutIndex,
      ),
    );

    return { id: categoryId, name: categoryName, options };
  })
  .filter((group: PosterRatioGroup) => group.options.length > 0);

export const ratioOptions: PosterRatio[] = ratioGroups.flatMap(
  (group) => group.options,
);

const ratioOptionsById: Record<string, PosterRatio> = ratioOptions.reduce(
  (acc: Record<string, PosterRatio>, option) => {
    if (!acc[option.id]) acc[option.id] = option;
    return acc;
  },
  {},
);

const manifestDefaultId = String(
  (layoutsManifest as any)?.defaultLayoutId ?? "",
).trim();

export const defaultRatioId: string = ratioOptionsById[manifestDefaultId]
  ? manifestDefaultId
  : (ratioOptions[0]?.id ?? fallbackRatio.id);

export function formatRatioDimensions(ratioOption: PosterRatio): string {
  if (!ratioOption) return "";
  return `${formatDecimal(ratioOption.width)} x ${formatDecimal(ratioOption.height)} ${ratioOption.unit}`;
}

export function getRatioOption(ratioId: string): PosterRatio | null {
  const normalizedId = String(ratioId ?? "").trim();
  if (normalizedId === "custom") return null;
  if (ratioOptionsById[normalizedId]) return ratioOptionsById[normalizedId];
  if (ratioOptionsById[defaultRatioId])
    return ratioOptionsById[defaultRatioId];
  return fallbackRatio;
}

export function createCustomRatioOption(
  widthCm: number,
  heightCm: number,
): PosterRatio {
  const normalizedWidthCm = toPositiveNumber(widthCm, fallbackRatio.widthCm);
  const normalizedHeightCm = toPositiveNumber(
    heightCm,
    fallbackRatio.heightCm,
  );
  const symbol = createSymbolFromRatio(normalizedWidthCm, normalizedHeightCm);

  return {
    id: "custom",
    name: "Custom Ratio",
    description: "Manual width and height values.",
    width: normalizedWidthCm,
    height: normalizedHeightCm,
    unit: "cm",
    widthCm: normalizedWidthCm,
    heightCm: normalizedHeightCm,
    symbol,
    categoryId: "custom",
    categoryName: "Custom",
  };
}

/* ────── Deprecated aliases (backward-compat) ────── */

/** @deprecated Use `ratioGroups` */
export const layoutGroups = ratioGroups;
/** @deprecated Use `ratioOptions` */
export const layoutOptions = ratioOptions;
/** @deprecated Use `defaultRatioId` */
export const defaultLayoutId = defaultRatioId;
/** @deprecated Use `formatRatioDimensions` */
export const formatLayoutDimensions = formatRatioDimensions;
/** @deprecated Use `getRatioOption` */
export const getLayoutOption = getRatioOption;
/** @deprecated Use `createCustomRatioOption` */
export const createCustomLayoutOption = createCustomRatioOption;
