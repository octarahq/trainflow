import { interpolate } from "@/services/interpolator";
import { NextResponse } from "next/server";

export async function GET() {
  const goApiUrl = process.env.NODE_ENV === "development"
    ? "http://localhost:4062/live/vehicles"
    : "http://fr1.orionhost.xyz:4062/live/vehicles";

  try {
    const res = await fetch(goApiUrl);
    const goData = await res.json();
    
    if (!goData || !goData.vehicles) {
      return NextResponse.json({ count: 0, vehicles: [] });
    }

    const journeys = goData.vehicles.map((v: any) => v.journey);
    console.log("Total journeys fetched:", journeys.length);
    const interpolated = interpolate(journeys, new Date());
    console.log("Interpolated count:", interpolated.length);
    
    return NextResponse.json({ count: interpolated.length, vehicles: interpolated });
  } catch (err) {
    console.error("Error fetching live vehicles:", err);
    return NextResponse.json({ count: 0, vehicles: [] });
  }
}
