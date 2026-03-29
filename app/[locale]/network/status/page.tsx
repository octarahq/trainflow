import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import NetworkStatsCards from "./_components/NetworkStatsCards";
import DelayedTrainsTable from "./_components/DelayedTrainsTable";
import RefreshButton from "@/components/ui/RefreshButton";
import LastUpdated from "@/components/layout/LastUpdated";
import { getSiriData } from "@/lib/store";
import { interpolate } from "@/services/interpolator";
import { getTranslations } from "next-intl/server";

export default async function NetworkStatusPage() {
  const t = await getTranslations("network");
  const storeData = getSiriData();

  let stats = {
    total: 0,
    punctuality: 100,
    incidents: 0,
    delays: 0,
    inTransit: 0,
    lastUpdated: null as string | null,
  };

  let delayedTrains: any[] = [];
  try {
    const resp = await fetch("/api/network/status");
    const json = await resp.json();
    stats = json?.stats ?? stats;
    delayedTrains = json?.delayedTrains ?? [];
  } catch (e) {
    if (storeData && storeData.data) {
      const interpolated = interpolate(storeData.data, new Date(), true);
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
      const redIncidents = delays.filter((m) => m >= 15).length;
      const orangeDelays = delays.filter((m) => m > 0 && m < 15).length;
      const onTimeOrMinor = delays.filter((m) => m <= 5).length;
      const punctuality =
        total === 0 ? 100 : Math.round((onTimeOrMinor / total) * 100);

      stats = {
        total,
        punctuality,
        incidents: redIncidents,
        delays: orangeDelays,
        inTransit: total,
        lastUpdated: storeData.lastUpdated
          ? new Date(storeData.lastUpdated).toISOString()
          : null,
      };
      try {
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

        delayedTrains = trainsWithDelay;
      } catch (err) {}
    }
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white mb-1">
                {t("title")}
              </h2>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <LastUpdated iso={stats.lastUpdated} />
              </div>
            </div>
            <div className="flex gap-3">
              <RefreshButton />
            </div>
          </div>

          <NetworkStatsCards stats={stats} />
        </div>

        <DelayedTrainsTable trains={delayedTrains} />
      </main>

      <Footer />
    </div>
  );
}
