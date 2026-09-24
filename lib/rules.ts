import {
  BUYERS_PER_PAGE,
  COHORTS,
  FLOW_CHAINS,
  MAX_ADDRESSES_SHOWN,
  MAX_CARDS,
  MIN_TRADERS,
  QUARTER,
  QUOTE_SYMBOLS,
  RELATIVE_FLOOR,
  TRADE_CHAINS,
  type CohortKey,
  type CohortValue,
} from "./constants";

const EVM = /^0x[a-fA-F0-9]{40}$/i;
const SOLANA = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const SYMBOL = /^[A-Za-z][A-Za-z0-9.]{0,19}$/;

export type FlowRow = {
  chain: string;
  tokenAddress: string;
  tokenSymbol: string;
  netFlow24hUsd: number;
  netFlow1hUsd: number | null;
  netFlow7dUsd: number | null;
  netFlow30dUsd: number | null;
  tokenSectors: string[];
  traderCount: number | null;
  tokenAgeDays: number | null;
  marketCapUsd: number | null;
};

export type BookEntry =
  | { kind: "symbol"; symbol: string; raw: string }
  | { kind: "evm"; address: string; raw: string }
  | { kind: "solana"; address: string; raw: string }
  | { kind: "ignored"; raw: string };

export function isEvmAddress(value: string): boolean {
  return EVM.test(value);
}

export function isSolanaAddress(value: string): boolean {
  return SOLANA.test(value);
}

export function pageFloor(values: number[]): number {
  let max = 0;
  for (const value of values) {
    const absolute = Math.abs(value);
    if (absolute > max) max = absolute;
  }
  return RELATIVE_FLOOR * max;
}

