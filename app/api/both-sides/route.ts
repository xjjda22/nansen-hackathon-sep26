import { BUYERS_PER_PAGE, QUARTER, TRADES_COST, TRADES_PATH } from "@/lib/constants";
import { creditView, nansenMessage, nansenPost } from "@/lib/nansen";
import {
  buyerPageVerdict,
  classifyTokenInput,
  isQuoteSymbol,
  isTradeChain,
  parseTrades,
  publicPayload,
  rollingDay,
  utcDay,
} from "@/lib/rules";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Payload = {
  chain?: unknown;
  tokenAddress?: unknown;
  symbol?: unknown;
  side?: unknown;
};

export async function POST(request: Request) {
  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "The body was not JSON.", credits: creditView() },
      { status: 400 },
    );
  }

  const chain = typeof payload.chain === "string" ? payload.chain.trim() : "";
  const rawAddress = typeof payload.tokenAddress === "string" ? payload.tokenAddress : "";
  const symbol = typeof payload.symbol === "string" ? payload.symbol.trim() : "";
  const side = payload.side === "SELL" ? "SELL" : "BUY";

  if (!chain || !rawAddress.trim()) {
    return NextResponse.json(
      {
        ok: false,
        error: "A ticker with no chain and no address makes no call.",
        credits: creditView(),
      },
      { status: 400 },
    );
  }
  if (!isTradeChain(chain)) {
    return NextResponse.json(
      { ok: false, error: "That chain is not on who-bought-sold.", credits: creditView() },
      { status: 400 },
    );
  }

  const classified = classifyTokenInput(rawAddress);
  if (classified.kind !== "address") {
    return NextResponse.json(
      {
        ok: false,
        error: "A ticker with no address makes no call. Paste the token address, or pick a cached row.",
        credits: creditView(),
      },
      { status: 400 },
    );
  }

  if (symbol && isQuoteSymbol(symbol)) {
    return NextResponse.json(
      {
        ok: false,
        error: `${symbol.toUpperCase()} is on the quote-leg list. The call was not sent. An address typed by itself is not checked against that list.`,
        credits: creditView(),
      },
      { status: 400 },
    );
  }

  const addressKey = chain === "solana" ? classified.value : classified.value.toLowerCase();
  const day = utcDay();
  try {
    const trades = await nansenPost(
      TRADES_PATH,
      {
        chain,
        token_address: classified.value,
        buy_or_sell: side,
        date: rollingDay(),
        pagination: { page: 1, per_page: BUYERS_PER_PAGE },
      },
      TRADES_COST,
      `trades:${chain}:${addressKey}:${side}:${day}`,
    );
    if (!trades.ok) {
      return NextResponse.json(
        { ok: false, error: nansenMessage(trades.body, trades.status), credits: trades.credits },
        { status: trades.status },
      );
    }
    const parsed = parseTrades(trades.body);
    if (side === "SELL") {
      return NextResponse.json({
        ok: true,
        side,
        sentence: `Sell page, ${BUYERS_PER_PAGE} requested. ${parsed.rows.length} addresses came back. This does not change the buyer-page count, and it is not a one-way claim.`,
        addresses: parsed.rows.slice(0, 3).map((row) => row.address),
        rowCount: parsed.rows.length,
        pageCut: !parsed.isLastPage,
        quarter: QUARTER,
        addressOnly: !symbol,
        credits: trades.credits,
        raw: publicPayload(trades.body),
      });
    }
    const verdict = buyerPageVerdict(parsed.rows, parsed.isLastPage);
    return NextResponse.json({
      ok: true,
      side,
      ...verdict,
      quarter: QUARTER,
      pageSize: BUYERS_PER_PAGE,
      addressOnly: !symbol,
      hyperliquidLegal: chain === "hyperliquid",
      credits: trades.credits,
      raw: publicPayload(trades.body),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The trade page could not be read.";
    return NextResponse.json({ ok: false, error: message, credits: creditView() }, { status: 502 });
  }
}
