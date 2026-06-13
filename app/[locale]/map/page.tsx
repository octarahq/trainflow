"use client";

export const dynamic = "force-dynamic";

import {
  Map as MapComponent,
  MapTileLayer,
  MapZoomControl,
  MapUserPositionControl,
  MapLayersControl,
  MapLayers,
  MapLayerGroup,
} from "@/components/ui/map";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/config";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { StatsCard } from "@/components/map/StatsCard";
import { SearchResultsCard } from "@/components/map/SearchResultsCard";
import {
  TrainDetailsCard,
  TrainDetailsContent,
  TrainActions,
  TrainStatus,
} from "@/components/map/TrainDetails";
import {
  GareDetailsCard,
  GareDetailsContent,
} from "@/components/map/GareDetails";
import { FavoritesList } from "@/components/map/FavoritesList";
import { TrainsLayer } from "@/components/map/TrainsLayer";
import { StationsLayer } from "@/components/map/StationsLayer";
import { RailsVectorTiles } from "@/components/map/RailsVectorTiles";
import {
  MapClickHandler,
  CreateMapPanes,
  MapMovementTracker,
} from "@/components/map/MapUtils";
import { MapStateSync } from "@/components/map/MapStateSync";
import { useTranslations } from "next-intl";

import { InterpolatedJourney } from "@/types/trains";
import type { Map as LeafletMap } from "leaflet";

const MAX_ZOOM = 18;

