import type { SIRIVehicleJourney } from "@/types/siri/providers";


export function humanizeSiriId(id: string | undefined | null): string {
  if (!id) return "";

  
  const parts = id.split("::");
  let candidate = parts[parts.length - 1];

  
  if (candidate.includes(":")) {
    const sub = candidate.split(":");
    candidate = sub[sub.length - 1];
  }

  return candidate;
}


export function formatOperatorRef(op?: string): string {
  return op ? humanizeSiriId(op) : "";
}


export function formatJourneyTitle(journey: SIRIVehicleJourney): string {
  const { PublishedLineName, LineRef, FramedVehicleJourneyRef, OperatorRef } =
    journey;

  let title =
    PublishedLineName ||
    humanizeSiriId(FramedVehicleJourneyRef.DatedVehicleJourneyRef);

  
  if (LineRef) {
    const shortLine = humanizeSiriId(LineRef);
    if (shortLine && !title.includes(shortLine)) {
      title = `${title} (${shortLine})`;
    }
  }

  if (OperatorRef) {
    const op = formatOperatorRef(OperatorRef);
    if (op) title += ` [${op}]`;
  }

  return title;
}
