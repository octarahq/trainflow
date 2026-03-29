import { getSiriData } from "@/lib/store";
import { interpolate } from "@/services/interpolator";
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";

const CACHE_PATH = ".cache/network_status.json";

function parseDelayToMinutes(delay?: string | null): number {
  if (!delay) return 0;
  const hMatch = delay.match(/(\d+)h/);
  const mMatch = delay.match(/(\d+)min/);
  const hours = hMatch ? parseInt(hMatch[1], 10) : 0;
  const minutes = mMatch ? parseInt(mMatch[1], 10) : 0;
  return hours * 60 + minutes;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statsOnly = searchParams.has("stats");

  try {
    const raw = await readFile(CACHE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.stats || parsed.delayedTrains)) {
      if (parsed.stats && parsed.stats.delays === undefined) {
        try {
          const storeData = getSiriData();
          if (storeData && storeData.data) {
            const interpolated = interpolate(storeData.data, new Date());
            const parsedDelays = interpolated.map((t) =>
              parseDelayToMinutes((t as any).delay ?? null),
            );
            const orangeDelays = parsedDelays.filter(
              (m) => m > 0 && m < 15,
            ).length;
            parsed.stats.delays = orangeDelays;
          } else {
            parsed.stats.delays = 0;
          }
        } catch (e) {
          parsed.stats.delays = 0;
        }
      }
      return NextResponse.json(statsOnly ? { stats: parsed.stats } : parsed);
    }
  } catch (e) {}
  const storeData = getSiriData();

  if (!storeData || !storeData.data) {
    const emptyStats = {
      total: 0,
      punctuality: 100,
      incidents: 0,
      inTransit: 0,
      lastUpdated: null,
    };
    return NextResponse.json(
      statsOnly ? { stats: emptyStats } : { stats: emptyStats },
    );
  }

  const interpolated = interpolate(storeData.data, new Date());

  const total = interpolated.length;
  const delays = interpolated.map((t) =>
    parseDelayToMinutes((t as any).delay ?? null),
  );
  const redIncidents = delays.filter((m) => m >= 15).length;
  const orangeDelays = delays.filter((m) => m > 0 && m < 15).length;
  const onTimeOrMinor = delays.filter((m) => m <= 5).length;
  const punctuality =
    total === 0 ? 100 : Math.round((onTimeOrMinor / total) * 100);

  const stats = {
    total,
    punctuality,
    incidents: redIncidents,
    delays: orangeDelays,
    inTransit: total,
    lastUpdated: storeData.lastUpdated
      ? new Date(storeData.lastUpdated).toISOString()
      : null,
  };

  if (statsOnly) {
    return NextResponse.json({ stats });
  }

  const trainsWithDelay = interpolated
    .map((t) => ({
      number:
        (t.journey as any).TrainNumbers?.TrainNumberRef ||
        (t.journey as any).PublishedLineName ||
        (t.journey as any).VehicleJourneyRef ||
        null,
      type: (t.journey as any).VehicleMode || "Train",
      origin: (t.journey as any).OriginName || null,
      destination: (t.journey as any).DestinationName || null,
      aimedTime: t.tB ? new Date(t.tB).toISOString() : null,
      delay: (t as any).delay ?? null,
      delayMinutes: parseDelayToMinutes((t as any).delay ?? null),
      status: t.status ?? null,
      statusLabel: (() => {
        try {
          const j: any = (t as any).journey || {};
          const recorded = j?.RecordedCalls?.RecordedCall;
          const estimated = j?.EstimatedCalls?.EstimatedCall;
          const calls = [
            ...(Array.isArray(recorded)
              ? recorded
              : recorded
                ? [recorded]
                : []),
            ...(Array.isArray(estimated)
              ? estimated
              : estimated
                ? [estimated]
                : []),
          ];
          if (!calls || calls.length === 0) return null;
          const tail = calls.slice(-2);
          for (const c of tail) {
            if (!c) continue;
            const val = c?.Cancellation ?? c?.Cancelled ?? c?.CallCancellation;
            if (val === true || String(val) === "true") {
              return "Terminus déplacé";
            }
          }
        } catch (e) {}
        return null;
      })(),
    }))
    .filter((x) => x.delayMinutes > 0)
    .sort((a, b) => b.delayMinutes - a.delayMinutes)
    .slice(0, 10);

  return NextResponse.json({ stats, delayedTrains: trainsWithDelay });
}
