import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const rateLimit = new Map();

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api")) {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";

    const isMapData = pathname.startsWith("/api/data/");
    const limit = isMapData ? 1500 : 300;
    const windowMs = 60 * 1000;

    if (!rateLimit.has(ip)) {
      rateLimit.set(ip, {
        count: 0,
        lastReset: Date.now(),
      });
    }

    const ipData = rateLimit.get(ip);

    if (Date.now() - ipData.lastReset > windowMs) {
      ipData.count = 0;
      ipData.lastReset = Date.now();
    }

    if (ipData.count >= limit) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }

    ipData.count += 1;
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
