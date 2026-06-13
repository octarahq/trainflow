import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface RailSegment {
  id?: string;
  provider: string;
  lineName?: string;
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
  coords: [number, number][];
}

let railSegments: RailSegment[] | null = null;

function loadRails() {
  if (railSegments) return;
  try {
    const filePath = path.join(
      process.cwd(),
      "data",
      "network",
      "railSegments.json"
    );
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      railSegments = JSON.parse(data);
    } else {
      railSegments = [];
    }
  } catch (error) {
    console.error("Error loading rail segments", error);
    railSegments = [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const minLat = parseFloat(searchParams.get("minLat") || "0");
  const maxLat = parseFloat(searchParams.get("maxLat") || "0");
  const minLon = parseFloat(searchParams.get("minLon") || "0");
  const maxLon = parseFloat(searchParams.get("maxLon") || "0");

  if (!minLat || !maxLat || !minLon || !maxLon) {
    return NextResponse.json({ error: "Missing bbox params" }, { status: 400 });
  }

  if (!railSegments) loadRails();

  const filtered = (railSegments || []).filter(
    (seg) =>
      seg.xMax >= minLon &&
      seg.xMin <= maxLon &&
      seg.yMax >= minLat &&
      seg.yMin <= maxLat
  );

  return NextResponse.json(filtered);
}