export function parseBook(input: string): BookEntry[] {
  const parts = input
    .split(/[\s,]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.map((raw) => {
    const stripped = raw.replace(/^\$+/, "");
    if (isEvmAddress(stripped)) return { kind: "evm", address: stripped, raw };
    if (isSolanaAddress(stripped)) return { kind: "solana", address: stripped, raw };
    if (SYMBOL.test(stripped)) return { kind: "symbol", symbol: stripped.toUpperCase(), raw };
    return { kind: "ignored", raw };
  });
}

export function bookHasHolding(entries: BookEntry[]): boolean {
  return entries.some((entry) => entry.kind !== "ignored");
}

export function parseNetflow(body: unknown): { rows: FlowRow[]; isLastPage: boolean } {
  if (!body || typeof body !== "object") {
    throw new Error("Nansen returned a body this desk cannot read.");
  }
  const record = body as { data?: unknown; pagination?: { is_last_page?: unknown } };
  if (!Array.isArray(record.data)) {
    throw new Error("Nansen returned no data array.");
  }
  const rows: FlowRow[] = [];
  for (const item of record.data) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (
      typeof row.chain !== "string" ||
      typeof row.token_address !== "string" ||
      typeof row.token_symbol !== "string" ||
      typeof row.net_flow_24h_usd !== "number"
    ) {
      continue;
    }
    const sectors = Array.isArray(row.token_sectors)
      ? row.token_sectors.filter((sector): sector is string => typeof sector === "string")
      : [];
    rows.push({
      chain: row.chain,
      tokenAddress: row.token_address,
      tokenSymbol: row.token_symbol,
      netFlow24hUsd: row.net_flow_24h_usd,
      netFlow1hUsd: readNumber(row.net_flow_1h_usd),
      netFlow7dUsd: readNumber(row.net_flow_7d_usd),
      netFlow30dUsd: readNumber(row.net_flow_30d_usd),
      tokenSectors: sectors,
      traderCount: readNumber(row.trader_count),
      tokenAgeDays: readNumber(row.token_age_days),
      marketCapUsd: readNumber(row.market_cap_usd),
    });
  }
  if (record.data.length > 0 && rows.length === 0) {
    throw new Error("Nansen rows were missing the fields this desk reads.");
  }
  return { rows, isLastPage: record.pagination?.is_last_page !== false };
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function rowMatchesHolding(row: FlowRow, entries: BookEntry[]): boolean {
  for (const entry of entries) {
    if (entry.kind === "symbol" && row.tokenSymbol.toUpperCase() === entry.symbol) return true;
    if (
      entry.kind === "evm" &&
      isEvmAddress(row.tokenAddress) &&
      row.tokenAddress.toLowerCase() === entry.address.toLowerCase()
    ) {
      return true;
    }
    if (entry.kind === "solana" && row.tokenAddress === entry.address) return true;
  }
  return false;
}

export type ListCard = {
  chain: string;
  tokenAddress: string;
  tokenSymbol: string;
  netFlow24hUsd: number;
  traderCount: number;
  sectors: string[];
};

export function notOnYourList(rows: FlowRow[], isLastPage: boolean, bookInput: string) {
  const entries = parseBook(bookInput);
  const ignoredBad = entries.filter((entry) => entry.kind === "ignored").map((entry) => entry.raw);
  if (!bookHasHolding(entries)) {
    return {
      call: false as const,
      skipped: true as const,
      line:
        ignoredBad.length > 0
          ? "Ignored strings. Empty book. Ledger skipped."
          : "Empty book. Ledger skipped.",
      ignored: ignoredBad,
    };
  }

  const floorUsd = pageFloor(rows.map((row) => row.netFlow24hUsd));
  const ignoredAddresses: string[] = [];
  const unmatchedSymbols: string[] = [];

  for (const entry of entries) {
    if (entry.kind === "evm") {
      const hit = rows.some(
        (row) =>
          isEvmAddress(row.tokenAddress) &&
          row.tokenAddress.toLowerCase() === entry.address.toLowerCase(),
      );
      if (!hit) ignoredAddresses.push(entry.raw);
    } else if (entry.kind === "solana") {
      const hit = rows.some((row) => row.tokenAddress === entry.address);
      if (!hit) ignoredAddresses.push(entry.raw);
    } else if (entry.kind === "symbol") {
      const hit = rows.some((row) => row.tokenSymbol.toUpperCase() === entry.symbol);
      if (!hit) unmatchedSymbols.push(entry.symbol);
    }
  }

  const survivors = rows
    .filter((row) => row.netFlow24hUsd > 0)
    .filter((row) => Math.abs(row.netFlow24hUsd) >= floorUsd)
    .filter((row): row is FlowRow & { traderCount: number } => row.traderCount != null && row.traderCount >= MIN_TRADERS)
    .filter((row) => !rowMatchesHolding(row, entries))
    .sort((a, b) => b.netFlow24hUsd - a.netFlow24hUsd);

  const cards: ListCard[] = survivors.slice(0, MAX_CARDS).map((row) => ({
    chain: row.chain,
    tokenAddress: row.tokenAddress,
    tokenSymbol: row.tokenSymbol,
    netFlow24hUsd: row.netFlow24hUsd,
    traderCount: row.traderCount,
    sectors: row.tokenSectors,
  }));

  return {
    call: true as const,
    skipped: false as const,
    line: cards.length === 0 ? "No name off this book." : `${cards.length} off the book.`,
    ignored: [...ignoredBad, ...ignoredAddresses],
    unmatchedSymbols,
    floorUsd,
    pageCut: !isLastPage,
    count: cards.length,
    cards,
    stablesExcluded: true,
    nativesExcluded: true,
  };
}

export function findSurvivor(cards: ListCard[], chain: string, tokenAddress: string): ListCard | null {
  return (
    cards.find((card) => {
      if (card.chain !== chain) return false;
      if (card.chain === "solana") return card.tokenAddress === tokenAddress;
      if (isEvmAddress(card.tokenAddress) && isEvmAddress(tokenAddress)) {
        return card.tokenAddress.toLowerCase() === tokenAddress.toLowerCase();
      }
      return card.tokenAddress === tokenAddress;
    }) ?? null
  );
}

export type CohortMap = Partial<Record<CohortKey, CohortValue>>;

export function readCohortRecord(body: unknown): { empty: boolean; values: CohortMap } {
  if (!body || typeof body !== "object") {
    throw new Error("Nansen returned a body this desk cannot read.");
  }
  const data = (body as { data?: unknown }).data;
  if (!Array.isArray(data) || data.length === 0) return { empty: true, values: {} };
  const row = data[0];
  if (!row || typeof row !== "object") return { empty: true, values: {} };
  const record = row as Record<string, unknown>;
  const values: CohortMap = {};
  for (const cohort of COHORTS) {
    const value = record[cohort.key];
    values[cohort.key] = typeof value === "number" ? value : null;
  }
  return { empty: false, values };
}

/** Cohort named only when it is the largest absolute non-null value and shares the row's sign. */
export function cohortSentence(values: CohortMap, rowFlowUsd: number): string {
  const present = COHORTS.flatMap((cohort) => {
    const value = values[cohort.key];
    if (typeof value !== "number") return [];
    return [{ ...cohort, value }];
  });
  if (present.length === 0 || rowFlowUsd === 0) return "Cohorts are flat or missing.";
  const maxAbs = Math.max(...present.map((cohort) => Math.abs(cohort.value)));
  if (maxAbs === 0) return "Cohorts are flat or missing.";
  const leaders = present.filter((cohort) => Math.abs(cohort.value) === maxAbs);
  const rowPositive = rowFlowUsd > 0;
  const same = leaders.filter((cohort) => cohort.value !== 0 && cohort.value > 0 === rowPositive);
  if (same.length === 0) return "Cohorts are flat or missing.";
  const sign = same[0].value > 0 ? "positive" : "negative";
  return `${same.map((cohort) => cohort.name).join(" and ")}, ${sign}.`;
}

export type SectorSide = {
  sector: string;
  sumUsd: number;
  topSymbol: string;
  topChain: string;
  share: number;
  oneToken: boolean;
};

export function sectorWeather(rows: FlowRow[], isLastPage: boolean) {
  const floorUsd = pageFloor(rows.map((row) => row.netFlow24hUsd));
  let unmapped = 0;
  const buckets = new Map<string, { sum: number; parts: { symbol: string; chain: string; flow: number }[] }>();

  for (const row of rows) {
    if (row.tokenSectors.length === 0) {
      unmapped += 1;
      continue;
    }
    for (const sector of row.tokenSectors) {
      const bucket = buckets.get(sector) ?? { sum: 0, parts: [] };
      bucket.sum += row.netFlow24hUsd;
      bucket.parts.push({
        symbol: row.tokenSymbol,
        chain: row.chain,
        flow: row.netFlow24hUsd,
      });
      buckets.set(sector, bucket);
    }
  }

  const sums: SectorSide[] = [...buckets.entries()].map(([sector, bucket]) => {
    const top =
      bucket.sum >= 0
        ? [...bucket.parts].sort((a, b) => b.flow - a.flow)[0]
        : [...bucket.parts].sort((a, b) => a.flow - b.flow)[0];
    const share = bucket.sum === 0 || !top ? 0 : top.flow / bucket.sum;
    const oneToken =
      bucket.sum !== 0 && top ? Math.abs(top.flow) / Math.abs(bucket.sum) > 0.5 : false;
    return {
      sector,
      sumUsd: bucket.sum,
      topSymbol: top?.symbol ?? "",
      topChain: top?.chain ?? "",
      share,
      oneToken,
    };
  });

  const bestPositive = sums
    .filter((side) => side.sumUsd > 0)
    .sort((a, b) => b.sumUsd - a.sumUsd)[0] ?? null;
  const worstNegative = sums
    .filter((side) => side.sumUsd < 0)
    .sort((a, b) => a.sumUsd - b.sumUsd)[0] ?? null;

  const positiveUnder = !bestPositive || Math.abs(bestPositive.sumUsd) < floorUsd;
  const negativeUnder = !worstNegative || Math.abs(worstNegative.sumUsd) < floorUsd;
  const noWeather = rows.length === 0 || (positiveUnder && negativeUnder);

  const entering = !noWeather && bestPositive && !positiveUnder ? bestPositive : null;
  const leaving = !noWeather && worstNegative && !negativeUnder ? worstNegative : null;
  const nothingLeaving = !noWeather && !leaving;

  let sentence: string;
  if (rows.length === 0) {
    sentence = "The board came back empty. There is no sector weather.";
  } else if (noWeather) {
    sentence = `No sector weather. The strongest positive sector sum and the strongest negative sector sum are both under 1% of the largest absolute 24h flow on this page (${formatFloor(floorUsd)}). ${unmapped} rows had no sector.`;
  } else {
    const parts = ["Overlap."];
    if (entering) parts.push(entering.oneToken ? sideSentence(entering, "positive") : `Entering ${entering.sector}.`);
    else parts.push("No positive sector sum clears the floor.");
    if (leaving) parts.push(leaving.oneToken ? sideSentence(leaving, "negative") : `Leaving ${leaving.sector}.`);
    if (nothingLeaving) parts.push("Nothing is leaving.");
    parts.push(`${unmapped} rows had no sector.`);
    sentence = parts.join(" ");
  }

  return {
    sentence,
    entering,
    leaving,
    nothingLeaving,
    noWeather,
    unmapped,
    overlap: true,
    floorUsd,
    pageCut: !isLastPage,
    sums: sums.sort((a, b) => Math.abs(b.sumUsd) - Math.abs(a.sumUsd)),
  };
}

function sideSentence(side: SectorSide, direction: "positive" | "negative"): string {
  const share = formatShare(side.share);
  if (side.oneToken) {
    return `${side.sector} is not a sector move: ${side.topSymbol} on ${side.topChain} is more than half of that ${direction} sum (${share}).`;
  }
  return `The strongest ${direction} sum is ${side.sector}. ${side.topSymbol} on ${side.topChain} is ${share} of it.`;
}

function formatShare(share: number): string {
  return `${Math.round(share * 1000) / 10}%`;
}

function formatFloor(floorUsd: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(floorUsd);
}

export type TradeRow = {
  address: string;
  bought: number | null;
  sold: number | null;
};

export function parseTrades(body: unknown): { rows: TradeRow[]; isLastPage: boolean } {
  if (!body || typeof body !== "object") {
    throw new Error("Nansen returned a body this desk cannot read.");
  }
  const record = body as { data?: unknown; pagination?: { is_last_page?: unknown } };
  if (!Array.isArray(record.data)) throw new Error("Nansen returned no data array.");
  const rows: TradeRow[] = [];
  for (const item of record.data) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (typeof row.address !== "string" || row.address.length === 0) continue;
    rows.push({
      address: row.address,
      bought: typeof row.bought_volume_usd === "number" ? row.bought_volume_usd : null,
      sold: typeof row.sold_volume_usd === "number" ? row.sold_volume_usd : null,
    });
  }
  return { rows, isLastPage: record.pagination?.is_last_page !== false };
}

