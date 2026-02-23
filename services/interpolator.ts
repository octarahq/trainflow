import { Gare } from "@/types/network";
import type {
  SIRIData,
  SIRISNCFData,
  SIRIVehicleJourney,
  TrainJourney,
  TrainState,
} from "@/types/siri/providers";
import { getGareFromId } from "@/lib/stops/getFromId";
import { getSnappedPosition } from "./railManager";

type SIRICall = {
  StopPointRef?: string;
  ExpectedDepartureTime?: string;
  ExpectedArrivalTime?: string;
  AimedDepartureTime?: string;
  AimedArrivalTime?: string;
};


function gatherCalls(journey: SIRIVehicleJourney): SIRICall[] {
  const recorded = journey.RecordedCalls?.RecordedCall;
  const estimated = journey.EstimatedCalls?.EstimatedCall;
  return [
    ...(Array.isArray(recorded) ? recorded : recorded ? [recorded] : []),
    ...(Array.isArray(estimated) ? estimated : estimated ? [estimated] : []),
  ] as SIRICall[];
}

function sortCallsByTime(calls: SIRICall[]) {
  return calls
    .map((call) => {
      const time = toDate(
        call.ExpectedDepartureTime ??
          call.ExpectedArrivalTime ??
          call.AimedDepartureTime ??
          call.AimedArrivalTime
      );
      return { call, time };
    })
    .filter(
      (c): c is { call: SIRICall; time: Date } => c.time !== null
    )
    .sort((a, b) => a.time.getTime() - b.time.getTime());
}

export function getTrainState(
  journey: SIRIVehicleJourney,
  now: Date
): TrainState {
  const calls = gatherCalls(journey);
  if (calls.length === 0) return "completed";

  const sorted = sortCallsByTime(calls);
  if (sorted.length === 0) return "completed";

  const start = sorted[0].time;
  const end = sorted[sorted.length - 1].time;

  if (!start || !end) return "completed";
  if (now < start) return "upcoming";
  if (now > end) return "completed";
  return "active";
}

export function filterActiveTrains(
  journeys: SIRIData,
  now: Date
): SIRIVehicleJourney[] {
  const UPCOMING_THRESHOLD = 5 * 60; 

  const result = journeys
    .map((j) => {
      const t: TrainJourney = j;
      t.status = getTrainState(t, now);

      const calls = sortCallsByTime(gatherCalls(t));
      const first = calls.length ? calls[0] : null;
      const start = first ? first.time : null;

      t.departIn = start
        ? Math.max(0, Math.floor((start.getTime() - now.getTime()) / 1000))
        : null;
      return t;
    })
    .filter((j) => {
      if (j.status === "active") return true;
      if (j.status === "upcoming" && j.departIn != null) {
        return j.departIn <= UPCOMING_THRESHOLD;
      }
      return false;
    });

  console.log(`filterActiveTrains -> active/upcoming: ${result.length}`);
  return result;
}

