import fs from "fs/promises";
import path from "path";

let cachedGares: Array<any> | null = null;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);

  try {
    if (!cachedGares) {
      const file = path.join(process.cwd(), "data", "network", "gares.json");
      const raw = await fs.readFile(file, "utf8");
      cachedGares = JSON.parse(raw) as Array<any>;
    }
    const gares = cachedGares;

    if (!q) {
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const ql = q.toLowerCase();
    const results = gares
      .filter((g) => g.name && String(g.name).toLowerCase().includes(ql))
      .slice(0, limit)
      .map((g) => {
        const uic = g.uic || g.id;
        const siriId = `STIF:StopPoint:${uic}`;

        return {
          id: siriId,
          uic: uic,
          name: g.name,
          lat: g.lat,
          lon: g.lon,
        };
      });

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
}