export function buyerPageVerdict(rows: TradeRow[], isLastPage: boolean) {
  if (rows.length === 0) {
    return {
      verdict: "NO_TRADES" as const,
      sentence: "NO TRADES",
      addresses: [] as string[],
      counted: 0,
      floorUsd: 0,
      pageCut: !isLastPage,
    };
  }
  const anySold = rows.some((row) => row.sold !== null);
  if (!anySold) {
    return {
      verdict: "SOLD_VOLUME_ABSENT" as const,
      sentence: "SOLD VOLUME ABSENT.",
      addresses: [] as string[],
      counted: 0,
      floorUsd: 0,
      pageCut: !isLastPage,
    };
  }

  const magnitudes = rows.map((row) => {
    const values = [row.bought, row.sold].filter((value): value is number => value !== null);
    if (values.length === 0) return 0;
    return Math.max(...values.map((value) => Math.abs(value)));
  });
  const floorUsd = pageFloor(magnitudes);
  const counted = rows.filter((row) => {
    if (row.bought === null || row.sold === null) return false;
    const high = Math.max(Math.abs(row.bought), Math.abs(row.sold));
    const low = Math.min(Math.abs(row.bought), Math.abs(row.sold));
    if (high === 0 || low < QUARTER * high) return false;
    if (high < floorUsd) return false;
    return true;
  });

  return {
    verdict: "COUNT" as const,
    sentence: `Of the top page of buyers (${BUYERS_PER_PAGE}), ${counted.length} also sold.`,
    addresses: counted.slice(0, MAX_ADDRESSES_SHOWN).map((row) => row.address),
    counted: counted.length,
    floorUsd,
    pageCut: !isLastPage,
  };
}