export default function MapView() {
  const t = useTranslations("map.page");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [trains, setTrains] = useState<InterpolatedJourney[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedTrainId, setSelectedTrainId] = useState<string | null>(null);
  const [followingTrainId, setFollowingTrainId] = useState<string | null>(null);
  const [filterTrainId, setFilterTrainId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const trainsRef = useRef<InterpolatedJourney[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    trainsRef.current = trains;
  }, [trains]);

  const selectedTrain = useMemo(
    () =>
      trains.find(
        (t) =>
          t.journey.FramedVehicleJourneyRef.DatedVehicleJourneyRef ===
          selectedTrainId,
      ),
    [trains, selectedTrainId],
  );
  const fetchTrains = useCallback(async () => {
    try {
      const res = await fetch(`/api/vehicles/live`);
      const data = await res.json();
      if (data && Array.isArray(data.vehicles)) {
        if (data.vehicles.length === 0 && trainsRef.current.length > 0) {
        } else {
          setTrains(data.vehicles);
          setLastUpdate(new Date());
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrains();
  }, [fetchTrains]);

  const searchParamsRef = useRef(searchParams);
  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  const flyToWithOffset = useCallback(
    (lat: number, lon: number, zoom: number = 14) => {
      const map = mapRef.current;
      if (!map) return;

      const targetPoint = map.project([lat, lon], zoom);
      const w = window.innerWidth;
      const h = window.innerHeight;

      let offsetX = 0;
      let offsetY = 0;

      if (w >= 768) {
        offsetX = 200;
      } else {
        offsetY = h * 0.3;
      }

      targetPoint.x += offsetX;
      targetPoint.y += offsetY;

      const newCenter = map.unproject(targetPoint, zoom);
      map.flyTo(newCenter, zoom, { duration: 1.5 });
    },
    [],
  );

  useEffect(() => {
    const trainNumber = searchParams?.get("trainNumber");
    if (!trainNumber) return;
    if (trains.length === 0) return;

    const match = trains.find((t) => {
      const framed = t.journey.FramedVehicleJourneyRef?.DatedVehicleJourneyRef;
      const pub = t.journey.PublishedLineName;
      const num = (t.journey as any)?.TrainNumbers?.TrainNumberRef;
      return (
        framed === trainNumber ||
        pub === trainNumber ||
        String(num) === String(trainNumber)
      );
    });

    if (match) {
      const id = match.journey.FramedVehicleJourneyRef?.DatedVehicleJourneyRef || null;
      setSelectedTrainId(id);
      setSelectedGare(null);
      if (match.position) {
        flyToWithOffset(match.position.lat, match.position.lon, 14);
      }
    }
  }, [trains, searchParams, flyToWithOffset]);

  const activeCount = trains.filter((t) => t.status === "active").length;
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("favorites", JSON.stringify(favoriteIds));
    }
  }, [favoriteIds]);

  useEffect(() => {
    if (favoriteIds.length === 0) return;
    const existing = new Set(
      trains.map(
        (t) => t.journey.FramedVehicleJourneyRef.DatedVehicleJourneyRef,
      ),
    );
    const updated = favoriteIds.filter((id) => existing.has(id));
    if (updated.length !== favoriteIds.length) {
      setFavoriteIds(updated);
    }
  }, [trains, favoriteIds]);

  const handleZoomToTrain = () => {
    if (selectedTrain && selectedTrain.position) {
      flyToWithOffset(
        selectedTrain.position.lat,
        selectedTrain.position.lon,
        14,
      );
    }
  };

  const getTrainId = (t: InterpolatedJourney) =>
    t.journey.FramedVehicleJourneyRef.DatedVehicleJourneyRef;

  const favoriteTrains = trains.filter((t) =>
    favoriteIds.includes(getTrainId(t)),
  );

  const handleSelectFavorite = (t: InterpolatedJourney) => {
    const id = getTrainId(t);
    setSelectedTrainId(id);
    if (t.position) {
      flyToWithOffset(t.position.lat, t.position.lon, 14);
    }
  };

  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const isFavorite = selectedTrainId
    ? favoriteIds.includes(selectedTrainId)
    : false;

  const handleFollowTrain = () => {
    if (followingTrainId === selectedTrainId) {
      setFollowingTrainId(null);
    } else {
      setFollowingTrainId(selectedTrainId);
    }
  };

  const handleFilterTrain = () => {
    if (filterTrainId === selectedTrainId) {
      setFilterTrainId(null);
    } else {
      setFilterTrainId(selectedTrainId);
    }
  };

  const handleCloseTrain = useCallback(() => {
    setSelectedTrainId(null);
    if (searchParams?.has("trainNumber")) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("trainNumber");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, router, pathname]);

  const handleShareTrain = () => {
    if (!selectedTrainId) return;

    const encodedId = encodeURIComponent(selectedTrainId);
    const url = `${window.location.origin}/train/${encodedId}`;
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );

    if (isMobile && navigator.share) {
      navigator.share({
        title: t("shareTitle"),
        text: t("shareText"),
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert(t("copySuccess"));
    }
  };

  type SearchResult =
    | { kind: "train"; train: InterpolatedJourney }
    | { kind: "gare"; gare: import("@/types/network").Gare };

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedGare, setSelectedGare] = useState<
    import("@/types/network").Gare | null
  >(null);

  const displayedTrains = useMemo(() => {
    if (filterTrainId) {
      return trains.filter(
        (t) =>
          t.journey.FramedVehicleJourneyRef.DatedVehicleJourneyRef ===
          filterTrainId,
      );
    }
    return trains;
  }, [trains, filterTrainId]);

  function getLatLonFromGare(
    g: import("@/types/network").Gare,
  ): { lat: number; lon: number } | null {
    if ("lat" in g) {
      return { lat: g.lat, lon: g.lon };
    }
    if ("geometry" in g && g.geometry.coordinates) {
      return { lat: g.geometry.coordinates[1], lon: g.geometry.coordinates[0] };
    }
    if ("properties" in g && g.properties.geo_point_2d) {
      return {
        lat: g.properties.geo_point_2d.lat,
        lon: g.properties.geo_point_2d.lon,
      };
    }
    return null;
  }

  const [isMapMoving, setIsMapMoving] = useState(false);

  return (
    <div
      style={{ position: "fixed", inset: 0 }}
      className={cn("bg-zinc-900 transition-colors duration-500")}
      data-map-moving={isMapMoving}
    >
      <style jsx global>{`
        [data-map-moving="true"] .backdrop-blur-md,
        [data-map-moving="true"] .backdrop-blur-sm,
        [data-map-moving="true"] .backdrop-blur-xl {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          background-color: rgba(24, 24, 27, 0.9) !important;
        }
      `}</style>
      <LoadingScreen isLoading={isLoading} />
      <MapComponent
        center={[46.5, 2.5]}
        zoom={5}
        maxZoom={MAX_ZOOM}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
        preferCanvas={true}
      >
        <MapStateSync />
        <MapMovementTracker onMovingChanges={setIsMapMoving} />
        <MapClickHandler onMapClick={() => setSelectedTrainId(null)} />
        <MapLayers defaultLayerGroups={["Rails", "Trains"]}>
          <MapLayersControl />
          <CreateMapPanes />
          <MapTileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
            darkUrl="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          />
          <MapLayerGroup name="Rails">
            <RailsVectorTiles url={`${API_URL}/data/rails/{z}/{x}/{y}.pbf`} />
          </MapLayerGroup>
          <StationsLayer />
          <TrainsLayer
            trains={displayedTrains}
            selectedTrainId={selectedTrainId}
            onSelectTrain={setSelectedTrainId}
            followingTrainId={followingTrainId}
          />
        </MapLayers>
        <MapUserPositionControl style={{ top: "130px", right: "10px" }} />
        <MapZoomControl />
      </MapComponent>

      <main className="absolute inset-0 top-0 z-1000 flex flex-col md:flex-row overflow-hidden pointer-events-none">
        <aside className="w-full md:w-80 p-4 md:p-6 flex flex-col gap-4 md:gap-6 pointer-events-none max-h-[50vh] md:max-h-none md:h-full overflow-y-auto md:bg-gradient-to-r md:from-background-dark/80 md:to-transparent shrink-0">
          <StatsCard
            activeCount={activeCount}
            lastUpdate={lastUpdate}
            trains={trains}
            onShowTrain={(id) => {
              setSelectedTrainId(id);
              setSelectedGare(null);
              const train = trains.find(
                (t) =>
                  t.journey.FramedVehicleJourneyRef.DatedVehicleJourneyRef ===
                  id,
              );
              if (train && train.position) {
                flyToWithOffset(train.position.lat, train.position.lon, 14);
              }
            }}
            onSearchResults={setSearchResults}
            selectedItemId={selectedTrainId || (selectedGare ? "gare" : null)}
          />
          {searchResults.length > 0 && (
            <SearchResultsCard
              results={searchResults}
              onSelectTrain={(id) => {
                setSearchResults([]);
                setSelectedGare(null);
                setSelectedTrainId(id);
                const train = trains.find(
                  (t) =>
                    t.journey.FramedVehicleJourneyRef.DatedVehicleJourneyRef ===
                    id,
                );
                if (train && train.position) {
                  flyToWithOffset(train.position.lat, train.position.lon, 14);
                }
              }}
              onSelectGare={(g) => {
                setSearchResults([]);
                setSelectedTrainId(null);
                setSelectedGare(g);
                const coords = getLatLonFromGare(g);
                if (coords) {
                  flyToWithOffset(coords.lat, coords.lon, 14);
                }
              }}
              onClose={() => setSearchResults([])}
            />
          )}
        </aside>

        <div className="flex-1 relative" />
      </main>

      <div className="absolute top-6 right-16 bottom-6 z-2000 flex flex-col justify-start pointer-events-none w-[400px]">
        <div
          className={cn(
            "pointer-events-auto w-full transition-all duration-500 transform-gpu",
            !selectedGare && !selectedTrain
              ? "pointer-events-none invisible translate-x-[120%] opacity-0"
              : "translate-x-0 opacity-100",
          )}
        >
          {selectedGare && isDesktop && (
            <GareDetailsCard
              gare={selectedGare}
              trains={trains}
              onClose={() => setSelectedGare(null)}
            />
          )}
          {selectedTrain && isDesktop && (
            <TrainDetailsCard
              train={selectedTrain}
              onClose={handleCloseTrain}
              onZoom={handleZoomToTrain}
              onFollow={handleFollowTrain}
              onFilter={handleFilterTrain}
              isFollowing={followingTrainId === selectedTrainId}
              isFiltered={filterTrainId === selectedTrainId}
              onShare={handleShareTrain}
            />
          )}
        </div>
      </div>

      {!isDesktop && (selectedGare || selectedTrain) && (
        <div className="absolute bottom-6 left-4 right-4 z-2000 flex flex-col justify-end pointer-events-none">
          <div className="pointer-events-auto w-full transition-all duration-500 transform-gpu animate-in slide-in-from-bottom-10">
            {selectedGare && (
              <GareDetailsCard
                gare={selectedGare}
                trains={trains}
                onClose={() => setSelectedGare(null)}
              />
            )}
            {selectedTrain && (
              <TrainDetailsCard
                train={selectedTrain}
                onClose={handleCloseTrain}
                onZoom={handleZoomToTrain}
                onFollow={handleFollowTrain}
                onFilter={handleFilterTrain}
                isFollowing={followingTrainId === selectedTrainId}
                isFiltered={filterTrainId === selectedTrainId}
                onShare={handleShareTrain}
              />
            )}
          </div>
        </div>
      )}

      <FavoritesList
        trains={favoriteTrains}
        onSelect={handleSelectFavorite}
        onRemove={(id) => toggleFavorite(id)}
      />
    </div>
  );
}
