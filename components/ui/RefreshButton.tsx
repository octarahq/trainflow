"use client";

import { useRouter } from "next/navigation";
import { RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";

export default function RefreshButton({
  label = "Rafraichir",
}: {
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pressed, setPressed] = useState(false);

  const handleClick = () => {
    setLoading(true);
    try {
      router.refresh();
    } finally {
      const t = setTimeout(() => setLoading(false), 5000);
      return () => clearTimeout(t);
    }
  };

  useEffect(() => {
    return () => {
      setLoading(false);
    };
  }, []);

  return (
    <button
      onClick={handleClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      aria-busy={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-transform duration-150 ${
        pressed ? "scale-95" : "scale-100"
      } bg-white dark:bg-primary/10 border-slate-200 dark:border-primary/20 hover:cursor-pointer hover:bg-primary/20`}
    >
      <RefreshCcw
        className={`w-5 h-5 text-slate-700 dark:text-slate-300 ${loading ? "animate-spin" : ""}`}
      />
      {label}
    </button>
  );
}
