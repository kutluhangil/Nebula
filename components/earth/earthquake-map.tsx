"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { formatDistanceToNow } from "date-fns";
import { magnitudeColor } from "@/lib/dataviz";
import { EVENT_LAYERS, type NaturalEvent } from "@/lib/natural-events";

interface EarthquakeFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    tsunami: number;
  };
  geometry: {
    coordinates: [number, number, number];
  };
}

function getMagRadius(mag: number) {
  return Math.max(4, mag * 3);
}

export default function EarthquakeMap({
  earthquakes,
  naturalEvents = [],
  height = "500px",
}: {
  earthquakes: EarthquakeFeature[];
  naturalEvents?: NaturalEvent[];
  height?: string;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden border border-[var(--border)]"
      style={{ height }}
    >
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: "100%", width: "100%", background: "#0a0f1e" }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution=""
        />
        {earthquakes.map((quake) => {
          const [lon, lat] = quake.geometry.coordinates;
          const color = magnitudeColor(quake.properties.mag);
          const radius = getMagRadius(quake.properties.mag);

          return (
            <CircleMarker
              key={quake.id}
              center={[lat, lon]}
              radius={radius}
              fillColor={color}
              color={color}
              weight={1}
              opacity={0.8}
              fillOpacity={0.4}
            >
              <Popup className="nebula-popup">
                <div className="bg-gray-900 text-[var(--text)] p-3 rounded-lg min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-lg font-bold font-mono"
                      style={{ color }}
                    >
                      M{quake.properties.mag.toFixed(1)}
                    </span>
                    {quake.properties.tsunami === 1 && (
                      <span className="text-blue-400 text-xs">🌊 Tsunami</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 mb-1">
                    {quake.properties.place}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(quake.properties.time, {
                      addSuffix: true,
                    })}
                  </p>
                  <p className="text-xs text-gray-500">
                    Depth: {quake.geometry.coordinates[2].toFixed(1)}km
                  </p>
                  <p className="text-xs text-gray-500">
                    {lat.toFixed(3)}°, {lon.toFixed(3)}°
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* NASA EONET layers: wildfires, volcanoes, severe storms. */}
        {naturalEvents.map((event) => {
          const layer = EVENT_LAYERS[event.category];
          return (
            <CircleMarker
              key={event.id}
              center={[event.lat, event.lon]}
              radius={6}
              fillColor={layer.color}
              color={layer.color}
              weight={1}
              opacity={0.9}
              fillOpacity={0.55}
            >
              <Popup className="nebula-popup">
                <div className="bg-gray-900 text-[var(--text)] p-3 rounded-lg min-w-[200px]">
                  <div
                    className="text-xs font-mono uppercase tracking-wider mb-1"
                    style={{ color: layer.color }}
                  >
                    {layer.label}
                  </div>
                  <p className="text-sm text-gray-200 mb-1">{event.title}</p>
                  {event.magnitude !== null && (
                    <p className="text-xs text-gray-400">
                      {event.magnitude.toLocaleString()} {event.magnitudeUnit}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(event.date), {
                      addSuffix: true,
                    })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {event.lat.toFixed(3)}°, {event.lon.toFixed(3)}°
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
