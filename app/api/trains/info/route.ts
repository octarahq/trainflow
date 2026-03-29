import { getSiriData } from "@/lib/store";
import { interpolate } from "@/services/interpolator";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const trainNumber =
      url.searchParams.get("trainNumber") ||
      url.searchParams.get("trainnumber");

    if (!trainNumber) {
      return NextResponse.json(
        { error: "missing trainNumber" },
        { status: 400 },
      );
    }

    const storeData = getSiriData();
    if (!storeData || !storeData.data) {
      return NextResponse.json({ error: "no data" }, { status: 500 });
    }

    const interpolated = interpolate(storeData.data, new Date());

    const normalized = (s?: any) => (s == null ? "" : String(s));

    const matches = interpolated.filter((t) => {
      const j: any = t.journey;
      const candidates = [
        normalized(j?.TrainNumbers?.TrainNumberRef),
        normalized(j?.VehicleJourneyRef),
        normalized(j?.PublishedLineName),
      ];
      const decoded = decodeURIComponent(trainNumber);
      return candidates.some(
        (c) =>
          c === trainNumber ||
          c === decoded ||
          c.toLowerCase() === trainNumber.toLowerCase(),
      );
    });

    if (matches.length === 0) {
      return NextResponse.json(
        { error: "not found", trainNumber },
        { status: 404 },
      );
    }

    const results = matches.map((m) => {
      const j: any = m.journey || {};
      return {
        trainNumber:
          j?.TrainNumbers?.TrainNumberRef ||
          j?.PublishedLineName ||
          j?.VehicleJourneyRef ||
          null,
        origin: j?.OriginName || null,
        destination: j?.DestinationName || null,
        aimedTime: m.tB ? new Date(m.tB).toISOString() : null,
        delay: m.delay ?? null,
        realDelay: m.delay ?? null,
        status: m.status ?? null,
        raw: m,
      };
    });

    return NextResponse.json({ trainNumber, results });
  } catch (e) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
}
