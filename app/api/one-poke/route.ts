import { BUYERS_PER_PAGE, POKE_SHARE, TRADES_COST, TRADES_PATH } from "@/lib/constants";
import { creditView, nansenMessage, nansenPost } from "@/lib/nansen";
import {
  classifyTokenInput,
  isQuoteSymbol,
  isTradeChain,
  parseTrades,
  pokeVerdict,
  publicPayload,
  rollingDay,
  utcDay,
} from "@/lib/rules";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: { chain?: unknown; tokenAddress?: unknown; symbol?: unknown };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "The body was not JSON.", credits: creditView() },
      { status: 400 },
    );
  }

  const chain = typeof payload.chain === "string" ? payload.chain.trim() : "";
  const rawAddress = typeof payload.tokenAddress === "string" ? payload.tokenAddress : "";
  const symbol = typeof payload.symbol === "string" ? payload.symbol.trim() : "";

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
        error: `${symbol.toUpperCase()} is on the quote-leg list. The call was not sent.`,
        credits: creditView(),
      },
      { status: 400 },
    );
  }

  const addressKey = chain === "solana" ? classified.value : classified.value.toLowerCase();
  try {
    const trades = await nansenPost(
      TRADES_PATH,
      {
        chain,
        token_address: classified.value,
        buy_or_sell: "BUY",
        date: rollingDay(),
        pagination: { page: 1, per_page: BUYERS_PER_PAGE },
        order_by: [{ field: "bought_volume_usd", direction: "DESC" }],
      },
      TRADES_COST,
      `poke:${chain}:${addressKey}:${utcDay()}`,
    );
    if (!trades.ok) {
      return NextResponse.json(
        { ok: false, error: nansenMessage(trades.body, trades.status), credits: trades.credits },
        { status: trades.status },
      );
    }
    const parsed = parseTrades(trades.body);
    const verdict = pokeVerdict(parsed.rows, parsed.isLastPage);
    return NextResponse.json({
      ok: true,
      ...verdict,
      pokeShare: POKE_SHARE,
      pageSize: BUYERS_PER_PAGE,
      addressOnly: !symbol,
      credits: trades.credits,
      raw: publicPayload(trades.body),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The buy page could not be read.";
    return NextResponse.json({ ok: false, error: message, credits: creditView() }, { status: 502 });
  }
}
