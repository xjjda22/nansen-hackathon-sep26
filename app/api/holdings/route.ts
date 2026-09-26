import { HOLDINGS_BODY, HOLDINGS_COST, HOLDINGS_PATH } from "@/lib/constants";
import { creditView, holdingsCacheKey, nansenMessage, nansenPost } from "@/lib/nansen";
import { holdingComparisons, holdingMeasures, holdingTraits, holdExample, holdMarks, parseHoldings, publicPayload } from "@/lib/rules";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** One Smart Money holdings call. Holder count is the cut. */
export async function POST() {
  try {
    const held = await nansenPost(HOLDINGS_PATH, HOLDINGS_BODY, HOLDINGS_COST, holdingsCacheKey());
    if (!held.ok) {
      return NextResponse.json(
        { ok: false, error: nansenMessage(held.body, held.status), credits: held.credits },
        { status: held.status },
      );
    }
    const parsed = parseHoldings(held.body);
    const read = holdingComparisons(parsed.rows, parsed.isLastPage);
    const traits = holdingTraits(parsed.rows, parsed.isLastPage);
    return NextResponse.json({
      ok: true,
      frame: read.frame,
      common: read.common,
      meaningful: read.meaningful,
      unscored: read.unscored,
      traits,
      table: holdExample(parsed.rows),
      measures: holdingMeasures(parsed.rows),
      marks: holdMarks(parsed.rows),
      credits: held.credits,
      raw: publicPayload(held.body),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The holdings page could not be read.";
    return NextResponse.json({ ok: false, error: message, credits: creditView() }, { status: 502 });
  }
}
