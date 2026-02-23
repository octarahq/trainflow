import { NextResponse } from "next/server";
import { getSiriData } from "@/lib/store";
import { interpolate } from "@/services/interpolator";
import { searchTrainsAndStations } from "@/lib/search";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";

  const storeData = getSiriData();
  if (!storeData || !storeData.data) {
    return NextResponse.json({ error: "no data" }, { status: 500 });
  }

  const trains = interpolate(storeData.data, new Date());
  const results = searchTrainsAndStations(q, trains);
  return NextResponse.json(results);
}
