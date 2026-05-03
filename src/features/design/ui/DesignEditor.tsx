import { useState, useEffect } from "react";
import type {
  DesignTemplate,
  DesignElement,
  DesignElementOverride,
  DesignOverrides,
  DesignCoordsFormat,
  DesignCoordsPrecision,
} from "@/features/design/domain/types";
import type { FontOption } from "@/core/config";
import {
  ChevronDownIcon,
  AlignLeftIcon, AlignCenterHIcon, AlignRightIcon,
  AlignTopIcon, AlignCenterVIcon, AlignBottomIcon,
} from "@/shared/ui/Icons";

/* ────── Helpers ────── */

function humanize(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, " ");
}

function typeLabel(type: DesignElement["type"]): string {
  const map: Record<string, string> = {
    text: "text",
    "text-arc": "arc",
    divider: "divider",
    line: "line",
    coordinates: "coords",
  };
  return map[type] ?? type;
}

const FONT_WEIGHTS = [
  { value: 300, label: "Light" },
  { value: 400, label: "Reg" },
  { value: 500, label: "Med" },
  { value: 700, label: "Bold" },
];

const COORDS_FORMATS: { value: DesignCoordsFormat; label: string }[] = [
  { value: "dms", label: "DMS" },
  { value: "decimal-line", label: "Decimal" },
  { value: "decimal-stack", label: "Stacked" },
];

const COORDS_PRECISIONS: DesignCoordsPrecision[] = [3, 4, 5];

/* ────── Inline SVG icons for group headers ────── */

function IconMove() {
  return (
    <svg className="de-group-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v12M2 8h12M8 2l-2 2M8 2l2 2M8 14l-2-2M8 14l2-2M2 8l2-2M2 8l2 2M14 8l-2-2M14 8l-2 2" />
    </svg>
  );
}

function IconType() {
  return (
    <svg className="de-group-icon" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 3h12v2H9.5v8h-3V5H2V3z" />
    </svg>
  );
}

function IconSize() {
  return (
    <svg className="de-group-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 13h10M8 3v10M5 6l3-3 3 3" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg className="de-group-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5Z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

function IconArc() {
  return (
    <svg className="de-group-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 13a7 7 0 0 1 10 0" />
    </svg>
  );
}

function IconFormat() {
  return (
    <svg className="de-group-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 4h12M2 8h8M2 12h5" />
    </svg>
  );
}

/* ────── Number field ────── */

function NumField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="de-field">
      <span className="de-field-label">{label}</span>
      <input
        type="number"
        className="de-number-input"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
        }}
      />
    </label>
  );
}

/* ────── Per-element editor ────── */

