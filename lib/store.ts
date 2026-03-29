import type { SIRIVehicleJourney } from "@/types/siri/providers";
import { ValueCache } from "@sodiumlabs/cache";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";

export interface SiriStoreData {
  lastUpdated: Date;
  length: number;
  data: SIRIVehicleJourney[];
}

const CACHE_KEY = Symbol.for("siriDataCache");
const siriDataCache: ValueCache<SiriStoreData> =
  (globalThis as any)[CACHE_KEY] ||
  ((globalThis as any)[CACHE_KEY] = new ValueCache<SiriStoreData>({
    ttl: 60 * 60 * 1000,
  }));

export function setSiriData(data: SiriStoreData) {
  siriDataCache.set(data);
  try {
    if (!existsSync(".cache")) mkdirSync(".cache", { recursive: true });
    writeFileSync(".cache/siri_data.json", JSON.stringify(data));
  } catch (e) {}
}

export function getSiriData(): SiriStoreData | null {
  const cached = siriDataCache.get();
  if (cached) return cached;

  try {
    if (existsSync(".cache/siri_data.json")) {
      const fileData = readFileSync(".cache/siri_data.json", "utf-8");
      const parsed = JSON.parse(fileData);
      parsed.lastUpdated = new Date(parsed.lastUpdated);
      siriDataCache.set(parsed);
      return parsed as SiriStoreData;
    }
  } catch (e) {}

  return null;
}
