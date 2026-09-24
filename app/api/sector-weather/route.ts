import { NETFLOW_BODY, NETFLOW_COST, NETFLOW_PATH } from "@/lib/constants";
import { creditView, nansenMessage, nansenPost, netflowCacheKey } from "@/lib/nansen";
import { parseNetflow, publicPayload, sectorWeather } from "@/lib/rules";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const flow = await nansenPost(NETFLOW_PATH, NETFLOW_BODY, NETFLOW_COST, netflowCacheKey());
    if (!flow.ok) {
      return NextResponse.json(
        { ok: false, error: nansenMessage(flow.body, flow.status), credits: flow.credits },
        { status: flow.status },
      );
    }
    const parsed = parseNetflow(flow.body);
    const weather = sectorWeather(parsed.rows, parsed.isLastPage);
    return NextResponse.json({
      ok: true,
      ...weather,
      stablesExcluded: true,
      nativesExcluded: true,
      credits: flow.credits,
      raw: publicPayload(flow.body),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sector weather could not be read.";
    return NextResponse.json({ ok: false, error: message, credits: creditView() }, { status: 502 });
  }
}
