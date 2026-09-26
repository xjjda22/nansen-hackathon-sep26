import { creditView, fileCacheOn, setFileCache } from "@/lib/nansen";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, credits: creditView(), fileCache: fileCacheOn() });
}

export async function POST(request: Request) {
  let on = true;
  try {
    const payload = (await request.json()) as { fileCache?: unknown };
    on = payload.fileCache !== false;
  } catch {
    on = true;
  }
  return NextResponse.json({ ok: true, credits: creditView(), fileCache: setFileCache(on) });
}
