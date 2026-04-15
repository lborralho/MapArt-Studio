import { useCallback, useRef, useState } from "react";
import {
  geocodeLocation,
  searchLocations,
} from "@/core/services";

interface MarkerLocationSearchProps {
  onLocationFound: (lat: number, lon: number, label: string) => void;
}

/** Try to parse a raw string as "lat, lon" coordinates. */
function tryParseCoordinates(
  input: string,
): { lat: number; lon: number } | null {
  const cleaned = input.replace(/[^\d.,\-\s]/g, "").trim();
  const parts = cleaned.split(/[\s,]+/);
  if (parts.length !== 2) return null;
  const lat = parseFloat(parts[0]);
  const lon = parseFloat(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90) return null;
  if (lon < -180 || lon > 180) return null;
  return { lat, lon };
}

export default function MarkerLocationSearch({
  onLocationFound,
}: MarkerLocationSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    Array<{ id: string; label: string; lat: number; lon: number }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value);
      setError("");

      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }

      const trimmed = value.trim();

      // Fast-path: detect coordinate input and show inline suggestion
      const coords = tryParseCoordinates(trimmed);
      if (coords) {
        setSuggestions([
          {
            id: "__coords__",
            label: `Coordinates: ${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}`,
            lat: coords.lat,
            lon: coords.lon,
          },
        ]);
        setIsSuggestionsOpen(true);
        return;
      }

      if (trimmed.length < 2) {
        setSuggestions([]);
        setIsSuggestionsOpen(false);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const results = await searchLocations(trimmed, 5);
          setSuggestions(
            results.map((r) => ({
              id: r.id,
              label: r.label,
              lat: r.lat,
              lon: r.lon,
            })),
          );
          setIsSuggestionsOpen(results.length > 0);
        } catch {
          setSuggestions([]);
          setIsSuggestionsOpen(false);
        } finally {
          setIsLoading(false);
        }
      }, 350);
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setError("");

    // Coordinate shortcut
    const coords = tryParseCoordinates(trimmed);
    if (coords) {
      onLocationFound(
        coords.lat,
        coords.lon,
        `${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}`,
      );
      setQuery("");
      setSuggestions([]);
      setIsSuggestionsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await geocodeLocation(trimmed);
      onLocationFound(result.lat, result.lon, result.label);
      setQuery("");
      setSuggestions([]);
      setIsSuggestionsOpen(false);
    } catch {
      setError("Location not found. Try a more specific address.");
    } finally {
      setIsLoading(false);
    }
  }, [query, onLocationFound]);

  const handleSuggestionClick = useCallback(
    (suggestion: { label: string; lat: number; lon: number }) => {
      onLocationFound(suggestion.lat, suggestion.lon, suggestion.label);
      setQuery("");
      setSuggestions([]);
      setIsSuggestionsOpen(false);
      inputRef.current?.blur();
    },
    [onLocationFound],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void handleSubmit();
      }
      if (event.key === "Escape") {
        setSuggestions([]);
        setIsSuggestionsOpen(false);
      }
    },
    [handleSubmit],
  );

  return (
    <div className="marker-location-search">
      <p className="marker-picker__section-title">Add by Location</p>
      <p className="marker-location-search__hint">
        Enter an address or coordinates (lat, lon)
      </p>
      <div className="marker-location-search__input-wrap">
        <input
          ref={inputRef}
          type="text"
          className="form-control-tall marker-location-search__input"
          placeholder="e.g. Eiffel Tower or 48.8584, 2.2945"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
          aria-label="Search location to place marker"
          aria-autocomplete="list"
          aria-expanded={isSuggestionsOpen}
        />
        <button
          type="button"
          className="marker-location-search__go-btn"
          onClick={() => void handleSubmit()}
          disabled={isLoading || !query.trim()}
          aria-label="Add marker at location"
          title="Add marker at location"
        >
          {isLoading ? (
            <span className="marker-location-search__spinner" aria-hidden="true" />
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
              <line x1="10.5" y1="10.5" x2="14.5" y2="14.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          )}
        </button>

        {isSuggestionsOpen && suggestions.length > 0 ? (
          <ul
            className="marker-location-search__suggestions"
            role="listbox"
            aria-label="Location suggestions"
          >
            {suggestions.map((s) => (
              <li
                key={s.id}
                role="option"
                aria-selected={false}
                className="marker-location-search__suggestion"
                onClick={() => handleSuggestionClick(s)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSuggestionClick(s);
                  }
                }}
                tabIndex={0}
              >
                <svg
                  className="marker-location-search__suggestion-pin"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <span className="marker-location-search__suggestion-label">
                  {s.label}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {error ? (
        <p className="marker-picker__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
