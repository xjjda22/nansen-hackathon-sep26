import {
  FLOW_COST,
  FLOW_PATH,
  NETFLOW_BODY,
  NETFLOW_COST,
  NETFLOW_PATH,
} from "@/lib/constants";
import { creditView, nansenMessage, nansenPost, netflowCacheKey, peekCache } from "@/lib/nansen";
import {
  cohortSentence,
  findSurvivor,
  isFlowChain,
  notOnYourList,
  parseNetflow,
  publicPayload,
  readCohortRecord,
} from "@/lib/rules";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Payload = {
  book?: unknown;
  action?: unknown;
  chain?: unknown;
  tokenAddress?: unknown;
};

export async function POST(request: Request) {
  const payload = await readPayload(request);
  if (!payload) {
    return NextResponse.json(
      { ok: false, error: "The body was not JSON.", credits: creditView() },
      { status: 400 },
    );
  }
  const book = typeof payload.book === "string" ? payload.book : "";
  if (payload.action === "cohort") return cohort(payload, book);
  return board(book);
}

async function board(book: string) {
  const preview = notOnYourList([], true, book);
  if (!preview.call) {
    return NextResponse.json(
      { ok: false, error: preview.error, ignored: preview.ignored, credits: creditView() },
      { status: 400 },
    );
  }
  const nansen = await loadBoard();
  if (!nansen.ok) return nansen.response;
  const result = notOnYourList(nansen.rows, nansen.isLastPage, book);
  return NextResponse.json({
    ok: true,
    ...result,
    addingNotHolding: true,
    credits: nansen.credits,
    raw: publicPayload(nansen.body),
  });
}

async function cohort(payload: Payload, book: string) {
  const chain = typeof payload.chain === "string" ? payload.chain : "";
  const tokenAddress = typeof payload.tokenAddress === "string" ? payload.tokenAddress.trim() : "";
  if (!isFlowChain(chain) || !tokenAddress) {
    return NextResponse.json(
      {
        ok: false,
        error: "A cohort read needs a chain and a token address from a card that already survived.",
        credits: creditView(),
      },
      { status: 400 },
    );
  }
  if (chain === "hyperliquid") {
    return NextResponse.json(
      {
        ok: false,
        error: "Flow intelligence has no hyperliquid chain. hyperevm is a different chain.",
        credits: creditView(),
      },
      { status: 400 },
    );
  }
  const cached = peekCache(netflowCacheKey());
  if (!cached) {
    return NextResponse.json(
      {
        ok: false,
        error: "The board expired. Read the list again before opening a card.",
        credits: creditView(),
      },
      { status: 409 },
    );
  }
  let parsed: ReturnType<typeof parseNetflow>;
  try {
    parsed = parseNetflow(cached.body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The cached board could not be read.";
    return NextResponse.json({ ok: false, error: message, credits: creditView() }, { status: 502 });
  }
  const list = notOnYourList(parsed.rows, parsed.isLastPage, book);
  if (!list.call) {
    return NextResponse.json({ ok: false, error: list.error, credits: creditView() }, { status: 400 });
  }
  const card = findSurvivor(list.cards, chain, tokenAddress);
  if (!card) {
    return NextResponse.json(
      {
        ok: false,
        error: "That row is not one of the names this book left. The cohort call was not sent.",
        credits: creditView(),
      },
      { status: 400 },
    );
  }
  try {
    const flow = await nansenPost(
      FLOW_PATH,
      { chain, token_address: tokenAddress, timeframe: "1d" },
      FLOW_COST,
      `flow:${chain}:${tokenAddress}:${chain === "solana" ? tokenAddress : tokenAddress.toLowerCase()}:1d`,
    );
    if (!flow.ok) {
      return NextResponse.json(
        { ok: false, error: nansenMessage(flow.body, flow.status), credits: flow.credits },
        { status: flow.status },
      );
    }
    const record = readCohortRecord(flow.body);
    const sentence = record.empty
      ? "Cohorts are flat or missing."
      : cohortSentence(record.values, card.netFlow24hUsd);
    return NextResponse.json({
      ok: true,
      chain,
      tokenAddress: card.tokenAddress,
      tokenSymbol: card.tokenSymbol,
      sentence,
      credits: flow.credits,
      raw: publicPayload(flow.body),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The cohort read failed.";
    return NextResponse.json({ ok: false, error: message, credits: creditView() }, { status: 502 });
  }
}

async function loadBoard() {
  try {
    const flow = await nansenPost(NETFLOW_PATH, NETFLOW_BODY, NETFLOW_COST, netflowCacheKey());
    if (!flow.ok) {
      return {
        ok: false as const,
        response: NextResponse.json(
          { ok: false, error: nansenMessage(flow.body, flow.status), credits: flow.credits },
          { status: flow.status },
        ),
      };
    }
    const parsed = parseNetflow(flow.body);
    return { ok: true as const, ...parsed, credits: flow.credits, body: flow.body };
  } catch (error) {
    const message = error instanceof Error ? error.message : "The board could not be read.";
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: message, credits: creditView() }, { status: 502 }),
    };
  }
}

async function readPayload(request: Request): Promise<Payload | null> {
  try {
    return (await request.json()) as Payload;
  } catch {
    return null;
  }
}
