import type { DesignTemplate } from "../domain/types";

/* ────── Thumbnails (inline SVG) ────────────────────────────────────────────
 *
 * Each thumbnail is a miniature mockup of the actual layout. Rendered cream
 * on the dark card so it reads as a real poster mounted on a wall.
 * --------------------------------------------------------------------------- */

const PAPER = "#f4ede1";
const PAPER_MAP = "#ebe2d2";
const INK = "#1a1a1a";
const INK_SOFT = "#a89a85";
const ACCENT = "#7a3d2c";
const HEART_RED = "#c64531";

const classicThumbnail = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 110'><rect width='80' height='110' fill='${PAPER}'/><rect x='4' y='4' width='72' height='80' fill='${PAPER_MAP}'/><path d='M10 26 L66 30' stroke='${INK_SOFT}' stroke-width='0.5' opacity='0.55' fill='none'/><path d='M8 56 L66 50' stroke='${INK_SOFT}' stroke-width='0.5' opacity='0.5' fill='none'/><path d='M25 8 L30 82' stroke='${ACCENT}' stroke-width='1' opacity='0.7' fill='none'/><path d='M55 8 L52 82' stroke='${INK_SOFT}' stroke-width='0.45' opacity='0.55' fill='none'/><text x='40' y='93' text-anchor='middle' font-family='Georgia, serif' font-size='7' fill='${INK}' letter-spacing='0.5' font-weight='500'>CITY</text><line x1='32' y1='96.5' x2='48' y2='96.5' stroke='${INK}' stroke-width='0.3' opacity='0.5'/><text x='40' y='101.5' text-anchor='middle' font-family='sans-serif' font-size='2.4' fill='${INK}' letter-spacing='0.55' opacity='0.7'>COUNTRY</text><text x='40' y='106' text-anchor='middle' font-family='sans-serif' font-size='2.2' fill='${INK}' opacity='0.55'>38.779°N / 9.268°W</text></svg>`;

const editorialThumbnail = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 110'><rect width='80' height='110' fill='${PAPER}'/><rect x='5' y='5.5' width='70' height='80' fill='${PAPER_MAP}'/><path d='M8 22 Q26 28 42 24 T74 32' stroke='${INK_SOFT}' stroke-width='0.5' fill='none' opacity='0.6'/><path d='M6 50 Q30 42 50 56 T74 60' stroke='${INK_SOFT}' stroke-width='0.5' fill='none' opacity='0.5'/><path d='M14 6 L20 84' stroke='${INK_SOFT}' stroke-width='0.5' fill='none' opacity='0.5'/><path d='M48 6 L62 84' stroke='${ACCENT}' stroke-width='1.1' fill='none' opacity='0.75'/><line x1='5' y1='92' x2='75' y2='92' stroke='${INK}' stroke-width='0.2' opacity='0.45'/><text x='5' y='99' font-family='Georgia, serif' font-size='7.5' fill='${INK}' letter-spacing='0.1' font-weight='500'>CITY</text><text x='5' y='104.5' font-family='sans-serif' font-size='2.2' fill='${INK}' letter-spacing='0.4' opacity='0.7'>COUNTRY</text><text x='75' y='100' text-anchor='end' font-family='sans-serif' font-size='2' fill='${INK}' opacity='0.85'>38.779°N</text><text x='75' y='103.5' text-anchor='end' font-family='sans-serif' font-size='2' fill='${INK}' opacity='0.85'>9.268°W</text></svg>`;

const atelierThumbnail = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 110'><rect width='80' height='110' fill='${PAPER}'/><text x='40' y='21' text-anchor='middle' font-family='sans-serif' font-size='2' fill='${INK}' letter-spacing='0.6' opacity='0.7'>THE PLACE WE LOVE</text><circle cx='40' cy='46' r='24' fill='${PAPER_MAP}'/><path d='M20 38 Q35 32 58 52' stroke='${INK_SOFT}' stroke-width='0.5' fill='none' opacity='0.6'/><path d='M24 32 L56 60' stroke='${ACCENT}' stroke-width='0.8' fill='none' opacity='0.7'/><path d='M26 60 Q40 52 54 38' stroke='${INK_SOFT}' stroke-width='0.4' fill='none' opacity='0.55'/><text x='40' y='82' text-anchor='middle' font-family='Georgia, serif' font-size='6' fill='${INK}' letter-spacing='0.25' font-weight='500'>CITY</text><line x1='34' y1='86' x2='46' y2='86' stroke='${INK}' stroke-width='0.3' opacity='0.5'/><text x='40' y='90' text-anchor='middle' font-family='sans-serif' font-size='2' fill='${INK}' opacity='0.75'>38.779°N / 9.268°W</text><text x='40' y='94' text-anchor='middle' font-family='sans-serif' font-size='2' fill='${INK}' letter-spacing='0.6' opacity='0.7'>COUNTRY</text></svg>`;

