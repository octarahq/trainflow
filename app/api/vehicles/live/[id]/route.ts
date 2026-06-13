import { interpolate } from "@/services/interpolator";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const goApiUrl = process.env.NODE_ENV === "development"
    ? `http://localhost:4062/live/vehicle/${encodeURIComponent(id)}`
    : `http://fr1.orionhost.xyz:4062/live/vehicle/${encodeURIComponent(id)}`;

  try {
    const res = await fetch(goApiUrl);
    if (!res.ok) {
      return NextResponse.json({ vehicle: null }, { status: res.status });
    }
    const goData = await res.json();
    
    if (!goData || !goData.vehicle) {
      return NextResponse.json({ vehicle: null });
    }

    const journey = goData.vehicle.journey;
    const interpolated = interpolate([journey], new Date());
    
    if (interpolated.length === 0) {
      return NextResponse.json({ vehicle: null });
    }

    return NextResponse.json({ vehicle: interpolated[0] });
  } catch (err) {
    console.error(`Error fetching live vehicle ${id}:`, err);
    return NextResponse.json({ vehicle: null }, { status: 500 });
  }
}
