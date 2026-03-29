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
  nextRefresh,
  onRefresh,
  isRefreshing,
  trains = [],
  onShowTrain,
  onSearchResults,
}: {
  activeCount: number;
  lastUpdate: Date | null;
  nextRefresh: Date | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  trains?: import("@/types/trains").InterpolatedJourney[];
  onShowTrain?: (id: string) => void;
  onSearchResults?: (results: SearchResult[]) => void;
}) {
  const t = useTranslations("map.stats");
  const [isOpen, setIsOpen] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

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

  useEffect(() => {
    if (!nextRefresh) return;

    const updateTimeLeft = () => {
      const diff = Math.max(
        0,
        Math.ceil((nextRefresh.getTime() - Date.now()) / 1000),
      );
      setTimeLeft(diff);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [nextRefresh]);

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
      <div className="space-y-4 pointer-events-auto">
        <div
          className={cn(
            "bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-xl w-full transition-all duration-300 ease-in-out origin-left",
            isOpen
              ? "opacity-100 scale-100 translate-x-0"
              : "opacity-0 scale-95 -translate-x-8 pointer-events-none absolute left-0",
          )}
        >
          <Link href="/" className="font-bold text-lg text-white block mb-4">
            Trainflow
          </Link>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {t("search")}{" "}
              {isRefreshing || timeLeft === 0 ? (
                <LoaderCircle className="h-3 w-3 inline-block ml-1" />
              ) : (
                <span className="ml-1 text-[10px] font-mono">{timeLeft}s</span>
              )}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-slate-400 hover:text-white"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={cn("h-4 w-4", isRefreshing && "animate-spin")}
              />
            </Button>
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

        <div
          className={cn(
            "bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-xl transition-all duration-300 origin-left",
            isOpen
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none absolute",
          )}
        >
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

      <Button
        variant="secondary"
        size="icon"
        className="shadow-md border shrink-0 bg-white/5 backdrop-blur-md border-white/10 text-white hover:bg-white/10"
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