const heartbeatThumbnail = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 110'><rect width='80' height='110' fill='${PAPER}'/><path d='M40 70 C22 56, 6 44, 14 28 C20 18, 32 22, 40 32 C48 22, 60 18, 66 28 C74 44, 58 56, 40 70 Z' fill='${PAPER_MAP}'/><path d='M18 38 L60 50' stroke='${INK_SOFT}' stroke-width='0.5' opacity='0.5' fill='none'/><path d='M28 28 L52 60' stroke='${ACCENT}' stroke-width='0.8' opacity='0.7' fill='none'/><text x='40' y='80' text-anchor='middle' font-family='Georgia, serif' font-size='6.5' fill='${INK}' letter-spacing='0.2' font-weight='500'>CITY</text><text x='40' y='85' text-anchor='middle' font-family='sans-serif' font-size='1.5' fill='${INK}' letter-spacing='0.3' opacity='0.85'>38.779°N / 9.268°W</text><text x='40' y='88.5' text-anchor='middle' font-family='sans-serif' font-size='1.5' fill='${INK}' letter-spacing='0.5' opacity='0.8'>COUNTRY</text><line x1='30' y1='92' x2='50' y2='92' stroke='${INK}' stroke-width='0.25' opacity='0.4'/><text x='40' y='96' text-anchor='middle' font-family='sans-serif' font-size='1.4' fill='${INK}' letter-spacing='0.4' opacity='0.9'>OUR STORY BEGAN HERE</text><text x='40' y='99' text-anchor='middle' font-family='sans-serif' font-size='1.3' fill='${INK}' letter-spacing='0.2' opacity='0.7'>DD / MM / YYYY</text></svg>`;

const compassThumbnail = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 110'><rect width='80' height='110' fill='${PAPER}'/><rect width='80' height='82' fill='${PAPER_MAP}'/><path d='M2 28 L78 32' stroke='${INK_SOFT}' stroke-width='0.55' opacity='0.5' fill='none'/><path d='M2 58 L78 54' stroke='${INK_SOFT}' stroke-width='0.55' opacity='0.45' fill='none'/><path d='M16 2 L22 82' stroke='${ACCENT}' stroke-width='1.1' opacity='0.75' fill='none'/><path d='M55 2 L60 82' stroke='${INK_SOFT}' stroke-width='0.45' opacity='0.55' fill='none'/><path d='M40 36 c-2 0, -3.2 1.5, -3.2 3.5 c0 2.5, 3.2 5.5, 3.2 5.5 s3.2 -3, 3.2 -5.5 c0 -2, -1.2 -3.5, -3.2 -3.5 z' fill='${INK}'/><circle cx='40' cy='39.5' r='1' fill='#fff'/><text x='40' y='92' text-anchor='middle' font-family='sans-serif' font-size='4.5' fill='${INK}' letter-spacing='0.5' font-weight='500'>CITY</text><line x1='35' y1='96' x2='45' y2='96' stroke='${INK}' stroke-width='0.3' opacity='0.55'/><text x='40' y='100.5' text-anchor='middle' font-family='sans-serif' font-size='1.6' fill='${INK}' letter-spacing='0.6' opacity='0.8'>COUNTRY</text><text x='40' y='105' text-anchor='middle' font-family='sans-serif' font-size='1.3' fill='${INK}' letter-spacing='0.2' opacity='0.6'>38.779°N / 9.268°W</text></svg>`;

/* ────── Template Definitions ──────────────────────────────────────────────
 *
 * Coordinates and sizes are normalized 0–100 relative to the poster frame.
 * Font sizes are percent of poster height; letterSpacing is in em.
 * --------------------------------------------------------------------------- */

const SERIF = "Cormorant Garamond";
const SERIF_HIGH = "Playfair Display";
const SANS = "Inter";

/* ── Classic ── */

