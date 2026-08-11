"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X, MapPin, Clock, Zap } from "lucide-react";
import { TrainStopsTimeline } from "@/components/map/TimelineStops";
import { InterpolatedJourney } from "@/types/trains";
import { formatJourneyTitle } from "@/lib/format";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useTranslations, useLocale } from "next-intl";
import { API_URL } from "@/lib/config";

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

export default function TrainPage() {
  const t = useTranslations("train");
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const trainId = rawId ? decodeURIComponent(rawId) : undefined;

  const [train, setTrain] = useState<InterpolatedJourney | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const calls = useMemo(() => (train ? getCalls(train) : []), [train]);

  const currentStopIndex = useMemo(
    () =>
      train ? calls.findIndex((c) => c.StopPointRef === train.nextStopId) : -1,
    [calls, train?.nextStopId],
  );

  const estimatedSpeed = useMemo(() => {
    if (!train) return null;
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

  useEffect(() => {
    if (!trainId) {
      setIsLoading(false);
      return;
    }

    const fetchTrain = async () => {
      console.log("Fetching train data for ID:", trainId);
      try {
        const res = await fetch(
          `/api/vehicles/live/${encodeURIComponent(trainId)}`,
        );
        if (!res.ok) {
          console.log(res.status);
          setTrain(null);
          return;
        }
        const data = await res.json();
        console.log(data);
        if (data && data.vehicle) {
          setTrain(data.vehicle);
        } else {
          setTrain(null);
        }
      } catch (err) {
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrain();
    const interval = setInterval(fetchTrain, 30000);
    return () => clearInterval(interval);
  }, [trainId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background-dark to-slate-900 flex items-center justify-center">
        <div className="text-white">{t("loading")}</div>
      </div>
    );
  }

  if (!train) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background-dark to-slate-900 flex flex-col items-center justify-center">
        <div className="text-white text-2xl mb-4">{t("notFound")}</div>
        <Button onClick={() => router.back()} className="gap-2">
          <X className="h-4 w-4" />
          {t("back")}
        </Button>
      </div>
    );
  }

  const journeyTitle = formatJourneyTitle(train.journey);
  const trainType = train.journey.PublishedLineName || "Train";

  const finalArrival =
    train.journey.DestinationAimedArrivalTime ||
    calls[calls.length - 1]?.ExpectedArrivalTime ||
    calls[calls.length - 1]?.AimedArrivalTime;
  const finalDeparture =
    train.journey.OriginAimedDepartureTime ||
    calls[0]?.ExpectedDepartureTime ||
    calls[0]?.AimedDepartureTime;

  const goToMap = () => {
    if (train.position && trainId) {
      const params = new URLSearchParams();
      params.set("lat", train.position.lat.toFixed(6));
      params.set("lon", train.position.lon.toFixed(6));
      params.set("zoom", "14");
      params.set("trainNumber", trainId);
      router.push(`/map?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 bg-gradient-to-b from-background-dark to-slate-900 text-white p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-tgv-blue/20 text-tgv-blue text-xs font-bold rounded uppercase">
                  {trainType}
                </span>
              </div>
              <h1 className="text-4xl font-bold mb-2">{journeyTitle}</h1>
              <p className="text-slate-400">
                {t("from")}{" "}
                <span className="text-white font-semibold">
                  {train.journey.OriginName}
                </span>{" "}
                {t("to")}{" "}
                <span className="text-white font-semibold">
                  {train.journey.DestinationName}
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {finalDeparture && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="text-slate-400 text-sm mb-1">
                  {t("departure")}
                </div>
                <div className="text-xl font-bold">
                  {new Date(finalDeparture).toLocaleTimeString(locale, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            )}

            {finalArrival && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="text-slate-400 text-sm mb-1">
                  {t("arrival")}
                </div>
                <div className="text-xl font-bold">
                  {new Date(finalArrival).toLocaleTimeString(locale, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            )}

            {train.delay && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="text-slate-400 text-sm mb-1">{t("delay")}</div>
                <div className="text-xl font-bold text-red-400">
                  {train.delay}
                </div>
              </div>
            )}

            {estimatedSpeed && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
                <Zap className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-slate-400 text-sm">{t("speed")}</div>
                  <div className="text-xl font-bold">{estimatedSpeed} km/h</div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              {t("stops")}
            </h2>
            <div className="overflow-y-auto max-h-96 pr-2 -mr-2">
              <TrainStopsTimeline
                stops={calls.map((call, index) => {
                  const nextIndex = calls.findIndex(
                    (c) => c.StopPointRef === train.nextStopId
                  );
                  let status: "passed" | "current" | "upcoming" = "upcoming";
                  if (index < nextIndex) {
                    status = "passed";
                  } else if (index === nextIndex) {
                    status = "current";
                  }

                  return {
                    id: call.StopPointRef,
                    name: call.StopPointName,
                    arrivalTime: call.AimedArrivalTime
                      ? new Date(call.AimedArrivalTime).toLocaleTimeString(
                          locale,
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                      : undefined,
                    departureTime: call.AimedDepartureTime
                      ? new Date(call.AimedDepartureTime).toLocaleTimeString(
                          locale,
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                      : undefined,
                    status,
                  };
                })}
                progress={(() => {
                  const lastIndex = calls.findIndex(
                    (c) => c.StopPointRef === train.lastStopId
                  );
                  if (lastIndex === -1) return 0;
                  const totalSteps = Math.max(1, calls.length - 1);
                  return (lastIndex + (train.ratio || 0)) / totalSteps;
                })()}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={goToMap}
              className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-6"
            >
              <MapPin className="h-5 w-5" />
              {t("viewOnMap")}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
