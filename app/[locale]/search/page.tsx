"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ChevronDown } from "lucide-react";
import type { InterpolatedJourney } from "@/types/trains";
import { extractUIC } from "@/lib/utils/extractIds";
import { useTranslations, useLocale } from "next-intl";
import { enUS, fr as frLocale } from "date-fns/locale";
import { humanizeSiriId, humanizeTrainType } from "@/lib/format";

type Station = { id: string; name: string } | null;

type TrainCall = Partial<{
  StopPointRef: string;
  VisitNumber: string | number;
  Order: string | number;
  StopPointName: string;
  AimedArrivalTime: string;
  ExpectedArrivalTime: string;
  AimedDepartureTime: string;
  ExpectedDepartureTime: string;
  DeparturePlatformName: string;
  ArrivalPlatformName: string;
  source: "recorded" | "estimated";
}>;

export default function SearchPage() {
  const t = useTranslations("search");
  const locale = useLocale();
  const dateLocale = locale === "fr" ? frLocale : enUS;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [editorOpen, setEditorOpen] = useState(false);
  const [from, setFrom] = useState<Station>(null);
  const [to, setTo] = useState<Station>(null);
  const [date, setDate] = useState("");
  const [trains, setTrains] = useState<InterpolatedJourney[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [fromInput, setFromInput] = useState(from?.name || "");
  const [toInput, setToInput] = useState(to?.name || "");
  const [fromSelected, setFromSelected] = useState<Station>(from);
  const [toSelected, setToSelected] = useState<Station>(to);
  const [fromSuggestions, setFromSuggestions] = useState<Station[]>([]);
  const [toSuggestions, setToSuggestions] = useState<Station[]>([]);

  const fromTimer = useRef<any>(null);
  const toTimer = useRef<any>(null);
  const [fromFocused, setFromFocused] = useState(false);
  const [toFocused, setToFocused] = useState(false);

  useEffect(() => {
    const fromId = searchParams.get("from");
    const toId = searchParams.get("to");
    const dateStr = searchParams.get("date");

    const initDate = dateStr || format(new Date(), "yyyy-MM-dd");
    setDate(initDate);

    if (fromId) {
      const fromStation: Station = {
        id: fromId,
        name: searchParams.get("fromName") || fromId,
      };
      setFrom(fromStation);
      setFromInput(fromStation.name);
      setFromSelected(fromStation);
    }

    if (toId) {
      const toStation: Station = {
        id: toId,
        name: searchParams.get("toName") || toId,
      };
      setTo(toStation);
      setToInput(toStation.name);
      setToSelected(toStation);
    }

    setMounted(true);
  }, [searchParams]);

  useEffect(() => {
    if (mounted && (from?.id || to?.id)) {
      const fetchTrains = async () => {
        setLoading(true);
        try {
          const params = new URLSearchParams();
          if (from?.id) params.append("from", from.id);
          if (to?.id) params.append("to", to.id);
          if (date) params.append("date", date);
          const res = await fetch(`/api/vehicles/live`);
          const data = await res.json();
          setTrains(Array.isArray(data.vehicles) ? data.vehicles : []);
        } catch (error) {
          setTrains([]);
        }
        setLoading(false);
      };
      fetchTrains();
    }
  }, [from, to, date, mounted]);

  useEffect(() => {
    if (fromInput && fromFocused) {
      clearTimeout(fromTimer.current);
      let queryStr = fromInput;

      if (fromInput === "/") {
        queryStr = "";
      } else if (fromInput.startsWith("/")) {
        queryStr = fromInput.slice(1);
      }

      if (fromInput === "/" || (queryStr && queryStr.length >= 2)) {
        fromTimer.current = setTimeout(async () => {
          const res = await fetch(
            `/api/gares?q=${encodeURIComponent(queryStr)}&limit=12`,
          );
          const data = await res.json();
          setFromSuggestions(data);
        }, 150);
      } else {
        setFromSuggestions([]);
      }
    } else {
      setFromSuggestions([]);
    }
    return () => clearTimeout(fromTimer.current);
  }, [fromInput]);

  useEffect(() => {
    if (toInput && toFocused) {
      clearTimeout(toTimer.current);
      let queryStr = toInput;

      if (toInput === "/") {
        queryStr = "";
      } else if (toInput.startsWith("/")) {
        queryStr = toInput.slice(1);
      }

      if (toInput === "/" || (queryStr && queryStr.length >= 2)) {
        toTimer.current = setTimeout(async () => {
          const res = await fetch(
            `/api/gares?q=${encodeURIComponent(queryStr)}&limit=12`,
          );
          const data = await res.json();
          setToSuggestions(data);
        }, 150);
      } else {
        setToSuggestions([]);
      }
    } else {
      setToSuggestions([]);
    }
    return () => clearTimeout(toTimer.current);
  }, [toInput]);

  function openEditor() {
    setFromInput(from?.name || "");
    setToInput(to?.name || "");
    setFromSelected(from);
    setToSelected(to);
    setEditorOpen(true);
  }

  function handleSave() {
    if (!fromSelected && !toSelected) return;
    setFrom(fromSelected);
    setTo(toSelected);
    setEditorOpen(false);

    const params = new URLSearchParams();
    if (fromSelected) {
      params.set("from", fromSelected.id);
      params.set("fromName", fromSelected.name);
    }
    if (toSelected) {
      params.set("to", toSelected.id);
      params.set("toName", toSelected.name);
    }
    params.set("date", date);
    router.push(`/search?${params.toString()}`);
  }

  const formatCallTime = (
    call: TrainCall | undefined,
    preferArrival = false,
  ) => {
    if (!call) return "—";
    const time = preferArrival
      ? call.ExpectedArrivalTime ||
        call.AimedArrivalTime ||
        call.ExpectedDepartureTime ||
        call.AimedDepartureTime
      : call.ExpectedDepartureTime ||
        call.AimedDepartureTime ||
        call.ExpectedArrivalTime ||
        call.AimedArrivalTime;
    if (!time) return "—";
    return format(new Date(time), "HH:mm");
  };

  const matchesStop = (
    stopId: string | undefined,
    callId: string | undefined,
  ) => {
    if (!stopId || !callId) return false;
    if (stopId === callId) return true;

    const stopUIC = extractUIC(stopId);
    const callUIC = extractUIC(callId);

    return (
      (stopUIC != null && callId === stopUIC) ||
      (callUIC != null && stopId === callUIC) ||
      (stopUIC != null && callUIC != null && stopUIC === callUIC)
    );
  };

  const getCallByStop = (
    calls: TrainCall[],
    stopId?: string,
    preferArrival = false,
  ): TrainCall | undefined => {
    if (!stopId) return undefined;
    const candidates = calls.filter((c) => matchesStop(stopId, c.StopPointRef));
    if (candidates.length === 0) return undefined;

    const sortByQuality = (call: TrainCall) => {
      const expectedArrival = Boolean(call.ExpectedArrivalTime);
      const aimedArrival = Boolean(call.AimedArrivalTime);
      const expectedDeparture = Boolean(call.ExpectedDepartureTime);
      const aimedDeparture = Boolean(call.AimedDepartureTime);
      const hasBest = preferArrival
        ? expectedArrival || aimedArrival
        : expectedDeparture || aimedDeparture;
      const hasGood = preferArrival
        ? expectedDeparture || aimedDeparture
        : expectedArrival || aimedArrival;
      const sourceScore = call.source === "estimated" ? 2 : 1;
      const timeScore = hasBest ? 4 : hasGood ? 2 : 0;
      return sourceScore * 10 + timeScore;
    };

    return candidates.sort((a, b) => sortByQuality(b) - sortByQuality(a))[0];
  };

  const getStopCall = (
    train: InterpolatedJourney,
    stopId?: string,
    preferArrival = false,
  ) => {
    if (!stopId) return undefined;
    const calls = getTrainStops(train);
    return getCallByStop(calls, stopId, preferArrival);
  };

  const getStopTime = (
    train: InterpolatedJourney,
    stopId: string,
    isArrival = false,
  ) => {
    const call = getStopCall(train, stopId, isArrival);
    if (!call) return "—";
    return formatCallTime(call, isArrival);
  };

  const getDuration = (train: InterpolatedJourney) => {
    const stops = getTrainStops(train);
    if (!stops || stops.length === 0) return null;

    const fromIdx = stops.findIndex((s) =>
      matchesStop(from?.id ?? undefined, s.StopPointRef),
    );
    const toIdx = stops.findIndex((s) =>
      matchesStop(to?.id ?? undefined, s.StopPointRef),
    );
    if (fromIdx === -1 || toIdx === -1 || toIdx <= fromIdx) return null;

    const fromCall = stops[fromIdx];
    const toCall = stops[toIdx];

    const startTime = new Date(
      (fromCall.ExpectedDepartureTime as string) ||
        (fromCall.AimedDepartureTime as string) ||
        (fromCall.ExpectedArrivalTime as string) ||
        (fromCall.AimedArrivalTime as string) ||
        0,
    );
    const endTime = new Date(
      (toCall.ExpectedArrivalTime as string) ||
        (toCall.AimedArrivalTime as string) ||
        (toCall.ExpectedDepartureTime as string) ||
        (toCall.AimedDepartureTime as string) ||
        0,
    );

    if (
      !startTime ||
      !endTime ||
      isNaN(startTime.getTime()) ||
      isNaN(endTime.getTime())
    )
      return null;
    const minutes = Math.round(
      (endTime.getTime() - startTime.getTime()) / 60000,
    );
    if (isNaN(minutes) || minutes < 0) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours === 0 ? `${mins}m` : `${hours}h ${mins}m`;
  };

  const parseHHMM = (s?: string | null) => {
    if (!s) return null;
    const m = s.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    if (isNaN(hh) || isNaN(mm)) return null;
    return hh * 60 + mm;
  };

  const diffFromTimes = (start?: string | null, end?: string | null) => {
    const a = parseHHMM(start);
    const b = parseHHMM(end);
    if (a == null || b == null) return null;
    let diff = b - a;
    if (diff < 0) diff += 24 * 60;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return h === 0 ? `${m}m` : `${h}h ${m}m`;
  };

  const getTrainType = (train: InterpolatedJourney) =>
    train.journey.PublishedLineName ||
    humanizeTrainType(train.journey.ProductCategoryRef) ||
    humanizeTrainType(train.journey.VehicleMode) ||
    t("fallbackTrainType");

  const getTrainTypeBadgeClass = (trainType: string) => {
    const t = trainType.toLowerCase();
    if (t.includes("ouigo")) return "bg-pink-600";
    if (t.includes("ter")) return "bg-slate-600";
    if (t.includes("tgv")) return "bg-blue-600";
    return "bg-slate-700";
  };

  const getTrainStops = (train: InterpolatedJourney) => {
    const recorded = train.journey.RecordedCalls?.RecordedCall;
    const estimated = train.journey.EstimatedCalls?.EstimatedCall;
    const recordedList = (
      Array.isArray(recorded) ? recorded : recorded ? [recorded] : []
    ) as TrainCall[];
    const estimatedList = (
      Array.isArray(estimated) ? estimated : estimated ? [estimated] : []
    ) as TrainCall[];
    const combined = [
      ...recordedList.map((c) => ({ ...c, source: "recorded" as const })),
      ...estimatedList.map((c) => ({ ...c, source: "estimated" as const })),
    ];

    const normalized = combined
      .filter(Boolean)
      .map((c) => ({
        ...c,
        Order: Number(c.Order ?? c.VisitNumber ?? 0),
      }))
      .sort((a, b) => Number(a.Order ?? 0) - Number(b.Order ?? 0));

    const bestByStop = new Map<string, TrainCall>();
    for (const call of normalized) {
      const key =
        extractUIC(call.StopPointRef as string) ||
        (call.StopPointRef as string);
      const existing = bestByStop.get(key);
      if (!existing) {
        bestByStop.set(key, call);
      } else {
        const score = (c: TrainCall) => {
          const cancelled = Boolean(
            (c as any).Cancellation === true ||
            (c as any).Cancellation === "true",
          );
          const cancelPenalty = cancelled ? -1000 : 0;
          const visit = Number((c.VisitNumber as any) || 0);
          const expectedCount =
            Number(Boolean(c.ExpectedDepartureTime)) +
            Number(Boolean(c.ExpectedArrivalTime));
          const sourceScore = c.source === "estimated" ? 2 : 1;
          return cancelPenalty + visit + expectedCount * 10 + sourceScore;
        };

        const aScore = score(existing);
        const bScore = score(call);
        bestByStop.set(key, bScore > aScore ? call : existing);
      }
    }

    const stops = Array.from(bestByStop.values());
    return stops.sort((a, b) => Number(a.Order ?? 0) - Number(b.Order ?? 0));
  };

  const getConnectionsCount = (
    train: InterpolatedJourney,
    fromStopId?: string,
    toStopId?: string,
  ) => {
    const stops = getTrainStops(train);
    if (!stops || stops.length === 0) return 0;

    const findIndexById = (id?: string) => {
      if (!id) return -1;
      return stops.findIndex((s: TrainCall) => matchesStop(id, s.StopPointRef));
    };

    const fromIdx = findIndexById(fromStopId);
    const toIdx = findIndexById(toStopId);

    if (fromIdx !== -1 && toIdx !== -1 && toIdx > fromIdx) {
      return Math.max(0, toIdx - fromIdx - 1);
    }

    if (fromIdx !== -1) {
      return Math.max(0, stops.length - fromIdx - 1);
    }

    return Math.max(0, stops.length - 2);
  };

  const getPlatform = (
    train: InterpolatedJourney,
    stopId?: string,
    isArrival = false,
  ) => {
    const call = stopId
      ? getCallByStop(getTrainStops(train), stopId)
      : undefined;
    if (!call) return null;
    return isArrival
      ? call.ArrivalPlatformName || call.DeparturePlatformName || null
      : call.DeparturePlatformName || call.ArrivalPlatformName || null;
  };

  const getTerminus = (train: InterpolatedJourney) => {
    if (train.journey.DestinationName) return train.journey.DestinationName;
    const stops = getTrainStops(train);
    if (stops.length === 0) return null;
    const last = stops[stops.length - 1] as TrainCall | undefined;
    return last?.StopPointName ?? null;
  };

  const getTerminusStopId = (train: InterpolatedJourney) => {
    const stops = getTrainStops(train);
    if (stops.length === 0) return null;
    const last = stops[stops.length - 1] as TrainCall | undefined;
    return last?.StopPointRef ?? null;
  };

  const getRemainingDuration = (
    train: InterpolatedJourney,
    fromStopId?: string,
  ) => {
    const calls = getTrainStops(train).map((c: TrainCall) => ({
      stopId: c.StopPointRef,
      aimedArr: c.AimedArrivalTime,
      expArr: c.ExpectedArrivalTime,
      aimedDep: c.AimedDepartureTime,
      expDep: c.ExpectedDepartureTime,
    }));

    if (calls.length === 0) return null;
    let fromIdx = -1;
    if (fromStopId) {
      fromIdx = calls.findIndex((c) => matchesStop(fromStopId, c.stopId));
    }
    if (fromIdx === -1) fromIdx = 0;

    const start = calls[fromIdx];
    const end = calls[calls.length - 1];
    const startTime = new Date(
      start.expDep || start.aimedDep || start.expArr || start.aimedArr || 0,
    );
    const endTime = new Date(
      end.expArr || end.aimedArr || end.expDep || end.aimedDep || 0,
    );
    if (
      !startTime ||
      !endTime ||
      isNaN(startTime.getTime()) ||
      isNaN(endTime.getTime())
    )
      return null;
    const minutes = Math.round(
      (endTime.getTime() - startTime.getTime()) / 60000,
    );
    if (minutes < 0) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours === 0 ? `${mins}m` : `${hours}h ${mins}m`;
  };

  const displayedTrains: InterpolatedJourney[] = Array.isArray(trains)
    ? trains.filter((train) => {
        const calls = getTrainStops(train);
        
        let hasFrom = false;
        let hasTo = false;
        let fromOrder = -1;
        let toOrder = -1;

        if (from?.id) {
          const fromCall = getCallByStop(calls, from.id);
          if (fromCall) {
            hasFrom = Boolean(fromCall.ExpectedDepartureTime || fromCall.AimedDepartureTime);
            fromOrder = typeof fromCall.Order === "number" ? fromCall.Order : parseInt((fromCall.Order as string) || "0");
          }
        }

        if (to?.id) {
          const toCall = getCallByStop(calls, to.id);
          if (toCall) {
            hasTo = Boolean(toCall.ExpectedArrivalTime || toCall.AimedArrivalTime);
            toOrder = typeof toCall.Order === "number" ? toCall.Order : parseInt((toCall.Order as string) || "0");
          }
        }

        if (from?.id && to?.id) return hasFrom && hasTo && fromOrder <= toOrder;
        if (from?.id) return hasFrom;
        if (to?.id) return hasTo;
        
        return true;
      })
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-surface-dark text-foreground">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8 bg-surface-dark p-6 rounded-2xl border border-border-dark shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                {from && to ? (
                  <>
                    <h1 className="text-2xl font-bold tracking-tight">
                      {from.name}
                    </h1>
                    <ChevronDown
                      className="text-zinc-400 rotate-270"
                      size={18}
                    />
                    <h1 className="text-2xl font-bold tracking-tight">
                      {to.name}
                    </h1>
                  </>
                ) : from ? (
                  <h1 className="text-2xl font-bold tracking-tight">
                    {t("departure")} {from.name}
                  </h1>
                ) : to ? (
                  <h1 className="text-2xl font-bold tracking-tight">
                    {t("arrival")} {to.name}
                  </h1>
                ) : (
                  <h1 className="text-2xl font-bold tracking-tight">
                    {t("title")}
                  </h1>
                )}
              </div>
              {date && (
                <p className="text-sm text-zinc-400">
                  {format(new Date(date), "EEEE d MMMM yyyy", {
                    locale: dateLocale,
                  })}
                </p>
              )}
            </div>
            <button
              onClick={openEditor}
              className="flex items-center justify-center gap-2 rounded-xl border border-border-dark px-4 py-2 text-sm font-medium hover:bg-surface-dark transition-colors"
            >
              {t("editSearch")}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {loading && (
            <div className="text-center py-8">
              <p className="text-zinc-400">{t("loading")}</p>
            </div>
          )}

          {!loading && trains.length === 0 && (
            <div className="text-center py-8">
              <p className="text-zinc-400">{t("noResults")}</p>
            </div>
          )}

          {!loading &&
            displayedTrains.map((train: InterpolatedJourney, idx: number) => {
              const fromCall = getStopCall(train, from?.id, false);
              const toCall = getStopCall(train, to?.id, true);
              const departureTime = fromCall
                ? formatCallTime(fromCall, false)
                : null;
              const arrivalTime = toCall ? formatCallTime(toCall, true) : null;
              const isArrivalSearch = !!to?.id && !from?.id;
              let originCall = undefined as TrainCall | undefined;
              if (isArrivalSearch) {
                originCall = getStopCall(
                  train,
                  train.journey.OriginRef as string | undefined,
                  false,
                );
              }
              const primaryTime = isArrivalSearch
                ? originCall
                  ? formatCallTime(originCall, false)
                  : arrivalTime
                : departureTime;
              const primaryLabel = isArrivalSearch
                ? train.journey.OriginName || from?.name || "—"
                : from?.name || "—";
              const duration = from?.id && to?.id ? getDuration(train) : null;
              const terminus = getTerminus(train);
              const terminusStopId = getTerminusStopId(train);
              const remainingDuration =
                !duration && from?.id
                  ? getRemainingDuration(train, from.id)
                  : null;
              const fallbackFromTimes =
                !duration && !remainingDuration
                  ? diffFromTimes(departureTime, arrivalTime)
                  : null;
              const displayedDuration =
                duration || remainingDuration || fallbackFromTimes || "—";
              const trainType = getTrainType(train);
              const departurePlatform = from?.id
                ? getPlatform(train, from.id, false)
                : null;
              const arrivalPlatform = to?.id
                ? getPlatform(train, to.id, true)
                : terminusStopId
                  ? getPlatform(train, terminusStopId, true)
                  : null;
              const connectionsCount = getConnectionsCount(
                train,
                from?.id,
                to?.id,
              );
              const connectionsLabel =
                connectionsCount === 0
                  ? t("direct")
                  : connectionsCount === 1
                    ? t("oneStop")
                    : t("stops", { count: connectionsCount });
              const arrivalTimeResolved = to?.id
                ? arrivalTime
                : terminusStopId
                  ? getStopTime(train, terminusStopId, true)
                  : arrivalTime;

              return (
                <div
                  key={idx}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    const framed =
                      train.journey.FramedVehicleJourneyRef
                        ?.DatedVehicleJourneyRef;
                    const num =
                      framed ||
                      (train.journey as any)?.TrainNumbers?.TrainNumberRef ||
                      train.journey.PublishedLineName;
                    if (num)
                      router.push(
                        `/map?trainNumber=${encodeURIComponent(String(num))}`,
                      );
                  }}
                  className="group relative bg-surface-dark border border-border-dark rounded-2xl p-5 hover:border-accent-blue/50 transition-all shadow-sm cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-6 items-stretch">
                    <div className="flex w-full flex-col sm:flex-row gap-4 sm:gap-8 h-full items-start sm:items-center">
                      {isArrivalSearch ? (
                        <div className="w-full sm:w-40 flex-shrink-0 flex flex-col items-start gap-1">
                          <span className="text-lg font-bold">
                            {arrivalTime || "—"}
                          </span>
                          <span className="text-xs text-slate-400">
                            {train.journey.OriginName || "—"}
                          </span>
                        </div>
                      ) : (
                        <div className="w-full sm:w-40 flex-shrink-0 flex flex-col items-start gap-1">
                          <span className="text-lg font-bold">
                            {primaryTime || "—"}
                          </span>
                          <span className="text-xs text-slate-400">
                            {primaryLabel}
                          </span>
                        </div>
                      )}

                      <div className="w-full sm:flex-1 flex flex-col items-center px-4 relative h-full justify-center">
                        <span className="text-xs text-slate-400 mb-1">
                          {displayedDuration}
                        </span>
                        <div className="w-full h-px bg-slate-700 relative">
                          <div className="absolute -top-1 left-0 size-2 rounded-full bg-slate-300"></div>
                          <div className="absolute -top-1 right-0 size-2 rounded-full bg-zinc-400"></div>
                          {connectionsCount > 0 && (
                            <div className="absolute -top-1 left-1/2 -ml-1 size-2 rounded-full bg-slate-600"></div>
                          )}
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-2 text-center">
                          {connectionsLabel}
                        </span>
                      </div>

                      <div className="w-full sm:w-40 flex-shrink-0 flex flex-col items-start gap-1">
                        <span className="text-lg font-bold">
                          {isArrivalSearch
                            ? arrivalTimeResolved || "—"
                            : arrivalTimeResolved || "—"}
                        </span>
                        <span className="text-xs text-slate-400">
                          {to?.name || terminus || "—"}
                        </span>
                      </div>
                    </div>

                    <div className="w-56 flex-shrink-0 flex flex-col md:flex-row items-center gap-4 border-t md:border-t-0 md:border-l border-border-dark pt-3 md:pt-0 md:pl-3 self-stretch md:justify-start justify-center">
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2">
                          <div
                            className={`${getTrainTypeBadgeClass(trainType)} px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase`}
                          >
                            {trainType}
                          </div>
                          {(() => {
                            const ns = train.nextStop;
                            let arrivingTo: string | null = null;
                            if (ns) {
                              if (
                                "name" in ns &&
                                typeof (ns as { name?: unknown }).name ===
                                  "string"
                              )
                                arrivingTo = (ns as { name: string }).name;
                              else if (
                                "properties" in ns &&
                                ns.properties &&
                                typeof (ns.properties as { libelle?: unknown })
                                  .libelle === "string"
                              )
                                arrivingTo = (
                                  ns.properties as { libelle: string }
                                ).libelle;
                            }
                            const hasDeparted =
                              typeof train.ratio === "number"
                                ? train.ratio > 0
                                : Boolean(train.position);
                            if (hasDeparted && arrivingTo) {
                              return (
                                <span className="text-xs text-slate-400 uppercase ml-2">
                                  {t("arrivingAt", { station: arrivingTo })}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div className="text-xs text-slate-400 space-y-0.5">
                          <div>
                            {terminus || train.journey.DestinationName || "—"}
                          </div>
                          <div>
                            {departurePlatform || arrivalPlatform
                              ? t("platform", {
                                  number:
                                    departurePlatform || arrivalPlatform || "",
                                })
                              : t("platformUnknown")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </main>

      <Footer />

      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-black/90 border border-border-dark rounded-2xl p-6 w-full max-w-2xl">
            <h3 className="text-lg font-bold mb-4 text-zinc-100">
              {t("editor.title")}
            </h3>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm text-zinc-400">
                  {t("editor.fromLabel")}
                </label>
                <input
                  className="w-full mt-1 p-3 rounded-md bg-background/10 border border-border-dark text-zinc-100"
                  value={fromInput}
                  onChange={(e) => {
                    setFromInput(e.target.value);
                    setFromSelected(null);
                  }}
                  onFocus={() => setFromFocused(true)}
                  onBlur={() => setTimeout(() => setFromFocused(false), 150)}
                  placeholder={t("editor.placeholder")}
                />
                {fromSuggestions.length > 0 && fromFocused && (
                  <ul className="bg-surface-dark border border-border-dark mt-2 rounded-md max-h-48 overflow-auto">
                    {fromSuggestions.map((s: Station) => (
                      <li
                        key={s?.id || ""}
                        className="px-3 py-2 hover:bg-background/20 cursor-pointer text-zinc-100"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setFromSelected(s);
                          setFromInput(s?.name || "");
                          setFromSuggestions([]);
                          setFromFocused(false);
                        }}
                      >
                        {s?.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label className="text-sm text-zinc-400">
                  {t("editor.toLabel")}
                </label>
                <input
                  className="w-full mt-1 p-3 rounded-md bg-background/10 border border-border-dark text-zinc-100"
                  value={toInput}
                  onChange={(e) => {
                    setToInput(e.target.value);
                    setToSelected(null);
                  }}
                  onFocus={() => setToFocused(true)}
                  onBlur={() => setTimeout(() => setToFocused(false), 150)}
                  placeholder={t("editor.placeholder")}
                />
                {toSuggestions.length > 0 && toFocused && (
                  <ul className="bg-surface-dark border border-border-dark mt-2 rounded-md max-h-48 overflow-auto">
                    {toSuggestions.map((s: Station) => (
                      <li
                        key={s?.id || ""}
                        className="px-3 py-2 hover:bg-background/20 cursor-pointer text-zinc-100"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setToSelected(s);
                          setToInput(s?.name || "");
                          setToSuggestions([]);
                          setToFocused(false);
                        }}
                      >
                        {s?.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  onClick={() => setEditorOpen(false)}
                  className="px-4 py-2 rounded-md border border-border-dark text-zinc-200"
                >
                  {t("editor.cancel")}
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-md bg-primary text-white disabled:opacity-50"
                  disabled={!fromSelected && !toSelected}
                >
                  {t("editor.save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
