"use client";

import { X, Train, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatJourneyTitle } from "@/lib/format";
import type { InterpolatedJourney } from "@/types/trains";
import type { SearchResult } from "@/lib/search";
import type { Gare } from "@/types/network";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("map.search");
  return (
    <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-xl min-w-60 flex flex-col gap-2 pointer-events-auto shrink-0">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          {t("results", { count: results.length })}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-slate-400 hover:text-white"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2 pr-2">
        {results.map((res, idx) => {
          if (res.kind === "train") {
            const id =
              res.train.journey.FramedVehicleJourneyRef.DatedVehicleJourneyRef;
            const title = formatJourneyTitle(res.train.journey) || id;
            const operator = res.train.journey.OperatorRef || "";
            return (
              <button
                key={id + "-train"}
                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-primary/20 hover:text-primary hover:border-primary/30 transition-all text-left"
                onClick={() => onSelectTrain(id)}
              >
                <Train className="h-4 w-4 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold truncate">
                    {title}
                  </span>
                  {operator && (
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter truncate">
                      {operator}
                    </span>
                  )}
                </div>
              </button>
            );
          } else {
            const gare = res.gare;
            const name =
              "name" in gare ? gare.name : gare.properties?.libelle || "";
            return (
              <button
                key={name + "-gare" + idx}
                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-tgv-blue/20 hover:text-tgv-blue hover:border-tgv-blue/30 transition-all text-left"
                onClick={() => onSelectGare(gare)}
              >
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="text-sm font-semibold truncate">{name}</span>
              </button>
            );
          }
        })}
      </div>
    </div>
  );
}
