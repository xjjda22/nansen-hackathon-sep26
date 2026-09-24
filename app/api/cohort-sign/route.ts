import { FLOW_COST, FLOW_PATH } from "@/lib/constants";
import { creditView, noCallCredits, nansenMessage, nansenPost, noteCombinedUse } from "@/lib/nansen";
import {
  classifyTokenInput,
  isFlowChain,
  isQuoteSymbol,
  judgeDay,
  judgeFive,
  publicPayload,
  readCohortRecord,
} from "@/lib/rules";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function combinedCredits(dayUsed: number, fiveUsed: number, cached: boolean) {
  const used = dayUsed + fiveUsed;
  noteCombinedUse(used, cached);
  return creditView(used, cached);
}

export async function POST(request: Request) {
  let payload: { chain?: unknown; tokenAddress?: unknown; symbol?: unknown };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "The body was not JSON.", credits: noCallCredits() },
      { status: 400 },
    );
  }

  const chain = typeof payload.chain === "string" ? payload.chain.trim() : "";
  const rawAddress = typeof payload.tokenAddress === "string" ? payload.tokenAddress : "";
  const symbol = typeof payload.symbol === "string" ? payload.symbol.trim() : "";

  if (!chain && !rawAddress.trim()) {
    return NextResponse.json(
      { ok: false, error: "A symbol alone makes no call. Send a chain and a token address.", credits: noCallCredits() },
      { status: 400 },
    );
  }
  if (!chain || !rawAddress.trim()) {
    return NextResponse.json(
      { ok: false, error: "A symbol alone makes no call. Both a chain and a token address are required.", credits: noCallCredits() },
      { status: 400 },
    );
  }
  if (chain === "hyperliquid" || !isFlowChain(chain)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          chain === "hyperliquid"
            ? "Flow intelligence has no hyperliquid chain. hyperevm is a different chain. The call was not sent."
            : "That chain is not on flow intelligence.",
        credits: noCallCredits(),
      },
      { status: 400 },
    );
  }
  const classified = classifyTokenInput(rawAddress);
  if (classified.kind !== "address") {
    return NextResponse.json(
      { ok: false, error: "A symbol alone makes no call. Paste the token address, or pick a cached row.", credits: noCallCredits() },
      { status: 400 },
    );
  }
  if (symbol && isQuoteSymbol(symbol)) {
    return NextResponse.json(
      {
        ok: false,
        error: `${symbol.toUpperCase()} is on the quote-leg list from the board. The call was not sent.`,
        credits: noCallCredits(),
      },
      { status: 400 },
    );
  }

  const addressKey = chain === "solana" ? classified.value : classified.value.toLowerCase();
  try {
    const day = await nansenPost(
      FLOW_PATH,
      { chain, token_address: classified.value, timeframe: "1d" },
      FLOW_COST,
      `flow:${chain}:${addressKey}:1d`,
    );
    if (!day.ok) {
      return NextResponse.json(
        { ok: false, error: nansenMessage(day.body, day.status), credits: day.credits },
        { status: day.status },
      );
    }
    const dayRecord = readCohortRecord(day.body);
    if (dayRecord.empty) {
      return NextResponse.json({
        ok: true,
        noFlow: true,
        flat: false,
        line: "No flow.",
        agreement: null,
        addressOnly: !symbol,
        credits: day.credits,
        raw: publicPayload(day.body),
      });
    }
    const judged = judgeDay(dayRecord.values);
    if (judged.flat) {
      return NextResponse.json({
        ok: true,
        noFlow: false,
        flat: true,
        line: "FLAT",
        agreement: null,
        addressOnly: !symbol,
        credits: day.credits,
        raw: publicPayload(day.body),
      });
    }
    if (judged.winners.every((winner) => winner.fresh)) {
      return NextResponse.json({
        ok: true,
        noFlow: false,
        flat: false,
        line: judged.line,
        agreement: "UNAVAILABLE" as const,
        fiveSkipped: "Fresh wallets have no 5-minute field, so the 5-minute call was not sent.",
        addressOnly: !symbol,
        credits: day.credits,
        raw: publicPayload(day.body),
      });
    }

    const five = await nansenPost(
      FLOW_PATH,
      { chain, token_address: classified.value, timeframe: "5m" },
      FLOW_COST,
      `flow:${chain}:${addressKey}:5m`,
    );
    if (!five.ok) {
      return NextResponse.json({
        ok: true,
        noFlow: false,
        flat: false,
        line: judged.line,
        agreement: "UNAVAILABLE" as const,
        fiveSkipped: nansenMessage(five.body, five.status),
        addressOnly: !symbol,
        credits: combinedCredits(day.creditsUsed, five.creditsUsed, false),
        raw: { day: publicPayload(day.body), five: publicPayload(five.body) },
      });
    }
    const fiveRecord = readCohortRecord(five.body);
    const agreement = judgeFive(judged.winners, fiveRecord.empty ? null : fiveRecord.values, fiveRecord.empty);
    return NextResponse.json({
      ok: true,
      noFlow: false,
      flat: false,
      line: judged.line,
      agreement,
      addressOnly: !symbol,
      credits: combinedCredits(day.creditsUsed, five.creditsUsed, day.cached && five.cached),
      raw: { day: publicPayload(day.body), five: publicPayload(five.body) },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The cohort read failed.";
    return NextResponse.json({ ok: false, error: message, credits: creditView() }, { status: 502 });
  }
}
