import { useEffect, useRef, useMemo, useState } from "react";
import { MapLayerGroup, MapMarker, MapCircleMarker } from "@/components/ui/map";
import { cn } from "@/lib/utils";
import type { Marker, CircleMarker } from "leaflet";
import { InterpolatedJourney } from "@/types/trains";
import { useMap, useMapEvents } from "react-leaflet";
import { TrainDirectionIcon } from "@/components/icon/TrainDirectionIcon";

export function TrainsLayer({
  trains,
  selectedTrainId,
  onSelectTrain,
  followingTrainId,
}: {
  trains: InterpolatedJourney[];
  selectedTrainId: string | null;
  onSelectTrain: (id: string) => void;
  followingTrainId: string | null;
}) {
  const map = useMap();
  const markersRef = useRef<Map<string, Marker | CircleMarker>>(new Map());
  const requestRef = useRef<number>(0);
  const [zoom, setZoom] = useState(() => map.getZoom());
  const isZoomingRef = useRef(false);

  useMapEvents({
    zoomstart: () => {
      isZoomingRef.current = true;
    },
    zoomend: () => {
      isZoomingRef.current = false;
      setZoom(map.getZoom());
    },
    movestart: () => {
      isZoomingRef.current = true;
    },
    moveend: () => {
      isZoomingRef.current = false;
    },
  });

  const filteredTrains = useMemo(() => {
    if (zoom >= 10) return trains;

    const gridSize = zoom < 5 ? 0.6 : zoom < 7 ? 0.3 : zoom < 9 ? 0.1 : 0.04;

    const grid = new Map<string, InterpolatedJourney>();
    const results: InterpolatedJourney[] = [];
    const forceVisibleIds = new Set(
      [selectedTrainId, followingTrainId].filter(Boolean),
    );

    trains.forEach((t) => {
      const trainId = t.journey.FramedVehicleJourneyRef.DatedVehicleJourneyRef;

      if (forceVisibleIds.has(trainId)) {
        results.push(t);
        return;
      }

      let lat = 0,
        lon = 0;
      if (t.position) {
        lat = t.position.lat;
        lon = t.position.lon;
      } else if (t.lastStopCoords && t.nextStopCoords) {
        const now = Date.now();
        const tA = new Date(t.tA).getTime();
        const tB = new Date(t.tB).getTime();
        const duration = tB - tA;
        const ratio =
          duration > 0 ? Math.max(0, Math.min(1, (now - tA) / duration)) : 0;

        lat =
          t.lastStopCoords.lat +
          (t.nextStopCoords.lat - t.lastStopCoords.lat) * ratio;
        lon =
          t.lastStopCoords.lon +
          (t.nextStopCoords.lon - t.lastStopCoords.lon) * ratio;
      } else {
        return;
      }

      const gx = Math.floor(lon / gridSize);
      const gy = Math.floor(lat / gridSize);
      const gridId = `${gx}_${gy}`;

      const existing = grid.get(gridId);
      if (!existing) {
        grid.set(gridId, t);
      } else {
        const tName = (t.journey.PublishedLineName || "").toLowerCase();
        const eName = (existing.journey.PublishedLineName || "").toLowerCase();
        const tIsHigh = tName.includes("tgv") || tName.includes("ouigo");
        const eIsHigh = eName.includes("tgv") || eName.includes("ouigo");
        if (tIsHigh && !eIsHigh) {
          grid.set(gridId, t);
        }
      }
    });

    results.push(...Array.from(grid.values()));
    return results;
  }, [trains, zoom, selectedTrainId, followingTrainId]);

  const currentTimestamp = useMemo(() => Date.now(), [trains]);

  useEffect(() => {
    const trainsMap = new Map(
      filteredTrains.map((t) => [
        t.journey.FramedVehicleJourneyRef.DatedVehicleJourneyRef,
        t,
      ]),
    );

    const animate = () => {
      const now = Date.now();

      if (!isZoomingRef.current) {
        markersRef.current.forEach((marker, trainId) => {
          const train = trainsMap.get(trainId);
          if (!train || !train.lastStopCoords || !train.nextStopCoords) return;

          if (train.position && typeof train.bearing === "number") {
            return;
          }

          const tA = new Date(train.tA).getTime();
          const tB = new Date(train.tB).getTime();
          const duration = tB - tA;

          let ratio = 0;
          if (duration > 0) {
            ratio = (now - tA) / duration;
          }

          ratio = Math.max(0, Math.min(1, ratio));

          const lat =
            train.lastStopCoords.lat +
            (train.nextStopCoords.lat - train.lastStopCoords.lat) * ratio;
          const lon =
            train.lastStopCoords.lon +
            (train.nextStopCoords.lon - train.lastStopCoords.lon) * ratio;

          marker.setLatLng([lat, lon]);

          if (followingTrainId === trainId) {
            map.setView([lat, lon], map.getZoom(), { animate: false });
          }
        });
      }

      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [filteredTrains, followingTrainId, map]);

  return (
    <MapLayerGroup name="Trains">
      {filteredTrains.map((train) => {
        if (!train.lastStopCoords || !train.nextStopCoords) return null;

        const trainId =
          train.journey.FramedVehicleJourneyRef.DatedVehicleJourneyRef;
        let lat: number, lon: number, rotation: number;

        if (train.position && typeof train.bearing === "number") {
          lat = train.position.lat;
          lon = train.position.lon;
          rotation = train.bearing;
        } else {
          const tA = new Date(train.tA).getTime();
          const tB = new Date(train.tB).getTime();
          const duration = tB - tA;
          const now = currentTimestamp;

          let ratio = 0;
          if (duration > 0) {
            ratio = (now - tA) / duration;
          }

          ratio = Math.max(0, Math.min(1, ratio));

          lat =
            train.lastStopCoords.lat +
            (train.nextStopCoords.lat - train.lastStopCoords.lat) * ratio;
          lon =
            train.lastStopCoords.lon +
            (train.nextStopCoords.lon - train.lastStopCoords.lon) * ratio;

          const dy = train.nextStopCoords.lat - train.lastStopCoords.lat;
          const dx = train.nextStopCoords.lon - train.lastStopCoords.lon;
          const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          rotation = angle;
        }

        const isSelected = trainId === selectedTrainId;
        const name = (train.journey.PublishedLineName || "").toLowerCase();

        const isHigh =
          name.includes("tgv") ||
          name.includes("ouigo") ||
          name.includes("eurostar");

        const showDirection = zoom >= 12;

        if (!showDirection && !isSelected) {
          const color = isHigh ? "#ec5b13" : "#ffffff";
          return (
            <MapCircleMarker
              key={trainId}
              ref={(node: CircleMarker) => {
                if (node) markersRef.current.set(trainId, node);
                else markersRef.current.delete(trainId);
              }}
              center={[lat, lon]}
              radius={isHigh ? 5 : 4}
              pathOptions={{
                color: "#000000",
                fillColor: color,
                fillOpacity: 1,
                weight: 1,
                pane: "trainsPane",
              }}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation();
                  onSelectTrain(trainId);
                },
              }}
            />
          );
        }

        const dotSize = isSelected ? 16 : isHigh ? 10 : 8;
        const arrowSize = isSelected ? 12 : isHigh ? 11 : 10;
        const gap = 2;
        const markerHeight = Math.max(dotSize, arrowSize);
        const markerWidth = showDirection ? dotSize + gap + arrowSize : dotSize;

        return (
          <MapMarker
            key={trainId}
            ref={(node: Marker) => {
              if (node) markersRef.current.set(trainId, node);
              else markersRef.current.delete(trainId);
            }}
            position={[lat, lon]}
            icon={
              <div
                className="relative"
                style={{
                  width: markerWidth,
                  height: markerHeight,
                  transform: showDirection
                    ? `rotate(${rotation}deg)`
                    : undefined,
                  transformOrigin: "center",
                  transition: "transform 0.1s ease-out",
                }}
              >
                <div
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 rounded-full border border-black/50 shadow-sm transition-all duration-300",
                    isSelected
                      ? "bg-red-500 scale-125 z-50"
                      : isHigh
                        ? "bg-primary"
                        : "bg-white",
                    zoom < 7 && !isSelected && "border-transparent",
                  )}
                  style={{ width: dotSize, height: dotSize }}
                />
                {showDirection && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 leading-none"
                    style={{ left: dotSize + gap }}
                  >
                    <TrainDirectionIcon
                      size={arrowSize}
                      color="#ffffff"
                      rotation={0}
                    />
                  </div>
                )}
              </div>
            }
            iconAnchor={
              showDirection
                ? [Math.ceil(markerWidth / 2), Math.ceil(markerHeight / 2)]
                : isSelected
                  ? [8, 8]
                  : isHigh
                    ? [5, 5]
                    : [4, 4]
            }
            pane="trainsPane"
            eventHandlers={{
              click: (e) => {
                e.originalEvent.stopPropagation();
                onSelectTrain(trainId);
              },
            }}
          />
        );
      })}
    </MapLayerGroup>
  );
}
