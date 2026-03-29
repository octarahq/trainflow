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
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-500 text-xs font-semibold uppercase tracking-wider bg-primary/5">
              <th className="px-6 py-4">{t("trainNumber")}</th>
              <th className="px-6 py-4">{t("route")}</th>
              <th className="px-6 py-4">{t("delay")}</th>
              <th className="px-6 py-4">{t("status")}</th>
              <th className="px-6 py-4">{t("actions")}</th>
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
                <td className="px-6 py-4 text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-[120px] md:max-w-none">
                      {train.origin || "-"}
                    </span>
                    <span className="text-slate-500 text-xs">→</span>
                    <span className="truncate max-w-[120px] md:max-w-none">
                      {train.destination || "-"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
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
                <td className="px-6 py-4">
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
                <td className="px-6 py-4">
                  <Link
                    href={`/map?trainNumber=${train.number || train.trainNumber}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
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
    </div>
  );
}
