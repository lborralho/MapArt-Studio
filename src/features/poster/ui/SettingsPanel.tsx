import { useState } from "react";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { useFormHandlers } from "@/features/poster/application/useFormHandlers";
import { useLocationAutocomplete } from "@/features/location/application/useLocationAutocomplete";
import { useCurrentLocation } from "@/features/location/application/useCurrentLocation";
import { useMapSync } from "@/features/map/application/useMapSync";
import type { MobileTab } from "@/shared/ui/MobileNavBar";

import LocationSection from "@/features/location/ui/LocationSection";
import MapSettingsSection from "@/features/map/ui/MapSettingsSection";
import LayersSection from "@/features/map/ui/LayersSection";
import MarkersSection from "@/features/markers/ui/MarkersSection";
import TypographySection from "@/features/poster/ui/TypographySection";
import {
  LocationIcon,
  ThemeIcon,
  RatioIcon,
  LayersIcon,
  MarkersIcon,
  StyleIcon,
  DesignIcon,
  ChevronDownIcon,
} from "@/shared/ui/Icons";

import { themeOptions } from "@/features/theme/infrastructure/themeRepository";
import { ratioGroups } from "@/features/layout/infrastructure/layoutRepository";
import {
  MIN_POSTER_CM,
  MAX_POSTER_CM,
  FONT_OPTIONS,
} from "@/core/config";
import type { SearchResult } from "@/features/location/domain/types";
import { designOptions } from "@/features/design/infrastructure/designRepository";
import { getDesignTemplate } from "@/features/design/infrastructure/designRepository";
import DesignCard from "@/features/design/ui/DesignCard";

type SectionId =
  | "location"
  | "theme"
  | "design"
  | "layout"
  | "layers"
  | "markers"
  | "style";

const accordionSections: {
  id: SectionId;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "location", label: "Location", Icon: LocationIcon },
  { id: "theme", label: "Theme", Icon: ThemeIcon },
  { id: "design", label: "Design", Icon: DesignIcon },
  { id: "layout", label: "Ratio", Icon: RatioIcon },
  { id: "layers", label: "Layers", Icon: LayersIcon },
  { id: "markers", label: "Markers", Icon: MarkersIcon },
  { id: "style", label: "Style", Icon: StyleIcon },
];

