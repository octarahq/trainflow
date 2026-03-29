"use client";

import { X, Train, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/use-favorites";
import { InterpolatedJourney } from "@/types/trains";
import { Gare } from "@/types/network";
import { formatJourneyTitle } from "@/lib/format";
import { extractUIC } from "@/lib/utils/extractIds";
import { useTranslations } from "next-intl";

function getUICFromGare(g: Gare): string | undefined {
  if ("uic" in g) {
    return g.uic;
  }
  if (g.properties && g.properties.code_uic) {
    return String(g.properties.code_uic);
  }
  return undefined;
}

export function GareDetailsContent({
  gare,
  trains,
}: {
  gare: Gare;
  trains: InterpolatedJourney[];
}) {
  const t = useTranslations("map.gare");
  const uic = getUICFromGare(gare);

  type TrainAtGare = {
    train: InterpolatedJourney;
    arrival?: string;
    departure?: string;
  };

  const trainsAtGare = trains
    .map<TrainAtGare | null>((t) => {
      const rawCalls =
        t.journey.EstimatedCalls?.EstimatedCall ??
        t.journey.RecordedCalls?.RecordedCall ??
        [];
      const calls = Array.isArray(rawCalls) ? rawCalls : [rawCalls];
      for (const c of calls) {
        const found = extractUIC(c.StopPointRef || "");
        if (found && uic && found === uic) {
          const arrival: string | undefined =
            (c as any).ExpectedArrivalTime || c.AimedArrivalTime || undefined;
          const departure: string | undefined =
            (c as any).ExpectedDepartureTime ||
            c.AimedDepartureTime ||
            undefined;
          return { train: t, arrival, departure };
        }
      }
      return null;
    })
    .filter((x): x is TrainAtGare => x !== null)
    .sort((a, b) => {
      const ta = a.arrival
        ? new Date(a.arrival).getTime()
        : a.departure
          ? new Date(a.departure).getTime()
          : 0;
      const tb = b.arrival
        ? new Date(b.arrival).getTime()
        : b.departure
          ? new Date(b.departure).getTime()
          : 0;
      return ta - tb;
    })
    .slice(0, 20);

  const name = "name" in gare ? gare.name : gare.properties?.libelle || "";

  return (
    <div className="space-y-2 text-sm">
      <div className="mt-2 text-sm">
        <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">
          {t("trainsPassing")}
        </div>
        {trainsAtGare.length === 0 && (
          <p className="text-xs text-muted-foreground">{t("noTrains")}</p>
        )}
        <ul className="space-y-1">
          {trainsAtGare.map(({ train, arrival, departure }) => {
            const id =
              train.journey.FramedVehicleJourneyRef.DatedVehicleJourneyRef;
            const title = formatJourneyTitle(train.journey);
            return (
              <li key={id} className="flex items-center gap-2">
                <Train className="h-4 w-4" />
                <div className="flex flex-col text-sm">
                  <span className="font-medium">{title}</span>
                  {(arrival || departure) && (
                    <span className="text-xs text-muted-foreground">
                      {arrival &&
                        `${t("arrival")} ${new Date(arrival).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}`}
                      {arrival && departure && " • "}
                      {departure &&
                        `${t("departure")} ${new Date(
                          departure,
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function GareDetailsCard({
  gare,
  trains,
  onClose,
}: {
  gare: Gare;
  trains: InterpolatedJourney[];
  onClose: () => void;
}) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const uic = getUICFromGare(gare);
  const stationId = uic || ("id" in gare ? String(gare.id) : "");
  const name = "name" in gare ? gare.name : gare.properties?.libelle || "";

  return (
    <div className="bg-background-dark/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto">
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-tgv-blue/20 p-2 rounded-lg flex-shrink-0">
            <MapPin className="h-5 w-5 text-tgv-blue" />
          </div>
          <h3 className="text-white font-bold text-xl leading-tight truncate">
            {name}
          </h3>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 transition-colors ${
              isFavorite(stationId)
                ? "text-primary"
                : "text-slate-500 hover:text-white"
            }`}
            onClick={() => toggleFavorite({ id: stationId, name })}
          >
            <Star
              className="h-4 w-4"
              fill={isFavorite(stationId) ? "currentColor" : "none"}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-white"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="px-5 pb-5 max-h-[40vh] overflow-y-auto">
        <GareDetailsContent gare={gare} trains={trains} />
      </div>
    </div>
  );
}
