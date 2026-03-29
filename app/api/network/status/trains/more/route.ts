import { getSiriData } from "@/lib/store";
import { interpolate } from "@/services/interpolator";
import { NextResponse } from "next/server";

function parseDelayToMinutes(delay?: string | null): number {
  if (!delay) return 0;
  const hMatch = delay.match(/(\d+)h/);
  const mMatch = delay.match(/(\d+)min/);
  const hours = hMatch ? parseInt(hMatch[1], 10) : 0;
  const minutes = mMatch ? parseInt(mMatch[1], 10) : 0;
  return (hours || 0) * 60 + (minutes || 0);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const storeData = getSiriData();
    if (!storeData || !storeData.data) {
      return NextResponse.json({ trains: [], total: 0 });
    }

    const interpolated = interpolate(storeData.data, new Date(), true);

    const trainsWithDelay = interpolated
      .map((t) => ({
        trainNumber:
          (t.journey as any).TrainNumbers?.TrainNumberRef ||
          (t.journey as any).PublishedLineName ||
          (t.journey as any).VehicleJourneyRef ||
          null,
        origin: (t.journey as any).OriginName || null,
        destination: (t.journey as any).DestinationName || null,
        aimedTime: t.tB ? new Date(t.tB).toISOString() : null,
        delay: (t as any).delay ?? null,
        realDelay: (t as any).delay ?? null,
        delayMinutes: parseDelayToMinutes((t as any).delay ?? null),
        status: t.status ?? null,
        statusLabel: (() => {
          try {
            const j: any = (t as any).journey || {};
            const recorded = j?.RecordedCalls?.RecordedCall;
            const estimated = j?.EstimatedCalls?.EstimatedCall;
            const calls = [
              ...(Array.isArray(recorded)
                ? recorded
                : recorded
                  ? [recorded]
                  : []),
              ...(Array.isArray(estimated)
                ? estimated
                : estimated
                  ? [estimated]
                  : []),
            ];
            if (!calls || calls.length === 0) return null;
            const tail = calls.slice(-2);
            for (const c of tail) {
              if (!c) continue;
              const val =
                c?.Cancellation || c?.Cancelled || c?.CallCancellation;
              if (val === true || String(val) === "true") {
                return "Terminus déplacé";
              }
            }
          } catch (e) {}
          return null;
        })(),
      }))
      .filter((x) => x.delayMinutes > 0)
      .sort((a, b) => b.delayMinutes - a.delayMinutes);

    const start = (page - 1) * limit;
    const paginated = trainsWithDelay.slice(start, start + limit);

    return NextResponse.json({
      trains: paginated,
      total: trainsWithDelay.length,
      page,
      limit,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
