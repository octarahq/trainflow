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

  const wasmRef = useRef<{
    snap: (lon: number, lat: number, count: number) => void;
    memory: Float64Array;
    count: number;
  } | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/snapper.wasm")
      .then((r) => r.arrayBuffer())
      .then((bytes) =>
        WebAssembly.instantiate(bytes, { env: { abort: () => {} } }),
      )
      .then((result) => {
        if (!active) return;
        const exports = result.instance.exports as any;
        wasmRef.current = {
          snap: exports.snap,
          memory: new Float64Array(exports.memory.buffer),
          count: 0,
        };
        fetchRails();
      })
      .catch((err) => console.error("WASM load error", err));
    return () => {
      active = false;
    };
  }, []);

  const fetchRails = async () => {
    if (!wasmRef.current || map.getZoom() < 10) return;
    try {
      const bounds = map.getBounds();
      const bbox = `minLat=${bounds.getSouth()}&maxLat=${bounds.getNorth()}&minLon=${bounds.getWest()}&maxLon=${bounds.getEast()}`;
      const res = await fetch(`/api/rails?${bbox}`);
      const segments = await res.json();

      const memArray = wasmRef.current.memory;
      let offset = 0;
      for (const seg of segments) {
        for (const c of seg.coords) {
          if (offset < 199990) {
            memArray[offset++] = c[0];
            memArray[offset++] = c[1];
          }
        }
        if (offset < 199990) {
          memArray[offset++] = 9999;
          memArray[offset++] = 9999;
        }
      }
      wasmRef.current.count = offset;
    } catch (e) {
      console.error(e);
    }
  };

  useMapEvents({
    zoomstart: () => {
      isZoomingRef.current = true;
    },
    zoomend: () => {
      isZoomingRef.current = false;
      setZoom(map.getZoom());
      fetchRails();
    },
    movestart: () => {
      isZoomingRef.current = true;
    },
    moveend: () => {
      isZoomingRef.current = false;
      fetchRails();
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

      markersRef.current.forEach((marker, trainId) => {
        const train = trainsMap.get(trainId);
        if (!train || !train.lastStopCoords || !train.nextStopCoords) return;

        const tA = new Date(train.tA).getTime();
        const tB = new Date(train.tB).getTime();
        const duration = tB - tA;

        let ratio = 0;
        if (duration > 0) {
          ratio = (now - tA) / duration;
        }

        ratio = Math.max(0, Math.min(1, ratio));

        let lat =
          train.lastStopCoords.lat +
          (train.nextStopCoords.lat - train.lastStopCoords.lat) * ratio;
        let lon =
          train.lastStopCoords.lon +
          (train.nextStopCoords.lon - train.lastStopCoords.lon) * ratio;

        let rotation = 0;
        const train_dy = train.nextStopCoords.lat - train.lastStopCoords.lat;
        const train_dx = train.nextStopCoords.lon - train.lastStopCoords.lon;
        const macroAngle = (Math.atan2(-train_dy, train_dx) * 180) / Math.PI;

        if (wasmRef.current && wasmRef.current.count > 0) {
          wasmRef.current.snap(lon, lat, wasmRef.current.count);
          const wasmLon = wasmRef.current.memory[200000];
          const wasmLat = wasmRef.current.memory[200001];
          let wasmAngle = wasmRef.current.memory[200002];

          const distSq =
            (wasmLon - lon) * (wasmLon - lon) +
            (wasmLat - lat) * (wasmLat - lat);

          if (distSq < 0.005) {
            lon = wasmLon;
            lat = wasmLat;

            const normWasm = ((wasmAngle % 360) + 360) % 360;
            const normMacro = ((macroAngle % 360) + 360) % 360;
            let diff = Math.abs(normWasm - normMacro);
            if (diff > 180) diff = 360 - diff;

            if (diff > 90) {
              wasmAngle += 180;
            }
            rotation = wasmAngle;
          } else {
            rotation = macroAngle;
          }
        } else {
          rotation = macroAngle;
        }

        marker.setLatLng([lat, lon]);

        const icon = marker.getElement();
        if (icon) {
          const wrapper = icon.querySelector(
            ".train-icon-wrapper",
          ) as HTMLElement;
          if (wrapper) wrapper.style.transform = `rotate(${rotation}deg)`;
        }

        if (followingTrainId === trainId && !isZoomingRef.current) {
          map.setView([lat, lon], map.getZoom(), { animate: false });
        }
      });

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

        const train_dy = train.nextStopCoords.lat - train.lastStopCoords.lat;
        const train_dx = train.nextStopCoords.lon - train.lastStopCoords.lon;
        const macroAngle = (Math.atan2(-train_dy, train_dx) * 180) / Math.PI;

        if (wasmRef.current && wasmRef.current.count > 0) {
          wasmRef.current.snap(lon, lat, wasmRef.current.count);
          const wasmLon = wasmRef.current.memory[200000];
          const wasmLat = wasmRef.current.memory[200001];
          let wasmAngle = wasmRef.current.memory[200002];

          const distSq =
            (wasmLon - lon) * (wasmLon - lon) +
            (wasmLat - lat) * (wasmLat - lat);

          if (distSq < 0.005) {
            lon = wasmLon;
            lat = wasmLat;

            const normWasm = ((wasmAngle % 360) + 360) % 360;
            const normMacro = ((macroAngle % 360) + 360) % 360;
            let diff = Math.abs(normWasm - normMacro);
            if (diff > 180) diff = 360 - diff;

            if (diff > 90) {
              wasmAngle += 180;
            }
            rotation = wasmAngle;
          } else {
            rotation = macroAngle;
          }
        } else {
          rotation = macroAngle;
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
                className="relative train-icon-wrapper"
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
