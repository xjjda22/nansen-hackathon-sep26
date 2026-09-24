import { CHAIN_RANK_COST, CHAIN_RANK_PATH } from "@/lib/constants";
import { creditView, nansenMessage, nansenPost } from "@/lib/nansen";
import { gasLead, type GasRow } from "@/lib/rules";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function parseRank(body: unknown): GasRow[] {
  if (!body || typeof body !== "object" || !Array.isArray((body as { data?: unknown }).data)) {
    throw new Error("Nansen returned no chain list.");
  }
  const rows: GasRow[] = [];
  for (const item of (body as { data: unknown[] }).data) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (typeof row.chain !== "string" || row.chain.length === 0) continue;
    rows.push({
      chain: row.chain,
      gasUsd: typeof row.total_gas_used_usd === "number" ? row.total_gas_used_usd : null,
    });
  }
  return rows;
}

export async function POST() {
  try {
    const rank = await nansenPost(
      CHAIN_RANK_PATH,
      { time_frame: 7, chain_type: "evm" },
      CHAIN_RANK_COST,
      "chain-rank:evm:7",
    );
    if (!rank.ok) {
      return NextResponse.json(
        { ok: false, error: nansenMessage(rank.body, rank.status), credits: rank.credits },
        { status: rank.status },
      );
    }
    const verdict = gasLead(parseRank(rank.body));
    return NextResponse.json({ ok: true, ...verdict, credits: rank.credits });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The chain rank could not be read.";
    return NextResponse.json({ ok: false, error: message, credits: creditView() }, { status: 502 });
  }
}
