"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { useSearchParams } from "next/navigation";

export function MapStateSync() {
  const map = useMap();
  const searchParams = useSearchParams();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;

    const lat = searchParams?.get("lat");
    const lon = searchParams?.get("lon");
    const zoom = searchParams?.get("zoom");

    if (lat && lon && zoom) {
      const latNum = parseFloat(lat);
      const lonNum = parseFloat(lon);
      const zoomNum = parseInt(zoom, 10);

      if (!isNaN(latNum) && !isNaN(lonNum) && !isNaN(zoomNum)) {
        map.setView([latNum, lonNum], zoomNum, { animate: false });
      }
    }

    initializedRef.current = true;
  }, [map, searchParams]);

  useEffect(() => {
    if (!initializedRef.current) return;

    const handleMoveEnd = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();

      const params = new URLSearchParams();
      params.set("lat", center.lat.toFixed(6));
      params.set("lon", center.lng.toFixed(6));
      params.set("zoom", zoom.toString());

      searchParams?.forEach((value, key) => {
        if (!["lat", "lon", "zoom"].includes(key)) {
          params.set(key, value);
        }
      });

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, "", newUrl);
    };

    map.on("moveend", handleMoveEnd);
    map.on("zoomend", handleMoveEnd);

    return () => {
      map.off("moveend", handleMoveEnd);
      map.off("zoomend", handleMoveEnd);
    };
  }, [map, searchParams]);

  return null;
}
