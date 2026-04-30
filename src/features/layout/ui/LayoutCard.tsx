import type { PosterRatio } from "../domain/types";
import { formatRatioDimensions } from "../infrastructure/layoutRepository";

function getRatioSymbolDataUri(ratioOption: PosterRatio): string {
  const symbol = String(ratioOption?.symbol ?? "").trim();
  if (!symbol) return "";
  const normalizedSymbol = symbol.replace(
    /stroke-width=(['"])([\d.]+)\1/g,
    (_match, quote: string, value: string) => {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        return `stroke-width=${quote}${value}${quote}`;
      }
      const thinner = Math.max(0.8, parsed * 0.5);
      return `stroke-width=${quote}${thinner}${quote}`;
    },
  );
  return `data:image/svg+xml;utf8,${encodeURIComponent(normalizedSymbol)}`;
}

interface RatioCardProps {
  ratioOption: PosterRatio | null;
  onClick?: () => void;
  isSelected?: boolean;
}

export default function RatioCard({
  ratioOption,
  onClick,
  isSelected = false,
}: RatioCardProps) {
  if (!ratioOption) {
    return null;
  }
  const className = ["layout-card", isSelected ? "is-selected" : ""]
    .filter(Boolean)
    .join(" ");
  const symbolDataUri = getRatioSymbolDataUri(ratioOption);
  const sizeText = formatRatioDimensions(ratioOption);
  const infoText = sizeText;

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-pressed={isSelected}
    >
      <div className="layout-card-copy">
        <p className="layout-card-name">{ratioOption.name}</p>
        <p className="layout-card-meta">{infoText}</p>
      </div>
      {symbolDataUri ? (
        <img
          className="layout-card-symbol"
          src={symbolDataUri}
          alt={`${ratioOption.name} ratio symbol`}
        />
      ) : null}
    </button>
  );
}
