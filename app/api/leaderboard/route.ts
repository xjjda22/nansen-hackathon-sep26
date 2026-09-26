import { LEADERBOARD_BODY, LEADERBOARD_COST, LEADERBOARD_PATH } from "@/lib/constants";
import { creditView, leaderboardCacheKey, nansenMessage, nansenPost } from "@/lib/nansen";
import { parseLeaderboard, profitCutAddresses, publicPayload, tradedKeys, traderComparisons, traderMeasures, walletExample } from "@/lib/rules";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** One Smart Money PnL leaderboard call. Comparisons 9–17 and 20 are not requested. */
export async function POST() {
  try {
    const board = await nansenPost(LEADERBOARD_PATH, LEADERBOARD_BODY, LEADERBOARD_COST, leaderboardCacheKey());
    if (!board.ok) {
      return NextResponse.json(
        { ok: false, error: nansenMessage(board.body, board.status), credits: board.credits },
        { status: board.status },
      );
    }
    const parsed = parseLeaderboard(board.body);
    const read = traderComparisons(parsed.rows, parsed.isLastPage, parsed.keyKind);
    return NextResponse.json({
      ok: true,
      frame: read.frame,
      common: read.common,
      meaningful: read.meaningful,
      unscored: read.unscored,
      topAddresses: profitCutAddresses(parsed.rows),
      tradedKeys: tradedKeys(parsed.rows),
      keyKind: parsed.keyKind,
      table: walletExample(parsed.rows),
      measures: traderMeasures(parsed.rows, parsed.keyKind),
      credits: board.credits,
      raw: publicPayload(board.body),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The leaderboard could not be read.";
    return NextResponse.json({ ok: false, error: message, credits: creditView() }, { status: 502 });
  }
}