const classicDesign: DesignTemplate = {
  id: "classic",
  name: "Classic",
  description: "Timeless rectangular poster with city and coordinates centered below.",
  thumbnail: classicThumbnail,
  mask: "rect",
  elements: [
    {
      id: "city",
      type: "text",
      x: 50,
      y: 82,
      content: "{{city}}",
      fontSize: 4.5,
      fontWeight: 300,
      textAlign: "center",
      letterSpacing: 0.35,
      textTransform: "uppercase",
      editable: true,
    },
    {
      id: "divider",
      type: "divider",
      x: 50,
      y: 86,
      width: 40,
      strokeWidth: 0.15,
    },
    {
      id: "country",
      type: "text",
      x: 50,
      y: 90,
      content: "{{country}}",
      fontSize: 2.0,
      fontWeight: 400,
      textAlign: "center",
      letterSpacing: 0.2,
      textTransform: "uppercase",
      editable: true,
    },
    {
      id: "coordinates",
      type: "coordinates",
      x: 50,
      y: 94,
      fontSize: 1.4,
      fontWeight: 400,
      textAlign: "center",
      letterSpacing: 0.15,
    },
  ],
  effects: {},
  styles: {
    useThemeTextColor: true,
    mapPadding: { top: 4, right: 4, bottom: 22, left: 4 },
  },
};

/* ── Editorial ── */

const editorialDesign: DesignTemplate = {
  id: "editorial",
  name: "Editorial",
  description: "Magazine-style layout with the city anchored bottom-left and stacked coordinates on the right.",
  thumbnail: editorialThumbnail,
  mask: "rect",
  centerMarker: { type: "none" },
  effects: {},
  styles: {
    fontFamily: SANS,
    useThemeTextColor: true,
    mapPadding: { top: 5, right: 6, bottom: 22, left: 6 },
  },
  elements: [
    {
      id: "rule",
      type: "divider",
      x: 50,
      y: 84,
      width: 88,
      strokeWidth: 0.1,
      opacity: 0.35,
    },
    {
      id: "city",
      type: "text",
      x: 50,
      y: 91,
      width: 88,
      textAlign: "left",
      content: "{{city}}",
      fontFamily: SERIF_HIGH,
      fontSize: 6.5,
      fontWeight: 500,
      letterSpacing: 0.05,
      textTransform: "uppercase",
      editable: true,
      editLabel: "City",
    },
    {
      id: "country",
      type: "text",
      x: 50,
      y: 96,
      width: 88,
      textAlign: "left",
      content: "{{country}}",
      fontFamily: SANS,
      fontSize: 1.6,
      fontWeight: 400,
      letterSpacing: 0.35,
      textTransform: "uppercase",
      opacity: 0.6,
      editable: true,
      editLabel: "Country",
    },
    {
      id: "coordinates",
      type: "coordinates",
      x: 50,
      y: 93.5,
      width: 88,
      textAlign: "right",
      coordsFormat: "decimal-stack",
      coordsPrecision: 4,
      fontFamily: SANS,
      fontSize: 1.4,
      letterSpacing: 0.2,
      lineHeight: 1.4,
      opacity: 0.75,
    },
  ],
};

/* ── Atelier (sharp circle, curved tagline) ── */

const atelierDesign: DesignTemplate = {
  id: "atelier",
  name: "Atelier",
  description: "Crisp circular map with a curved tagline above and elegant typography below.",
  thumbnail: atelierThumbnail,
  mask: "circle",
  effects: {},
  styles: {
    fontFamily: SANS,
    useThemeTextColor: true,
    mapPadding: { top: 20, right: 15, bottom: 30, left: 15 },
  },
  elements: [
    {
      id: "tagline",
      type: "text-arc",
      x: 50,
      y: 45,
      arcCenterX: 50,
      arcCenterY: 45,
      arcRadius: 37,
      arcMidAngle: 0,
      arcSpan: 120,
      content: "THE PLACE WE LOVE",
      fontFamily: SANS,
      fontSize: 1.6,
      fontWeight: 500,
      letterSpacing: 0.35,
      textTransform: "uppercase",
      opacity: 0.8,
      editable: true,
      editLabel: "Tagline",
    },
    {
      id: "city",
      type: "text",
      x: 50,
      y: 77,
      content: "{{city}}",
      fontFamily: SERIF_HIGH,
      fontSize: 5.8,
      fontWeight: 500,
      textAlign: "center",
      letterSpacing: 0.15,
      textTransform: "uppercase",
      editable: true,
      editLabel: "City",
    },
    {
      id: "divider",
      type: "divider",
      x: 50,
      y: 83.5,
      width: 20,
      strokeWidth: 0.08,
      opacity: 0.55,
    },
    {
      id: "coordinates",
      type: "coordinates",
      x: 50,
      y: 87.5,
      coordsFormat: "decimal-line",
      coordsPrecision: 3,
      fontFamily: SANS,
      fontSize: 1.45,
      letterSpacing: 0.18,
      opacity: 0.75,
    },
    {
      id: "country",
      type: "text",
      x: 50,
      y: 91.5,
      content: "{{country}}",
      fontFamily: SANS,
      fontSize: 1.4,
      letterSpacing: 0.5,
      textTransform: "uppercase",
      opacity: 0.7,
      editable: true,
      editLabel: "Country",
    },
  ],
};

