"use client";

import { X, ZoomIn, Eye, Filter, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InterpolatedJourney } from "@/types/trains";
import { formatJourneyTitle } from "@/lib/format";
import { TrainStopsTimeline } from "./TimelineStops";
import { useEffect, useState, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface Call {
  StopPointRef: string;
  StopPointName: string;
  AimedArrivalTime?: string;
  ExpectedArrivalTime?: string;
  AimedDepartureTime?: string;
  ExpectedDepartureTime?: string;
}

function getCalls(train: InterpolatedJourney): Call[] {
  const recorded = train.journey.RecordedCalls?.RecordedCall;
  const estimated = train.journey.EstimatedCalls?.EstimatedCall;

  const recordedArr = (
    Array.isArray(recorded) ? recorded : recorded ? [recorded] : []
  ) as Call[];
  const estimatedArr = (
    Array.isArray(estimated) ? estimated : estimated ? [estimated] : []
  ) as Call[];

  const allCalls = [...recordedArr, ...estimatedArr];

  return allCalls.sort((a, b) => {
    const timeA = new Date(
      a.ExpectedDepartureTime ||
        a.AimedDepartureTime ||
        a.ExpectedArrivalTime ||
        a.AimedArrivalTime ||
        "",
    ).getTime();
    const timeB = new Date(
      b.ExpectedDepartureTime ||
        b.AimedDepartureTime ||
        b.ExpectedArrivalTime ||
        b.AimedArrivalTime ||
        "",
    ).getTime();
    return timeA - timeB;
  });
}

export function TrainDetailsContent({ train }: { train: InterpolatedJourney }) {
  const t = useTranslations("map.trainDetails");
  const calls = useMemo(() => getCalls(train), [train]);
  const currentStopIndex = useMemo(
    () => calls.findIndex((c) => c.StopPointRef === train.nextStopId),
    [calls, train.nextStopId],
  );

  const journeyStart =
    train.journey.OriginAimedDepartureTime ||
    calls[0]?.ExpectedDepartureTime ||
    calls[0]?.AimedDepartureTime;
  const journeyEnd =
    train.journey.DestinationAimedArrivalTime ||
    calls[calls.length - 1]?.ExpectedArrivalTime ||
    calls[calls.length - 1]?.AimedArrivalTime;

  const [liveRatio, setLiveRatio] = useState(0);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const animate = () => {
      if (!journeyStart || !journeyEnd) return;
      const now = Date.now();
      const start = new Date(journeyStart).getTime();
      const end = new Date(journeyEnd).getTime();
      const duration = end - start;

      let ratio = 0;
      if (duration > 0) {
        ratio = (now - start) / duration;
      }
      ratio = Math.max(0, Math.min(1, ratio));
      setLiveRatio(ratio);

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [journeyStart, journeyEnd]);

  const estimatedSpeed = useMemo(() => {
    const { lastStopCoords, nextStopCoords } = train;
    if (!lastStopCoords || !nextStopCoords) return null;

    const R = 6371;
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(nextStopCoords.lat - lastStopCoords.lat);
    const dLon = toRad(nextStopCoords.lon - lastStopCoords.lon);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lastStopCoords.lat)) *
        Math.cos(toRad(nextStopCoords.lat)) *
        Math.sin(dLon / 2) ** 2;
    const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const tA = new Date(train.tA).getTime();
    const tB = new Date(train.tB).getTime();
    const durationHours = (tB - tA) / 3_600_000;

    if (durationHours <= 0) return null;

    const speed = Math.round(distanceKm / durationHours);
    return speed > 0 && speed < 400 ? speed : null;
  }, [train]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        const currentStop = scrollRef.current.querySelector(
          '[data-status="current"]',
        );
        if (currentStop) {
          currentStop.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [train.nextStopId]);

  const timelineProgress = useMemo(() => {
    if (calls.length <= 1) return 0;
    const now = Date.now();

    for (let i = 0; i < calls.length - 1; i++) {
      const depTime =
        calls[i].ExpectedDepartureTime || calls[i].AimedDepartureTime;
      const arrTimeNext =
        calls[i + 1].ExpectedArrivalTime || calls[i + 1].AimedArrivalTime;

      if (!depTime || !arrTimeNext) continue;

      const t1 = new Date(depTime).getTime();
      const t2 = new Date(arrTimeNext).getTime();

      if (now >= t1 && now <= t2) {
        const segmentProgress = (now - t1) / (t2 - t1);
        return (i + segmentProgress) / (calls.length - 1);
      }

      if (now < t1) {
        const arrTimeCurrent =
          calls[i].ExpectedArrivalTime || calls[i].AimedArrivalTime;
        if (arrTimeCurrent) {
          const t0 = new Date(arrTimeCurrent).getTime();
          if (now >= t0) return i / (calls.length - 1);
        }
        if (i === 0) return 0;
      }
    }

    const lastArr =
      calls[calls.length - 1].ExpectedArrivalTime ||
      calls[calls.length - 1].AimedArrivalTime;
    if (lastArr && now >= new Date(lastArr).getTime()) return 1;

    return liveRatio;
  }, [calls, liveRatio]);

  const nextStop =
    calls[currentStopIndex]?.StopPointName || t("status.terminus");
  const finalArrival = journeyEnd
    ? new Date(journeyEnd).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";

  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-5">
        <div className="flex flex-col gap-1">
          <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
            {t("estSpeed")}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-white text-lg font-bold">
              {estimatedSpeed ?? "--"}
            </span>
            <span className="text-slate-500 text-xs">
              {estimatedSpeed ? "km/h" : ""}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
            {t("nextStop")}
          </span>
          <span className="text-white text-sm font-bold truncate">
            {nextStop}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
            {t("finalArrival")}
          </span>
          <span className="text-white text-lg font-bold">{finalArrival}</span>
        </div>
      </div>

      <div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative">
          <div
            className="absolute left-0 top-0 h-full bg-primary/40"
            style={{ width: `${liveRatio * 100}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full border-2 border-background-dark shadow-[0_0_8px_#ec5b13] z-10"
            style={{ left: `calc(${liveRatio * 100}% - 6px)` }}
          >
            <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-25" />
          </div>
        </div>
        <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
          <span>
            {t("departure")}{" "}
            {journeyStart
              ? new Date(journeyStart).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "--:--"}
          </span>
          <span>
            {t("journeyProgress", { percent: Math.round(liveRatio * 100) })}
          </span>
          <span>
            {t("arrival")} {finalArrival}
          </span>
        </div>
      </div>

      <div className="border-t border-white/5 pt-2 flex flex-col min-h-0">
        <button 
          onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
          className="flex items-center justify-between w-full text-[10px] text-slate-500 uppercase font-bold mb-2 hover:text-white transition-colors"
        >
          {t("stopsDetails")}
          <span className="text-lg leading-none">{isTimelineExpanded ? "−" : "+"}</span>
        </button>
        {isTimelineExpanded && (
          <div
            ref={scrollRef}
            className="overflow-y-auto max-h-[22vh] pr-2 -mr-2 scrollbar-thin scroll-smooth animate-in slide-in-from-top-2 fade-in"
          >
            <TrainStopsTimeline
              stops={calls.map((call, index) => ({
                id: call.StopPointRef,
                name: call.StopPointName,
                arrivalTime: call.AimedArrivalTime
                  ? new Date(call.AimedArrivalTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : undefined,
                departureTime: call.AimedDepartureTime
                  ? new Date(call.AimedDepartureTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : undefined,
                status:
                  index < currentStopIndex
                    ? "passed"
                    : index === currentStopIndex
                      ? "current"
                      : "upcoming",
              }))}
              progress={timelineProgress}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function TrainStatus({ train }: { train: InterpolatedJourney }) {
  const t = useTranslations("map.trainDetails");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const now = new Date();

      if (train.status === "upcoming") {
        const departIn = train.journey.departIn || 0;
        if (departIn < 60) setStatus(t("status.imminent"));
        else setStatus(t("status.departIn", { min: Math.ceil(departIn / 60) }));
        return;
      }

      if (train.status === "completed") {
        setStatus(t("status.terminus"));
        return;
      }

      const tB = new Date(train.tB);
      const diffMs = tB.getTime() - now.getTime();
      if (diffMs < 45000) setStatus(t("status.arriving"));
      else setStatus(t("status.enroute", { min: Math.ceil(diffMs / 60000) }));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [train, t]);

  return <div className="text-slate-400 text-sm">{status}</div>;
}

export function TrainActions({
  onZoom,
  onFollow,
  onFilter,
  isFollowing,
  isFiltered,
  onShare,
}: {
  onZoom: () => void;
  onFollow: () => void;
  onFilter: () => void;
  isFollowing: boolean;
  isFiltered: boolean;
  onShare: () => void;
}) {
  const t = useTranslations("map.trainDetails");

  return (
    <div className="bg-white/5 p-3 flex gap-2">
      <Button
        onClick={onZoom}
        className="flex-1 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 border-none h-auto"
      >
        <ZoomIn className="h-4 w-4" />
        {t("actions.zoom")}
      </Button>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onFollow}
          className={cn(
            "h-10 w-10 border-white/10 bg-white/10 text-white hover:bg-white/20",
            isFollowing && "bg-primary/20 border-primary/40 text-primary",
          )}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onFilter}
          className={cn(
            "h-10 w-10 border-white/10 bg-white/10 text-white hover:bg-white/20",
            isFiltered && "bg-primary/20 border-primary/40 text-primary",
          )}
        >
          <Filter className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onShare}
          className="h-10 w-10 border-white/10 bg-white/10 text-white hover:bg-white/20"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function TrainDetailsCard({
  train,
  onClose,
  onZoom,
  onFollow,
  onFilter,
  isFollowing,
  isFiltered,
  onShare,
}: {
  train: InterpolatedJourney;
  onClose: () => void;
  onZoom: () => void;
  onFollow: () => void;
  onFilter: () => void;
  isFollowing: boolean;
  isFiltered: boolean;
  onShare: () => void;
}) {
  const t = useTranslations("map.trainDetails");
  const journeyTitle = formatJourneyTitle(train.journey);
  const trainType = train.journey.PublishedLineName || "Train";

  return (
    <div className="flex flex-col gap-4 pointer-events-auto">
      <div className="bg-background-dark/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-tgv-blue/20 text-tgv-blue text-[10px] font-bold rounded uppercase">
                {trainType}
              </span>
              <h3
                className="text-white font-bold text-xl truncate"
                title={journeyTitle}
              >
                {journeyTitle}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <span className="font-medium text-slate-100">
                {train.journey.OriginName}
              </span>
              <span className="text-slate-600">→</span>
              <span className="font-medium text-slate-100">
                {train.journey.DestinationName}
              </span>
            </div>
            <TrainStatus train={train} />
          </div>
          <div className="text-right flex flex-col items-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-slate-500 hover:text-white mb-2"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
            {train.delay && (
              <>
                <div className="text-primary text-sm font-bold leading-tight">
                  {train.delay}
                </div>
                <div className="text-slate-500 text-[10px] uppercase font-bold">
                  {t("delay")}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="px-5 pb-5 overflow-hidden flex flex-col">
          <TrainDetailsContent train={train} />
        </div>
      </div>

      <div className="bg-background-dark/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <TrainActions
          onZoom={onZoom}
          onFollow={onFollow}
          onFilter={onFilter}
          isFollowing={isFollowing}
          isFiltered={isFiltered}
          onShare={onShare}
        />
      </div>
    </div>
  );
}
