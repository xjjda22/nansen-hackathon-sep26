import { NETFLOW_BODY, NETFLOW_COST, NETFLOW_PATH } from "@/lib/constants";
import { creditView, noCallCredits, nansenMessage, nansenPost, netflowCacheKey } from "@/lib/nansen";
import {
  notOnYourList,
  parseNetflow,
  publicPayload,
  sameTickerTwoChains,
  sectorWeather,
} from "@/lib/rules";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let book = "";
  let symbol = "";
  try {
    const payload = (await request.json()) as { book?: unknown; symbol?: unknown };
    book = typeof payload.book === "string" ? payload.book : "";
    symbol = typeof payload.symbol === "string" ? payload.symbol : "";
  } catch {
    return NextResponse.json(
      { ok: false, error: "The body was not JSON.", credits: noCallCredits() },
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
    const ledger = notOnYourList(parsed.rows, parsed.isLastPage, book);
    const weather = sectorWeather(parsed.rows, parsed.isLastPage);
    const rails = railsFrom(parsed.rows, parsed.isLastPage, symbol);
    return NextResponse.json({
      ok: true,
      pageCut: !parsed.isLastPage,
      ledger: ledger.call
        ? {
            skipped: false,
            line: ledger.line,
            cards: ledger.cards,
            ignored: ledger.ignored,
            unmatchedSymbols: ledger.unmatchedSymbols,
          }
        : {
            skipped: true,
            line: ledger.line,
            cards: [],
            ignored: ledger.ignored,
            unmatchedSymbols: [],
          },
      weather: {
        sentence: weather.sentence,
        entering: weather.entering,
        leaving: weather.leaving,
        nothingLeaving: weather.nothingLeaving,
        noWeather: weather.noWeather,
        unmapped: weather.unmapped,
      },
      rails,
      rows: parsed.rows.map((row) => ({
        chain: row.chain,
        tokenAddress: row.tokenAddress,
        tokenSymbol: row.tokenSymbol,
        netFlow1hUsd: row.netFlow1hUsd,
        netFlow24hUsd: row.netFlow24hUsd,
        netFlow7dUsd: row.netFlow7dUsd,
        netFlow30dUsd: row.netFlow30dUsd,
        traderCount: row.traderCount,
        tokenAgeDays: row.tokenAgeDays,
        marketCapUsd: row.marketCapUsd,
        sectors: row.tokenSectors,
      })),
      credits: flow.credits,
      raw: publicPayload(flow.body),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The board could not be read.";
    return NextResponse.json({ ok: false, error: message, credits: creditView() }, { status: 502 });
  }
}

function railsFrom(rows: Parameters<typeof sameTickerTwoChains>[0], isLastPage: boolean, symbol: string) {
  if (!symbol.trim()) {
    return {
      skipped: true,
      line: "No symbol. Rails skipped.",
      status: "skipped" as const,
      symbol: "",
      rows: [],
      tied: false,
    };
  }
  const result = sameTickerTwoChains(rows, isLastPage, symbol);
  if (!result.call) {
    return {
      skipped: true,
      line: result.error,
      status: "skipped" as const,
      symbol: "",
      rows: [],
      tied: false,
    };
  }
  return {
    skipped: false,
    line: result.sentence,
    status: result.status,
    symbol: result.symbol,
    rows: result.rows,
    tied: result.tied,
  };
}
