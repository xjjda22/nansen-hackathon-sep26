import { creditView, netflowCacheKey, peekCache } from "@/lib/nansen";
import { parseNetflow } from "@/lib/rules";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Cache read only. Does not call Nansen. */
export async function GET() {
  const cached = peekCache(netflowCacheKey());
  if (!cached) {
    return NextResponse.json({
      ok: true,
      ready: false,
      rows: [],
      credits: creditView(),
    });
  }
  try {
    const parsed = parseNetflow(cached.body);
    return NextResponse.json({
      ok: true,
      ready: true,
      pageCut: !parsed.isLastPage,
      rows: parsed.rows.map((row) => ({
        chain: row.chain,
        tokenAddress: row.tokenAddress,
        tokenSymbol: row.tokenSymbol,
        netFlow24hUsd: row.netFlow24hUsd,
        sectors: row.tokenSectors,
      })),
      credits: creditView(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The cached board could not be read.";
    return NextResponse.json({ ok: false, error: message, credits: creditView() }, { status: 502 });
  }
}