/* ── Heartbeat (heart map + red heart center, story below) ── */

const heartbeatDesign: DesignTemplate = {
  id: "heartbeat",
  name: "Heartbeat",
  description: "Heart-shaped map — designed for anniversaries and gifts.",
  thumbnail: heartbeatThumbnail,
  mask: "heart",
  centerMarker: { type: "none" },
  effects: {},
  styles: {
    fontFamily: SANS,
    useThemeTextColor: true,
    mapPadding: { top: -2, right: -2, bottom: 32, left: -2 },
  },
  elements: [
    {
      id: "city",
      type: "text",
      x: 50,
      y: 71.5,
      content: "{{city}}",
      fontFamily: SERIF,
      fontSize: 6.5,
      fontWeight: 500,
      textAlign: "center",
      letterSpacing: 0.2,
      textTransform: "uppercase",
      editable: true,
      editLabel: "City",
    },
    {
      id: "coordinates",
      type: "coordinates",
      x: 50,
      y: 76.5,
      coordsFormat: "decimal-line",
      coordsPrecision: 3,
      fontFamily: SANS,
      fontSize: 1.35,
      letterSpacing: 0.3,
      opacity: 0.85,
    },
    {
      id: "country",
      type: "text",
      x: 50,
      y: 80,
      content: "{{country}}",
      fontFamily: SANS,
      fontSize: 1.4,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      opacity: 0.8,
      editable: true,
      editLabel: "Country",
    },
    {
      id: "divider",
      type: "divider",
      x: 50,
      y: 84,
      width: 25,
      strokeWidth: 0.08,
      opacity: 0.4,
    },
    {
      id: "tagline",
      type: "text",
      x: 50,
      y: 88,
      content: "OUR STORY BEGAN HERE",
      fontFamily: SANS,
      fontSize: 1.3,
      letterSpacing: 0.4,
      textTransform: "uppercase",
      editable: true,
      editLabel: "Tagline",
    },
    {
      id: "date",
      type: "text",
      x: 50,
      y: 91.5,
      content: "DD / MM / YYYY",
      fontFamily: SANS,
      fontSize: 1.2,
      letterSpacing: 0.2,
      opacity: 0.7,
      editable: true,
      editLabel: "Date",
    },
  ],
};

/* ── Compass (full-bleed map + center pin + spaced sans bottom) ── */

const compassDesign: DesignTemplate = {
  id: "compass",
  name: "Compass",
  description: "Modern minimalist layout with a prominent solid color base and contemporary typography.",
  thumbnail: compassThumbnail,
  mask: "rect",
  centerMarker: { type: "none" },
  effects: {},
  styles: {
    fontFamily: SANS,
    useThemeTextColor: true,
    mapPadding: { top: 0, right: 0, bottom: 25, left: 0 },
  },
  elements: [
    {
      id: "city",
      type: "text",
      x: 50,
      y: 83,
      content: "{{city}}",
      fontFamily: SANS,
      fontSize: 5.5,
      fontWeight: 500,
      textAlign: "center",
      letterSpacing: 0.35,
      textTransform: "uppercase",
      editable: true,
      editLabel: "City",
    },
    {
      id: "divider",
      type: "divider",
      x: 50,
      y: 88,
      width: 15,
      strokeWidth: 0.1,
      opacity: 0.5,
    },
    {
      id: "country",
      type: "text",
      x: 50,
      y: 91.5,
      content: "{{country}}",
      fontFamily: SANS,
      fontSize: 1.6,
      letterSpacing: 0.5,
      textTransform: "uppercase",
      opacity: 0.85,
      editable: true,
      editLabel: "Country",
    },
    {
      id: "coordinates",
      type: "coordinates",
      x: 50,
      y: 95.5,
      coordsFormat: "decimal-line",
      coordsPrecision: 4,
      fontFamily: SANS,
      fontSize: 1.3,
      letterSpacing: 0.25,
      opacity: 0.65,
    },
  ],
};

/* ────── Registry ────── */

const allDesigns: DesignTemplate[] = [
  classicDesign,
  editorialDesign,
  atelierDesign,
  heartbeatDesign,
  compassDesign,
];

const designsById: Record<string, DesignTemplate> = Object.fromEntries(
  allDesigns.map((d) => [d.id, d]),
);

export const designOptions: DesignTemplate[] = allDesigns;

export const defaultDesignId: string = "classic";

export function getDesignTemplate(designId: string): DesignTemplate {
  const id = String(designId ?? "").trim();
  return designsById[id] ?? designsById[defaultDesignId] ?? classicDesign;
}