export default function SettingsPanel({
  mobileTab,
}: {
  mobileTab?: MobileTab;
}) {
  const { state, dispatch, selectedTheme } = usePosterContext();
  const {
    handleChange,
    handleNumericFieldBlur,
    handleThemeChange,
    handleRatioChange,
    handleColorChange,
    handleResetColors,
    handleLocationSelect,
    handleClearLocation,
    setLocationFocused,
  } = useFormHandlers();
  const { locationSuggestions, isLocationSearching, searchNow } = useLocationAutocomplete(
    state.form.location,
    state.isLocationFocused,
  );
  const { flyToLocation } = useMapSync();
  const { handleUseCurrentLocation, isLocatingUser, locationPermissionMessage } =
    useCurrentLocation(flyToLocation);

  const [isColorEditorActive, setIsColorEditorActive] = useState(false);
  const [openSections, setOpenSections] = useState<Set<SectionId>>(
    new Set(["location", "theme", "design", "layout", "style"]),
  );

  const isAuxEditorActive = isColorEditorActive;
  const showLocationSuggestions =
    state.isLocationFocused && locationSuggestions.length > 0;

  const toggleSection = (id: SectionId) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const onLocationSelect = (location: SearchResult) => {
    handleLocationSelect(location);
    flyToLocation(location.lat, location.lon);
  };

  return (
    <form className="settings-panel" onSubmit={(e) => e.preventDefault()}>
      <div
        className={`mobile-section mobile-section--location accordion-item${openSections.has("location") ? " accordion-item--open" : ""}`}
      >
        <AccordionHeader
          sectionId="location"
          label={accordionSections[0].label}
          Icon={accordionSections[0].Icon}
          isOpen={openSections.has("location")}
          onToggle={toggleSection}
        />
        <div
          className={`accordion-body${openSections.has("location") ? " is-open" : ""}`}
        >
          <div className="accordion-body-inner">
            {!isColorEditorActive ? (
              <LocationSection
                form={state.form}
                onChange={handleChange}
                onLocationFocus={() => setLocationFocused(true)}
                onLocationBlur={() => setLocationFocused(false)}
                searchNow={searchNow}
                showLocationSuggestions={showLocationSuggestions}
                locationSuggestions={locationSuggestions}
                isLocationSearching={isLocationSearching}
                onLocationSelect={onLocationSelect}
                onClearLocation={handleClearLocation}
                onUseCurrentLocation={handleUseCurrentLocation}
                isLocatingUser={isLocatingUser}
                locationPermissionMessage={locationPermissionMessage}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div
        className={`mobile-section mobile-section--theme-settings accordion-item${openSections.has("theme") ? " accordion-item--open" : ""}`}
      >
        <AccordionHeader
          sectionId="theme"
          label={accordionSections[1].label}
          Icon={accordionSections[1].Icon}
          isOpen={openSections.has("theme")}
          onToggle={toggleSection}
        />
        <div
          className={`accordion-body${openSections.has("theme") ? " is-open" : ""}`}
        >
          <div className="accordion-body-inner">
            {!isColorEditorActive ? (
              <MapSettingsSection
                activeMobileTab={mobileTab}
                form={state.form}
                onChange={handleChange}
                onNumericFieldBlur={handleNumericFieldBlur}
                onThemeChange={handleThemeChange}
                onRatioChange={handleRatioChange}
                selectedTheme={selectedTheme}
                themeOptions={themeOptions}
                ratioGroups={ratioGroups}
                minPosterCm={MIN_POSTER_CM}
                maxPosterCm={MAX_POSTER_CM}
                customColors={state.customColors}
                onColorChange={handleColorChange}
                onResetColors={handleResetColors}
                onColorEditorActiveChange={setIsColorEditorActive}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div
        className={`mobile-section mobile-section--layout-settings accordion-item${openSections.has("layout") ? " accordion-item--open" : ""}`}
      >
        <AccordionHeader
          sectionId="layout"
          label={accordionSections[3].label}
          Icon={accordionSections[3].Icon}
          isOpen={openSections.has("layout")}
          onToggle={toggleSection}
        />
        <div
          className={`accordion-body${openSections.has("layout") ? " is-open" : ""}`}
        >
          <div className="accordion-body-inner">
            {!isColorEditorActive ? (
              <MapSettingsSection
                activeMobileTab={mobileTab}
                form={state.form}
                onChange={handleChange}
                onNumericFieldBlur={handleNumericFieldBlur}
                onThemeChange={handleThemeChange}
                onRatioChange={handleRatioChange}
                selectedTheme={selectedTheme}
                themeOptions={themeOptions}
                ratioGroups={ratioGroups}
                minPosterCm={MIN_POSTER_CM}
                maxPosterCm={MAX_POSTER_CM}
                customColors={state.customColors}
                onColorChange={handleColorChange}
                onResetColors={handleResetColors}
                onColorEditorActiveChange={setIsColorEditorActive}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div
        className={`mobile-section mobile-section--design accordion-item${openSections.has("design") ? " accordion-item--open" : ""}`}
      >
        <AccordionHeader
          sectionId="design"
          label={accordionSections.find((s) => s.id === "design")!.label}
          Icon={accordionSections.find((s) => s.id === "design")!.Icon}
          isOpen={openSections.has("design")}
          onToggle={toggleSection}
        />
        <div
          className={`accordion-body${openSections.has("design") ? " is-open" : ""}`}
        >
          <div className="accordion-body-inner">
            {!isColorEditorActive ? (
              <section className="panel-block">
                <h2>Design Template</h2>
                <div className="design-template-list card-scroll-list">
                  {designOptions.map((design) => (
                    <DesignCard
                      key={design.id}
                      design={design}
                      isSelected={design.id === state.form.designId}
                      onClick={() =>
                        dispatch({ type: "SET_DESIGN", designId: design.id })
                      }
                    />
                  ))}
                </div>
                {state.form.designId !== "classic" ? (
                  <div className="design-text-overrides">
                    <h3>Customize Text</h3>
                    {getDesignTemplate(state.form.designId)
                      .elements.filter(
                        (el) =>
                          el.editable &&
                          (el.type === "text" || el.type === "text-arc"),
                      )
                      .map((el) => {
                        const label =
                          el.editLabel ??
                          el.id.charAt(0).toUpperCase() + el.id.slice(1);
                        const placeholder =
                          el.content?.replace(/\{\{(\w+)\}\}/g, (_, k) => k) ?? "";
                        return (
                          <label key={el.id} className="design-text-field">
                            <span className="design-text-field-label">{label}</span>
                            <input
                              type="text"
                              className="design-text-field-input"
                              placeholder={placeholder}
                              value={state.designOverrides[el.id] ?? ""}
                              onChange={(e) =>
                                dispatch({
                                  type: "SET_DESIGN_OVERRIDE",
                                  elementId: el.id,
                                  content: e.target.value,
                                })
                              }
                            />
                          </label>
                        );
                      })}
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className={`mobile-section mobile-section--layers accordion-item${openSections.has("layers") ? " accordion-item--open" : ""}`}
      >
        <AccordionHeader
          sectionId="layers"
          label={accordionSections[4].label}
          Icon={accordionSections[4].Icon}
          isOpen={openSections.has("layers")}
          onToggle={toggleSection}
        />
        <div
          className={`accordion-body${openSections.has("layers") ? " is-open" : ""}`}
        >
          <div className="accordion-body-inner">
            {!isAuxEditorActive ? (
              <LayersSection
                form={state.form}
                onChange={handleChange}
                minPosterCm={MIN_POSTER_CM}
                maxPosterCm={MAX_POSTER_CM}
                onNumericFieldBlur={handleNumericFieldBlur}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div
        className={`mobile-section mobile-section--markers accordion-item${openSections.has("markers") ? " accordion-item--open" : ""}`}
      >
        <AccordionHeader
          sectionId="markers"
          label={accordionSections[5].label}
          Icon={accordionSections[5].Icon}
          isOpen={openSections.has("markers")}
          onToggle={toggleSection}
        />
        <div
          className={`accordion-body${openSections.has("markers") ? " is-open" : ""}`}
        >
          <div className="accordion-body-inner">
            {!isColorEditorActive ? <MarkersSection /> : null}
          </div>
        </div>
      </div>

      <div
        className={`mobile-section mobile-section--style accordion-item${openSections.has("style") ? " accordion-item--open" : ""}`}
      >
        <AccordionHeader
          sectionId="style"
          label={accordionSections[6].label}
          Icon={accordionSections[6].Icon}
          isOpen={openSections.has("style")}
          onToggle={toggleSection}
        />
        <div
          className={`accordion-body${openSections.has("style") ? " is-open" : ""}`}
        >
          <div className="accordion-body-inner">
            {!isAuxEditorActive ? (
              <TypographySection
                form={state.form}
                onChange={handleChange}
                fontOptions={FONT_OPTIONS}
              />
            ) : null}
          </div>
        </div>
      </div>

      {!isAuxEditorActive && state.error ? <p className="error">{state.error}</p> : null}
    </form>
  );
}

function AccordionHeader({
  sectionId,
  label,
  Icon,
  isOpen,
  onToggle,
}: {
  sectionId: SectionId;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  isOpen: boolean;
  onToggle: (id: SectionId) => void;
}) {
  return (
    <button
      type="button"
      className={`accordion-header${isOpen ? " is-open" : ""}`}
      onClick={() => onToggle(sectionId)}
      aria-expanded={isOpen}
    >
      <Icon className="accordion-icon" />
      <span className="accordion-label">{label}</span>
      <ChevronDownIcon className="accordion-chevron" />
    </button>
  );
}
