import GaresFile from "@/public/network/gares.json";
import type { InterpolatedJourney } from "@/types/trains";
import type { Gare } from "@/types/network";

export type SearchResult =
  | { kind: "train"; train: InterpolatedJourney }
  | { kind: "gare"; gare: Gare };

function normalize(str: string): string {
  
  
  return str
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/saint/g, "st")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function searchTrainsAndStations(
  query: string,
  trains: InterpolatedJourney[],
): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  
  
  
  let stationTerm = q;
  ["gare", "station", "ville", "city"].forEach((w) => {
    if (stationTerm.startsWith(w + " ")) {
      stationTerm = stationTerm.slice(w.length + 1);
    }
  });

  let matched: InterpolatedJourney[] = [];

  const searchInStops = (
    t: InterpolatedJourney,
    city: string,
  ) => {
    const recorded = t.journey.RecordedCalls?.RecordedCall;
    const estimated = t.journey.EstimatedCalls?.EstimatedCall;
    const calls = [
      ...(Array.isArray(recorded) ? recorded : recorded ? [recorded] : []),
      ...(Array.isArray(estimated) ? estimated : estimated ? [estimated] : []),
    ];
    return calls.some((call) => {
      const name = call.StopPointName;
      return typeof name === "string" && name.toLowerCase().includes(city);
    });
  };

  if (/^\d+$/.test(q)) {
    matched = trains.filter((t) =>
      t.journey.FramedVehicleJourneyRef.DatedVehicleJourneyRef.toLowerCase().includes(
        q,
      ),
    );
  } else {
    const [key, ...rest] = q.split(":");
    const value = rest.join(":").trim();
    if (value) {
      if (["type", "t", "vehicletype", "product", "category"].includes(key)) {
        matched = trains.filter(
          (t) =>
            t.journey.ProductCategoryRef?.toLowerCase().includes(value) ||
            t.journey.VehicleMode?.toLowerCase().includes(value) ||
            t.journey.PublishedLineName?.toLowerCase().includes(value),
        );
      } else if (["company", "compagnie", "operator", "c"].includes(key)) {
        matched = trains.filter((t) =>
          t.journey.OperatorRef?.toLowerCase().includes(value),
        );
      } else if (["city", "ville", "station", "gare"].includes(key)) {
        matched = trains.filter((t) => searchInStops(t, value));
        stationTerm = value;
      }
    }
    if (matched.length === 0) {
      matched = trains.filter((t) => {
        if (
          t.journey.FramedVehicleJourneyRef.DatedVehicleJourneyRef.toLowerCase().includes(
            q,
          )
        )
          return true;
        if (t.journey.OperatorRef?.toLowerCase().includes(q)) return true;
        if (t.journey.PublishedLineName?.toLowerCase().includes(q)) return true;
        return searchInStops(t, q);
      });
    }
  }

  
  matched.sort((a, b) => {
    const order: Record<string, number> = {
      active: 0,
      upcoming: 1,
      completed: 1,
    };
    return (order[a.status] ?? 1) - (order[b.status] ?? 1);
  });

  const trainResults: SearchResult[] = matched.map((t) => ({ kind: "train", train: t }));

  const stations: Gare[] = (GaresFile as any) as Gare[];
  const normStation = normalize(stationTerm);
  const stationMatches = stations.filter((g) => {
    const name = ("name" in g ? g.name : g.properties?.libelle) ?? "";
    return normalize(name).includes(normStation);
  });
  let stationResults: SearchResult[] = stationMatches.map((g) => ({ kind: "gare", gare: g }));

  
  const trimmedLen = q.replace(/[^a-z0-9]/g, "").length;
  if (trimmedLen < 5) {
    stationResults = [];
  }

  
  
  if (
    stationResults.length > 0 &&
    !/^\d+$/.test(q) &&
    trimmedLen >= 5
  ) {
    return stationResults;
  }

  
  return [...stationResults, ...trainResults];
}