function ElementEditor({
  element,
  override,
  fontOptions,
  onOverride,
  onReset,
}: {
  element: DesignElement;
  override: DesignElementOverride;
  fontOptions: FontOption[];
  onOverride: (o: Partial<DesignElementOverride>) => void;
  onReset: () => void;
}) {
  const isText = element.type === "text" || element.type === "text-arc";
  const isArc = element.type === "text-arc";
  const isPlainText = element.type === "text";
  const isDivider = element.type === "divider" || element.type === "line";
  const isCoords = element.type === "coordinates";

  // cx/cy take precedence over legacy x/y — they're set by the drag editor
  const x = override.cx ?? override.x ?? element.x;
  const y = override.cy ?? override.y ?? element.y;

  const alignH = (val: number) => onOverride(isArc ? { arcCenterX: val } : { cx: val });
  const alignV = (val: number) => onOverride(isArc ? { arcCenterY: val } : { cy: val });
  const color = override.color ?? element.color ?? "";
  const opacity = override.opacity ?? element.opacity ?? 1;
  const fontFamily = override.fontFamily ?? element.fontFamily ?? "";
  const fontSize = override.fontSize ?? element.fontSize ?? 3;
  const fontWeight = override.fontWeight ?? element.fontWeight ?? 400;
  const fontStyle = override.fontStyle ?? element.fontStyle ?? "normal";
  const letterSpacing = override.letterSpacing ?? element.letterSpacing ?? 0;
  const lineHeight = override.lineHeight ?? element.lineHeight ?? 1.2;
  const textAlign = override.textAlign ?? element.textAlign ?? "center";
  const textTransform = override.textTransform ?? element.textTransform ?? "none";
  const width = override.width ?? element.width ?? 40;
  const strokeWidth = override.strokeWidth ?? element.strokeWidth ?? 0.1;
  const arcRadius = override.arcRadius ?? element.arcRadius ?? 35;
  const arcMidAngle = override.arcMidAngle ?? element.arcMidAngle ?? 0;
  const arcSpan = override.arcSpan ?? element.arcSpan ?? 120;
  const coordsFormat = override.coordsFormat ?? element.coordsFormat ?? "dms";
  const coordsPrecision = override.coordsPrecision ?? element.coordsPrecision ?? 4;
  const hasOverride = Object.keys(override).length > 0;

  return (
    <div className="de-element-body">
      {/* Text content */}
      {isText && (
        <label className="de-field de-field--full">
          <span className="de-field-label">Text</span>
          <input
            type="text"
            className="de-text-input"
            value={override.content ?? element.content ?? ""}
            onChange={(e) => onOverride({ content: e.target.value })}
          />
        </label>
      )}

      {/* Position */}
      <div className="de-group">
        <span className="de-group-title">
          <IconMove />
          Position
        </span>
        <div className="de-align-grid">
          <div className="de-align-row">
            <button type="button" className="de-align-btn" title="Align left" onClick={() => alignH(0)}><AlignLeftIcon /></button>
            <button type="button" className="de-align-btn" title="Center horizontally" onClick={() => alignH(50)}><AlignCenterHIcon /></button>
            <button type="button" className="de-align-btn" title="Align right" onClick={() => alignH(100)}><AlignRightIcon /></button>
          </div>
          <div className="de-align-row">
            <button type="button" className="de-align-btn" title="Align top" onClick={() => alignV(0)}><AlignTopIcon /></button>
            <button type="button" className="de-align-btn" title="Center vertically" onClick={() => alignV(50)}><AlignCenterVIcon /></button>
            <button type="button" className="de-align-btn" title="Align bottom" onClick={() => alignV(100)}><AlignBottomIcon /></button>
          </div>
        </div>
        <div className="de-row">
          <NumField label="X %" value={x} min={0} max={100} step={0.5} onChange={(v) => onOverride({ cx: v })} />
          <NumField label="Y %" value={y} min={0} max={100} step={0.5} onChange={(v) => onOverride({ cy: v })} />
        </div>
      </div>

      {/* Typography */}
      {(isText || isCoords) && (
        <div className="de-group">
          <span className="de-group-title">
            <IconType />
            Typography
          </span>
          <label className="de-field de-field--full">
            <span className="de-field-label">Font</span>
            <select
              className="de-select"
              value={fontFamily}
              onChange={(e) => onOverride({ fontFamily: e.target.value || undefined })}
            >
              <option value="">Template default</option>
              {fontOptions.filter((f) => f.value !== "").map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </label>
          <div className="de-row">
            <NumField label="Size" value={fontSize} min={0.5} max={15} step={0.1} onChange={(v) => onOverride({ fontSize: v })} />
            <NumField label="Spacing" value={letterSpacing} min={0} max={2} step={0.05} onChange={(v) => onOverride({ letterSpacing: v })} />
          </div>
          {isText && (
            <div className="de-field de-field--full">
              <span className="de-field-label">Weight</span>
              <div className="de-weight-group">
                {FONT_WEIGHTS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`de-weight-btn${fontWeight === value ? " de-weight-btn--active" : ""}`}
                    onClick={() => onOverride({ fontWeight: value })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Italic + Case (text and arc) */}
          {isText && (
            <div className="de-row">
              <div className="de-field">
                <span className="de-field-label">Style</span>
                <div className="de-seg-group">
                  <button
                    type="button"
                    className={`de-seg-btn${fontStyle === "italic" ? " de-seg-btn--active" : ""}`}
                    title="Italic"
                    onClick={() => onOverride({ fontStyle: fontStyle === "italic" ? "normal" : "italic" })}
                  >
                    <em>I</em>
                  </button>
                </div>
              </div>
              <div className="de-field">
                <span className="de-field-label">Case</span>
                <div className="de-seg-group">
                  <button type="button" className={`de-seg-btn${textTransform === "none" ? " de-seg-btn--active" : ""}`} title="As typed" onClick={() => onOverride({ textTransform: "none" })}>Ag</button>
                  <button type="button" className={`de-seg-btn${textTransform === "uppercase" ? " de-seg-btn--active" : ""}`} title="UPPERCASE" onClick={() => onOverride({ textTransform: "uppercase" })}>AA</button>
                  <button type="button" className={`de-seg-btn${textTransform === "lowercase" ? " de-seg-btn--active" : ""}`} title="lowercase" onClick={() => onOverride({ textTransform: "lowercase" })}>aa</button>
                </div>
              </div>
            </div>
          )}

          {/* Text align + Line height (not arc) */}
          {!isArc && (
            <>
              <div className="de-field de-field--full">
                <span className="de-field-label">Align</span>
                <div className="de-seg-group">
                  <button type="button" className={`de-seg-btn${textAlign === "left" ? " de-seg-btn--active" : ""}`} onClick={() => onOverride({ textAlign: "left" })}>Left</button>
                  <button type="button" className={`de-seg-btn${textAlign === "center" ? " de-seg-btn--active" : ""}`} onClick={() => onOverride({ textAlign: "center" })}>Center</button>
                  <button type="button" className={`de-seg-btn${textAlign === "right" ? " de-seg-btn--active" : ""}`} onClick={() => onOverride({ textAlign: "right" })}>Right</button>
                </div>
              </div>
              <div className="de-row">
                <NumField label="Line H" value={lineHeight} min={0.7} max={3} step={0.05} onChange={(v) => onOverride({ lineHeight: v })} />
                {isPlainText && (
                  <NumField label="Width %" value={width || 0} min={0} max={100} step={5} onChange={(v) => onOverride({ width: v })} />
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Divider dimensions */}
      {isDivider && (
        <div className="de-group">
          <span className="de-group-title">
            <IconSize />
            Dimensions
          </span>
          <div className="de-row">
            <NumField label="Width %" value={width} min={1} max={100} step={1} onChange={(v) => onOverride({ width: v })} />
            <NumField label="Thickness" value={strokeWidth} min={0.05} max={1} step={0.05} onChange={(v) => onOverride({ strokeWidth: v })} />
          </div>
        </div>
      )}

      {/* Arc properties */}
      {isArc && (
        <div className="de-group">
          <span className="de-group-title">
            <IconArc />
            Arc
          </span>
          <div className="de-row">
            <NumField label="Radius" value={arcRadius} min={5} max={60} step={0.5} onChange={(v) => onOverride({ arcRadius: v })} />
            <NumField label="Span °" value={arcSpan} min={10} max={340} step={1} onChange={(v) => onOverride({ arcSpan: v })} />
          </div>
          <div className="de-row">
            <NumField label="Mid angle °" value={arcMidAngle} min={-180} max={180} step={1} onChange={(v) => onOverride({ arcMidAngle: v })} />
          </div>
        </div>
      )}

      {/* Coordinates format */}
      {isCoords && (
        <div className="de-group">
          <span className="de-group-title">
            <IconFormat />
            Format
          </span>
          <div className="de-field de-field--full">
            <span className="de-field-label">Display</span>
            <div className="de-seg-group">
              {COORDS_FORMATS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`de-seg-btn${coordsFormat === value ? " de-seg-btn--active" : ""}`}
                  onClick={() => onOverride({ coordsFormat: value })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {coordsFormat !== "dms" && (
            <div className="de-field de-field--full">
              <span className="de-field-label">Precision</span>
              <div className="de-seg-group">
                {COORDS_PRECISIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`de-seg-btn${coordsPrecision === p ? " de-seg-btn--active" : ""}`}
                    onClick={() => onOverride({ coordsPrecision: p })}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Appearance */}
      <div className="de-group">
        <span className="de-group-title">
          <IconEye />
          Appearance
        </span>
        <div className="de-color-row" style={{ padding: "0" }}>
          <span className="de-field-label">Color</span>
          <div className="de-color-controls">
            <input
              type="color"
              className="de-color-input"
              value={color || "#000000"}
              onChange={(e) => onOverride({ color: e.target.value })}
            />
            {override.color && (
              <button
                type="button"
                className="de-clear-btn"
                title="Reset to default"
                onClick={() => onOverride({ color: undefined })}
              >
                ↩
              </button>
            )}
          </div>
        </div>
        <div className="de-field de-field--full">
          <div className="de-slider-header">
            <span className="de-field-label">Opacity</span>
            <span className="de-slider-value">{Math.round(opacity * 100)}%</span>
          </div>
          <input
            type="range"
            className="de-slider"
            min={0}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => onOverride({ opacity: parseFloat(e.target.value) })}
          />
        </div>
      </div>

      {/* Reset element */}
      {hasOverride && (
        <button type="button" className="de-element-reset" onClick={onReset}>
          Reset element
        </button>
      )}
    </div>
  );
}

/* ────── Main DesignEditor component ────── */

export interface DesignEditorProps {
  design: DesignTemplate;
  overrides: DesignOverrides;
  themeBgColor: string;
  designBgColor: string | null;
  fontOptions: FontOption[];
  activeElementId?: string | null;
  onActiveElementChange?: (id: string | null) => void;
  onOverride: (elementId: string, override: Partial<DesignElementOverride>) => void;
  onClearElementOverride: (elementId: string) => void;
  onBgColorChange: (color: string | null) => void;
  onResetAll: () => void;
}

export default function DesignEditor({
  design,
  overrides,
  themeBgColor,
  designBgColor,
  fontOptions,
  activeElementId,
  onActiveElementChange,
  onOverride,
  onClearElementOverride,
  onBgColorChange,
  onResetAll,
}: DesignEditorProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (activeElementId) {
      setExpandedIds((prev) => {
        if (prev.has(activeElementId)) return prev;
        return new Set([...prev, activeElementId]);
      });
    }
  }, [activeElementId]);

  const toggleElement = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    onActiveElementChange?.(id);
  };

  const effectiveBg = designBgColor ?? themeBgColor;
  const hasAnyOverride =
    Object.keys(overrides).length > 0 || designBgColor !== null;

  return (
    <div className="design-editor">
      {/* ── Background ── */}
      <div className="de-section">
        <div className="de-section-header">
          <span className="de-section-title">Background</span>
        </div>
        <div className="de-color-row">
          <span className="de-field-label">Color</span>
          <div className="de-color-controls">
            <input
              type="color"
              className="de-color-input"
              value={effectiveBg}
              onChange={(e) => onBgColorChange(e.target.value)}
            />
            {designBgColor !== null && (
              <button
                type="button"
                className="de-clear-btn"
                title="Reset to theme color"
                onClick={() => onBgColorChange(null)}
              >
                ↩
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Elements ── */}
      <div className="de-section">
        <div className="de-section-header">
          <span className="de-section-title">Elements</span>
          {hasAnyOverride && (
            <button type="button" className="de-reset-all-btn" onClick={onResetAll}>
              Reset all
            </button>
          )}
        </div>
        <div className="de-element-list">
          {design.elements.map((el) => {
            const isOpen = expandedIds.has(el.id);
            const isActive = el.id === activeElementId;
            const override = overrides[el.id] ?? {};
            const hasOverride = Object.keys(override).length > 0;
            const label = el.editLabel ?? humanize(el.id);

            return (
              <div
                key={el.id}
                className={`de-element-card${isOpen ? " de-element-card--open" : ""}${isActive ? " de-element-card--active" : ""}`}
              >
                <button
                  type="button"
                  className="de-element-header"
                  onClick={() => toggleElement(el.id)}
                  aria-expanded={isOpen}
                >
                  <span className="de-element-label">{label}</span>
                  <span className="de-element-type">{typeLabel(el.type)}</span>
                  {hasOverride && <span className="de-override-dot" aria-hidden="true" />}
                  <ChevronDownIcon className="de-element-chevron" />
                </button>
                {isOpen && (
                  <ElementEditor
                    element={el}
                    override={override}
                    fontOptions={fontOptions}
                    onOverride={(o) => onOverride(el.id, o)}
                    onReset={() => onClearElementOverride(el.id)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
