"use client";

import { X, Train, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InterpolatedJourney } from "@/types/trains";
import { Gare } from "@/types/network";
import { formatJourneyTitle } from "@/lib/format";
import { extractUIC } from "@/lib/utils/extractIds";

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
            (c as any).ExpectedDepartureTime || c.AimedDepartureTime || undefined;
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
          Trains passant par cette gare
        </div>
        {trainsAtGare.length === 0 && (
          <p className="text-xs text-muted-foreground">Aucun train trouvé</p>
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
                        `Arrivée: ${new Date(arrival).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`}
                      {arrival && departure && " • "}
                      {departure &&
                        `Départ: ${new Date(departure).toLocaleTimeString([], {
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
  const name = "name" in gare ? gare.name : gare.properties?.libelle || "";

  return (
    <div className="bg-popover text-popover-foreground p-4 rounded-md border shadow-md w-60 flex flex-col gap-2 h-full overflow-y-auto">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          <h3 className="font-bold text-lg leading-tight">{name}</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 -mr-2 -mt-2"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <GareDetailsContent gare={gare} trains={trains} />
    </div>
  );
}