export function classifyTokenInput(
  raw: string,
): { kind: "address"; value: string } | { kind: "symbol"; value: string } | { kind: "bad" } {
  const stripped = raw.trim().replace(/^\$+/, "");
  if (!stripped) return { kind: "bad" };
  if (isEvmAddress(stripped)) return { kind: "address", value: stripped };
  if (isSolanaAddress(stripped)) return { kind: "address", value: stripped };
  if (stripped.length >= 26 && /^[A-Za-z0-9:_-]+$/.test(stripped)) {
    return { kind: "address", value: stripped };
  }
  if (SYMBOL.test(stripped)) return { kind: "symbol", value: stripped.toUpperCase() };
  return { kind: "bad" };
}

export function isQuoteSymbol(symbol: string | undefined | null): boolean {
  if (!symbol) return false;
  return QUOTE_SYMBOLS.has(symbol.trim().toUpperCase());
}

export function isFlowChain(chain: string): boolean {
  return (FLOW_CHAINS as readonly string[]).includes(chain);
}

export function isTradeChain(chain: string): boolean {
  return (TRADE_CHAINS as readonly string[]).includes(chain);
}

export type ChainHit = {
  chain: string;
  tokenAddress: string;
  tokenSymbol: string;
  netFlow24hUsd: number;
  netFlow1hUsd: number | null;
  netFlow7dUsd: number | null;
  netFlow30dUsd: number | null;
  larger: boolean;
};

