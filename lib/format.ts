import type { SIRIVehicleJourney } from "@/types/siri/providers";

export function humanizeSiriId(id: string | undefined | null): string {
  if (!id) return "";

  const parts = id.split("::").filter(Boolean);
  if (parts.length === 0) return id;
  let candidate = parts[parts.length - 1];

  if (candidate.includes(":")) {
    const sub = candidate.split(":").filter(Boolean);
    if (sub.length > 0) {
      candidate = sub[sub.length - 1];
    }
  }

  return candidate;
}

export function humanizeTrainType(type: string | undefined | null): string {
  if (!type) return "";
  const raw = humanizeSiriId(type);

  const mapping: Record<string, string> = {
    TGV_INOUI: "TGV InOui",
    INTERCITES: "Intercités",
    TER: "TER",
    CORAIL: "Corail",
    TRANSILIEN: "Transilien",
    RER: "RER",
    OUIGO: "OUIGO",
    TGV: "TGV",
    TRAIN: "Train",
  };

  const upper = raw.toUpperCase();
  for (const [key, value] of Object.entries(mapping)) {
    if (upper.includes(key)) return value;
  }

  return raw.replace(/_/g, " ");
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