function toDate(s?: string | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function makeGareFromStopId(stopId?: string): Gare | null {
  if (!stopId) return null;
  const stop = getGareFromId(stopId);
  if (!stop) return null;
  return stop;
}

export function findActiveSegment(
  journey: SIRIVehicleJourney,
  now: Date
): { lastStop: Gare; nextStop: Gare } | null {
  const raw = gatherCalls(journey);
  if (raw.length === 0) return null;

  const calls = sortCallsByTime(raw)
    .map((c) => ({ stopId: c.call.StopPointRef as string, time: c.time }));

  if (calls.length === 0) return null;

  const idx = calls.findIndex((c) => c.time.getTime() > now.getTime());

  let lastStopId: string | undefined;
  let nextStopId: string | undefined;

  if (idx === -1) {
    lastStopId = calls[calls.length - 1].stopId;
    nextStopId = undefined;
  } else if (idx === 0) {
    lastStopId = undefined;
    nextStopId = calls[0].stopId;
  } else {
    lastStopId = calls[idx - 1].stopId;
    nextStopId = calls[idx].stopId;
  }

  if (!lastStopId || !nextStopId) return null;

  const lastGare = makeGareFromStopId(lastStopId);
  const nextGare = makeGareFromStopId(nextStopId);

  if (!lastGare || !nextGare) return null;

  return { lastStop: lastGare, nextStop: nextGare };
}

import { InterpolatedJourney } from "@/types/trains";

function calculateDelay(journey: SIRIVehicleJourney): string | undefined {
  const recordedCalls = journey.RecordedCalls?.RecordedCall;
  const estimatedCalls = journey.EstimatedCalls?.EstimatedCall;

  const calls = [
    ...(Array.isArray(recordedCalls)
      ? recordedCalls
      : recordedCalls
      ? [recordedCalls]
      : []),
    ...(Array.isArray(estimatedCalls)
      ? estimatedCalls
      : estimatedCalls
      ? [estimatedCalls]
      : []),
  ] as SIRICall[];

  if (calls.length === 0) return undefined;

  let maxDelay = 0;

  for (const call of calls) {
    if (call.AimedArrivalTime && call.ExpectedArrivalTime) {
      const diff =
        new Date(call.ExpectedArrivalTime).getTime() -
        new Date(call.AimedArrivalTime).getTime();
      if (diff > maxDelay) maxDelay = diff;
    }
    if (call.AimedDepartureTime && call.ExpectedDepartureTime) {
      const diff =
        new Date(call.ExpectedDepartureTime).getTime() -
        new Date(call.AimedDepartureTime).getTime();
      if (diff > maxDelay) maxDelay = diff;
    }
  }

  if (maxDelay >= 60000) {
    const totalMinutes = Math.floor(maxDelay / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, "0")}min`;
    }
    return `${minutes}min`;
  }

  return undefined;
}

export function interpolate(data: SIRIData, now: Date): InterpolatedJourney[] {
  const activeJourneys = filterActiveTrains(data, now);
  console.log(`interpolate -> activeJourneys count ${activeJourneys.length}`);

  const results: InterpolatedJourney[] = [];

  function getLatLon(g: Gare): { lat: number; lon: number } | null {
    if ("lat" in g) {
      return { lat: g.lat, lon: g.lon };
    }
    if ("geometry" in g && g.geometry.coordinates) {
      return { lat: g.geometry.coordinates[1], lon: g.geometry.coordinates[0] };
    }
    if ("properties" in g && g.properties.geo_point_2d) {
      return {
        lat: g.properties.geo_point_2d.lat,
        lon: g.properties.geo_point_2d.lon,
      };
    }
    return null;
  }

  for (const journey of activeJourneys) {
    const rawCalls = gatherCalls(journey);
    if (rawCalls.length < 1) continue;

    const calls = sortCallsByTime(rawCalls).map((c) => ({
      stopId: c.call.StopPointRef as string,
      time: c.time,
    }));

    if (calls.length < 1) continue;

    let pushed = false;
    
    for (let i = 0; i < calls.length - 1; i++) {
      const A = calls[i];
      const B = calls[i + 1];
      const tA = A.time;
      const tB = B.time;

      if (tA.getTime() <= now.getTime() && now.getTime() < tB.getTime()) {
        const denom = tB.getTime() - tA.getTime();
        const ratio = denom > 0 ? (now.getTime() - tA.getTime()) / denom : 0;

        const lastStop = makeGareFromStopId(A.stopId);
        const nextStop = makeGareFromStopId(B.stopId);

        let position: { lat: number; lon: number } | undefined;
        let bearing: number | undefined;

        if (lastStop && nextStop) {
          const lastCoords = getLatLon(lastStop);
          const nextCoords = getLatLon(nextStop);

          if (lastCoords && nextCoords) {
            const lat =
              lastCoords.lat + (nextCoords.lat - lastCoords.lat) * ratio;
            const lon =
              lastCoords.lon + (nextCoords.lon - lastCoords.lon) * ratio;

            const snapped = getSnappedPosition(lat, lon);
            if (snapped) {
              position = { lat: snapped.lat, lon: snapped.lon };
              bearing = snapped.bearing;
            } else {
              position = { lat, lon };
              const dy = nextCoords.lat - lastCoords.lat;
              const dx = nextCoords.lon - lastCoords.lon;
              bearing = (Math.atan2(dy, dx) * 180) / Math.PI;
            }

            results.push({
              journey,
              status: journey.status as TrainState,
              lastStopId: A.stopId,
              nextStopId: B.stopId,
              lastStop: lastStop ?? undefined,
              nextStop: nextStop ?? undefined,
              lastStopCoords: lastCoords,
              nextStopCoords: nextCoords,
              tA,
              tB,
              ratio,
              position,
              bearing,
              delay: calculateDelay(journey),
            });
            pushed = true;
          }
        }

        break;
      }
    }

    
    
    
    const UPCOMING_THRESHOLD = 5 * 60; 
    if (
      !pushed &&
      (journey.status === "active" ||
        (journey.status === "upcoming" &&
          journey.departIn != null &&
          journey.departIn <= UPCOMING_THRESHOLD))
    ) {
      
      let A = calls[0];
      if (now.getTime() >= calls[calls.length - 1].time.getTime()) {
        A = calls[calls.length - 1];
      }
      const lastStop = makeGareFromStopId(A.stopId);
      if (lastStop) {
        const coords = getLatLon(lastStop);
        if (coords) {
          results.push({
            journey,
            status: journey.status as TrainState,
            lastStopId: A.stopId,
            nextStopId: A.stopId,
            lastStop: lastStop,
            nextStop: lastStop,
            lastStopCoords: coords,
            nextStopCoords: coords,
            tA: A.time,
            tB: A.time,
            ratio: 0,
            position: coords,
            bearing: undefined,
            delay: calculateDelay(journey),
          });
        }
      }
    }
  }
  return results;
}

export function processSiriData(rawData: SIRISNCFData): SIRIVehicleJourney[] {
  
  const frames =
    rawData?.Siri?.ServiceDelivery?.EstimatedTimetableDelivery
      ?.EstimatedJourneyVersionFrame;

  if (!frames) {
    console.warn(
      "processSiriData: no frames in rawData",
      JSON.stringify(rawData?.Siri || "<no siri>")
    );
    return [];
  }

  const data: SIRIVehicleJourney[] = (() => {
    const frameArray = Array.isArray(frames) ? frames : [frames];
    return frameArray.flatMap((f) => f.EstimatedVehicleJourney ?? []);
  })();

  console.log(`Total journeys fetched: ${data.length}`);
  return filterActiveTrains(data, new Date());
}