function chainHit(row: FlowRow, larger: boolean): ChainHit {
  return {
    chain: row.chain,
    tokenAddress: row.tokenAddress,
    tokenSymbol: row.tokenSymbol,
    netFlow24hUsd: row.netFlow24hUsd,
    netFlow1hUsd: row.netFlow1hUsd,
    netFlow7dUsd: row.netFlow7dUsd,
    netFlow30dUsd: row.netFlow30dUsd,
    larger,
  };
}

export function sameTickerTwoChains(rows: FlowRow[], isLastPage: boolean, symbolRaw: string) {
  const stripped = symbolRaw.trim().replace(/^\$+/, "");
  if (!SYMBOL.test(stripped)) {
    return {
      call: false as const,
      error: "Type one symbol. A ticker with no letters, or an address, makes no call here.",
    };
  }
  const symbol = stripped.toUpperCase();
  const floorUsd = pageFloor(rows.map((row) => row.netFlow24hUsd));
  const matched = rows.filter(
    (row) => row.tokenSymbol.toUpperCase() === symbol && Math.abs(row.netFlow24hUsd) >= floorUsd,
  );
  const pageNote = isLastPage ? "" : " This scan is the first page only.";

  if (matched.length === 0) {
    return {
      call: true as const,
      status: "absent" as const,
      symbol,
      sentence: `The board did not include ${symbol}.${pageNote} Netflow has no hyperliquid chain.`,
      rows: [] as ChainHit[],
      tied: false,
      floorUsd,
      pageCut: !isLastPage,
    };
  }

  const sorted = [...matched].sort(
    (a, b) => Math.abs(b.netFlow24hUsd) - Math.abs(a.netFlow24hUsd),
  );

  if (sorted.length === 1) {
    const row = sorted[0];
    return {
      call: true as const,
      status: "once" as const,
      symbol,
      sentence: `${row.tokenSymbol} is on this page once, on ${row.chain}.${pageNote}`,
      rows: [chainHit(row, false)],
      tied: false,
      floorUsd,
      pageCut: !isLastPage,
    };
  }

  const leaderAbs = Math.abs(sorted[0].netFlow24hUsd);
  const secondAbs = Math.abs(sorted[1].netFlow24hUsd);
  const tied = leaderAbs === secondAbs || Math.abs(leaderAbs - secondAbs) < floorUsd;
  const hits: ChainHit[] = sorted.map((row) => {
    const absolute = Math.abs(row.netFlow24hUsd);
    const larger = tied ? absolute === leaderAbs || Math.abs(leaderAbs - absolute) < floorUsd : absolute === leaderAbs;
    return chainHit(row, larger);
  });
  const sentence = tied
    ? `${sorted[0].tokenSymbol} is on more than one chain. The largest absolute 24h figures are inside the page floor of each other, so they are tied.${pageNote}`
    : `${sorted[0].tokenSymbol} is on more than one chain. The larger absolute 24h net flow is on ${sorted[0].chain}.${pageNote}`;

  return {
    call: true as const,
    status: "several" as const,
    symbol,
    sentence,
    rows: hits,
    tied,
    floorUsd,
    pageCut: !isLastPage,
  };
}

