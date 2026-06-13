import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import NetworkStatsCards from "./_components/NetworkStatsCards";
import DelayedTrainsTable from "./_components/DelayedTrainsTable";
import RefreshButton from "@/components/ui/RefreshButton";
import LastUpdated from "@/components/layout/LastUpdated";
import { getTranslations } from "next-intl/server";

export default async function NetworkStatusPage() {
  const t = await getTranslations("network");

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
    const isDev = process.env.NODE_ENV === "development";
    const backendUrl = isDev
      ? "http://localhost:4062"
      : "http://fr1.orionhost.xyz:4062";

    const resp = await fetch(`${backendUrl}/network/status`);
    if (resp.ok) {
      const json = await resp.json();
      stats = json?.stats ?? stats;
      delayedTrains = json?.delayedTrains ?? [];
    }
  } catch (e) {
    console.error("Failed to fetch network status", e);
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
