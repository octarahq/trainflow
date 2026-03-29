"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function LastUpdated({ iso }: { iso?: string | null }) {
  const t = useTranslations("common.lastUpdated");

  const computeLabel = (isoDate?: string | null): string => {
    if (!isoDate) return t("unknown");
    const then = new Date(isoDate).getTime();
    const diff = Date.now() - then;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return t("now");
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t("minutes", { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("hours", { count: hours });
    const days = Math.floor(hours / 24);
    return t("days", { count: days });
  };

  const [label, setLabel] = useState(() => computeLabel(iso));

  useEffect(() => {
    setLabel(computeLabel(iso));
    if (!iso) return;
    const id = setInterval(() => setLabel(computeLabel(iso)), 15_000);
    return () => clearInterval(id);
  }, [iso, t]);

  return <span className="text-slate-500 dark:text-slate-400">{label}</span>;
}
