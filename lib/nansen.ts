import { CACHE_MS } from "@/lib/constants";

type CacheEntry = {
  at: number;
  status: number;
  ok: boolean;
  body: unknown;
  creditsUsed: number;
};

type Store = {
  cache: Map<string, CacheEntry>;
  inflight: Map<string, Promise<CacheEntry>>;
  spent: number;
  remaining: number | null;
  lastUsed: number;
  lastCached: boolean;
};

function store(): Store {
  const g = globalThis as typeof globalThis & { __offbook?: Store };
  if (!g.__offbook) {
    g.__offbook = {
      cache: new Map(),
      inflight: new Map(),
      spent: 0,
      remaining: null,
      lastUsed: 0,
      lastCached: false,
    };
  }
  if (g.__offbook.lastUsed == null) g.__offbook.lastUsed = 0;
  if (g.__offbook.lastCached == null) g.__offbook.lastCached = false;
  return g.__offbook;
}

export type CreditView = {
  spentThisSession: number;
  remaining: number | null;
  used: number;
  cached: boolean;
};

export function noteCombinedUse(used: number, cached: boolean) {
  const current = store();
  current.lastUsed = used;
  current.lastCached = cached;
}

export function creditView(used?: number, cached?: boolean): CreditView {
  const current = store();
  return {
    spentThisSession: current.spent,
    remaining: current.remaining,
    used: used ?? current.lastUsed,
    cached: cached ?? current.lastCached,
  };
}

export function peekCache(cacheKey: string): CacheEntry | null {
  const hit = store().cache.get(cacheKey);
  if (!hit) return null;
  if (hit.at + CACHE_MS <= Date.now()) {
    store().cache.delete(cacheKey);
    return null;
  }
  return hit;
}

export function netflowCacheKey(): string {
  return "netflow:board:v1";
}

function scrub(message: string): string {
  return message.replace(/nsn_[a-z0-9]+/gi, "[redacted]").slice(0, 400);
}

export function nansenMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const record = body as { message?: unknown; error?: unknown };
    const message =
      typeof record.message === "string"
        ? record.message
        : typeof record.error === "string"
          ? record.error
          : "";
    if (message) return scrub(message);
  }
  return `Nansen returned ${status}.`;
}

export type NansenResult = {
  ok: boolean;
  status: number;
  body: unknown;
  cached: boolean;
  creditsUsed: number;
  credits: CreditView;
};

/**
 * One POST to Nansen. Identical cache keys share one in-flight request and a
 * two-minute body cache. Credits increase only when this process calls Nansen.
 */
export async function nansenPost(
  path: string,
  body: unknown,
  publishedCost: number,
  cacheKey: string,
): Promise<NansenResult> {
  const current = store();
  const hit = peekCache(cacheKey);
  if (hit) {
    current.lastUsed = 0;
    current.lastCached = true;
    return {
      ok: hit.ok,
      status: hit.status,
      body: hit.body,
      cached: true,
      creditsUsed: 0,
      credits: creditView(0, true),
    };
  }

  const pending = current.inflight.get(cacheKey);
  if (pending) {
    const shared = await pending;
    return {
      ok: shared.ok,
      status: shared.status,
      body: shared.body,
      cached: true,
      creditsUsed: 0,
      credits: creditView(0, true),
    };
  }

  const task = (async (): Promise<CacheEntry> => {
    const apiKey = process.env.NANSEN_API_KEY;
    if (!apiKey) {
      throw new Error("NANSEN_API_KEY is not set on the server.");
    }
    const response = await fetch(`https://api.nansen.ai${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const text = await response.text();
    let parsed: unknown = null;
    if (text) {
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        parsed = { message: scrub(text) };
      }
    }
    const usedHeader = response.headers.get("x-nansen-credits-used");
    const remainingHeader = response.headers.get("x-nansen-credits-remaining");
    let used = 0;
    if (usedHeader != null && usedHeader !== "" && Number.isFinite(Number(usedHeader))) {
      used = Number(usedHeader);
    } else if (response.ok) {
      used = publishedCost;
    }
    current.spent += used;
    if (
      remainingHeader != null &&
      remainingHeader !== "" &&
      Number.isFinite(Number(remainingHeader))
    ) {
      current.remaining = Number(remainingHeader);
    }
    const entry: CacheEntry = {
      at: Date.now(),
      status: response.status,
      ok: response.ok,
      body: parsed,
      creditsUsed: used,
    };
    if (response.ok) current.cache.set(cacheKey, entry);
    current.lastUsed = used;
    current.lastCached = false;
    return entry;
  })();

  current.inflight.set(cacheKey, task);
  try {
    const entry = await task;
    return {
      ok: entry.ok,
      status: entry.status,
      body: entry.body,
      cached: false,
      creditsUsed: entry.creditsUsed,
      credits: creditView(entry.creditsUsed, false),
    };
  } finally {
    current.inflight.delete(cacheKey);
  }
}