export type Agreement = "AGREE" | "DISAGREE" | "UNAVAILABLE";

export function judgeDay(values: CohortMap): {
  flat: boolean;
  line: string;
  winners: { key: CohortKey; name: string; fresh: boolean; value: number }[];
} {
  const present = COHORTS.flatMap((cohort) => {
    const value = values[cohort.key];
    if (typeof value !== "number") return [];
    return [{ ...cohort, value }];
  });
  if (present.length === 0) return { flat: true, line: "FLAT", winners: [] };
  const maxAbs = Math.max(...present.map((cohort) => Math.abs(cohort.value)));
  const floor = RELATIVE_FLOOR * maxAbs;
  const eligible = present.filter((cohort) => cohort.value !== 0 && Math.abs(cohort.value) >= floor);
  if (eligible.length === 0) return { flat: true, line: "FLAT", winners: [] };
  const winnerAbs = Math.max(...eligible.map((cohort) => Math.abs(cohort.value)));
  const winners = eligible.filter((cohort) => Math.abs(cohort.value) === winnerAbs);
  const line = winners
    .map((cohort) => `${cohort.name}, ${cohort.value > 0 ? "positive" : "negative"}`)
    .join("; ");
  return { flat: false, line, winners };
}

export function judgeFive(
  winners: { key: CohortKey; name: string; fresh: boolean; value: number }[],
  five: CohortMap | null,
  fiveFailed: boolean,
): Agreement {
  if (winners.length === 0) return "UNAVAILABLE";
  if (winners.every((winner) => winner.fresh)) return "UNAVAILABLE";
  const comparable = winners.filter((winner) => !winner.fresh);
  if (fiveFailed || !five) return "UNAVAILABLE";
  let sawAgree = false;
  for (const winner of comparable) {
    const value = five[winner.key];
    if (typeof value !== "number" || value === 0) return "UNAVAILABLE";
    const matches = value > 0 === winner.value > 0;
    if (!matches) return "DISAGREE";
    sawAgree = true;
  }
  return sawAgree ? "AGREE" : "UNAVAILABLE";
}

export function rollingDay(now = new Date()): { from: string; to: string } {
  return {
    from: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    to: now.toISOString(),
  };
}

export function utcDay(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function publicPayload(body: unknown): unknown {
  return walkPayload(body);
}

function walkPayload(value: unknown): unknown {
  if (typeof value === "string") return value.replace(/nsn_[a-z0-9]+/gi, "[redacted]");
  if (Array.isArray(value)) return value.map(walkPayload);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (/label/i.test(key)) continue;
      out[key] = walkPayload(child);
    }
    return out;
  }
  return value;
}

export function hourAgainstDay(
  netFlow1hUsd: number | null,
  netFlow24hUsd: number | null,
): "match" | "differ" | "flat" | "absent" {
  if (netFlow1hUsd == null || netFlow24hUsd == null) return "absent";
  if (netFlow1hUsd === 0 || netFlow24hUsd === 0) return "flat";
  return netFlow1hUsd > 0 === netFlow24hUsd > 0 ? "match" : "differ";
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
