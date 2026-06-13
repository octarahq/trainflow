import { interpolate } from "./services/interpolator";
async function run() {
  const goApiUrl = "http://fr1.orionhost.xyz:4062/live/vehicles";
  const res = await fetch(goApiUrl);
  const goData = await res.json();
  const journeys = goData.vehicles.map((v: any) => v.journey);
  console.log("Total journeys fetched:", journeys.length);
  const interpolated = interpolate(journeys, new Date());
  console.log("Interpolated count:", interpolated.length);
}
run();
