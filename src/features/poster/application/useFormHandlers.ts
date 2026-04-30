import { useCallback } from "react";
import { usePosterContext } from "../ui/PosterContext";
import { clamp } from "@/shared/geo/math";
import {
  normalizePosterSizeValue,
  resolveRatioIdForSize,
  formatRatioCm,
} from "@/features/layout/domain/layoutMatcher";
import {
  getRatioOption,
  ratioOptions,
} from "@/features/layout/infrastructure/layoutRepository";
import {
  MIN_POSTER_CM,
  MAX_POSTER_CM,
  MIN_DISTANCE_METERS,
  MAX_DISTANCE_METERS,
  LAYOUT_MATCH_TOLERANCE_CM,
} from "@/core/config";

/**
 * Provides ready-made event handlers for the settings form,
 * replacing the inline handlers previously in App.jsx.
 */
export function useFormHandlers() {
  const { state, dispatch } = usePosterContext();

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const target = event.target as HTMLInputElement;
      const { name, value, type } = target;
      const checked = "checked" in target ? target.checked : false;

      if (type === "checkbox") {
        dispatch({ type: "SET_FIELD", name, value: checked });
        return;
      }

      const fieldValue: string | boolean = value as string;

      // After a suggestion is selected, the reducer sets isLocationFocused=false.
      // If the user starts typing without re-clicking (DOM focus never left),
      // onFocus never fires, so we restore it here on the first keystroke.
      if (name === "location" && !state.isLocationFocused) {
        dispatch({ type: "SET_LOCATION_FOCUSED", focused: true });
      }

      dispatch({ type: "SET_FIELD", name, value: fieldValue });
    },
    [dispatch, state.isLocationFocused],
  );

  const handleNumericFieldBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      const { name, value } = event.target;
      const trimmed = String(value ?? "").trim();
      if (!trimmed) return;

      const parsed = Number(trimmed);
      if (!Number.isFinite(parsed)) return;

      if (name === "distance") {
        dispatch({
          type: "SET_FIELD",
          name: "distance",
          value: String(
            Math.round(clamp(parsed, MIN_DISTANCE_METERS, MAX_DISTANCE_METERS)),
          ),
        });
        return;
      }

      if (name === "width" || name === "height") {
        const normalizedChangedValue = clamp(
          parsed,
          MIN_POSTER_CM,
          MAX_POSTER_CM,
        );

        const prevWidth =
          name === "width" ? normalizedChangedValue : Number(state.form.width);
        const prevHeight =
          name === "height"
            ? normalizedChangedValue
            : Number(state.form.height);

        const nextWidth = normalizePosterSizeValue(
          prevWidth,
          normalizedChangedValue,
          MIN_POSTER_CM,
          MAX_POSTER_CM,
        );
        const nextHeight = normalizePosterSizeValue(
          prevHeight,
          normalizedChangedValue,
          MIN_POSTER_CM,
          MAX_POSTER_CM,
        );

        dispatch({
          type: "SET_FORM_FIELDS",
          fields: {
            width: formatRatioCm(nextWidth),
            height: formatRatioCm(nextHeight),
            ratio: resolveRatioIdForSize(
              nextWidth,
              nextHeight,
              state.form.ratio,
              LAYOUT_MATCH_TOLERANCE_CM,
              getRatioOption(state.form.ratio),
              ratioOptions,
            ),
          },
        });
      }
    },
    [dispatch, state.form.width, state.form.height, state.form.ratio],
  );

  const handleThemeChange = useCallback(
    (themeId: string) => {
      dispatch({ type: "SET_THEME", themeId });
    },
    [dispatch],
  );

  const handleRatioChange = useCallback(
    (ratioId: string) => {
      const ratioOption = getRatioOption(ratioId);
      if (!ratioOption) return;

      dispatch({
        type: "SET_RATIO",
        ratioId: ratioOption.id,
        widthCm: formatRatioCm(ratioOption.widthCm),
        heightCm: formatRatioCm(ratioOption.heightCm),
      });
    },
    [dispatch],
  );

  const handleColorChange = useCallback(
    (key: string, value: string) => {
      dispatch({ type: "SET_COLOR", key, value });
    },
    [dispatch],
  );

  const handleResetColors = useCallback(() => {
    dispatch({ type: "RESET_COLORS" });
  }, [dispatch]);

  const handleLocationSelect = useCallback(
    (suggestion: {
      label: string;
      lat: number;
      lon: number;
      city: string;
      country: string;
      id: string;
    }) => {
      dispatch({ type: "SELECT_LOCATION", location: suggestion });
    },
    [dispatch],
  );

  const handleClearLocation = useCallback(() => {
    dispatch({ type: "CLEAR_LOCATION" });
  }, [dispatch]);

  const setLocationFocused = useCallback(
    (focused: boolean) => {
      dispatch({ type: "SET_LOCATION_FOCUSED", focused });
    },
    [dispatch],
  );

  return {
    handleChange,
    handleNumericFieldBlur,
    handleThemeChange,
    handleRatioChange,
    handleColorChange,
    handleResetColors,
    handleLocationSelect,
    handleClearLocation,
    setLocationFocused,
  };
}
