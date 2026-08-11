"use client";

import { useEffect, useState } from "react";
import { MapLayerGroup, MapCircleMarker, MapPopup } from "@/components/ui/map";
import { useMap, useMapEvents } from "react-leaflet";

interface Station {
  uic: string;
  lat: number;
  lon: number;
  name: string;
}

export function StationsLayer() {
  const [stations, setStations] = useState<Station[]>([]);
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  useEffect(() => {
    fetch("/network/gares.json")
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        const seen = new Set();
        const uniqueStations = data.filter((s: Station) => {
          if (seen.has(s.uic)) return false;
          seen.add(s.uic);
          return true;
        });
        setStations(uniqueStations);
      })
      .catch((err) => {});
  }, []);

  if (zoom < 10) return null;

  return (
    <MapLayerGroup name="Gares" pane="stationsPane">
      {stations.map((station) => (
        <MapCircleMarker
          key={station.uic}
          center={[station.lat, station.lon]}
          radius={4}
          pathOptions={{
            color: "#ffffff",
            fillColor: "#ef4444",
            fillOpacity: 1,
            weight: 2,
            pane: "stationsPane",
          }}
        >
          {zoom >= 13 && (
            <MapPopup>
              <div className="text-sm">
                <strong>{station.name}</strong>
                <br />
                <span className="text-xs text-muted-foreground">
                  UIC: {station.uic}
                </span>
              </div>
            </MapPopup>
          )}
        </MapCircleMarker>
      ))}
    </MapLayerGroup>
  );
}
