"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { formatJourneyTitle } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { searchTrains, searchStations, SearchResult } from "@/lib/search";
import { useDebounce } from "@/hooks/use-debounce";

export function StatsCard({
  activeCount,
  lastUpdate,
  trains = [],
  onShowTrain,
  onSearchResults,
  selectedItemId,
}: {
  activeCount: number;
  lastUpdate: Date | null;
  trains?: import("@/types/trains").InterpolatedJourney[];
  onShowTrain?: (id: string) => void;
  onSearchResults?: (results: SearchResult[]) => void;
  selectedItemId?: string | null;
}) {
  const t = useTranslations("map.stats");
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (
      selectedItemId &&
      typeof window !== "undefined" &&
      window.innerWidth < 768
    ) {
      setIsOpen(false);
    }
  }, [selectedItemId]);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [stationResults, setStationResults] = useState<SearchResult[]>([]);

  const trainResults = useMemo(
    () => searchTrains(query, trains || []),
    [query, trains],
  );

  useEffect(() => {
    if (debouncedQuery.length >= 3) {
      searchStations(debouncedQuery).then(setStationResults);
    } else {
      setStationResults([]);
    }
  }, [debouncedQuery]);

  const results = useMemo(
    () => [...stationResults, ...trainResults],
    [stationResults, trainResults],
  );

  useEffect(() => {
    onSearchResults?.(results);
  }, [results, onSearchResults]);

  const [networkStatus, setNetworkStatus] = useState<any>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/network/status?stats");
        if (!res.ok) return;
        const data = await res.json();
        setNetworkStatus(data.stats);
      } catch (e) {}
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!results || results.length !== 1) return;
    const q = query.trim().toLowerCase();
    if (/^\d+$/.test(q) && onShowTrain) {
      const only = results[0];
      if (only.kind === "train") {
        onShowTrain(
          only.train.journey.FramedVehicleJourneyRef.DatedVehicleJourneyRef,
        );
      }
    }
  }, [results, query, onShowTrain]);

  const punctuality = networkStatus?.punctuality ?? 100;

  return (
    <div className="flex items-start gap-2 pointer-events-auto">
      <div className="pointer-events-auto w-full">
        <div
          className={cn(
            "bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-xl w-full transition-all duration-300 ease-in-out origin-left flex flex-col gap-4",
            isOpen
              ? "opacity-100 scale-100 translate-x-0"
              : "opacity-0 scale-95 -translate-x-8 pointer-events-none absolute left-0 md:opacity-100 md:scale-100 md:translate-x-0 md:pointer-events-auto md:relative md:left-auto",
          )}
        >
          <div>
            <Link href="/" className="font-bold text-lg text-white block mb-4">
              Trainflow
            </Link>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {t("search")}
              </h3>
            </div>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("placeholder")}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              {t("networkStatus")}
            </h3>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full animate-pulse",
                    punctuality > 75
                      ? "bg-green-500"
                      : punctuality > 50
                        ? "bg-orange-500"
                        : "bg-red-500",
                  )}
                ></span>
                <span
                  className={cn(
                    "text-xs font-medium",
                    punctuality > 75
                      ? "text-green-400"
                      : punctuality > 50
                        ? "text-orange-400"
                        : "text-red-400",
                  )}
                >
                  {punctuality > 75
                    ? t("status.normal")
                    : punctuality > 50
                      ? t("status.slow")
                      : t("status.disrupted")}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 italic">
                {t("lastUpdate")}{" "}
                {networkStatus?.lastUpdated
                  ? new Date(networkStatus.lastUpdated).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "--:--"}
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">{t("onTime")}</span>
                  <span className="text-white font-medium">{punctuality}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      punctuality > 75
                        ? "bg-green-500/60"
                        : punctuality > 50
                          ? "bg-orange-500/60"
                          : "bg-red-500/60",
                    )}
                    style={{ width: `${punctuality}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">{t("activeTrains")}</span>
                <span className="text-white font-bold">{activeCount}</span>
              </div>
              {networkStatus?.incidents > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-red-400">{t("incidents")}</span>
                  <span className="text-red-400 font-bold">
                    {networkStatus.incidents}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Button
        variant="secondary"
        size="icon"
        className="shadow-md border shrink-0 bg-white/5 backdrop-blur-md border-white/10 text-white hover:bg-white/10 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
