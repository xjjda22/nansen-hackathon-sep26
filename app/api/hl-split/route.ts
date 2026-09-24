import { POSITION_COST, POSITION_PATH } from "@/lib/constants";
import { creditView, nansenMessage, nansenPost } from "@/lib/nansen";
import { hlSplit, publicPayload } from "@/lib/rules";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: { tokenAddress?: unknown };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "The body was not JSON.", credits: creditView() },
      { status: 400 },
    );
  }

  const tokenAddress = typeof payload.tokenAddress === "string" ? payload.tokenAddress.trim() : "";
  if (!tokenAddress) {
    return NextResponse.json(
      {
        ok: false,
        error: "An empty token makes no call. This desk does not read spot netflow.",
        credits: creditView(),
      },
      { status: 400 },
    );
  }

  try {
    const book = await nansenPost(
      POSITION_PATH,
      { token_address: tokenAddress },
      POSITION_COST,
      `hl-split:${tokenAddress}`,
    );
    if (!book.ok) {
      return NextResponse.json(
        { ok: false, error: nansenMessage(book.body, book.status), credits: book.credits },
        { status: book.status },
      );
    }
    return NextResponse.json({
      ok: true,
      ...hlSplit(book.body),
      credits: book.credits,
      raw: publicPayload(book.body),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The position book could not be read.";
    return NextResponse.json({ ok: false, error: message, credits: creditView() }, { status: 502 });
  }
}
