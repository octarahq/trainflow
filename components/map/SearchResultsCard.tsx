"use client";

import { X, Train, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatJourneyTitle } from "@/lib/format";
import type { InterpolatedJourney } from "@/types/trains";
import type { SearchResult } from "@/lib/search";
import type { Gare } from "@/types/network";

export function SearchResultsCard({
  results,
  onSelectTrain,
  onSelectGare,
  onClose,
}: {
  results: SearchResult[];
  onSelectTrain: (id: string) => void;
  onSelectGare: (gare: Gare) => void;
  onClose: () => void;
}) {
  return (
    <div className="bg-popover text-popover-foreground p-4 rounded-md border shadow-md w-60 flex flex-col gap-2 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-lg">Résultats</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 -mr-2 -mt-2"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-1 max-h-[calc(100%-2rem)] overflow-y-auto">
        {results.map((res, idx) => {
          if (res.kind === "train") {
            const id =
              res.train.journey.FramedVehicleJourneyRef.DatedVehicleJourneyRef;
            const title = formatJourneyTitle(res.train.journey) || id;
            const operator = res.train.journey.OperatorRef || "";
            return (
              <button
                key={id + "-train"}
                className="flex w-full items-center gap-2 p-1 rounded hover:bg-gray-700"
                onClick={() => onSelectTrain(id)}
              >
                <Train className="h-4 w-4" />
                <div className="flex flex-col text-left">
                  <span className="font-medium text-sm">{title}</span>
                  {operator && (
                    <span className="text-xs text-muted-foreground">
                      {operator}
                    </span>
                  )}
                </div>
              </button>
            );
          } else {
            const gare = res.gare;
            const name = "name" in gare ? gare.name : gare.properties?.libelle || "";
            return (
              <button
                key={name + "-gare" + idx}
                className="flex w-full items-center gap-2 p-1 rounded hover:bg-gray-700"
                onClick={() => onSelectGare(gare)}
              >
                <MapPin className="h-4 w-4" />
                <span className="font-medium text-sm">{name}</span>
              </button>
            );
          }
        })}
      </div>
    </div>
  );
}
