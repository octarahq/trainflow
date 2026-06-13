export function snap(px: f64, py: f64, numCoords: i32): void {
  let minDistance: f64 = Infinity;
  let bestX: f64 = px;
  let bestY: f64 = py;
  let bestAngle: f64 = 0;

  for (let i = 0; i < numCoords - 2; i += 2) {
    let x1 = load<f64>(i * 8);
    let y1 = load<f64>((i + 1) * 8);
    let x2 = load<f64>((i + 2) * 8);
    let y2 = load<f64>((i + 3) * 8);

    if (x1 > 9000.0 || x2 > 9000.0) continue;

    let dx = x2 - x1;
    let dy = y2 - y1;
    let len2 = dx * dx + dy * dy;

    let sx: f64 = x1;
    let sy: f64 = y1;

    if (len2 > 0) {
      let t = Math.max(
        0.0,
        Math.min(1.0, ((px - x1) * dx + (py - y1) * dy) / len2),
      );
      sx = x1 + t * dx;
      sy = y1 + t * dy;
    }

    let d2 = (px - sx) * (px - sx) + (py - sy) * (py - sy);

    if (d2 < minDistance) {
      minDistance = d2;
      bestX = sx;
      bestY = sy;
      bestAngle = (Math.atan2(-dy, dx) * 180.0) / Math.PI;
    }
  }

  store<f64>(1600000, bestX);
  store<f64>(1600008, bestY);
  store<f64>(1600016, bestAngle);
}
