import fetchAllProviders from "@/services/SIRIFetcher";
import { setSiriData } from "@/lib/store";
import { processSiriData, interpolate } from "@/services/interpolator";
import { mkdir, writeFile } from "fs/promises";

const CACHE_DIR = ".cache";
const CACHE_PATH = `${CACHE_DIR}/network_status.json`;

import { ValueCache } from "@sodiumlabs/cache";

const INTERVAL_CACHE_KEY = Symbol.for("siriIntervalCache");
const siriIntervalCache: ValueCache<boolean> =
  (globalThis as any)[INTERVAL_CACHE_KEY] ||
  ((globalThis as any)[INTERVAL_CACHE_KEY] = new ValueCache<boolean>({
    ttl: 24 * 60 * 60 * 1000,
  }));

let intervalId: NodeJS.Timeout | null = null;

export function startSiriFetcher() {
  if (siriIntervalCache.get()) return;
  siriIntervalCache.set(true);

  const fetchAndStore = async () => {
    try {
      const rawData = await fetchAllProviders();

      const activeTrains = processSiriData(rawData);

      setSiriData({
        lastUpdated: new Date(),
        length: activeTrains.length,
        data: activeTrains,
      });
      try {
        await mkdir(CACHE_DIR, { recursive: true });
        const interpolated = interpolate(activeTrains as any, new Date(), true);
        const total = interpolated.length;
        const parseDelayToMinutes = (delay?: string | null) => {
          if (!delay) return 0;
          const hMatch = delay.match(/(\d+)h/);
          const mMatch = delay.match(/(\d+)min/);
          const hours = hMatch ? parseInt(hMatch[1], 10) : 0;
          const minutes = mMatch ? parseInt(mMatch[1], 10) : 0;
          return hours * 60 + minutes;
        };

        const delays = interpolated.map((t) =>
          parseDelayToMinutes((t as any).delay ?? null),
        );
        const incidents = delays.filter((m) => m >= 15).length;
        const orangeDelays = delays.filter((m) => m > 5 && m < 15).length;
        const onTimeOrMinor = delays.filter((m) => m <= 5).length;
        const punctuality =
          total === 0 ? 100 : Math.round((onTimeOrMinor / total) * 100);

        const stats = {
          total,
          punctuality,
          incidents,
          delays: orangeDelays,
          inTransit: total,
          lastUpdated: new Date().toISOString(),
        };

        const trainsWithDelay = interpolated
          .map((t) => ({
            trainNumber:
              (t.journey as any).TrainNumbers?.TrainNumberRef ||
              (t.journey as any).PublishedLineName ||
              (t.journey as any).VehicleJourneyRef ||
              null,
            origin: (t.journey as any).OriginName || null,
            destination: (t.journey as any).DestinationName || null,
            aimedTime: t.tB ? new Date(t.tB).toISOString() : null,
            delay: (t as any).delay ?? null,
            realDelay: (t as any).delay ?? null,
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
                  const val =
                    c?.Cancellation ?? c?.Cancelled ?? c?.CallCancellation;
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

        const payload = { stats, delayedTrains: trainsWithDelay };
        await writeFile(CACHE_PATH, JSON.stringify(payload));
      } catch (e) {}
    } catch (error) {}
  };

  fetchAndStore();

  intervalId = setInterval(fetchAndStore, 30000);
}
