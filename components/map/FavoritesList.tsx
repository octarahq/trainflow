"use client";

import { InterpolatedJourney } from "@/types/trains";
import { formatJourneyTitle } from "@/lib/format";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function FavoritesList({
  trains,
  onSelect,
  onRemove,
}: {
  trains: InterpolatedJourney[];
  onSelect: (train: InterpolatedJourney) => void;
  onRemove: (id: string) => void;
}) {
  const t = useTranslations("map.favorites");
  if (trains.length === 0) return null;

  return (
    <div className="absolute bottom-4 right-4 z-50 bg-popover text-popover-foreground p-3 rounded-md border shadow-md w-60 max-w-xs text-secondary-foreground">
      <h4 className="font-semibold text-sm mb-2">{t("title")}</h4>
      <ul className="space-y-1 text-sm">
        {trains.map((t_info) => {
          const id =
            t_info.journey.FramedVehicleJourneyRef.DatedVehicleJourneyRef;
          const title = formatJourneyTitle(t_info.journey) || "Train";
          return (
            <li key={id} className="flex justify-between items-center">
              <button
                className="text-left flex-1 truncate"
                onClick={() => onSelect(t_info)}
              >
                {title}
              </button>
              <button
                className="p-1"
                onClick={() => onRemove(id)}
                title={t("delete")}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
