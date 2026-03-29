import { useTranslations } from "next-intl";

export default function NetworkStatsCards({ stats }: any) {
  const t = useTranslations("network.stats");
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 shadow-sm">
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">
          {t("punctuality")}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-white">
            {stats.punctuality || 0}%
          </span>
        </div>
        <div className="mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full"
            style={{ width: `${stats.punctuality || 0}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 shadow-sm">
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">
          {t("incidents")}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-orange-500">
            {stats.incidents || 0}
          </span>
          <span className="text-slate-500 text-lg ml-1">
            / {stats.delays || 0}
          </span>
        </div>
        <div className="mt-4 flex gap-1">
          {(() => {
            const redBars = Math.ceil((stats.incidents || 0) / 50);
            const yellowBars = Math.ceil((stats.delays || 0) / 200);
            const bars = [];
            for (let i = 0; i < redBars && bars.length < 5; i++) {
              bars.push(
                <div
                  key={`red-${i}`}
                  className="h-1.5 flex-1 bg-red-500 rounded-full"
                ></div>,
              );
            }
            for (let i = 0; i < yellowBars && bars.length < 5; i++) {
              bars.push(
                <div
                  key={`yellow-${i}`}
                  className="h-1.5 flex-1 bg-yellow-500 rounded-full"
                ></div>,
              );
            }
            while (bars.length < 5) {
              bars.push(
                <div
                  key={`empty-${bars.length}`}
                  className="h-1.5 flex-1 bg-slate-800 rounded-full"
                ></div>,
              );
            }
            return bars;
          })()}
        </div>
      </div>

      <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 shadow-sm">
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">
          {t("total")}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-white">
            {stats.total || 0}
          </span>
        </div>
        <div className="mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-1000"
            style={{
              width: `${Math.min(100, ((stats.total || 0) / 2000) * 100)}%`,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
