import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Map } from "lucide-react";

export default function DelayedTrainsTable({ trains }: any) {
  const t = useTranslations("network.table");

  if (!trains || trains.length === 0) {
    return (
      <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 shadow-sm overflow-hidden text-center">
        <p className="text-slate-500">{t("noDelayed")}</p>
      </div>
    );
  }

  return (
    <div className="bg-primary/5 rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-primary/10 flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">{t("title")}</h3>
        <span className="text-xs font-medium text-slate-400 bg-primary/10 px-3 py-1 rounded-full">
          {trains.length} {t("trains")}
        </span>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-500 text-xs font-semibold uppercase tracking-wider bg-primary/5">
              <th className="px-6 py-4">{t("trainNumber")}</th>
              <th className="px-6 py-4 border-l border-primary/5">
                {t("route")}
              </th>
              <th className="px-6 py-4 border-l border-primary/5">
                {t("delay")}
              </th>
              <th className="px-6 py-4 border-l border-primary/5">
                {t("status")}
              </th>
              <th className="px-6 py-4 border-l border-primary/5 text-right">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/10">
            {trains.map((train: any, idx: number) => (
              <tr
                key={idx}
                className="hover:bg-primary/5 transition-colors group"
              >
                <td className="px-6 py-4 font-bold text-white">
                  {train.number || train.trainNumber || "-"}
                </td>
                <td className="px-6 py-4 text-slate-300 border-l border-primary/5">
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-[200px]">
                      {train.origin || "-"}
                    </span>
                    <span className="text-slate-500 text-xs shrink-0">→</span>
                    <span className="truncate max-w-[200px]">
                      {train.destination || "-"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 border-l border-primary/5">
                  <span
                    className={`font-semibold ${
                      (train.delayMinutes || 0) >= 15
                        ? "text-red-400"
                        : "text-orange-400"
                    }`}
                  >
                    +{train.delay || "-"}
                  </span>
                </td>
                <td className="px-6 py-4 border-l border-primary/5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-2 rounded-full ${
                        (train.delayMinutes || 0) >= 15
                          ? "bg-red-500"
                          : "bg-orange-500 animate-pulse"
                      }`}
                    ></span>
                    <span
                      className={`text-sm ${
                        (train.delayMinutes || 0) >= 15
                          ? "text-red-400 font-medium"
                          : "text-orange-400"
                      }`}
                    >
                      {train.statusLabel ||
                        ((train.delayMinutes || 0) >= 15
                          ? t("grave")
                          : t("leger"))}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 border-l border-primary/5 text-right">
                  <Link
                    href={`/map?trainNumber=${train.number || train.trainNumber}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                    title={t("viewOnMap")}
                  >
                    <Map size={18} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex flex-col divide-y divide-primary/10">
        {trains.map((train: any, idx: number) => (
          <div
            key={idx}
            className="p-5 hover:bg-primary/5 transition-colors active:bg-primary/10"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">
                  Train n°
                </span>
                <span className="text-xl font-bold text-white">
                  {train.number || train.trainNumber || "-"}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span
                  className={`text-lg font-bold ${
                    (train.delayMinutes || 0) >= 15
                      ? "text-red-400"
                      : "text-orange-400"
                  }`}
                >
                  +{train.delay || "-"}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`size-1.5 rounded-full ${
                      (train.delayMinutes || 0) >= 15
                        ? "bg-red-500"
                        : "bg-orange-500 animate-pulse"
                    }`}
                  ></span>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-tight ${
                      (train.delayMinutes || 0) >= 15
                        ? "text-red-400"
                        : "text-orange-400"
                    }`}
                  >
                    {train.statusLabel ||
                      ((train.delayMinutes || 0) >= 15
                        ? t("grave")
                        : t("leger"))}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 mb-4">
              <div className="flex-1 text-sm font-medium text-slate-300 truncate">
                {train.origin || "-"}
              </div>
              <div className="text-slate-600">→</div>
              <div className="flex-1 text-sm font-medium text-slate-300 text-right truncate">
                {train.destination || "-"}
              </div>
            </div>

            <Link
              href={`/map?trainNumber=${train.number || train.trainNumber}`}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
            >
              <Map size={18} />
              <span>Voir sur la carte</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
