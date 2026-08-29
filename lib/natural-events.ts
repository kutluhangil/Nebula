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
