import type { DesignTemplate } from "../domain/types";

function getDesignThumbnailDataUri(design: DesignTemplate): string {
  const svg = String(design.thumbnail ?? "").trim();
  if (!svg) return "";
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

interface DesignCardProps {
  design: DesignTemplate;
  isSelected: boolean;
  onClick: () => void;
}

export default function DesignCard({
  design,
  isSelected,
  onClick,
}: DesignCardProps) {
  const className = ["design-card", isSelected ? "is-selected" : ""]
    .filter(Boolean)
    .join(" ");
  const thumbnailUri = getDesignThumbnailDataUri(design);

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-pressed={isSelected}
    >
      {thumbnailUri ? (
        <img
          className="design-card-thumbnail"
          src={thumbnailUri}
          alt={`${design.name} design preview`}
        />
      ) : (
        <div className="design-card-thumbnail design-card-thumbnail--empty" />
      )}
      <div className="design-card-copy">
        <p className="design-card-name">{design.name}</p>
        <p className="design-card-meta">{design.description}</p>
      </div>
    </button>
  );
}
