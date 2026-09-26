import { DEX_TRADES_BODY, DEX_TRADES_COST, DEX_TRADES_PATH } from "@/lib/constants";
import { creditView, dexTradesCacheKey, nansenMessage, nansenPost } from "@/lib/nansen";
import { parseDexTrades, publicPayload } from "@/lib/rules";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** One Smart Money dex-trades call. The profit cut is joined in the browser. */
export async function POST() {
  try {
    const tape = await nansenPost(DEX_TRADES_PATH, DEX_TRADES_BODY, DEX_TRADES_COST, dexTradesCacheKey());
    if (!tape.ok) {
      return NextResponse.json(
        { ok: false, error: nansenMessage(tape.body, tape.status), credits: tape.credits },
        { status: tape.status },
      );
    }
    const parsed = parseDexTrades(tape.body);
    return NextResponse.json({
      ok: true,
      buys: parsed.buys,
      isLastPage: parsed.isLastPage,
      credits: tape.credits,
      raw: publicPayload(tape.body),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The print page could not be read.";
    return NextResponse.json({ ok: false, error: message, credits: creditView() }, { status: 502 });
  }
}
