/** Shared shape and presentation for the NASA EONET layers on the Earth page. */

export type EventCategory = "wildfires" | "volcanoes" | "severeStorms";

export interface NaturalEvent {
  id: string;
  title: string;
  description: string | null;
  category: EventCategory;
  lat: number;
  lon: number;
  date: string;
  magnitude: number | null;
  magnitudeUnit: string | null;
  sourceUrl: string | null;
}

export interface EventsResponse {
  category: EventCategory;
  categoryTitle: string;
  events: NaturalEvent[];
  source: string;
}

/**
 * Colours sit alongside the seismic severity scale rather than inside it, so a
 * wildfire is never mistaken for a magnitude band.
 */
export const EVENT_LAYERS: Record<
  EventCategory,
  { label: string; color: string }
> = {
  wildfires: { label: "Wildfires", color: "#ff7a3d" },
  volcanoes: { label: "Volcanoes", color: "#e0483d" },
  severeStorms: { label: "Severe Storms", color: "#4aa8ff" },
};

export const EVENT_CATEGORIES = Object.keys(EVENT_LAYERS) as EventCategory[];

/**
 * Map layers that do not come from EONET. They are declared beside the EONET
 * ones so the legend, the toggles and the map draw from a single list of
 * colours, but each reads its own source: radar from RainViewer, tsunami from
 * the flag USGS already sets on a quake.
 */
export const RADAR_LAYER = { label: "Weather radar", color: "#3fdfe8" } as const;
export const TSUNAMI_LAYER = { label: "Tsunami alerts", color: "#4aa8ff" } as const;
