import { DCA_COST, DCA_PATH } from "@/lib/constants";
import { creditView, nansenMessage, nansenPost } from "@/lib/nansen";
import { classifyTokenInput, isSolanaAddress, jupDcaVerdict, publicPayload } from "@/lib/rules";
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

  const raw = typeof payload.tokenAddress === "string" ? payload.tokenAddress : "";
  const classified = classifyTokenInput(raw);
  if (classified.kind !== "address" || !isSolanaAddress(classified.value)) {
    return NextResponse.json(
      {
        ok: false,
        error: "A ticker with no Solana mint makes no call. Paste the mint address.",
        credits: creditView(),
      },
      { status: 400 },
    );
  }

  try {
    const dca = await nansenPost(
      DCA_PATH,
      { token_address: classified.value, pagination: { page: 1, per_page: 25 } },
      DCA_COST,
      `jup-dca:${classified.value}`,
    );
    if (!dca.ok) {
      return NextResponse.json(
        { ok: false, error: nansenMessage(dca.body, dca.status), credits: dca.credits },
        { status: dca.status },
      );
    }
    return NextResponse.json({
      ok: true,
      ...jupDcaVerdict(dca.body),
      credits: dca.credits,
      raw: publicPayload(dca.body),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The DCA page could not be read.";
    return NextResponse.json({ ok: false, error: message, credits: creditView() }, { status: 502 });
  }
}
