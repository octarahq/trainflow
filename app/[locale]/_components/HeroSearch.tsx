"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ArrowRightLeft } from "lucide-react";
import { useTranslations } from "next-intl";

type Station = { id: string; name: string } | null;

export default function HeroSearch() {
  const t = useTranslations("home.hero.search");
  const router = useRouter();
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [fromSelected, setFromSelected] = useState<Station>(null);
  const [toSelected, setToSelected] = useState<Station>(null);
  const [fromSuggestions, setFromSuggestions] = useState<Station[]>([]);
  const [toSuggestions, setToSuggestions] = useState<Station[]>([]);
  const [fromFocused, setFromFocused] = useState(false);
  const [toFocused, setToFocused] = useState(false);

  const fromTimer = useRef<any>(null);
  const toTimer = useRef<any>(null);

  useEffect(() => {
    if (fromInput.length >= 2 && fromFocused && !fromInput.startsWith("/")) {
      clearTimeout(fromTimer.current);
      fromTimer.current = setTimeout(async () => {
        const res = await fetch(
          `/api/gares?q=${encodeURIComponent(fromInput)}&limit=5`,
        );
        const data = await res.json();
        setFromSuggestions(data);
      }, 150);
    } else {
      setFromSuggestions([]);
    }
  }, [fromInput, fromFocused]);

  useEffect(() => {
    if (toInput.length >= 2 && toFocused && !toInput.startsWith("/")) {
      clearTimeout(toTimer.current);
      toTimer.current = setTimeout(async () => {
        const res = await fetch(
          `/api/gares?q=${encodeURIComponent(toInput)}&limit=5`,
        );
        const data = await res.json();
        setToSuggestions(data);
      }, 150);
    } else {
      setToSuggestions([]);
    }
  }, [toInput, toFocused]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (fromSelected) {
      params.set("from", fromSelected.id);
      params.set("fromName", fromSelected.name);
    }
    if (toSelected) {
      params.set("to", toSelected.id);
      params.set("toName", toSelected.name);
    }
    if (params.toString()) {
      router.push(`/search?${params.toString()}`);
    }
  };

  const swapStations = () => {
    const tempInput = fromInput;
    const tempSelected = fromSelected;
    setFromInput(toInput);
    setFromSelected(toSelected);
    setToInput(tempInput);
    setToSelected(tempSelected);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-2 shadow-2xl overflow-visible">
      <div className="flex flex-col md:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
            <MapPin size={20} />
          </div>
          <input
            type="text"
            placeholder={t("from")}
            className="w-full bg-transparent border-none py-6 pl-12 pr-4 text-white placeholder-zinc-500 focus:ring-0 text-lg"
            value={fromInput}
            onChange={(e) => {
              setFromInput(e.target.value);
              setFromSelected(null);
            }}
            onFocus={() => setFromFocused(true)}
            onBlur={() => setTimeout(() => setFromFocused(false), 200)}
          />
          {fromSuggestions.length > 0 && fromFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
              {fromSuggestions.map((s) => (
                <button
                  key={s?.id}
                  className="w-full text-left px-6 py-4 hover:bg-white/5 text-zinc-300 hover:text-white transition-colors border-b border-white/5 last:border-none"
                  onClick={() => {
                    setFromSelected(s);
                    setFromInput(s?.name || "");
                    setFromSuggestions([]);
                  }}
                >
                  {s?.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={swapStations}
          className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white transition-all transform hover:rotate-180"
        >
          <ArrowRightLeft size={20} />
        </button>

        <div className="relative flex-1 w-full">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
            <MapPin size={20} />
          </div>
          <input
            type="text"
            placeholder={t("to")}
            className="w-full bg-transparent border-none py-6 pl-12 pr-4 text-white placeholder-zinc-500 focus:ring-0 text-lg"
            value={toInput}
            onChange={(e) => {
              setToInput(e.target.value);
              setToSelected(null);
            }}
            onFocus={() => setToFocused(true)}
            onBlur={() => setTimeout(() => setToFocused(false), 200)}
          />
          {toSuggestions.length > 0 && toFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
              {toSuggestions.map((s) => (
                <button
                  key={s?.id}
                  className="w-full text-left px-6 py-4 hover:bg-white/5 text-zinc-300 hover:text-white transition-colors border-b border-white/5 last:border-none"
                  onClick={() => {
                    setToSelected(s);
                    setToInput(s?.name || "");
                    setToSuggestions([]);
                  }}
                >
                  {s?.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSearch}
          className="w-full md:w-auto px-8 py-6 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-primary/20"
        >
          <Search size={22} />
          <span>{t("button")}</span>
        </button>
      </div>
    </div>
  );
}
