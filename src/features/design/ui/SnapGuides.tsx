import React, { type CSSProperties } from "react";
import type { ActiveSnaps } from "../application/useDragInteraction";

interface SnapGuidesProps {
  activeSnaps: ActiveSnaps;
}

const GUIDE_COLOR = "rgba(59,130,246,0.75)";
const LABEL_STYLE: CSSProperties = {
  position: "absolute",
  fontSize: 10,
  color: "rgba(59,130,246,0.95)",
  background: "rgba(255,255,255,0.88)",
  padding: "1px 4px",
  borderRadius: 2,
  fontFamily: "monospace",
  whiteSpace: "nowrap",
  pointerEvents: "none",
};

export function SnapGuides({ activeSnaps }: SnapGuidesProps) {
  const hasAny = activeSnaps.x !== undefined || activeSnaps.y !== undefined;
  if (!hasAny) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      {activeSnaps.x !== undefined && (
        <div
          style={{
            position: "absolute",
            left: `${activeSnaps.x}%`,
            top: 0,
            bottom: 0,
            width: 0,
            borderLeft: `1.5px dashed ${GUIDE_COLOR}`,
            transform: "translateX(-0.75px)",
          }}
        >
          <span style={{ ...LABEL_STYLE, top: "50%", left: 4, transform: "translateY(-50%)" }}>
            {activeSnaps.x.toFixed(1)}%
          </span>
        </div>
      )}

      {activeSnaps.y !== undefined && (
        <div
          style={{
            position: "absolute",
            top: `${activeSnaps.y}%`,
            left: 0,
            right: 0,
            height: 0,
            borderTop: `1.5px dashed ${GUIDE_COLOR}`,
            transform: "translateY(-0.75px)",
          }}
        >
          <span style={{ ...LABEL_STYLE, left: "50%", top: 4, transform: "translateX(-50%)" }}>
            {activeSnaps.y.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}
