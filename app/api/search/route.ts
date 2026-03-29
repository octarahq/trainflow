import { NextResponse } from "next/server";
import { getSiriData } from "@/lib/store";
import { interpolate } from "@/services/interpolator";
import { getGareByUIC } from "@/lib/stops";
import { extractUIC } from "@/lib/utils/extractIds";
import type { InterpolatedJourney } from "@/types/trains";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fromId = url.searchParams.get("from");
  const toId = url.searchParams.get("to");
  const dateStr = url.searchParams.get("date");

  if (!fromId && !toId) {
    return NextResponse.json(
      { error: "Missing from or to parameters" },
      { status: 400 },
    );
  }

  const storeData = getSiriData();
  if (!storeData || !storeData.data) {
    return NextResponse.json({ error: "no data", storeData }, { status: 500 });
  }

  const date = dateStr ? new Date(dateStr) : new Date();

  const matchesStop = (stopId: string | null, callId: string | undefined) => {
    if (!stopId || !callId) return false;

    if (stopId === callId) return true;

    const stopUIC = extractUIC(stopId);
    const callUIC = extractUIC(callId);

    return (
      (stopUIC != null && callId === stopUIC) ||
      (callUIC != null && stopId === callUIC) ||
      (stopUIC != null && callUIC != null && stopUIC === callUIC)
    );
  };

  const getMatchingCall = (stopId: string | null, calls: any[]) =>
    calls.find((call) => matchesStop(stopId, call.StopPointRef));

  const trains = Array.isArray(storeData.data)
    ? storeData.data.map((journey: any) => ({
        journey,
        status: "active" as const,
      }))
    : [];

  const filteredTrains = trains.filter((train) => {
    const recorded = train.journey.RecordedCalls?.RecordedCall;
    const estimated = train.journey.EstimatedCalls?.EstimatedCall;
    const calls = [
      ...(Array.isArray(recorded) ? recorded : recorded ? [recorded] : []),
      ...(Array.isArray(estimated) ? estimated : estimated ? [estimated] : []),
    ];

    if (fromId && toId) {
      const hasFrom = calls.some((call) =>
        matchesStop(fromId, call.StopPointRef),
      );
      const hasTo = calls.some((call) => matchesStop(toId, call.StopPointRef));

      if (!hasFrom || !hasTo) return false;

      const fromIndex = calls.findIndex((call) =>
        matchesStop(fromId, call.StopPointRef),
      );
      const toIndex = calls.findIndex((call) =>
        matchesStop(toId, call.StopPointRef),
      );
      return fromIndex >= 0 && toIndex >= 0 && fromIndex < toIndex;
    } else if (fromId) {
      return calls.some((call) => matchesStop(fromId, call.StopPointRef));
    } else {
      return calls.some((call) => matchesStop(toId, call.StopPointRef));
    }
  });

  filteredTrains.sort((a, b) => {
    const getTime = (train: any) => {
      const recorded = train.journey.RecordedCalls?.RecordedCall;
      const estimated = train.journey.EstimatedCalls?.EstimatedCall;
      const calls = [
        ...(Array.isArray(recorded) ? recorded : recorded ? [recorded] : []),
        ...(Array.isArray(estimated)
          ? estimated
          : estimated
            ? [estimated]
            : []),
      ];

      const getCallByStop = (stopId: string | null) => {
        if (!stopId) return null;
        return getMatchingCall(stopId, calls);
      };

      if (fromId) {
        const fromCall = getCallByStop(fromId);
        if (!fromCall) return new Date(0);
        return new Date(
          fromCall.ExpectedDepartureTime || fromCall.AimedDepartureTime || 0,
        );
      } else {
        const toCall = getCallByStop(toId);
        if (!toCall) return new Date(0);
        return new Date(
          toCall.ExpectedArrivalTime || toCall.AimedArrivalTime || 0,
        );
      }
    };
    return getTime(a).getTime() - getTime(b).getTime();
  });

  const fromUIC = extractUIC(fromId);
  const toUIC = extractUIC(toId);

  const fromStation = fromUIC ? getGareByUIC(fromUIC) : undefined;
  const toStation = toUIC ? getGareByUIC(toUIC) : undefined;

  return NextResponse.json({
    trains: filteredTrains,
    from: fromStation || null,
    to: toStation || null,
  });
}
