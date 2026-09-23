import { NETFLOW_BODY, NETFLOW_COST, NETFLOW_PATH } from "@/lib/constants";
import { creditView, nansenMessage, nansenPost, netflowCacheKey } from "@/lib/nansen";
import { parseNetflow, sameTickerTwoChains } from "@/lib/rules";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let symbol = "";
  try {
    const payload = (await request.json()) as { symbol?: unknown };
    symbol = typeof payload.symbol === "string" ? payload.symbol : "";
  } catch {
    return NextResponse.json(
      { ok: false, error: "The body was not JSON.", credits: creditView() },
      { status: 400 },
    );
  }

  const preview = sameTickerTwoChains([], true, symbol);
  if (!preview.call) {
    return NextResponse.json(
      { ok: false, error: preview.error, credits: creditView() },
      { status: 400 },
    );
  }

  try {
    const flow = await nansenPost(NETFLOW_PATH, NETFLOW_BODY, NETFLOW_COST, netflowCacheKey());
    if (!flow.ok) {
      return NextResponse.json(
        { ok: false, error: nansenMessage(flow.body, flow.status), credits: flow.credits },
        { status: flow.status },
      );
    }
    const parsed = parseNetflow(flow.body);
    const result = sameTickerTwoChains(parsed.rows, parsed.isLastPage, symbol);
    return NextResponse.json({ ok: true, ...result, credits: flow.credits });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The two-chain check could not be read.";
    return NextResponse.json({ ok: false, error: message, credits: creditView() }, { status: 502 });
  }
}
