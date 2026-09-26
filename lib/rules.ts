import {
  COHORTS,
  DEX_TRADES_PER_PAGE,
  HOLDINGS_PER_PAGE,
  FLOW_CHAINS,
  LEADERBOARD_PER_PAGE,
  MAX_CARDS,
  MIN_TRADERS,
  QUEST_MAX,
  QUEST_MIN,
  NETFLOW_PER_PAGE,
  RELATIVE_FLOOR,
  type CohortKey,
  type CohortValue,
} from "./constants";
import { tokenMark, walletMark } from "./token-ref";

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

export function isFlowChain(chain: string): boolean {
  return (FLOW_CHAINS as readonly string[]).includes(chain);
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

export type OnloadPair = {
  symbol: string;
  leftChain: string;
  leftUsd: number;
  rightChain: string;
  rightUsd: number;
  tied: boolean;
  leader: string;
  week: "match" | "differ" | "flat" | "absent";
  month: "match" | "differ" | "flat" | "absent";
};

export type OnloadSide = {
  sector: string;
  sumUsd: number;
  topSymbol: string;
  topChain: string;
  oneToken: boolean;
};

export type OnloadRead = {
  pageCount: number;
  positive: number;
  sector: string | null;
  sectorSumUsd: number | null;
  entering: OnloadSide | null;
  leaving: OnloadSide | null;
  nothingLeaving: boolean;
  noWeather: boolean;
  unmapped: number;
  flipCount: number;
  sharpestSymbol: string | null;
  sharpestTraders: number | null;
  sharpest7dUsd: number | null;
  sharpest30dUsd: number | null;
  pair: OnloadPair | null;
};

/** Four stamps from one netflow page. The book is empty. No second call. */
export function onloadRead(rows: FlowRow[]): OnloadRead {
  const weather = sectorWeather(rows, true);
  const flips = rows.filter((row) => signFlip(row.netFlow7dUsd, row.netFlow30dUsd));
  let sharpest: FlowRow | null = null;
  let widest = -1;
  for (const row of flips) {
    const width = Math.abs((row.netFlow7dUsd ?? 0) - (row.netFlow30dUsd ?? 0));
    if (width > widest) {
      widest = width;
      sharpest = row;
    }
  }
  return {
    pageCount: rows.length,
    positive: rows.filter((row) => row.netFlow24hUsd > 0).length,
    sector: weather.entering?.sector ?? null,
    sectorSumUsd: weather.entering?.sumUsd ?? null,
    entering: weather.entering ? sideOf(weather.entering) : null,
    leaving: weather.leaving ? sideOf(weather.leaving) : null,
    nothingLeaving: weather.nothingLeaving,
    noWeather: weather.noWeather,
    unmapped: weather.unmapped,
    flipCount: flips.length,
    sharpestSymbol: sharpest?.tokenSymbol ?? null,
    sharpestTraders: sharpest?.traderCount ?? null,
    sharpest7dUsd: sharpest?.netFlow7dUsd ?? null,
    sharpest30dUsd: sharpest?.netFlow30dUsd ?? null,
    pair: railsPair(rows),
  };
}

function sideOf(side: SectorSide): OnloadSide {
  return {
    sector: side.sector,
    sumUsd: side.sumUsd,
    topSymbol: side.topSymbol,
    topChain: side.topChain,
    oneToken: side.oneToken,
  };
}

function signFlip(week: number | null, month: number | null): boolean {
  if (week == null || month == null || week === 0 || month === 0) return false;
  return week > 0 !== month > 0;
}

function railsPair(rows: FlowRow[]): OnloadPair | null {
  const floorUsd = pageFloor(rows.map((row) => row.netFlow24hUsd));
  const groups = new Map<string, FlowRow[]>();
  for (const row of rows) {
    if (Math.abs(row.netFlow24hUsd) < floorUsd) continue;
    const key = row.tokenSymbol.toUpperCase();
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }
  let best: FlowRow[] | null = null;
  for (const list of groups.values()) {
    const chains = new Set(list.map((row) => row.chain));
    if (chains.size < 2) continue;
    const sorted = [...list].sort((a, b) => Math.abs(b.netFlow24hUsd) - Math.abs(a.netFlow24hUsd));
    if (!best || Math.abs(sorted[0].netFlow24hUsd) > Math.abs(best[0].netFlow24hUsd)) best = sorted;
  }
  if (!best) return null;
  const left = best[0];
  const right = best.find((row) => row.chain !== left.chain);
  if (!right) return null;
  const gap = Math.abs(Math.abs(left.netFlow24hUsd) - Math.abs(right.netFlow24hUsd));
  const tied = gap < floorUsd;
  return {
    symbol: left.tokenSymbol,
    leftChain: left.chain,
    leftUsd: left.netFlow24hUsd,
    rightChain: right.chain,
    rightUsd: right.netFlow24hUsd,
    tied,
    leader: left.chain,
    week: hourAgainstDay(left.netFlow7dUsd, right.netFlow7dUsd),
    month: hourAgainstDay(left.netFlow30dUsd, right.netFlow30dUsd),
  };
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

const TOKEN_TOP = 50;

export type HalfStat = {
  count: number;
  sectors: string[];
  sectorCount: number;
  sectorShare: number | null;
  chains: string[];
  chainCount: number;
  chainShare: number | null;
  flipCount: number;
  flipShare: number | null;
  medianTraders: number | null;
  medianAgeDays: number | null;
  medianMarketCapUsd: number | null;
  tradersPresent: number;
  agePresent: number;
  marketCapPresent: number;
};

export type TokenMeasure = {
  name: string;
  bar: string;
  climb: string;
  gap: string;
  barPlain: string;
  climbPlain: string;
  gapPlain: string;
};

export type TokenHalves = {
  ranked: FlowRow[];
  pageCount: number;
  shortPage: boolean;
  top: HalfStat;
  rest: HalfStat;
  frame: string;
  common: string[];
  meaningful: string[];
};

/** Rank one netflow page by absolute 24h flow and compare the first 50 tokens with the rest. */
export function tokenHalves(rows: FlowRow[]): TokenHalves {
  const ranked = rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const gap = Math.abs(b.row.netFlow24hUsd) - Math.abs(a.row.netFlow24hUsd);
      if (gap !== 0) return gap;
      return a.index - b.index;
    })
    .map((item) => item.row);
  const cut = Math.min(TOKEN_TOP, ranked.length);
  const top = halfStat(ranked.slice(0, cut));
  const rest = halfStat(ranked.slice(cut));
  return {
    ranked,
    pageCount: ranked.length,
    shortPage: ranked.length < NETFLOW_PER_PAGE,
    top,
    rest,
    ...halfLines(ranked.length, top, rest),
  };
}

export type PageHit = {
  row: FlowRow;
  half: "top" | "rest";
  rank: number;
  windows: "match" | "differ" | "flat" | "absent";
};

/** One symbol or one address, read off the ranked netflow page. No second call. */
export function findOnPage(
  rows: FlowRow[],
  query: string,
):
  | { status: "empty" }
  | { status: "ignored" }
  | { status: "several" }
  | { status: "absent"; label: string }
  | { status: "found"; hits: PageHit[]; rest: boolean } {
  const trimmed = query.trim();
  if (!trimmed) return { status: "empty" };
  const entries = parseBook(trimmed).filter((entry) => entry.kind !== "ignored" || entry.raw.trim());
  const usable = entries.filter((entry) => entry.kind !== "ignored");
  if (usable.length === 0) return { status: "ignored" };
  if (usable.length > 1) return { status: "several" };
  const entry = usable[0];
  const halves = tokenHalves(rows);
  const hits: PageHit[] = [];
  halves.ranked.forEach((row, index) => {
    const matched =
      entry.kind === "symbol"
        ? row.tokenSymbol.toUpperCase() === entry.symbol
        : entry.kind === "evm"
          ? isEvmAddress(row.tokenAddress) && row.tokenAddress.toLowerCase() === entry.address.toLowerCase()
          : row.tokenAddress === entry.address;
    if (!matched) return;
    hits.push({
      row,
      half: index < halves.top.count ? "top" : "rest",
      rank: index + 1,
      windows: hourAgainstDay(row.netFlow7dUsd, row.netFlow30dUsd),
    });
  });
  if (hits.length === 0) {
    const label = entry.kind === "symbol" ? entry.symbol : entry.address;
    return { status: "absent", label };
  }
  return { status: "found", hits, rest: halves.rest.count > 0 };
}

const PROBE_CAP = 5;

/** Traits for up to five symbols or addresses. No top-versus-bottom split. */
export function probeQuest(input: {
  query: string;
  flow: FlowRow[];
  holds: HoldMark[];
  buys: DexBuy[];
  traded: string[];
  keyKind: TokenKeyKind | null;
}): { note: string | null; sections: QuestSection[] } {
  const usable = parseBook(input.query).filter((entry) => entry.kind !== "ignored");
  if (usable.length === 0) return { note: "Enter a symbol or an address.", sections: [] };
  const note = usable.length > PROBE_CAP ? `Five is the limit. ${usable.length - PROBE_CAP} left off.` : null;
  const sections = usable.slice(0, PROBE_CAP).map((entry, index) => probeSection(entry, index, input));
  return { note, sections };
}

type NamedEntry = Exclude<BookEntry, { kind: "ignored" }>;

function probeSection(
  entry: NamedEntry,
  index: number,
  input: { flow: FlowRow[]; holds: HoldMark[]; buys: DexBuy[]; traded: string[]; keyKind: TokenKeyKind | null },
): QuestSection {
  const label = entry.kind === "symbol" ? entry.symbol : entry.address;
  const flowHits = input.flow.filter((row) => nameMatch(entry, row.tokenSymbol, row.tokenAddress));
  const holdHits = input.holds.filter((row) => nameMatch(entry, row.symbol, row.address));
  const buyHits = input.buys.filter((row) => nameMatch(entry, row.tokenSymbol ?? "", row.tokenAddress ?? ""));
  const traits: QuestTrait[] = [];
  if (flowHits.length === 0) {
    traits.push(trait(`probe-${index}-flow`, "Netflow", `${label} is not on the netflow page.`));
  } else {
    for (const row of flowHits.slice(0, 3)) traits.push(trait(`probe-${index}-flow-${row.chain}`, "Netflow", flowTrait(row)));
  }
  if (holdHits.length === 0) {
    traits.push(trait(`probe-${index}-hold`, "Holdings", `${label} is not on the holdings page.`));
  } else {
    for (const row of holdHits.slice(0, 3)) traits.push(trait(`probe-${index}-hold-${row.address}`, "Holdings", holdTrait(row)));
  }
  traits.push(trait(`probe-${index}-print`, "Prints", buyHits.length === 0 ? `${label} has no buy on today's tape.` : printTrait(label, buyHits)));
  traits.push(trait(`probe-${index}-traded`, "Wallets", tradedTrait(entry, input.traded, input.keyKind)));
  return { id: `probe-${index}`, title: label, traits };
}

function nameMatch(entry: BookEntry, symbol: string, address: string): boolean {
  if (entry.kind === "symbol") return symbol.toUpperCase() === entry.symbol;
  if (entry.kind === "evm") return isEvmAddress(address) && address.toLowerCase() === entry.address.toLowerCase();
  if (entry.kind === "solana") return address === entry.address;
  return false;
}

function flowTrait(row: FlowRow): string {
  const windows = row.netFlow7dUsd == null || row.netFlow30dUsd == null ? "A week or a month is missing." : signFlip(row.netFlow7dUsd, row.netFlow30dUsd) ? "Week and month point different ways." : "Week and month agree.";
  const traders = row.traderCount == null ? "Trader count is absent." : `${row.traderCount} traders.`;
  const age = row.tokenAgeDays == null ? "Age is absent." : `${plainNumber(row.tokenAgeDays)} days old.`;
  const cap = row.marketCapUsd == null ? "Market cap is absent." : `Market cap ${formatUsd(row.marketCapUsd)}.`;
  const sectors = row.tokenSectors.length > 0 ? row.tokenSectors.join(", ") : "No sector.";
  return `${tokenMark({ symbol: row.tokenSymbol, chain: row.chain, address: row.tokenAddress })} on ${row.chain}. 24h net flow ${formatUsd(row.netFlow24hUsd)}. ${windows} ${traders} ${age} ${cap} ${sectors}`;
}

function holdTrait(row: HoldMark): string {
  const dollars = row.valueUsd == null ? "Dollars are absent." : `${formatUsd(row.valueUsd)} still there.`;
  const share = row.sharePercent == null ? "Share is absent." : `${percentText(row.sharePercent)} of the book.`;
  const change = row.change24hPercent == null ? "The 24h balance change is absent." : `Balance change ${percentText(row.change24hPercent)}.`;
  const chain = row.chain || "solana";
  return `${tokenMark({ symbol: row.symbol || "unnamed", chain, address: row.address })}. ${row.holdersCount} wallets still hold it. ${dollars} ${share} ${change}`;
}

function printTrait(label: string, buys: DexBuy[]): string {
  const ages = present(buys.map((buy) => buy.boughtAgeDays));
  const caps = present(buys.map((buy) => buy.boughtMarketCap));
  const age = ages.length === 0 ? "Age at the buy is absent." : `Age at the buy ${plainNumber(median(ages) ?? 0)} days.`;
  const cap = caps.length === 0 ? "Cap at the buy is absent." : `Cap at the buy ${formatUsd(median(caps) ?? 0)}.`;
  const trader = buys[0]?.traderAddress ? `One trader is ${walletMark("solana", buys[0].traderAddress)}.` : "";
  const minted = buys.find((buy) => buy.tokenAddress);
  const named = minted?.tokenAddress ? tokenMark({ symbol: minted.tokenSymbol || label, chain: "solana", address: minted.tokenAddress }) : label;
  return `${named}. ${buys.length} buys on today's tape. ${age} ${cap} ${trader}`.trim();
}

function tradedTrait(entry: NamedEntry, traded: string[], keyKind: TokenKeyKind | null): string {
  if (keyKind == null || traded.length === 0) return "The leaderboard page has no token key, so this name cannot be checked against what they traded.";
  const hit =
    entry.kind === "symbol"
      ? keyKind === "symbol" && traded.some((key) => key.toUpperCase() === entry.symbol)
      : keyKind === "address" && traded.some((key) => (entry.kind === "evm" ? key.toLowerCase() === entry.address.toLowerCase() : key === entry.address));
  const label = entry.kind === "symbol" ? entry.symbol : entry.address;
  return hit ? `The top wallets list ${label} among the names they traded.` : `${label} is not on the top wallets' traded list.`;
}

/** Fifty cuts of one netflow page. No field outside that body. */
export function tokenMeasures(ranked: FlowRow[], topCount: number): TokenMeasure[] {
  const top = ranked.slice(0, topCount);
  const rest = ranked.slice(topCount);
  const rows: TokenMeasure[] = [];
  const addCount = (name: string, pick: (row: FlowRow) => boolean, noun: string) => {
    const bar = top.filter(pick).length;
    const climb = rest.filter(pick).length;
    rows.push(fillMeasure({
      name,
      bar: `${bar} of ${top.length} names are ${noun}.`,
      climb: `${climb} of ${rest.length} names are ${noun}.`,
      gap: countGap(bar, climb, noun),
    }));
  };
  const addMedian = (name: string, pick: (row: FlowRow) => number | null, kind: "count" | "days" | "usd") => {
    const barValues = present(top.map(pick));
    const climbValues = present(rest.map(pick));
    const bar = median(barValues);
    const climb = median(climbValues);
    rows.push(fillMeasure({
      name,
      bar: measureCell(bar, barValues.length, top.length, kind),
      climb: measureCell(climb, climbValues.length, rest.length, kind),
      gap: medianGap(bar, climb, kind),
    }));
  };
  const topSector = mode(top.flatMap((row) => [...new Set(row.tokenSectors)]), top.length);
  const restSector = mode(rest.flatMap((row) => [...new Set(row.tokenSectors)]), rest.length);
  const topChain = mode(top.map((row) => row.chain), top.length);
  const restChain = mode(rest.map((row) => row.chain), rest.length);
  rows.push(fillMeasure({
    name: "Tokens",
    bar: `${top.length} names are in the loud group.`,
    climb: `${rest.length} names are in the quiet group.`,
    gap: top.length === rest.length ? "Same count. The two groups are the same size." : countGap(top.length, rest.length, "tokens"),
  }));
  rows.push(fillMeasure({
    name: "Sector",
    bar: groupLabel(topSector.names, topSector.count, top.length),
    climb: groupLabel(restSector.names, restSector.count, rest.length),
    gap: nameGap(topSector.names, restSector.names, topSector.count, restSector.count, "sector"),
  }));
  rows.push(fillMeasure({
    name: "Chain",
    bar: groupLabel(topChain.names, topChain.count, top.length),
    climb: groupLabel(restChain.names, restChain.count, rest.length),
    gap: nameGap(topChain.names, restChain.names, topChain.count, restChain.count, "chain"),
  }));
  addCount("No sector", (row) => row.tokenSectors.length === 0, "without a sector");
  addCount("Two sectors or more", (row) => row.tokenSectors.length > 1, "in more than one sector");
  for (const chain of ["solana", "ethereum", "base", "bnb", "robinhood"] as const) {
    addCount(chain, (row) => row.chain === chain, `on ${chain}`);
  }
  addCount("Positive 24h", (row) => row.netFlow24hUsd > 0, "positive 24h");
  addCount("Negative 24h", (row) => row.netFlow24hUsd < 0, "negative 24h");
  addCount("Positive 7d", (row) => (row.netFlow7dUsd ?? 0) > 0 && row.netFlow7dUsd != null, "positive 7d");
  addCount("Negative 7d", (row) => row.netFlow7dUsd != null && row.netFlow7dUsd < 0, "negative 7d");
  addCount("Positive 30d", (row) => row.netFlow30dUsd != null && row.netFlow30dUsd > 0, "positive 30d");
  addCount("Negative 30d", (row) => row.netFlow30dUsd != null && row.netFlow30dUsd < 0, "negative 30d");
  addCount("Positive 1h", (row) => row.netFlow1hUsd != null && row.netFlow1hUsd > 0, "positive 1h");
  addCount("1h missing", (row) => row.netFlow1hUsd == null, "missing 1h");
  addCount("7d missing", (row) => row.netFlow7dUsd == null, "missing 7d");
  addCount("30d missing", (row) => row.netFlow30dUsd == null, "missing 30d");
  addCount("7d sign ≠ 30d", (row) => signFlip(row.netFlow7dUsd, row.netFlow30dUsd), "flips");
  addCount("1h sign ≠ 24h", (row) => hourAgainstDay(row.netFlow1hUsd, row.netFlow24hUsd) === "differ", "1h flips");
  addCount("24h sign ≠ 7d", (row) => signFlip(row.netFlow24hUsd, row.netFlow7dUsd), "24h flips");
  addCount("7d and 30d both up", (row) => (row.netFlow7dUsd ?? 0) > 0 && (row.netFlow30dUsd ?? 0) > 0, "up on both");
  addCount("7d and 30d both down", (row) => (row.netFlow7dUsd ?? 0) < 0 && (row.netFlow30dUsd ?? 0) < 0, "down on both");
  addCount("Age under 1 day", (row) => row.tokenAgeDays != null && row.tokenAgeDays < 1, "under a day");
  addCount("Age under 7 days", (row) => row.tokenAgeDays != null && row.tokenAgeDays < 7, "under 7 days");
  addCount("Age under 30 days", (row) => row.tokenAgeDays != null && row.tokenAgeDays < 30, "under 30 days");
  addCount("Age over a year", (row) => row.tokenAgeDays != null && row.tokenAgeDays > 365, "over a year");
  addCount("Age missing", (row) => row.tokenAgeDays == null, "missing age");
  addCount("Traders 2 or fewer", (row) => row.traderCount != null && row.traderCount <= 2, "with 2 traders or fewer");
  addCount("Traders at least 20", (row) => row.traderCount != null && row.traderCount >= 20, "with 20 traders or more");
  addCount("Traders at least 50", (row) => row.traderCount != null && row.traderCount >= 50, "with 50 traders or more");
  addCount("Traders at least 100", (row) => row.traderCount != null && row.traderCount >= 100, "with 100 traders or more");
  addCount("Traders missing", (row) => row.traderCount == null, "missing traders");
  addCount("Cap under $1M", (row) => row.marketCapUsd != null && row.marketCapUsd < 1_000_000, "under $1M");
  addCount("Cap under $10M", (row) => row.marketCapUsd != null && row.marketCapUsd < 10_000_000, "under $10M");
  addCount("Cap at least $100M", (row) => row.marketCapUsd != null && row.marketCapUsd >= 100_000_000, "at $100M or more");
  addCount("Cap missing", (row) => row.marketCapUsd == null, "missing cap");
  addCount("Memecoins", (row) => row.tokenSectors.some((sector) => sector.toLowerCase().includes("meme")), "tagged memecoin");
  addMedian("Median |24h|", (row) => Math.abs(row.netFlow24hUsd), "usd");
  addMedian("Median 24h", (row) => row.netFlow24hUsd, "usd");
  addMedian("Median |7d|", (row) => (row.netFlow7dUsd == null ? null : Math.abs(row.netFlow7dUsd)), "usd");
  addMedian("Median 7d", (row) => row.netFlow7dUsd, "usd");
  addMedian("Median |30d|", (row) => (row.netFlow30dUsd == null ? null : Math.abs(row.netFlow30dUsd)), "usd");
  addMedian("Median 30d", (row) => row.netFlow30dUsd, "usd");
  addMedian("Median |1h|", (row) => (row.netFlow1hUsd == null ? null : Math.abs(row.netFlow1hUsd)), "usd");
  addMedian("Median traders", (row) => row.traderCount, "count");
  addMedian("Median age", (row) => row.tokenAgeDays, "days");
  addMedian("Median market cap", (row) => row.marketCapUsd, "usd");
  return rows;
}

const KEPT_TOKEN_MEASURES = ["Sector", "Chain", "7d sign ≠ 30d", "Median traders", "Median age", "Median market cap"] as const;

/** The token ladder. The rank is already the size of the move, so the other counts stay off this table. */
export function keptTokenMeasures(rows: TokenMeasure[]): TokenMeasure[] {
  const byName = new Map(rows.map((row) => [row.name, row]));
  return KEPT_TOKEN_MEASURES.flatMap((name) => {
    const row = byName.get(name);
    return row ? [row] : [];
  });
}

function countGap(bar: number, climb: number, noun: string): string {
  const delta = climb - bar;
  if (delta === 0) return "The quieter names are level with the bar.";
  if (delta < 0) return `The quieter names have ${Math.abs(delta)} fewer ${noun}.`;
  return `The quieter names have ${delta} more ${noun}.`;
}

function nameGap(barNames: string[], climbNames: string[], barCount: number, climbCount: number, noun: string): string {
  if (barNames.join("|") !== climbNames.join("|")) return `The quieter names do not share the loud group's ${noun}.`;
  const delta = climbCount - barCount;
  if (delta === 0) return `The quieter names already share the loud group's ${noun}.`;
  if (delta < 0) return `Same ${noun}. The quieter names have ${Math.abs(delta)} fewer tokens on it.`;
  return `Same ${noun}. The quieter names have ${delta} more tokens on it.`;
}

function groupLabel(names: string[], count: number, total: number): string {
  if (names.length === 0 || total === 0) return "This side has no number.";
  const each = names.length > 1 ? "each " : "";
  return `${names.join(", ")} is the common label, ${each}${count} of ${total} names.`;
}

type MeasureKind = "count" | "days" | "usd" | "share" | "ratio" | "pct";

function measureCell(value: number | null, presentCount: number, total: number, kind: MeasureKind): string {
  if (presentCount === 0 || value == null) return "This side has no number.";
  const body = measureBody(value, kind);
  if (presentCount < total) return `The middle of this group is ${body}. Only ${presentCount} of ${total} names had a number.`;
  return `The middle of this group is ${body}.`;
}

function medianGap(bar: number | null, climb: number | null, kind: MeasureKind): string {
  if (bar == null || climb == null) return "This side has no number.";
  const delta = climb - bar;
  const abs = Math.abs(delta);
  const level = kind === "usd" ? abs < 1 : kind === "share" || kind === "pct" ? abs < 0.005 : abs < 0.05;
  if (level) return "The quieter names are level with the bar.";
  const body = measureBody(abs, kind);
  if (delta < 0) {
    if (kind === "days") return `The quieter names are ${body} younger than the bar.`;
    if (kind === "usd" || kind === "share" || kind === "pct" || kind === "ratio") return `The quieter names are ${body} short of the bar.`;
    return `The quieter names are ${body} fewer than the bar.`;
  }
  if (kind === "days") return `The quieter names are ${body} older than the bar.`;
  if (kind === "usd" || kind === "share" || kind === "pct" || kind === "ratio") return `The quieter names are ${body} above the bar.`;
  return `The quieter names are ${body} more than the bar.`;
}

function fillMeasure(row: { name: string; bar: string; climb: string; gap: string }): TokenMeasure {
  return {
    ...row,
    barPlain: kidCell(row.bar, "loud"),
    climbPlain: kidCell(row.climb, "quiet"),
    gapPlain: kidCell(row.gap, "gap"),
  };
}

function kidCell(text: string, side: "loud" | "quiet" | "gap"): string {
  if (text === "This side has no number.") return "This side has no number.";
  if (side === "loud") return text.replaceAll("names", "loud coins").replaceAll("this group", "the loud coins");
  if (side === "quiet") return text.replaceAll("names", "quiet coins").replaceAll("this group", "the quiet coins");
  return text.replaceAll("quieter names", "quiet coins").replaceAll("the bar", "the loud coins");
}

function ladderMedian(name: string, bar: number | null, climb: number | null, kind: MeasureKind): TokenMeasure {
  return fillMeasure({
    name,
    bar: measureCell(bar, bar == null ? 0 : 1, 1, kind),
    climb: measureCell(climb, climb == null ? 0 : 1, 1, kind),
    gap: medianGap(bar, climb, kind),
  });
}

function halfStat(rows: FlowRow[]): HalfStat {
  const sectorLabels: string[] = [];
  for (const row of rows) {
    for (const sector of new Set(row.tokenSectors)) sectorLabels.push(sector);
  }
  const sector = mode(sectorLabels, rows.length);
  const chain = mode(
    rows.map((row) => row.chain),
    rows.length,
  );
  const traders = rows.map((row) => row.traderCount).filter((value): value is number => value != null);
  const ages = rows.map((row) => row.tokenAgeDays).filter((value): value is number => value != null);
  const caps = rows.map((row) => row.marketCapUsd).filter((value): value is number => value != null);
  const flipCount = rows.filter((row) => signFlip(row.netFlow7dUsd, row.netFlow30dUsd)).length;
  return {
    count: rows.length,
    sectors: sector.names,
    sectorCount: sector.count,
    sectorShare: sector.share,
    chains: chain.names,
    chainCount: chain.count,
    chainShare: chain.share,
    flipCount,
    flipShare: rows.length === 0 ? null : flipCount / rows.length,
    medianTraders: median(traders),
    medianAgeDays: median(ages),
    medianMarketCapUsd: median(caps),
    tradersPresent: traders.length,
    agePresent: ages.length,
    marketCapPresent: caps.length,
  };
}

function mode(labels: string[], total: number): { names: string[]; count: number; share: number | null } {
  if (total === 0 || labels.length === 0) return { names: [], count: 0, share: null };
  const counts = new Map<string, number>();
  for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1);
  let best = 0;
  for (const count of counts.values()) if (count > best) best = count;
  const names = [...counts.keys()].filter((name) => counts.get(name) === best).sort();
  return { names, count: best, share: best / total };
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function halfLines(
  pageCount: number,
  top: HalfStat,
  rest: HalfStat,
): { frame: string; common: string[]; meaningful: string[] } {
  if (pageCount === 0) {
    return { frame: "This page has no tokens.", common: [], meaningful: [] };
  }
  if (rest.count === 0) {
    return {
      frame: `This list has ${pageCount} tokens, not 100, and fewer than 50, so there is nothing quieter to set beside them.`,
      common: [],
      meaningful: [],
    };
  }
  const frame = pageCount < NETFLOW_PER_PAGE
    ? `${pageCount} tokens, not 100. The ${top.count} largest 24h moves, then ${rest.count} quieter names on this list. The rank is the size of the move.`
    : `The ${top.count} largest 24h moves, then ${pageCount - top.count} quieter names on this list. The rank is the size of the move.`;
  const common: string[] = [];
  const meaningful: string[] = [];
  place(
    common,
    meaningful,
    groupSplit("sector", top.sectors, top.sectorCount, top.count, rest.sectors, rest.sectorCount, rest.count),
  );
  place(
    common,
    meaningful,
    groupSplit("chain", top.chains, top.chainCount, top.count, rest.chains, rest.chainCount, rest.count),
  );
  place(common, meaningful, flipSplit(top, rest));
  place(
    common,
    meaningful,
    medianSplit("Wallets in the name. How many smart-money wallets traded it", top.medianTraders, top.tradersPresent, top.count, rest.medianTraders, rest.tradersPresent, rest.count, "count"),
  );
  place(
    common,
    meaningful,
    medianSplit("Age. How many days since the token was deployed", top.medianAgeDays, top.agePresent, top.count, rest.medianAgeDays, rest.agePresent, rest.count, "days"),
  );
  place(
    common,
    meaningful,
    medianSplit(
      "Size now. Market cap today, not the cap when someone bought",
      top.medianMarketCapUsd,
      top.marketCapPresent,
      top.count,
      rest.medianMarketCapUsd,
      rest.marketCapPresent,
      rest.count,
      "usd",
    ),
  );
  return { frame, common, meaningful };
}

function place(common: string[], meaningful: string[], item: { match: boolean; text: string }) {
  (item.match ? common : meaningful).push(item.text);
}

function groupSplit(
  kind: "sector" | "chain",
  topNames: string[],
  topCount: number,
  topTotal: number,
  restNames: string[],
  restCount: number,
  restTotal: number,
): { match: boolean; text: string } {
  const same = topNames.join("\0") === restNames.join("\0");
  if (!same) {
    return {
      match: false,
      text: `${kind === "sector" ? "Sector. The crowd the name sits in." : "Chain. Where the move happened."} Biggest moves: ${groupText(topNames, topCount, topTotal)} Quieter names: ${groupText(restNames, restCount, restTotal)}`,
    };
  }
  if (topNames.length === 0) {
    return { match: true, text: kind === "sector" ? "Sector. Neither side has a crowd." : "Chain. Neither side has a crowd." };
  }
  const label = topNames.length > 1 ? topNames.join(" and ") : topNames[0];
  return {
    match: true,
    text: `${kind === "sector" ? "Sector. The crowd the name sits in." : "Chain. Where the move happened."} Same either way: ${label}. Biggest moves ${topCount} of ${topTotal}. Quieter names ${restCount} of ${restTotal}.`,
  };
}

function flipSplit(top: HalfStat, rest: HalfStat): { match: boolean; text: string } {
  const same = top.flipCount * rest.count === rest.flipCount * top.count;
  const caveat = "A zero, or a missing window, is not a flip.";
  if (same) {
    return {
      match: true,
      text: `Sign flip. Week and month point different ways. Same either way. Biggest moves ${top.flipCount} of ${top.count}. Quieter names ${rest.flipCount} of ${rest.count}. ${caveat}`,
    };
  }
  return {
    match: false,
    text: `Sign flip. Week and month point different ways. Biggest moves ${top.flipCount} of ${top.count}. Quieter names ${rest.flipCount} of ${rest.count}. ${caveat}`,
  };
}

function groupText(names: string[], count: number, total: number): string {
  if (names.length === 0) return "absent.";
  const each = names.length > 1 ? "each " : "";
  return `${names.join(", ")}, ${each}${count} of ${total}.`;
}

function medianSplit(
  label: string,
  topValue: number | null,
  topPresent: number,
  topTotal: number,
  restValue: number | null,
  restPresent: number,
  restTotal: number,
  kind: "count" | "days" | "usd" | "pct",
): { match: boolean; text: string } {
  const topText = medianText(topValue, topPresent, topTotal, kind);
  const restText = medianText(restValue, restPresent, restTotal, kind);
  if (topValue == null && restValue == null) return { match: true, text: `${label}. Neither side has a number.` };
  if (topValue != null && topValue === restValue) {
    const figure = kind === "usd" ? formatUsd(topValue) : kind === "days" ? `${plainNumber(topValue)} days` : kind === "pct" ? percentText(topValue) : plainNumber(topValue);
    const partial = topPresent < topTotal || restPresent < restTotal
      ? ` First 50 with a number: ${topPresent} of ${topTotal}. Others with a number: ${restPresent} of ${restTotal}.`
      : "";
    return { match: true, text: `${label}. Same either way: ${figure}.${partial}` };
  }
  return { match: false, text: `${label}. First 50: ${topText}. The others: ${restText}.` };
}

function medianText(value: number | null, present: number, total: number, kind: "count" | "days" | "usd" | "pct"): string {
  if (present === 0 || value == null) return "absent";
  const body = kind === "usd" ? formatUsd(value) : kind === "days" ? `${plainNumber(value)} days` : kind === "pct" ? percentText(value) : plainNumber(value);
  if (present < total) return `${body} (${present} of ${total} present)`;
  return body;
}

function percentText(fraction: number): string {
  const pct = fraction * 100;
  if (pct === 0) return "0%";
  const abs = Math.abs(pct);
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : abs >= 0.01 ? 2 : 4;
  const text = pct.toFixed(digits).replace(/\.?0+$/, "");
  return `${text}%`;
}

function plainNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  const nearest = Math.round(value * 10) / 10;
  return Number.isInteger(nearest) ? nearest.toFixed(1) : String(nearest);
}

const TRADER_TOP = 50;
const ADDRESS_FIELDS = ["token_address", "address"] as const;
const SYMBOL_FIELDS = ["token_symbol", "symbol"] as const;

export type TokenKeyKind = "address" | "symbol";

export type TraderRow = {
  address: string;
  totalPnlUsd: number;
  nTokens: number;
  heldTokensCount: number;
  nTrades: number;
  openTrades: number;
  realizedPnlUsd: number;
  winRate: number | null;
  avgTradeRoi: number | null;
  unrealizedRoiPercent: number | null;
  traded: string[];
  balance: string[];
};

export type DexBuy = {
  traderAddress: string;
  boughtAgeDays: number | null;
  boughtMarketCap: number | null;
  tokenSymbol?: string | null;
  tokenAddress?: string | null;
  tradeValueUsd?: number | null;
  soldAgeDays?: number | null;
};

export type TraderRead = {
  pageCount: number;
  frame: string;
  common: string[];
  meaningful: string[];
  unscored: string | null;
};

function rankTraders(rows: TraderRow[]): TraderRow[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const gap = b.row.totalPnlUsd - a.row.totalPnlUsd;
      if (gap !== 0) return gap;
      return a.index - b.index;
    })
    .map((item) => item.row);
}

/** First 50 by total PnL that carry an address. Solana addresses stay exact. */
export function profitCutAddresses(rows: TraderRow[]): string[] {
  const addresses: string[] = [];
  for (const row of rankTraders(rows).slice(0, TRADER_TOP)) {
    if (row.address) addresses.push(row.address);
  }
  return addresses;
}

/** Token keys the top 50 wallets list as traded. Empty when the page has no token key. */
export function tradedKeys(rows: TraderRow[]): string[] {
  const keys = new Set<string>();
  for (const row of rankTraders(rows).slice(0, TRADER_TOP)) {
    for (const key of row.traded) keys.add(key);
  }
  return [...keys];
}

/** Comparisons 1–8. Profit is only the cut. One parsed page, no second call. */
export function traderComparisons(rows: TraderRow[], isLastPage: boolean, keyKind: TokenKeyKind | null): TraderRead {
  const ranked = rankTraders(rows);
  const cut = Math.min(TRADER_TOP, ranked.length);
  const top = ranked.slice(0, cut);
  const rest = ranked.slice(cut);
  if (ranked.length === 0) {
    return { pageCount: 0, frame: "This page has no wallets.", common: [], meaningful: [], unscored: null };
  }
  if (rest.length === 0) {
    return {
      pageCount: ranked.length,
      frame: `This list has ${ranked.length} wallets. Fewer than 50, so there is no one to set them beside.`,
      common: [],
      meaningful: [],
      unscored: null,
    };
  }
  const size = ranked.length < LEADERBOARD_PER_PAGE
    ? `${ranked.length} Solana wallets over 30 days, ordered by profit, not ${LEADERBOARD_PER_PAGE}. The first 50 made the most. The other ${rest.length} are the rest of this list.`
    : `The first 50 made the most over 30 days. The other ${rest.length} are the rest of this list.`;
  const frame = isLastPage ? size : `${size} The list stops here. The other wallets are this page, not everyone.`;
  const common: string[] = [];
  const meaningful: string[] = [];
  place(common, meaningful, countSplit("Names traded. How many different tokens they touched", top.map((row) => row.nTokens), rest.map((row) => row.nTokens)));
  place(common, meaningful, ratioSplit("Still holding. Of the names they traded, the share they still hold", top, rest, heldShare, "share"));
  place(common, meaningful, ratioSplit("Still open. Of their trades, the share that has not closed", top, rest, openShare, "share"));
  place(common, meaningful, ratioSplit("Already banked. Of a profit, the share that is realized, not still on paper", top, rest, realizedShare, "share"));
  place(common, meaningful, countSplit("Wins. The share of trades that made money. The rank is dollars, not this", top.map((row) => row.winRate), rest.map((row) => row.winRate), "share"));
  place(common, meaningful, ratioSplit("Repeat buys. Trades per token. Going back to a name, not only opening new ones", top, rest, tradesPerToken, "ratio"));
  const unscored = keyKind == null
    ? "Shared tokens and the bag match need a token name on each wallet. This list has none, so those two stay blank."
    : null;
  if (keyKind != null) {
    place(common, meaningful, overlapSplit(top, rest));
    place(common, meaningful, ratioSplit("Bag matches the trades. Of what they hold now, the share that is also a name they traded", top, rest, bagShare, "share"));
  }
  return { pageCount: ranked.length, frame, common, meaningful, unscored };
}

/** The eight habits, as the same four columns as the token ladder. */
export function traderMeasures(rows: TraderRow[], keyKind: TokenKeyKind | null): TokenMeasure[] {
  const ranked = rankTraders(rows);
  const top = ranked.slice(0, Math.min(TRADER_TOP, ranked.length));
  const rest = ranked.slice(top.length);
  if (top.length === 0 || rest.length === 0) return [];
  const measures = [
    ladderMedian("Names traded", median(present(top.map((row) => row.nTokens))), median(present(rest.map((row) => row.nTokens))), "count"),
    ladderMedian("Still holding", median(present(top.map(heldShare))), median(present(rest.map(heldShare))), "share"),
    ladderMedian("Still open", median(present(top.map(openShare))), median(present(rest.map(openShare))), "share"),
    ladderMedian("Already banked", median(present(top.map(realizedShare))), median(present(rest.map(realizedShare))), "share"),
    ladderMedian("Wins", median(present(top.map((row) => row.winRate))), median(present(rest.map((row) => row.winRate))), "share"),
    ladderMedian("Repeat buys", median(present(top.map(tradesPerToken))), median(present(rest.map(tradesPerToken))), "ratio"),
  ];
  if (keyKind == null) return measures;
  return [
    ...measures,
    ladderMedian("Same names", meanOverlap(top), meanOverlap(rest), "share"),
    ladderMedian("Bag matches the trades", median(present(top.map(bagShare))), median(present(rest.map(bagShare))), "share"),
  ];
}

function heldShare(row: TraderRow): number | null {
  if (row.nTokens === 0) return null;
  return row.heldTokensCount / row.nTokens;
}

function openShare(row: TraderRow): number | null {
  if (row.nTrades === 0) return null;
  return row.openTrades / row.nTrades;
}

function realizedShare(row: TraderRow): number | null {
  if (row.totalPnlUsd <= 0) return null;
  return row.realizedPnlUsd / row.totalPnlUsd;
}

function tradesPerToken(row: TraderRow): number | null {
  if (row.nTokens === 0) return null;
  return row.nTrades / row.nTokens;
}

function bagShare(row: TraderRow): number | null {
  if (row.balance.length === 0) return null;
  const traded = new Set(row.traded);
  let hit = 0;
  for (const key of row.balance) if (traded.has(key)) hit += 1;
  return hit / row.balance.length;
}

function countSplit(
  label: string,
  topValues: (number | null)[],
  restValues: (number | null)[],
  kind: "count" | "share" = "count",
): { match: boolean; text: string } {
  return figureSplit(label, present(topValues), topValues.length, present(restValues), restValues.length, kind);
}

function ratioSplit(
  label: string,
  top: TraderRow[],
  rest: TraderRow[],
  pick: (row: TraderRow) => number | null,
  kind: "share" | "ratio",
): { match: boolean; text: string } {
  return figureSplit(label, present(top.map(pick)), top.length, present(rest.map(pick)), rest.length, kind);
}

function figureSplit(
  label: string,
  topValues: number[],
  topTotal: number,
  restValues: number[],
  restTotal: number,
  kind: "count" | "share" | "ratio",
): { match: boolean; text: string } {
  const topValue = median(topValues);
  const restValue = median(restValues);
  if (topValue == null && restValue == null) return { match: true, text: `${label}. Neither side has a number.` };
  const topText = figureText(topValue, kind);
  const restText = figureText(restValue, kind);
  if (topText === restText && topValue != null) {
    return { match: true, text: `${label}. Same either way: ${topText}.` };
  }
  return {
    match: false,
    text: `${label}. Who made the money: ${sideText(topText, topValues.length, topTotal)}. The other wallets: ${sideText(restText, restValues.length, restTotal)}.`,
  };
}

function sideText(text: string, presentCount: number, total: number): string {
  if (text === "absent") return "absent";
  if (presentCount < total) return `${text} (${presentCount} of ${total})`;
  return text;
}

function figureText(value: number | null, kind: "count" | "share" | "ratio"): string {
  if (value == null) return "absent";
  if (kind === "count") return plainNumber(value);
  if (kind === "ratio") return ratioText(value);
  return shareText(value);
}

function shareText(value: number): string {
  if (value < 0 || value > 1) return ratioText(value);
  const pct = Math.round(value * 1000) / 10;
  return Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1)}%`;
}

function ratioText(value: number): string {
  const nearest = Math.round(value * 100) / 100;
  return Number.isInteger(nearest) ? String(nearest) : nearest.toFixed(2);
}

function overlapSplit(top: TraderRow[], rest: TraderRow[]): { match: boolean; text: string } {
  const topMean = meanOverlap(top);
  const restMean = meanOverlap(rest);
  const topSets = setsWithKeys(top).length;
  const restSets = setsWithKeys(rest).length;
  if (topMean == null && restMean == null) {
    return { match: true, text: "Same names. How much these wallets traded the same tokens as each other. Fewer than two wallets on each side list a token." };
  }
  if (topMean != null && shareText(topMean) === (restMean == null ? "" : shareText(restMean))) {
    return { match: true, text: `Same names. How much these wallets traded the same tokens as each other. Same either way: ${shareText(topMean)}.` };
  }
  return {
    match: false,
    text: `Same names. How much these wallets traded the same tokens as each other. Who made the money: ${overlapText(topMean, topSets)}. The other wallets: ${overlapText(restMean, restSets)}.`,
  };
}

function overlapText(value: number | null, wallets: number): string {
  if (value == null) return "absent";
  return `${shareText(value)} (${wallets} wallets)`;
}

function meanOverlap(rows: TraderRow[]): number | null {
  const sets = setsWithKeys(rows);
  if (sets.length < 2) return null;
  let sum = 0;
  let pairs = 0;
  for (let i = 0; i < sets.length; i += 1) {
    for (let j = i + 1; j < sets.length; j += 1) {
      sum += jaccard(sets[i], sets[j]);
      pairs += 1;
    }
  }
  return pairs === 0 ? null : sum / pairs;
}

function setsWithKeys(rows: TraderRow[]): Set<string>[] {
  return rows.filter((row) => row.traded.length > 0).map((row) => new Set(row.traded));
}

function jaccard(left: Set<string>, right: Set<string>): number {
  let shared = 0;
  for (const key of left) if (right.has(key)) shared += 1;
  const union = left.size + right.size - shared;
  return union === 0 ? 0 : shared / union;
}

function present(values: (number | null)[]): number[] {
  return values.filter((value): value is number => value != null);
}

export function parseLeaderboard(body: unknown): { rows: TraderRow[]; isLastPage: boolean; keyKind: TokenKeyKind | null } {
  if (!body || typeof body !== "object") {
    throw new Error("Nansen returned a body this desk cannot read.");
  }
  const record = body as { data?: unknown; pagination?: { is_last_page?: unknown } };
  if (!Array.isArray(record.data)) throw new Error("Nansen returned no data array.");
  const keyKind = detectKeyKind(record.data);
  const rows: TraderRow[] = [];
  for (const item of record.data) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const total = readNumber(row.total_pnl_usd);
    const nTokens = readNumber(row.n_tokens);
    const held = readNumber(row.held_tokens_count);
    const trades = readNumber(row.n_trades);
    const open = readNumber(row.open_trades);
    const realized = readNumber(row.realized_pnl_usd);
    if (total == null || nTokens == null || held == null || trades == null || open == null || realized == null) continue;
    const address = typeof row.address === "string" ? row.address : "";
    rows.push({
      address,
      totalPnlUsd: total,
      nTokens,
      heldTokensCount: held,
      nTrades: trades,
      openTrades: open,
      realizedPnlUsd: realized,
      winRate: readNumber(row.win_rate),
      avgTradeRoi: readNumber(row.avg_trade_roi),
      unrealizedRoiPercent: readNumber(row.roi_percent_unrealised),
      traded: tokenKeys(row.top_traded_tokens_info, keyKind),
      balance: tokenKeys(row.top_5_balance_tokens_info, keyKind),
    });
  }
  if (record.data.length > 0 && rows.length === 0) {
    throw new Error("Nansen rows were missing the fields this desk reads.");
  }
  return { rows, isLastPage: record.pagination?.is_last_page !== false, keyKind };
}

function detectKeyKind(data: unknown[]): TokenKeyKind | null {
  let symbol = false;
  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    for (const list of [row.top_traded_tokens_info, row.top_5_balance_tokens_info]) {
      if (!Array.isArray(list)) continue;
      for (const entry of list) {
        if (fieldValue(entry, ADDRESS_FIELDS) != null) return "address";
        if (fieldValue(entry, SYMBOL_FIELDS) != null) symbol = true;
      }
    }
  }
  return symbol ? "symbol" : null;
}

function tokenKeys(value: unknown, keyKind: TokenKeyKind | null): string[] {
  if (keyKind == null || !Array.isArray(value)) return [];
  const fields = keyKind === "address" ? ADDRESS_FIELDS : SYMBOL_FIELDS;
  const keys = new Set<string>();
  for (const entry of value) {
    const key = fieldValue(entry, fields);
    if (key) keys.add(key);
  }
  return [...keys];
}

function fieldValue(entry: unknown, fields: readonly string[]): string | null {
  if (!entry || typeof entry !== "object") return null;
  const record = entry as Record<string, unknown>;
  for (const field of fields) {
    const value = record[field];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

/**
 * Comparisons 18 and 19. Each wallet contributes the median of its buys on this
 * page. A top-50 wallet with no buy is absent. The rest are other printers.
 */
export function buyComparisons(topAddresses: string[], buys: DexBuy[], isLastPage: boolean): TraderRead {
  const topSet = new Set(topAddresses);
  const topBuckets = new Map<string, DexBuy[]>();
  for (const address of topAddresses) topBuckets.set(address, []);
  const restBuckets = new Map<string, DexBuy[]>();
  for (const buy of buys) {
    const bucket = topSet.has(buy.traderAddress) ? topBuckets.get(buy.traderAddress) : undefined;
    if (bucket) {
      bucket.push(buy);
      continue;
    }
    const other = restBuckets.get(buy.traderAddress);
    if (other) other.push(buy);
    else restBuckets.set(buy.traderAddress, [buy]);
  }
  const short = buys.length < DEX_TRADES_PER_PAGE ? `, short of ${DEX_TRADES_PER_PAGE}` : "";
  const pageNote = isLastPage ? "" : " The tape stops at this page.";
  if (buys.length === 0) {
    return { pageCount: 0, frame: `No buys on this tape${short}.`, common: [], meaningful: [], unscored: null };
  }
  if (topAddresses.length === 0) {
    return {
      pageCount: buys.length,
      frame: `This print page has ${buys.length} buys${short}. The leaderboard cut has no addresses, so the buys are not split.${pageNote}`,
      common: [],
      meaningful: [],
      unscored: null,
    };
  }
  const restWallets = [...restBuckets.keys()];
  const named = topAddresses.length === TRADER_TOP ? "The 50 who made the most" : `The ${topAddresses.length} who made the most`;
  const frame = `${buys.length} buys in the last 24 hours${short}. ${named}. ${boughtCount(topBuckets)} of them bought on this tape. ${restWallets.length} other wallets also bought. A wallet with no buy today is left out.${pageNote}`;
  if (restWallets.length === 0) {
    return {
      pageCount: buys.length,
      frame: `${frame} No other wallet bought, so there is no one to set them beside.`,
      common: [],
      meaningful: [],
      unscored: null,
    };
  }
  const topAge = walletMedians(topBuckets, "age");
  const restAge = walletMedians(restBuckets, "age");
  const topCap = walletMedians(topBuckets, "cap");
  const restCap = walletMedians(restBuckets, "cap");
  const common: string[] = [];
  const meaningful: string[] = [];
  place(common, meaningful, medianSplit(
    "When. How old the token was on the buy",
    topAge.value,
    topAge.present,
    topAddresses.length,
    restAge.value,
    restAge.present,
    restWallets.length,
    "days",
  ));
  place(common, meaningful, medianSplit(
    "Size at the buy. Market cap then, not the cap now",
    topCap.value,
    topCap.present,
    topAddresses.length,
    restCap.value,
    restCap.present,
    restWallets.length,
    "usd",
  ));
  const topValue = walletMedians(topBuckets, "value");
  const restValue = walletMedians(restBuckets, "value");
  if (topValue.value != null || restValue.value != null) {
    place(common, meaningful, medianSplit(
      "Dollars on the print. How much the buy was, not the size of the coin",
      topValue.value,
      topValue.present,
      topAddresses.length,
      restValue.value,
      restValue.present,
      restWallets.length,
      "usd",
    ));
  }
  const topSold = walletMedians(topBuckets, "soldAge");
  const restSold = walletMedians(restBuckets, "soldAge");
  if (topSold.value != null || restSold.value != null) {
    place(common, meaningful, medianSplit(
      "What they sold. How old that token was",
      topSold.value,
      topSold.present,
      topAddresses.length,
      restSold.value,
      restSold.present,
      restWallets.length,
      "days",
    ));
  }
  const topPrints = [...topBuckets.values()].map((items) => items.length).filter((count) => count > 0);
  const restPrints = [...restBuckets.values()].map((items) => items.length).filter((count) => count > 0);
  place(common, meaningful, medianSplit(
    "Prints today. Buys on this tape, per wallet",
    median(topPrints),
    topPrints.length,
    topPrints.length,
    median(restPrints),
    restPrints.length,
    restPrints.length,
    "count",
  ));
  return { pageCount: buys.length, frame, common, meaningful, unscored: null };
}

/** Age and cap at the buy, in the same four columns as the token ladder. */
export function printMeasures(topAddresses: string[], buys: DexBuy[]): TokenMeasure[] {
  const topSet = new Set(topAddresses);
  const topBuckets = new Map<string, DexBuy[]>();
  for (const address of topAddresses) topBuckets.set(address, []);
  const restBuckets = new Map<string, DexBuy[]>();
  for (const buy of buys) {
    const bucket = topSet.has(buy.traderAddress) ? topBuckets.get(buy.traderAddress) : undefined;
    if (bucket) {
      bucket.push(buy);
      continue;
    }
    const other = restBuckets.get(buy.traderAddress);
    if (other) other.push(buy);
    else restBuckets.set(buy.traderAddress, [buy]);
  }
  if (topAddresses.length === 0 || restBuckets.size === 0) return [];
  const topAge = walletMedians(topBuckets, "age");
  const restAge = walletMedians(restBuckets, "age");
  const topCap = walletMedians(topBuckets, "cap");
  const restCap = walletMedians(restBuckets, "cap");
  return [
    ladderMedian("Age at the buy", topAge.value, restAge.value, "days"),
    ladderMedian("Size at the buy", topCap.value, restCap.value, "usd"),
  ];
}

function boughtCount(buckets: Map<string, DexBuy[]>): number {
  let count = 0;
  for (const buys of buckets.values()) if (buys.length > 0) count += 1;
  return count;
}

type BuyField = "age" | "cap" | "value" | "soldAge";

function buyField(buy: DexBuy, field: BuyField): number | null {
  switch (field) {
    case "age":
      return buy.boughtAgeDays;
    case "cap":
      return buy.boughtMarketCap;
    case "value":
      return buy.tradeValueUsd ?? null;
    case "soldAge":
      return buy.soldAgeDays ?? null;
    default: {
      const exhaustive: never = field;
      return exhaustive;
    }
  }
}

function walletMedians(
  buckets: Map<string, DexBuy[]>,
  field: BuyField,
): { value: number | null; present: number } {
  const values: number[] = [];
  for (const buys of buckets.values()) {
    const picked: number[] = [];
    for (const buy of buys) {
      const value = buyField(buy, field);
      if (value != null) picked.push(value);
    }
    const wallet = median(picked);
    if (wallet != null) values.push(wallet);
  }
  return { value: median(values), present: values.length };
}

export function parseDexTrades(body: unknown): { buys: DexBuy[]; isLastPage: boolean } {
  if (!body || typeof body !== "object") {
    throw new Error("Nansen returned a body this desk cannot read.");
  }
  const record = body as { data?: unknown; pagination?: { is_last_page?: unknown } };
  if (!Array.isArray(record.data)) throw new Error("Nansen returned no data array.");
  const buys: DexBuy[] = [];
  for (const item of record.data) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (typeof row.trader_address !== "string" || !row.trader_address) continue;
    buys.push({
      traderAddress: row.trader_address,
      boughtAgeDays: readNumber(row.token_bought_age_days),
      boughtMarketCap: readNumber(row.token_bought_market_cap),
      tokenSymbol: typeof row.token_bought_symbol === "string" ? row.token_bought_symbol : null,
      tokenAddress: typeof row.token_bought_address === "string" ? row.token_bought_address : typeof row.token_address === "string" ? row.token_address : null,
      tradeValueUsd: readNumber(row.trade_value_usd),
      soldAgeDays: readNumber(row.token_sold_age_days),
    });
  }
  if (record.data.length > 0 && buys.length === 0) {
    throw new Error("Nansen rows were missing the fields this desk reads.");
  }
  return { buys, isLastPage: record.pagination?.is_last_page !== false };
}

export type HoldingRow = {
  chain: string;
  symbol: string;
  address: string;
  sectors: string[];
  holdersCount: number;
  valueUsd: number | null;
  change24hPercent: number | null;
  sharePercent: number | null;
  marketCapUsd: number | null;
  ageDays: number | null;
};

/** Holdings board. Holder count is only the cut. */
export function holdingComparisons(rows: HoldingRow[], isLastPage: boolean): TraderRead {
  const ranked = rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const gap = b.row.holdersCount - a.row.holdersCount;
      if (gap !== 0) return gap;
      return a.index - b.index;
    })
    .map((item) => item.row);
  const short = ranked.length < HOLDINGS_PER_PAGE ? `, not ${HOLDINGS_PER_PAGE},` : "";
  const pageNote = isLastPage ? "" : " The list stops at this page.";
  if (ranked.length === 0) {
    return { pageCount: 0, frame: `This page has no holdings${short}.`, common: [], meaningful: [], unscored: null };
  }
  const cut = Math.min(TRADER_TOP, ranked.length);
  const top = ranked.slice(0, cut);
  const rest = ranked.slice(cut);
  if (rest.length === 0) {
    return {
      pageCount: ranked.length,
      frame: `${ranked.length} holdings${short}. Fewer than 50, so there is nothing thinner to set beside them.${pageNote}`,
      common: [],
      meaningful: [],
      unscored: null,
    };
  }
  const frame = `${ranked.length} holdings${short}. The ${cut} tokens the most wallets still hold, then ${rest.length} thinner names. Wallet count only orders the list.${pageNote}`;
  const common: string[] = [];
  const meaningful: string[] = [];
  place(common, meaningful, holdingSplit("Dollars still there. What the wallets hold, in USD", top, rest, (row) => row.valueUsd, "usd"));
  place(common, meaningful, holdingSplit("Today. How much that pile changed in 24 hours", top, rest, (row) => row.change24hPercent, "pct"));
  place(common, meaningful, holdingSplit("Share of the pile. This name against everything they hold", top, rest, (row) => row.sharePercent, "pct"));
  place(common, meaningful, holdingSplit("Size now. Market cap today", top, rest, (row) => row.marketCapUsd, "usd"));
  return { pageCount: ranked.length, frame, common, meaningful, unscored: null };
}

/** Holder count only orders the list. These four say what that order leaves out. */
export function holdingMeasures(rows: HoldingRow[]): TokenMeasure[] {
  const ranked = [...rows].sort((a, b) => b.holdersCount - a.holdersCount);
  const top = ranked.slice(0, Math.min(TRADER_TOP, ranked.length));
  const rest = ranked.slice(top.length);
  if (top.length === 0 || rest.length === 0) return [];
  const pick = (side: HoldingRow[], read: (row: HoldingRow) => number | null) => median(present(side.map(read)));
  return [
    ladderMedian("Dollars still there", pick(top, (row) => row.valueUsd), pick(rest, (row) => row.valueUsd), "usd"),
    ladderMedian("Today", pick(top, (row) => row.change24hPercent), pick(rest, (row) => row.change24hPercent), "pct"),
    ladderMedian("Share of the pile", pick(top, (row) => row.sharePercent), pick(rest, (row) => row.sharePercent), "pct"),
    ladderMedian("Size now", pick(top, (row) => row.marketCapUsd), pick(rest, (row) => row.marketCapUsd), "usd"),
  ];
}

const PRICED_CAP_USD = 100_000_000;
const THIN_VALUE_USD = 100_000;
const THIN_CAP_USD = 20_000_000;
const THIN_AGE_DAYS = 7;
const THIN_CHANGE_FLOOR = -0.05;
const THIN_CHANGE_CAP = 0.15;
const MOVE_CHANGE = 0.15;
const BAG_CHANGE = -0.05;
const FRESH_AGE_DAYS = 3;
const BALLAST_SHARE = 0.5;

export type HoldingSeat = "priced" | "overlap" | "moving" | "bag" | "fat";

export type HoldingTraitName = {
  symbol: string;
  holders: number;
  valueUsd: number | null;
  detail: string;
};

export type HoldingTraitBlock = {
  title: string;
  line: string;
  names: HoldingTraitName[];
};

export type QuestTrait = {
  id: string;
  title: string;
  line: string;
  plain?: string;
};

export type QuestTable = {
  caption: string;
  columns: string[];
  nameLabels: [string, string];
  rows: { name: string; top: string; topPlain: string; topNames: string[]; bottom: string; bottomPlain: string; bottomNames: string[] }[];
};

export type QuestSection = {
  id: string;
  title: string;
  traits: QuestTrait[];
  table?: QuestTable;
};

export type HoldingTraits = {
  lines: string[];
  blocks: HoldingTraitBlock[];
  quest: QuestSection[];
};

type Seated = HoldingRow & { seat: HoldingSeat };

/** Traits on one holdings page. Holder count stays the overlap cut. No order. */
export function holdingTraits(rows: HoldingRow[], isLastPage: boolean): HoldingTraits {
  const crowd = crowdCut(rows);
  const seated = rows.flatMap((row) => {
    const seat = seatOf(row, crowd);
    return seat == null ? [] : [{ ...row, seat }];
  });
  const priced = seated.filter((row) => row.seat === "priced");
  const overlap = seated.filter((row) => row.seat === "overlap");
  const moving = seated.filter((row) => row.seat === "moving");
  const bag = seated.filter((row) => row.seat === "bag");
  const fat = seated.filter((row) => row.seat === "fat");
  const lines = [
    bookLine(rows, isLastPage),
    pileLine(rows),
    ballastLine(rows),
    themeLine(rows, crowd),
    freshLine(rows, crowd),
    zeroLine(rows, crowd),
    copyLine(rows, overlap),
  ].filter((line): line is string => line != null);
  return {
    lines,
    quest: holdingQuest({ rows, isLastPage, crowd, priced, overlap, moving, bag, fat }),
    blocks: [
      {
        title: "Already priced",
        line: `${priced.length} names with at least ${crowd} wallets and a market cap of ${formatUsd(PRICED_CAP_USD)} or more. ${formatUsd(sumValue(priced))} of this page sits there. A public cap screen already shows these.`,
        names: nameList(priced),
      },
      {
        title: "Thin overlap",
        line: `${overlap.length} names, ${formatUsd(sumValue(overlap))}. At least ${crowd} wallets, cohort value under ${formatUsd(THIN_VALUE_USD)}, market cap under ${formatUsd(THIN_CAP_USD)}, age at least ${THIN_AGE_DAYS} days, and a 24h change from ${percentText(THIN_CHANGE_FLOOR)} to ${percentText(THIN_CHANGE_CAP)}. The seat is small. The label is not an order.`,
        names: nameList(overlap),
      },
      {
        title: "Wait",
        line: waitLine(moving, bag, fat),
        names: [
          ...tagged(fat, "Fat seat").slice(0, 5),
          ...tagged(moving, "Still moving").slice(0, 5),
          ...tagged(bag, "Being cut").slice(0, 4),
        ],
      },
    ],
  };
}

function holdingQuest(input: {
  rows: HoldingRow[];
  isLastPage: boolean;
  crowd: number;
  priced: Seated[];
  overlap: Seated[];
  moving: Seated[];
  bag: Seated[];
  fat: Seated[];
}): QuestSection[] {
  const { rows, isLastPage, crowd, priced, overlap, moving, bag, fat } = input;
  const book = bookUsd(rows);
  const page = sumValue(rows);
  const one = rows.filter((row) => row.holdersCount <= 1);
  const several = rows.filter((row) => row.holdersCount >= 2);
  const ranked = rows.filter((row) => row.valueUsd != null).sort(byValue);
  const top = ranked.slice(0, 5);
  const leader = top[0];
  const ballast = sectorRollup(rows)
    .filter((side) => side.names >= 10 && side.topShare > BALLAST_SHARE)
    .sort((a, b) => b.dollars - a.dollars)[0];
  const second = ballast ? [...ballast.rows].sort(byValue)[1] : undefined;
  const floor = Math.min(crowd, 5);
  const sleeve = sectorRollup(rows)
    .map((side) => ({ ...side, vintage: ageVintage(side.rows, floor) }))
    .filter((side) => side.names >= 15 && side.topShare <= BALLAST_SHARE && page > 0 && side.dollars / page < 0.1 && side.vintage != null)
    .sort((a, b) => (b.vintage?.count ?? 0) - (a.vintage?.count ?? 0))[0];
  const young = rows.filter((row) => row.ageDays != null && row.ageDays <= FRESH_AGE_DAYS);
  const batch = freshBatch(young);
  const flat = rows.filter((row) => row.change24hPercent === 0);
  const fatSeat = median(top.map((row) => (row.valueUsd ?? 0) / Math.max(row.holdersCount, 1)));
  const thinSeat = median(overlap.map((row) => (row.valueUsd ?? 0) / Math.max(row.holdersCount, 1)));
  const traits: QuestTrait[] = [
    trait("book-share", "Page against the book", book != null && page > 0
      ? `This page is ${formatUsd(page)}, ${percentText(page / book)} of the ${formatUsd(book)} these wallets still hold.`
      : "The share field does not agree, so the full book is absent."),
    trait("book-several", "Two wallets or more", `${several.length} names on this page still sit with two or more wallets, ${formatUsd(sumValue(several))}.`),
    trait("book-one", "One wallet, on the page", `${one.length} names on this page are a single wallet, ${formatUsd(sumValue(one))}.`),
    trait("book-off", "Off this page", !isLastPage && one.length > 0 && book != null
      ? `The list stops here. The other ${formatUsd(book - page)} is one-wallet names that did not fit.`
      : "This page does not show a remainder past the last row."),
    trait("pile-five", "Five names", top.length >= 5 && page > 0
      ? `${top.map((row) => row.symbol || "unnamed").join(", ")} are ${formatUsd(sumValue(top))}, ${percentText(sumValue(top) / page)} of this page.`
      : "This page has fewer than five names with a dollar figure."),
    trait("pile-leader", "The largest name", leader && page > 0
      ? `${leader.symbol || "The largest"} alone is ${percentText((leader.valueUsd ?? 0) / page)} of this page, ${formatUsd(leader.valueUsd ?? 0)}.`
      : "No name on this page has a dollar figure."),
    trait("pile-cap", "Share of its own cap", leader && leader.marketCapUsd != null && leader.marketCapUsd > 0 && leader.valueUsd != null
      ? `${leader.symbol || "The largest"} is ${percentText(leader.valueUsd / leader.marketCapUsd)} of its own market cap.`
      : "The largest name has no market cap, so its share of the coin is absent."),
    trait("pile-seat", "Dollars per wallet", fatSeat != null
      ? `Those five piles average ${formatUsd(fatSeat)} per wallet.`
      : "The five largest piles have no per-wallet figure."),
    trait("tag-ballast", "One mint wears the tag", ballast
      ? `${ballast.sector} is ${ballast.names} names and ${formatUsd(ballast.dollars)}. ${ballast.topSymbol} is ${percentText(ballast.topShare)} of that tag.`
      : "No sector tag on this page is mostly one mint."),
    trait("tag-second", "The next mint in the tag", ballast && second && ballast.dollars > 0
      ? `${second.symbol || "The next"} is ${percentText((second.valueUsd ?? 0) / ballast.dollars)} of the same tag, ${formatUsd(second.valueUsd ?? 0)}.`
      : "The ballast tag has no second mint."),
    trait("tag-rest", "The rest of the tag", ballast
      ? `The other ${ballast.names - 1} names in ${ballast.sector} are ${formatUsd(ballast.dollars - ballast.topValue)}.`
      : "There is no remainder under a one-mint tag."),
    trait("tag-sleeve", "A sleeve that shares an age", sleeve?.vintage
      ? `${sleeve.sector} is ${sleeve.names} names and ${formatUsd(sleeve.dollars)}. ${sleeve.vintage.count} of ${sleeve.vintage.eligible} names with at least ${floor} wallets are ${sleeve.vintage.age} days old, within 2 days. ${sleeve.topSymbol} is ${percentText(sleeve.topShare)} of the sleeve.`
      : "No sector on this page shares one age across half its crowded names."),
    trait("fresh-prefix", "One fresh prefix", batch
      ? `${batch.rows.length} of ${young.length} names aged ${FRESH_AGE_DAYS} days or less share the prefix ${JSON.stringify(batch.mark.trim())}.`
      : `Names aged ${FRESH_AGE_DAYS} days or less do not share one prefix.`),
    trait("fresh-untagged", "No sector on the batch", batch
      ? `${batch.rows.filter((row) => row.sectors.length === 0).length} of those ${batch.rows.length} names have an empty sector.`
      : "There is no fresh batch to count untagged names in."),
    trait("fresh-settled", "The batch is not settled", batch
      ? `${batch.rows.filter((row) => row.holdersCount >= crowd).length} reach ${crowd} wallets. ${batch.rows.filter((row) => seatOf(row, crowd) === "overlap").length} of those pass the thin settled cut. Cohort dollars in the batch: ${formatUsd(sumValue(batch.rows))}.`
      : "There is no fresh batch to test against the thin cut."),
    trait("fresh-zero", "A zero is untouched", `${flat.length} of ${rows.length} names show a 24h change of exactly 0, ${formatUsd(sumValue(flat))}. ${flat.filter((row) => row.holdersCount >= crowd).length} of those have ${crowd} wallets or more.`),
    trait("seat-priced", "Already priced", `${priced.length} names have at least ${crowd} wallets and a market cap of ${formatUsd(PRICED_CAP_USD)} or more. ${formatUsd(sumValue(priced))} of this page sits there.`),
    trait("seat-thin", "Thin overlap", `${overlap.length} names, ${formatUsd(sumValue(overlap))}. At least ${crowd} wallets, cohort value under ${formatUsd(THIN_VALUE_USD)}, market cap under ${formatUsd(THIN_CAP_USD)}, age at least ${THIN_AGE_DAYS} days, 24h change from ${percentText(THIN_CHANGE_FLOOR)} to ${percentText(THIN_CHANGE_CAP)}.${thinSeat != null ? ` About ${formatUsd(thinSeat)} per wallet.` : ""} The label is not an order.`),
    trait("seat-fat", "Fat seats", fat.length > 0
      ? `${fat.length} crowded names are too large to sit in as a thin seat, ${formatUsd(sumValue(fat))}. Largest: ${[...fat].sort(byValue).slice(0, 3).map((row) => row.symbol || "unnamed").join(", ")}.`
      : "No crowded name is a fat seat."),
    trait("seat-wait", "Still moving, or being cut", `${moving.length} crowded names are still moving, ${formatUsd(sumValue(moving))}. ${bag.length} are being cut, ${formatUsd(sumValue(bag))}.${bag[0] ? ` Largest cut: ${[...bag].sort(byValue)[0]?.symbol || "unnamed"}.` : ""}`),
  ];
  const titles = ["The book", "The pile", "The tag", "The fresh names", "The seats"] as const;
  return titles.map((title, index) => ({
    id: `section-${index + 1}`,
    title,
    traits: traits.slice(index * 4, index * 4 + 4),
  }));
}

function trait(id: string, title: string, line: string): QuestTrait {
  return { id, title, line };
}

/** One walk across four bodies. Each section keeps the page it came from. */
export function combinedQuest(input: {
  moveLines: string[];
  walletLines: string[];
  printLines: string[];
  holdSections: QuestSection[];
  moveTable?: QuestTable | null;
  walletTable?: QuestTable | null;
  printTable?: QuestTable | null;
  holdTable?: QuestTable | null;
}): QuestSection[] {
  const hold = input.holdSections.slice(0, QUEST_MAX).flatMap((section) => {
    const first = section.traits[0];
    return first ? [{ ...first, id: `hold-${first.id}` }] : [];
  });
  const sections = [
    signalSection("move", "Move · netflow", input.moveLines, input.moveTable),
    signalSection("wallets", "Wallets · leaderboard", input.walletLines, input.walletTable),
    signalSection("prints", "Prints · dex trades", input.printLines, input.printTable),
    hold.length > 0 ? { id: "holds", title: "Holds · holdings", traits: hold, ...(input.holdTable ? { table: input.holdTable } : {}) } : null,
  ];
  return sections.filter((section): section is QuestSection => section != null && section.traits.length > 0);
}

export type HoldMark = {
  chain: string;
  address: string;
  symbol: string;
  holdersCount: number;
  marketCapUsd: number | null;
  valueUsd?: number | null;
  change24hPercent?: number | null;
  sharePercent?: number | null;
  ageDays?: number | null;
};

/** Traits that need more than one page. A median split cannot say these. */
export function crossTraits(input: {
  flow: FlowRow[];
  holds: HoldMark[];
  buys: DexBuy[];
  traded: string[];
  keyKind: TokenKeyKind | null;
}): QuestSection | null {
  const held = new Map<string, HoldMark>();
  for (const row of input.holds) {
    if (row.address) held.set(assetKey(row.chain, row.address), row);
  }
  const ranked = tokenHalves(input.flow).ranked;
  const moved = ranked.filter((row) => row.chain === "solana");
  const topMoved = moved.slice(0, Math.min(50, moved.length));
  const flowKeys = new Set(ranked.filter((row) => row.tokenAddress).map((row) => assetKey(row.chain, row.tokenAddress)));
  const heldRanked = [...input.holds].filter((row) => row.address).sort((a, b) => b.holdersCount - a.holdersCount);
  const topHeld = heldRanked.slice(0, Math.min(50, heldRanked.length));
  const offBook = held.size === 0 ? [] : topMoved.filter((row) => row.tokenAddress && !held.has(assetKey("solana", row.tokenAddress)));
  const quiet = topHeld.filter((row) => !flowKeys.has(assetKey(row.chain, row.address)));
  const printed = printedAndHeld(input.buys, held);
  const cap = capThenNow(input.buys, held, moved);
  const tradedHit = tradedOnMove(input.traded, input.keyKind, moved);
  const traits: QuestTrait[] = [];
  if (topMoved.length > 0 && offBook.length > 0) {
    traits.push(trait("cross-off-book", "On the move, off the book", `${offBook.length} of ${topMoved.length} Solana names in the largest moves are not on the holdings page. ${tokenMark({ symbol: offBook[0].tokenSymbol, chain: offBook[0].chain, address: offBook[0].tokenAddress })} is one. This page is not the whole book.`));
  }
  if (topHeld.length > 0 && quiet.length > 0) {
    const example = quiet[0];
    traits.push(trait("cross-quiet", "Still sitting, quiet today", `${quiet.length} of ${topHeld.length} most-held names are not on the netflow page. ${example ? tokenMark({ symbol: example.symbol, chain: example.chain || "solana", address: example.address }) : "One name"} is one. A balance can sit through a day with no move large enough for that list.`));
  }
  if (printed) traits.push(printed);
  if (cap) traits.push(cap);
  if (tradedHit) traits.push(tradedHit);
  if (traits.length === 0) return null;
  return { id: "across", title: "Across the pages", traits: traits.slice(0, 4) };
}

const CROSS_WALK = ["cross-off-book", "cross-quiet", "cross-cap"] as const;

/** The walk keeps the mismatches. A line that only confirms both pages still match stays off. */
export function crossWalk(section: QuestSection | null, table?: QuestTable | null): QuestSection | null {
  if (!section) return null;
  const traits = CROSS_WALK.flatMap((id) => {
    const found = section.traits.find((item) => item.id === id);
    return found ? [found] : [];
  }).slice(0, QUEST_MAX);
  if (traits.length === 0) return null;
  const withTable = table && traits.some((item) => item.id === "cross-off-book");
  return withTable
    ? { id: "across", title: "Across the pages", traits, table }
    : { id: "across", title: "Across the pages", traits };
}

const HOLD_WALK: { id: string; empty: (line: string) => boolean }[] = [
  { id: "tag-ballast", empty: (line) => line.startsWith("No sector tag") },
  { id: "tag-sleeve", empty: (line) => line.startsWith("No sector on this page") },
  { id: "fresh-prefix", empty: (line) => line.includes("do not share one prefix") },
  { id: "fresh-zero", empty: (line) => line.startsWith("0 of ") },
  { id: "seat-priced", empty: (line) => line.startsWith("0 names") },
  { id: "seat-thin", empty: (line) => line.startsWith("0 names") },
];

/** Holder count is only the cut. Empty refusals stay off the walk. */
export function holdWalkTraits(sections: QuestSection[]): QuestTrait[] {
  const traits = sections.flatMap((section) => section.traits);
  return HOLD_WALK.flatMap((item) => {
    const found = traits.find((trait) => trait.id === item.id);
    if (!found || item.empty(found.line)) return [];
    return [found];
  }).slice(0, QUEST_MAX);
}

function printedAndHeld(buys: DexBuy[], held: Map<string, HoldMark>): QuestTrait | null {
  const seen = new Map<string, string>();
  for (const buy of buys) {
    if (!buy.tokenAddress) continue;
    const mark = held.get(assetKey("solana", buy.tokenAddress));
    if (mark) seen.set(assetKey(mark.chain, mark.address), tokenMark({ symbol: mark.symbol || buy.tokenSymbol || "token", chain: mark.chain || "solana", address: mark.address }));
  }
  if (seen.size === 0) return null;
  const name = [...seen.values()][0] ?? "";
  return trait("cross-printed", "Printed and still held", `${seen.size} mints bought today are also on the holdings page. ${name} is one. The match is the mint.`);
}

function capsDiffer(thenCap: number, nowCap: number): boolean {
  return Math.abs(nowCap - thenCap) >= 1 && formatUsd(thenCap) !== formatUsd(nowCap);
}

function capThenNow(buys: DexBuy[], held: Map<string, HoldMark>, moved: FlowRow[]): QuestTrait | null {
  const flowNow = new Map<string, { symbol: string; cap: number }>();
  const holdNow = new Map<string, { symbol: string; cap: number }>();
  for (const row of moved) {
    if (row.tokenAddress && row.marketCapUsd != null) flowNow.set(assetKey(row.chain, row.tokenAddress), { symbol: row.tokenSymbol, cap: row.marketCapUsd });
  }
  for (const row of held.values()) {
    if (row.address && row.marketCapUsd != null) holdNow.set(assetKey(row.chain, row.address), { symbol: row.symbol, cap: row.marketCapUsd });
  }
  let best: { symbol: string; then: number; flow: number | null; hold: number | null; gap: number } | null = null;
  for (const buy of buys) {
    if (!buy.tokenAddress || buy.boughtMarketCap == null || buy.boughtMarketCap <= 0) continue;
    const key = assetKey("solana", buy.tokenAddress);
    const flow = flowNow.get(key);
    const hold = holdNow.get(key);
    const present = [flow, hold].filter((side): side is { symbol: string; cap: number } => side != null);
    if (present.length === 0 || !present.every((side) => capsDiffer(buy.boughtMarketCap ?? 0, side.cap))) continue;
    const gap = Math.max(...present.map((side) => Math.abs(side.cap - (buy.boughtMarketCap ?? 0))));
    if (!best || gap > best.gap) {
      best = {
        symbol: hold?.symbol || flow?.symbol || buy.tokenSymbol || buy.tokenAddress,
        then: buy.boughtMarketCap,
        flow: flow?.cap ?? null,
        hold: hold?.cap ?? null,
        gap,
      };
    }
  }
  if (!best) return null;
  const nows = [best.flow != null ? `netflow ${formatUsd(best.flow)}` : null, best.hold != null ? `holdings ${formatUsd(best.hold)}` : null].filter((part): part is string => part != null);
  return trait("cross-cap", "Cap then, cap now", `${best.symbol} was ${formatUsd(best.then)} at the buy. ${nows.join(". ")}. The tape is the cap then.`);
}

function tradedOnMove(traded: string[], keyKind: TokenKeyKind | null, moved: FlowRow[]): QuestTrait | null {
  if (keyKind == null || traded.length === 0 || moved.length === 0) return null;
  const keys = new Set(keyKind === "address" ? moved.map((row) => row.tokenAddress) : moved.map((row) => row.tokenSymbol.toUpperCase()));
  const hit = traded.filter((key) => keys.has(keyKind === "symbol" ? key.toUpperCase() : key));
  if (hit.length === 0) return null;
  const noun = keyKind === "address" ? "mints" : "tickers";
  return trait("cross-traded", "Traded and on the move list", `${hit.length} ${noun} the top wallets list as traded are also on the netflow page. The leaderboard is who made the money. Netflow is which names moved.`);
}

/** Solana names in the largest moves, split by whether the holdings page still has them. */
export function offBookExample(flow: FlowRow[], holds: HoldMark[]): QuestTable | null {
  if (flow.length === 0 || holds.length === 0) return null;
  const held = new Set(holds.filter((row) => row.address).map((row) => assetKey(row.chain, row.address)));
  if (held.size === 0) return null;
  const top = tokenHalves(flow).ranked.filter((row) => row.chain === "solana").slice(0, 50);
  const off = top.filter((row) => row.tokenAddress && !held.has(assetKey("solana", row.tokenAddress)));
  const on = top.filter((row) => row.tokenAddress && held.has(assetKey("solana", row.tokenAddress)));
  if (off.length === 0 || on.length === 0) return null;
  return {
    caption: "Off the book are Solana names in the largest moves that are missing from holdings. On the book are the ones that page still holds.",
    columns: ["Measure", "Off the book", "On the book"],
    nameLabels: ["Off the book", "On the book"],
    rows: [
      measureRow(
        "Names",
        sideCount(off.length, top.length, "are missing from holdings", "off the book"),
        sideCount(on.length, top.length, "are still on the holdings page", "on the book"),
        clipNames(off.map(tokenLabel)),
        clipNames(on.map(tokenLabel)),
      ),
      medianSides("24h flow", off, on, (row) => row.netFlow24hUsd, "usd", "off the book", "on the book", tokenLabel),
      medianSides("Wallets", off, on, (row) => row.traderCount, "count", "off the book", "on the book", tokenLabel),
      medianSides("Age", off, on, (row) => row.tokenAgeDays, "days", "off the book", "on the book", tokenLabel),
      medianSides("Size now", off, on, (row) => row.marketCapUsd, "usd", "off the book", "on the book", tokenLabel),
    ],
  };
}

function signalSection(id: string, title: string, lines: string[], table?: QuestTable | null): QuestSection | null {
  const traits = lines.map((line, index) => trait(`${id}-${index + 1}`, signalTitle(line), line));
  if (traits.length === 0) return null;
  return table ? { id, title, traits, table } : { id, title, traits };
}

/** Top 50 against the quieter 50 on the same netflow page. One example name on each side. */
export function moveExample(rows: FlowRow[]): QuestTable | null {
  const halves = tokenHalves(rows);
  const top = halves.ranked.slice(0, halves.top.count);
  const bottom = halves.ranked.slice(halves.top.count);
  if (top.length === 0 || bottom.length === 0) return null;
  const topLabel = top.length === 50 ? "Top 50" : `Top ${top.length}`;
  const bottomLabel = bottom.length === 50 ? "Bottom 50" : `Bottom ${bottom.length}`;
  const topFlips = top.filter((row) => signFlip(row.netFlow7dUsd, row.netFlow30dUsd));
  const bottomFlips = bottom.filter((row) => signFlip(row.netFlow7dUsd, row.netFlow30dUsd));
  return {
    caption: `${topLabel} are the largest 24h moves. ${bottomLabel} are the quieter names on this page. The right column is where they fall short.`,
    columns: ["Measure", topLabel, `${bottomLabel} lacks`],
    nameLabels: ["Top token", "Bottom token"],
    rows: [
      measureRow(
        "Sign flip",
        sideCount(topFlips.length, top.length, "have the week and the month pointing different ways"),
        lackCount(bottomFlips.length, topFlips.length, bottom.length, "have the week and the month pointing different ways"),
        clipNames(topFlips.map(tokenLabel)),
        clipNames(bottomFlips.map(tokenLabel)),
      ),
      medianNamed("Wallets in the name", halves.top.medianTraders, halves.rest.medianTraders, "count", top, bottom, (row) => row.traderCount, "fewer wallets"),
      medianNamed("Age", halves.top.medianAgeDays, halves.rest.medianAgeDays, "days", top, bottom, (row) => row.tokenAgeDays, "younger"),
      medianNamed("Size now", halves.top.medianMarketCapUsd, halves.rest.medianMarketCapUsd, "usd", top, bottom, (row) => row.marketCapUsd, "smaller"),
    ].filter((row): row is QuestTable["rows"][number] => row != null),
  };
}

const NAME_CAP = 10;

function clipNames(labels: string[]): string[] {
  return [...new Set(labels.map((label) => label.trim()).filter(Boolean))].slice(0, NAME_CAP);
}

function nearestMany<T>(rows: T[], pick: (row: T) => number | null, target: number | null, label: (row: T) => string): string[] {
  const ranked = rows.flatMap((row) => {
    const value = pick(row);
    if (value == null) return [];
    const name = label(row).trim();
    if (!name) return [];
    return [{ name, gap: target == null ? 0 : Math.abs(value - target) }];
  });
  ranked.sort((a, b) => a.gap - b.gap);
  return clipNames(ranked.map((item) => item.name));
}
function tokenLabel(row: FlowRow | null | undefined): string {
  if (!row) return "";
  if (!row.tokenAddress) return row.tokenSymbol;
  return tokenMark({ symbol: row.tokenSymbol, chain: row.chain, address: row.tokenAddress });
}

function medianNamed(
  name: string,
  topValue: number | null,
  bottomValue: number | null,
  kind: "count" | "days" | "usd",
  topRows: FlowRow[],
  bottomRows: FlowRow[],
  pick: (row: FlowRow) => number | null,
  shortWord: string,
): QuestTable["rows"][number] {
  return measureRow(
    name,
    sideMedian(topValue, kind),
    lackMedian(topValue, bottomValue, kind, shortWord),
    nearestMany(topRows, pick, topValue, tokenLabel),
    nearestMany(bottomRows, pick, bottomValue, tokenLabel),
  );
}

type Read = { text: string; plain: string };

function measureRow(name: string, top: Read, bottom: Read, topNames: string[], bottomNames: string[]): QuestTable["rows"][number] {
  return { name, top: top.text, topPlain: top.plain, bottom: bottom.text, bottomPlain: bottom.plain, topNames, bottomNames };
}

function sideCount(count: number, total: number, what: string, group = "loud coins"): Read {
  return {
    text: `${count} of ${total} names ${what}.`,
    plain: `${count} of ${total} ${group} ${what}.`,
  };
}

function lackCount(count: number, topCount: number, total: number, what: string): Read {
  const delta = count - topCount;
  if (delta > 0) {
    return {
      text: `${count} of ${total} names ${what}. That is ${delta} more than the top group.`,
      plain: `${count} of ${total} quiet coins ${what}. That is ${delta} more than the loud coins.`,
    };
  }
  if (delta < 0) {
    return {
      text: `${count} of ${total} names ${what}. That is ${Math.abs(delta)} fewer than the top group.`,
      plain: `${count} of ${total} quiet coins ${what}. That is ${Math.abs(delta)} fewer than the loud coins.`,
    };
  }
  return {
    text: `${count} of ${total} names ${what}. That is level with the top.`,
    plain: `${count} of ${total} quiet coins ${what}. Same as the loud coins.`,
  };
}

function sideMedian(value: number | null, kind: "count" | "days" | "usd" | "share" | "ratio" | "pct", group = "loud one"): Read {
  if (value == null) return { text: "This side has no number.", plain: "This side has no number." };
  const body = measureBody(value, kind);
  return { text: `The middle of this group is ${body}.`, plain: `The typical ${group} is ${body}.` };
}

function lackMedian(
  top: number | null,
  bottom: number | null,
  kind: "count" | "days" | "usd" | "share" | "ratio" | "pct",
  shortWord: string,
): Read {
  if (top == null || bottom == null) return { text: "This side has no number.", plain: "This side has no number." };
  const body = measureBody(bottom, kind);
  const delta = bottom - top;
  const abs = Math.abs(delta);
  const level = kind === "usd" ? abs < 1 : kind === "share" || kind === "pct" ? abs < 0.005 : abs < 0.05;
  if (level) {
    return {
      text: `The middle of this group is ${body}. That is level with the top.`,
      plain: `The typical quiet one is ${body}. Same as the loud group.`,
    };
  }
  if (delta > 0) {
    return {
      text: `The middle of this group is ${body}. That is ahead of the top.`,
      plain: `The typical quiet one is ${body}. Bigger than the loud group.`,
    };
  }
  const gap = measureBody(abs, kind);
  return {
    text: `The middle of this group is ${body}. That is ${gap} ${shortWord}.`,
    plain: `The typical quiet one is ${body}. It is ${gap} ${shortWord}.`,
  };
}

/** First 50 by profit against the rest of the leaderboard page. */
export function walletExample(rows: TraderRow[]): QuestTable | null {
  const ranked = rankTraders(rows);
  const top = ranked.slice(0, Math.min(TRADER_TOP, ranked.length));
  const rest = ranked.slice(top.length);
  if (top.length === 0 || rest.length === 0) return null;
  const topLabel = top.length === 50 ? "Top 50" : `Top ${top.length}`;
  const restLabel = `Other ${rest.length}`;
  const heldTop = median(present(top.map(heldShare)));
  const heldRest = median(present(rest.map(heldShare)));
  const bankedTop = median(present(top.map(realizedShare)));
  const bankedRest = median(present(rest.map(realizedShare)));
  const repeatTop = median(present(top.map(tradesPerToken)));
  const repeatRest = median(present(rest.map(tradesPerToken)));
  const overlapTop = meanOverlap(top);
  const overlapRest = meanOverlap(rest);
  return {
    caption: `${topLabel} made the most over 30 days. ${restLabel} are the rest of this list. The right column is where they fall short.`,
    columns: ["Measure", topLabel, `${restLabel} lack`],
    nameLabels: ["Top trader", "Other trader"],
    rows: [
      measureRow("Still holding", sideMedian(heldTop, "share"), lackMedian(heldTop, heldRest, "share", "less still held"), nearestMany(top, heldShare, heldTop, (row) => walletMark("solana", row.address)), nearestMany(rest, heldShare, heldRest, (row) => walletMark("solana", row.address))),
      measureRow("Already banked", sideMedian(bankedTop, "share"), lackMedian(bankedTop, bankedRest, "share", "less banked"), nearestMany(top, realizedShare, bankedTop, (row) => walletMark("solana", row.address)), nearestMany(rest, realizedShare, bankedRest, (row) => walletMark("solana", row.address))),
      measureRow("Repeat buys", sideMedian(repeatTop, "ratio"), lackMedian(repeatTop, repeatRest, "ratio", "fewer trades per name"), nearestMany(top, tradesPerToken, repeatTop, (row) => walletMark("solana", row.address)), nearestMany(rest, tradesPerToken, repeatRest, (row) => walletMark("solana", row.address))),
      measureRow("Same names", sideMedian(overlapTop, "share"), lackMedian(overlapTop, overlapRest, "share", "less overlap"), clipNames(top.map((row) => walletMark("solana", row.address))), clipNames(rest.map((row) => walletMark("solana", row.address)))),
    ],
  };
}

/** Age and cap at the buy. The profit cut against the other wallets on the tape. */
export function printExample(topAddresses: string[], buys: DexBuy[]): QuestTable | null {
  if (topAddresses.length === 0 || buys.length === 0) return null;
  const topSet = new Set(topAddresses);
  const topBuckets = new Map<string, DexBuy[]>();
  for (const address of topAddresses) topBuckets.set(address, []);
  const restBuckets = new Map<string, DexBuy[]>();
  for (const buy of buys) {
    const bucket = topSet.has(buy.traderAddress) ? topBuckets.get(buy.traderAddress) : undefined;
    if (bucket) {
      bucket.push(buy);
      continue;
    }
    const other = restBuckets.get(buy.traderAddress);
    if (other) other.push(buy);
    else restBuckets.set(buy.traderAddress, [buy]);
  }
  if (restBuckets.size === 0) return null;
  const topAge = walletMedians(topBuckets, "age");
  const restAge = walletMedians(restBuckets, "age");
  const topCap = walletMedians(topBuckets, "cap");
  const restCap = walletMedians(restBuckets, "cap");
  const topValue = walletMedians(topBuckets, "value");
  const restValue = walletMedians(restBuckets, "value");
  const topSold = walletMedians(topBuckets, "soldAge");
  const restSold = walletMedians(restBuckets, "soldAge");
  const topLabel = topAddresses.length === 50 ? "Top 50" : `Top ${topAddresses.length}`;
  const rows = [
    measureRow("Age at the buy", sideMedian(topAge.value, "days"), lackMedian(topAge.value, restAge.value, "days", "younger"), buyNames(topBuckets, "age", topAge.value), buyNames(restBuckets, "age", restAge.value)),
    measureRow("Size at the buy", sideMedian(topCap.value, "usd"), lackMedian(topCap.value, restCap.value, "usd", "smaller"), buyNames(topBuckets, "cap", topCap.value), buyNames(restBuckets, "cap", restCap.value)),
    differingBuyRow("Dollars on the print", topValue.value, restValue.value, "usd", "smaller", buyNames(topBuckets, "value", topValue.value), buyNames(restBuckets, "value", restValue.value)),
    differingBuyRow("What they sold", topSold.value, restSold.value, "days", "younger", buyNames(topBuckets, "soldAge", topSold.value), buyNames(restBuckets, "soldAge", restSold.value)),
  ].filter((row): row is QuestTable["rows"][number] => row != null);
  return {
    caption: `${topLabel} made the most. The other wallets also bought today. Age and cap are at the buy.`,
    columns: ["Measure", topLabel, "Other buyers lack"],
    nameLabels: ["Top print", "Other print"],
    rows,
  };
}

function differingBuyRow(
  name: string,
  top: number | null,
  rest: number | null,
  kind: "usd" | "days",
  lack: string,
  topNames: string[],
  restNames: string[],
): QuestTable["rows"][number] | null {
  if (top == null && rest == null) return null;
  if (top != null && rest != null && measureBody(top, kind) === measureBody(rest, kind)) return null;
  return measureRow(name, sideMedian(top, kind), lackMedian(top, rest, kind, lack), topNames, restNames);
}

export function holdMarks(rows: HoldingRow[]): HoldMark[] {
  return rows.map((row) => ({
    chain: row.chain,
    address: row.address,
    symbol: row.symbol,
    holdersCount: row.holdersCount,
    marketCapUsd: row.marketCapUsd,
    valueUsd: row.valueUsd,
    change24hPercent: row.change24hPercent,
    sharePercent: row.sharePercent,
    ageDays: row.ageDays,
  }));
}

/** First 50 by holder count against the thinner names on the holdings page. */
export function holdExample(rows: HoldingRow[]): QuestTable | null {
  const ranked = [...rows].sort((a, b) => b.holdersCount - a.holdersCount);
  const top = ranked.slice(0, Math.min(TRADER_TOP, ranked.length));
  const rest = ranked.slice(top.length);
  if (top.length === 0 || rest.length === 0) return null;
  const topLabel = top.length === 50 ? "Top 50" : `Top ${top.length}`;
  const dollarsTop = median(present(top.map((row) => row.valueUsd)));
  const dollarsRest = median(present(rest.map((row) => row.valueUsd)));
  const changeTop = median(present(top.map((row) => row.change24hPercent)));
  const changeRest = median(present(rest.map((row) => row.change24hPercent)));
  const shareTop = median(present(top.map((row) => row.sharePercent)));
  const shareRest = median(present(rest.map((row) => row.sharePercent)));
  const capTop = median(present(top.map((row) => row.marketCapUsd)));
  const capRest = median(present(rest.map((row) => row.marketCapUsd)));
  return {
    caption: `${topLabel} are the names the most wallets still hold. The other ${rest.length} are thinner. The right column is where they fall short.`,
    columns: ["Measure", topLabel, "Thinner names lack"],
    nameLabels: ["Top holding", "Thinner holding"],
    rows: [
      measureRow("Dollars still there", sideMedian(dollarsTop, "usd"), lackMedian(dollarsTop, dollarsRest, "usd", "less held"), nearestMany(top, (row) => row.valueUsd, dollarsTop, holdLabel), nearestMany(rest, (row) => row.valueUsd, dollarsRest, holdLabel)),
      measureRow("Today", sideMedian(changeTop, "pct"), lackMedian(changeTop, changeRest, "pct", "less on the day"), nearestMany(top, (row) => row.change24hPercent, changeTop, holdLabel), nearestMany(rest, (row) => row.change24hPercent, changeRest, holdLabel)),
      measureRow("Share of the pile", sideMedian(shareTop, "pct"), lackMedian(shareTop, shareRest, "pct", "less of the pile"), nearestMany(top, (row) => row.sharePercent, shareTop, holdLabel), nearestMany(rest, (row) => row.sharePercent, shareRest, holdLabel)),
      measureRow("Size now", sideMedian(capTop, "usd"), lackMedian(capTop, capRest, "usd", "smaller"), nearestMany(top, (row) => row.marketCapUsd, capTop, holdLabel), nearestMany(rest, (row) => row.marketCapUsd, capRest, holdLabel)),
      measureRow("Age", sideMedian(median(present(top.map((row) => row.ageDays))), "days"), lackMedian(median(present(top.map((row) => row.ageDays))), median(present(rest.map((row) => row.ageDays))), "days", "younger"), nearestMany(top, (row) => row.ageDays, median(present(top.map((row) => row.ageDays))), holdLabel), nearestMany(rest, (row) => row.ageDays, median(present(rest.map((row) => row.ageDays))), holdLabel)),
    ],
  };
}

function nearestOf<T>(rows: T[], pick: (row: T) => number | null, target: number | null, label: (row: T) => string): string | null {
  if (target == null) return null;
  let best: T | null = null;
  let gap = Infinity;
  for (const row of rows) {
    const value = pick(row);
    if (value == null) continue;
    const next = Math.abs(value - target);
    if (next < gap) {
      best = row;
      gap = next;
    }
  }
  if (!best) return null;
  const name = label(best).trim();
  return name.length > 0 ? name : null;
}

function shortAddress(address: string): string {
  if (address.length <= 10) return address || "wallet";
  return `${address.slice(0, 4)}-${address.slice(-4)}`;
}

function buyNames(buckets: Map<string, DexBuy[]>, field: BuyField, target: number | null): string[] {
  const wallets: { value: number; label: string }[] = [];
  for (const [trader, buys] of buckets) {
    const picked = buys.flatMap((buy) => {
      const value = buyField(buy, field);
      return value == null ? [] : [value];
    });
    const value = median(picked);
    const named = buys.find((buy) => buy.tokenSymbol || buy.tokenAddress) ?? buys[0];
    if (value == null || !named) continue;
    const token = named.tokenSymbol || "token";
    const mint = named.tokenAddress ? tokenMark({ symbol: token, chain: "solana", address: named.tokenAddress }) : token;
    wallets.push({ value, label: `${mint} · ${walletMark("solana", trader)}` });
  }
  wallets.sort((a, b) => Math.abs(a.value - (target ?? a.value)) - Math.abs(b.value - (target ?? b.value)));
  return clipNames(wallets.map((item) => item.label));
}

function buyWho(buckets: Map<string, DexBuy[]>, field: "age" | "cap", target: number | null): string {
  const wallets: { value: number; buy: DexBuy; trader: string }[] = [];
  for (const [trader, buys] of buckets) {
    const picked = buys.flatMap((buy) => {
      const value = field === "age" ? buy.boughtAgeDays : buy.boughtMarketCap;
      return value == null ? [] : [value];
    });
    const value = median(picked);
    const named = buys.find((buy) => buy.tokenSymbol || buy.tokenAddress) ?? buys[0];
    if (value != null && named) wallets.push({ value, buy: named, trader });
  }
  const hit = wallets.reduce<{ value: number; buy: DexBuy; trader: string } | null>((best, item) => {
    if (target == null) return best;
    if (!best || Math.abs(item.value - target) < Math.abs(best.value - target)) return item;
    return best;
  }, null);
  if (!hit) return "";
  const token = hit.buy.tokenSymbol || hit.buy.tokenAddress || "token";
  const mint = hit.buy.tokenAddress ? ` ${hit.buy.tokenAddress}` : "";
  return `${token}${mint} · ${hit.trader}`;
}

function holdLabel(row: HoldingRow | null): string {
  if (!row) return "";
  if (!row.address) return row.symbol;
  return tokenMark({ symbol: row.symbol || "unnamed", chain: "solana", address: row.address });
}

function nearestHold(rows: HoldingRow[], pick: (row: HoldingRow) => number | null, target: number | null): HoldingRow | null {
  if (target == null) return null;
  let best: HoldingRow | null = null;
  let gap = Infinity;
  for (const row of rows) {
    const value = pick(row);
    if (value == null) continue;
    const next = Math.abs(value - target);
    if (next < gap) {
      best = row;
      gap = next;
    }
  }
  return best;
}

function buyLabel(buckets: Map<string, DexBuy[]>, field: "age" | "cap", target: number | null): string | null {
  const wallets: { value: number; buy: DexBuy }[] = [];
  for (const buys of buckets.values()) {
    const picked = buys.flatMap((buy) => {
      const value = field === "age" ? buy.boughtAgeDays : buy.boughtMarketCap;
      return value == null ? [] : [value];
    });
    const value = median(picked);
    const named = buys.find((buy) => buy.tokenSymbol);
    if (value != null && named) wallets.push({ value, buy: named });
  }
  return nearestOf(wallets, (item) => item.value, target, (item) => item.buy.tokenSymbol ?? "");
}

function measureBody(value: number, kind: "count" | "days" | "usd" | "share" | "ratio" | "pct"): string {
  if (kind === "usd") return formatUsd(value);
  if (kind === "days") return `${plainNumber(value)} days`;
  if (kind === "share" || kind === "pct") return kind === "pct" ? percentText(value) : shareText(value);
  if (kind === "ratio") return ratioText(value);
  return plainNumber(value);
}

function signalTitle(line: string): string {
  const cut = line.indexOf(".");
  const title = (cut > 0 ? line.slice(0, cut) : line).trim();
  return title.length > 42 ? title.slice(0, 42).trim() : title;
}

function freshBatch(young: HoldingRow[]): { mark: string; rows: HoldingRow[] } | null {
  if (young.length < 20) return null;
  const counts = new Map<string, HoldingRow[]>();
  for (const row of young) {
    const mark = markPrefix(row.symbol);
    if (!mark) continue;
    const list = counts.get(mark) ?? [];
    list.push(row);
    counts.set(mark, list);
  }
  let best: HoldingRow[] = [];
  let mark = "";
  for (const [prefix, list] of counts) {
    if (list.length > best.length) {
      best = list;
      mark = prefix;
    }
  }
  if (best.length < young.length * 0.7) return null;
  return { mark, rows: best };
}

function crowdCut(rows: HoldingRow[]): number {
  const cut = percentile(rows.map((row) => row.holdersCount), 0.9);
  if (cut == null) return 2;
  return Math.max(2, Math.round(cut));
}

function seatOf(row: HoldingRow, crowd: number): HoldingSeat | null {
  if (row.holdersCount < crowd) return null;
  if (row.marketCapUsd != null && row.marketCapUsd >= PRICED_CAP_USD) return "priced";
  if (isThin(row)) return "overlap";
  if ((row.ageDays != null && row.ageDays < THIN_AGE_DAYS) || (row.change24hPercent != null && Math.abs(row.change24hPercent) >= MOVE_CHANGE)) {
    return "moving";
  }
  if (row.change24hPercent != null && row.change24hPercent <= BAG_CHANGE) return "bag";
  return "fat";
}

function isThin(row: HoldingRow): boolean {
  return (
    row.valueUsd != null &&
    row.valueUsd < THIN_VALUE_USD &&
    row.marketCapUsd != null &&
    row.marketCapUsd < THIN_CAP_USD &&
    row.ageDays != null &&
    row.ageDays >= THIN_AGE_DAYS &&
    row.change24hPercent != null &&
    row.change24hPercent > THIN_CHANGE_FLOOR &&
    row.change24hPercent < THIN_CHANGE_CAP
  );
}

function bookLine(rows: HoldingRow[], isLastPage: boolean): string | null {
  const book = bookUsd(rows);
  const page = sumValue(rows);
  if (book == null || book <= 0 || page <= 0) return null;
  const share = percentText(page / book);
  const one = rows.filter((row) => row.holdersCount <= 1);
  const several = rows.filter((row) => row.holdersCount >= 2);
  const reachedOne = one.length > 0 && several.length > 0;
  const tail = !isLastPage && reachedOne
    ? ` This page already lists every name with two or more wallets (${several.length}, ${formatUsd(sumValue(several))}). The other ${formatUsd(book - page)} is names one wallet holds that did not fit on this page.`
    : "";
  return `Book. This page is ${formatUsd(page)}, ${share} of the ${formatUsd(book)} these wallets still hold.${tail}`;
}

function pileLine(rows: HoldingRow[]): string | null {
  const ranked = rows.filter((row) => row.valueUsd != null).sort(byValue);
  if (ranked.length < 5) return null;
  const top = ranked.slice(0, 5);
  const page = sumValue(rows);
  if (page <= 0) return null;
  const topSum = sumValue(top);
  const leader = top[0];
  const leaderShare = leader.valueUsd == null ? 0 : leader.valueUsd / page;
  return `Pile. ${top.map((row) => row.symbol || "unnamed").join(", ")} are ${formatUsd(topSum)}, ${percentText(topSum / page)} of this page. ${leader.symbol || "The largest"} alone is ${percentText(leaderShare)}.`;
}

function ballastLine(rows: HoldingRow[]): string | null {
  const best = sectorRollup(rows)
    .filter((side) => side.names >= 10 && side.topShare > BALLAST_SHARE)
    .sort((a, b) => b.dollars - a.dollars)[0];
  if (!best) return null;
  const rest = best.dollars - best.topValue;
  const second = [...best.rows].sort(byValue)[1];
  const secondBit = second && best.dollars > 0 && (second.valueUsd ?? 0) / best.dollars >= 0.05
    ? ` ${second.symbol || "The next"} is still ${percentText((second.valueUsd ?? 0) / best.dollars)} of the tag.`
    : "";
  return `Ballast. ${best.sector} is ${best.names} names and ${formatUsd(best.dollars)}. ${best.topSymbol} is ${percentText(best.topShare)} of that tag.${secondBit} The other ${best.names - 1} names are ${formatUsd(rest)}.`;
}

function themeLine(rows: HoldingRow[], crowd: number): string | null {
  const page = sumValue(rows);
  if (page <= 0) return null;
  const floor = Math.min(crowd, 5);
  const theme = sectorRollup(rows)
    .map((side) => ({ ...side, vintage: ageVintage(side.rows, floor) }))
    .filter((side) => side.names >= 15 && side.topShare <= BALLAST_SHARE && side.dollars / page < 0.1 && side.vintage != null)
    .sort((a, b) => (b.vintage?.count ?? 0) - (a.vintage?.count ?? 0))[0];
  if (!theme || !theme.vintage) return null;
  return `Repeating sleeve. ${theme.sector} is ${theme.names} names and ${formatUsd(theme.dollars)}, ${percentText(theme.dollars / page)} of this page. ${theme.vintage.count} of the ${theme.vintage.eligible} names with at least ${floor} wallets are ${theme.vintage.age} days old, within 2 days of each other. ${theme.topSymbol} is ${percentText(theme.topShare)} of the sleeve, under half.`;
}

function ageVintage(rows: HoldingRow[], crowd: number): { age: number; count: number; eligible: number } | null {
  const eligible = rows.filter((row) => row.holdersCount >= crowd && row.ageDays != null);
  if (eligible.length < 8) return null;
  const counts = new Map<number, number>();
  for (const row of eligible) {
    const age = row.ageDays ?? 0;
    counts.set(age, (counts.get(age) ?? 0) + 1);
  }
  let mode = 0;
  let best = 0;
  for (const [age, count] of counts) {
    if (count > best) {
      best = count;
      mode = age;
    }
  }
  const count = eligible.filter((row) => Math.abs((row.ageDays ?? 0) - mode) <= 2).length;
  if (count < 8 || count < eligible.length * 0.5) return null;
  return { age: mode, count, eligible: eligible.length };
}

function freshLine(rows: HoldingRow[], crowd: number): string | null {
  const young = rows.filter((row) => row.ageDays != null && row.ageDays <= FRESH_AGE_DAYS);
  if (young.length < 20) return null;
  const counts = new Map<string, HoldingRow[]>();
  for (const row of young) {
    const mark = markPrefix(row.symbol);
    if (!mark) continue;
    const list = counts.get(mark) ?? [];
    list.push(row);
    counts.set(mark, list);
  }
  let best: HoldingRow[] = [];
  let mark = "";
  for (const [prefix, list] of counts) {
    if (list.length > best.length) {
      best = list;
      mark = prefix;
    }
  }
  if (best.length < young.length * 0.7) return null;
  const crowded = best.filter((row) => row.holdersCount >= crowd);
  const settled = crowded.filter((row) => seatOf(row, crowd) === "overlap");
  return `Fresh batch. ${best.length} of ${young.length} names aged ${FRESH_AGE_DAYS} days or less share the prefix ${JSON.stringify(mark.trim())}. ${best.filter((row) => row.sectors.length === 0).length} of them have no sector. ${crowded.length} reach ${crowd} wallets, and ${settled.length} of those pass the thin settled cut. Cohort dollars in the batch: ${formatUsd(sumValue(best))}.`;
}

function zeroLine(rows: HoldingRow[], crowd: number): string | null {
  const flat = rows.filter((row) => row.change24hPercent === 0);
  if (flat.length < 10) return null;
  const crowded = flat.filter((row) => row.holdersCount >= crowd).length;
  const verb = crowded === 1 ? "has" : "have";
  return `Untouched. ${flat.length} of ${rows.length} names show a 24h change of exactly 0, ${formatUsd(sumValue(flat))} on this page. ${crowded} of those ${verb} ${crowd} wallets or more. A zero here is a balance nobody moved.`;
}

function copyLine(rows: HoldingRow[], overlap: Seated[]): string | null {
  const fat = [...rows].filter((row) => row.valueUsd != null && row.holdersCount > 0).sort(byValue).slice(0, 5);
  const fatSeat = median(fat.map((row) => (row.valueUsd ?? 0) / row.holdersCount));
  const thinSeat = median(overlap.map((row) => (row.valueUsd ?? 0) / row.holdersCount));
  if (fatSeat == null || thinSeat == null || fat.length === 0) return null;
  const leader = fat[0];
  const owned = leader.marketCapUsd != null && leader.marketCapUsd > 0 && leader.valueUsd != null
    ? ` ${leader.symbol || "The largest"} is ${percentText(leader.valueUsd / leader.marketCapUsd)} of its own market cap.`
    : "";
  return `Size. The five largest piles average ${formatUsd(fatSeat)} per wallet. The thin overlap seats average ${formatUsd(thinSeat)} per wallet.${owned}`;
}

function waitLine(moving: Seated[], bag: Seated[], fat: Seated[]): string {
  const fatNames = [...fat].sort(byValue).slice(0, 3).map((row) => row.symbol || "unnamed");
  const movingNames = [...moving].sort((a, b) => b.holdersCount - a.holdersCount).slice(0, 3).map((row) => row.symbol || "unnamed");
  const bagLead = [...bag].sort(byValue)[0];
  const fatBit = fatNames.length > 0 ? ` Fat seats, ${fat.length} names, ${formatUsd(sumValue(fat))}. Largest: ${fatNames.join(", ")}.` : "";
  const moveBit = moving.length > 0 ? ` Still moving, ${moving.length} names, ${formatUsd(sumValue(moving))}. Most wallets: ${movingNames.join(", ")}.` : "";
  const bagBit = bagLead
    ? ` Being cut, ${bag.length} names, ${formatUsd(sumValue(bag))}. Largest: ${bagLead.symbol || "unnamed"}, ${bagLead.holdersCount} wallets, ${formatUsd(bagLead.valueUsd ?? 0)}, ${percentText(bagLead.change24hPercent ?? 0)}.`
    : "";
  return `Wait.${fatBit}${moveBit}${bagBit}`;
}

function tagged(rows: Seated[], label: string): HoldingTraitName[] {
  return nameList(rows).map((name) => ({ ...name, detail: `${label}. ${name.detail}` }));
}

function sectorRollup(rows: HoldingRow[]): { sector: string; names: number; dollars: number; topSymbol: string; topValue: number; topShare: number; rows: HoldingRow[] }[] {
  const buckets = new Map<string, HoldingRow[]>();
  for (const row of rows) {
    for (const sector of new Set(row.sectors)) {
      const list = buckets.get(sector) ?? [];
      list.push(row);
      buckets.set(sector, list);
    }
  }
  const sides = [];
  for (const [sector, list] of buckets) {
    const dollars = sumValue(list);
    const top = [...list].sort(byValue)[0];
    const topValue = top?.valueUsd ?? 0;
    sides.push({
      sector,
      names: list.length,
      dollars,
      topSymbol: top?.symbol || "unnamed",
      topValue,
      topShare: dollars > 0 ? topValue / dollars : 0,
      rows: list,
    });
  }
  return sides;
}

function bookUsd(rows: HoldingRow[]): number | null {
  const ratios: number[] = [];
  for (const row of rows) {
    if (row.valueUsd == null || row.sharePercent == null || row.sharePercent <= 0) continue;
    ratios.push(row.valueUsd / row.sharePercent);
  }
  if (ratios.length === 0 || ratios.length < rows.length * 0.9) return null;
  const mid = median(ratios);
  if (mid == null || mid <= 0) return null;
  if (ratios.some((ratio) => Math.abs(ratio - mid) / mid > 0.001)) return null;
  return mid;
}

function nameList(rows: Seated[]): HoldingTraitName[] {
  return [...rows].sort((a, b) => b.holdersCount - a.holdersCount || (b.valueUsd ?? 0) - (a.valueUsd ?? 0)).map((row) => ({
    symbol: row.symbol || "unnamed",
    holders: row.holdersCount,
    valueUsd: row.valueUsd,
    detail: `${row.holdersCount} wallets, ${row.valueUsd == null ? "value absent" : formatUsd(row.valueUsd)}`,
  }));
}

function sumValue(rows: { valueUsd: number | null }[]): number {
  let sum = 0;
  for (const row of rows) if (row.valueUsd != null) sum += row.valueUsd;
  return sum;
}

function byValue(a: { valueUsd: number | null }, b: { valueUsd: number | null }): number {
  return (b.valueUsd ?? 0) - (a.valueUsd ?? 0);
}

function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const low = Math.floor(index);
  const high = Math.min(low + 1, sorted.length - 1);
  return sorted[low] * (1 - (index - low)) + sorted[high] * (index - low);
}

function markPrefix(symbol: string): string {
  let index = 0;
  while (index < symbol.length) {
    const code = symbol.charCodeAt(index);
    const letter = (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || (code >= 48 && code <= 57);
    if (letter) break;
    index += 1;
  }
  return symbol.slice(0, index);
}

function holdingSplit(
  label: string,
  top: HoldingRow[],
  rest: HoldingRow[],
  pick: (row: HoldingRow) => number | null,
  kind: "usd" | "pct",
): { match: boolean; text: string } {
  const topValues = present(top.map(pick));
  const restValues = present(rest.map(pick));
  return medianSplit(label, median(topValues), topValues.length, top.length, median(restValues), restValues.length, rest.length, kind);
}

export type DepthInsight = {
  id: string;
  title: string;
  technical: string;
  plain: string;
  section: "move" | "wallets" | "prints" | "holds" | "across";
};

export type SectionQuests = {
  id: string;
  title: string;
  traits: QuestSection;
  insights: QuestSection;
};

/** Traits keep their comparison table. Insights get a second table on the same page, then the deeper lines. */
export function splitQuests(
  sections: QuestSection[],
  insights: DepthInsight[],
  tables: Partial<Record<string, QuestTable | null>> = {},
): SectionQuests[] {
  return sections.map((section) => {
    const lines = insights
      .filter((item) => item.section === section.id)
      .map((item) => ({ id: item.id, title: item.title, line: item.technical, plain: item.plain }));
    const table = tables[section.id];
    return {
      id: section.id,
      title: section.title,
      traits: section,
      insights: { id: `${section.id}-insights`, title: section.title, traits: lines, ...(table ? { table } : {}) },
    };
  });
}

/** Drop a page that cannot fill the band. Extra lines past the max stay off. */
export function bandQuests(sections: SectionQuests[]): SectionQuests[] {
  return sections.flatMap((section) => {
    const traits = section.traits.traits.slice(0, QUEST_MAX);
    const insights = section.insights.traits.slice(0, QUEST_MAX);
    if (traits.length < QUEST_MIN || insights.length < QUEST_MIN) return [];
    return [{
      ...section,
      traits: { ...section.traits, traits },
      insights: { ...section.insights, traits: insights },
    }];
  });
}

const SEAT_CAP_USD = 10_000_000;
const SEAT_MIN_WALLETS = 9;
const SEAT_MIN_USD = 5_000;
const FAT_PER_WALLET = 20_000;
const SEAT_MIN_AGE = 14;
const LIFE_AGE_DAYS = 3;

function assetKey(chain: string, address: string): string {
  return `${chain}:${address}`;
}

function tickerKey(symbol: string): string {
  return symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function perWallet(row: HoldingRow): number | null {
  if (row.valueUsd == null || row.holdersCount <= 0) return null;
  return row.valueUsd / row.holdersCount;
}

function markHolding(row: HoldingRow): string {
  return tokenMark({ symbol: row.symbol || "unnamed", chain: row.chain || "solana", address: row.address });
}

function markFlow(row: FlowRow): string {
  return tokenMark({ symbol: row.tokenSymbol || "unnamed", chain: row.chain, address: row.tokenAddress });
}

type DepthDraft = Omit<DepthInsight, "section">;

const INSIGHT_SECTION: Record<string, DepthInsight["section"]> = {
  "other-chain-seat": "holds",
  "same-ticker": "holds",
  "address-street": "holds",
  "pile-three": "holds",
  "flow-vs-hold": "across",
  "shrinking-pile": "across",
  "bought-off-book": "across",
  "quiet-bought": "across",
  "life-of-token": "move",
  "late-blip": "move",
  "hour-against-day": "move",
  "flow-one-chain": "move",
  "buyers-only-page": "move",
  "roi-under-total": "wallets",
  "open-rate": "wallets",
  "one-mint": "wallets",
  "left-the-tape": "prints",
  "only-the-cut": "prints",
  "giant-at-buy": "prints",
};

export type InsightExtra = {
  traders?: TraderRow[];
  keyKind?: TokenKeyKind | null;
  buys?: DexBuy[];
  topAddresses?: string[];
};

/** Field rules on the pages already loaded. No ticker list. Each insight names the quest it belongs to. */
export function deeperInsights(holds: HoldingRow[], flows: FlowRow[], extra: InsightExtra = {}): DepthInsight[] {
  const insights: DepthDraft[] = [];
  const thin = holds.filter((row) => {
    const per = perWallet(row);
    return (
      row.holdersCount >= SEAT_MIN_WALLETS &&
      row.marketCapUsd != null &&
      row.marketCapUsd < SEAT_CAP_USD &&
      row.ageDays != null &&
      row.ageDays > SEAT_MIN_AGE &&
      row.valueUsd != null &&
      row.valueUsd >= SEAT_MIN_USD &&
      per != null &&
      per < FAT_PER_WALLET &&
      row.change24hPercent != null &&
      row.change24hPercent >= THIN_CHANGE_FLOOR &&
      row.change24hPercent <= THIN_CHANGE_CAP
    );
  });
  const thinLead = [...thin].sort((a, b) => b.holdersCount - a.holdersCount)[0];
  const chainCounts = new Map<string, number>();
  for (const row of holds) {
    if (!row.chain) continue;
    chainCounts.set(row.chain, (chainCounts.get(row.chain) ?? 0) + 1);
  }
  const busiest = [...chainCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (thinLead && busiest && thinLead.chain && thinLead.chain !== busiest[0]) {
    insights.push({
      id: "other-chain-seat",
      title: "The thin seat left the busiest chain",
      technical: `This holdings page has the most rows on ${busiest[0]}, ${busiest[1]} names. The thin seat with the most wallets is ${markHolding(thinLead)} on ${thinLead.chain}.`,
      plain: `Most of the coins in the pile are on ${busiest[0]}. The little coin the most people share is on ${thinLead.chain}.`,
    });
  }
  const twins = new Map<string, HoldingRow[]>();
  for (const row of holds) {
    const key = tickerKey(row.symbol);
    if (key.length < 3 || !row.chain || !row.address) continue;
    const list = twins.get(key) ?? [];
    list.push(row);
    twins.set(key, list);
  }
  let widest: { symbol: string; low: HoldingRow; high: HoldingRow; ratio: number } | null = null;
  let twinGroups = 0;
  for (const list of twins.values()) {
    const chains = new Set(list.map((row) => row.chain));
    const addresses = new Set(list.map((row) => row.address));
    if (chains.size < 2 || addresses.size < 2) continue;
    twinGroups += 1;
    const priced = list.filter((row) => row.marketCapUsd != null && row.marketCapUsd > 0);
    if (priced.length < 2) continue;
    const low = [...priced].sort((a, b) => (a.marketCapUsd ?? 0) - (b.marketCapUsd ?? 0))[0];
    const high = [...priced].sort((a, b) => (b.marketCapUsd ?? 0) - (a.marketCapUsd ?? 0))[0];
    if (!low || !high || low.marketCapUsd == null || high.marketCapUsd == null || low.marketCapUsd <= 0) continue;
    const ratio = high.marketCapUsd / low.marketCapUsd;
    if (!widest || ratio > widest.ratio) widest = { symbol: low.symbol, low, high, ratio };
  }
  if (widest) {
    insights.push({
      id: "same-ticker",
      title: "Same ticker, different coin",
      technical: `${twinGroups} tickers appear on more than one chain with different addresses. The widest market-cap gap is ${widest.symbol}: ${markHolding(widest.low)} at ${formatUsd(widest.low.marketCapUsd ?? 0)} and ${markHolding(widest.high)} at ${formatUsd(widest.high.marketCapUsd ?? 0)}.`,
      plain: `Same name, two coins. One is small and one is big.`,
    });
  }
  const byAsset = new Map<string, HoldingRow>();
  const addressChains = new Map<string, Set<string>>();
  for (const row of holds) {
    if (!row.address) continue;
    if (row.chain) {
      byAsset.set(assetKey(row.chain, row.address), row);
      const seen = addressChains.get(row.address) ?? new Set<string>();
      seen.add(row.chain);
      addressChains.set(row.address, seen);
    }
  }
  const reused = [...addressChains.values()].filter((chains) => chains.size > 1).length;
  if (reused > 0) {
    insights.push({
      id: "address-street",
      title: "The address needs a chain",
      technical: `${reused} ${reused === 1 ? "address appears" : "addresses appear"} on more than one chain. Matching on the address alone mixes those assets. The key is chain plus address.`,
      plain: `The same address shows up on two chains. You need the chain and the address, or it is a different coin.`,
    });
  }
  const clashes: { flow: FlowRow; hold: HoldingRow }[] = [];
  for (const flow of flows) {
    const traders = flow.traderCount ?? 0;
    if (traders < SEAT_MIN_WALLETS || !flow.tokenAddress || !flow.chain) continue;
    const hold = byAsset.get(assetKey(flow.chain, flow.tokenAddress));
    if (hold && hold.holdersCount <= 8) clashes.push({ flow, hold });
  }
  const clash = clashes[0];
  if (clash) {
    insights.push({
      id: "flow-vs-hold",
      title: "Traders and holders disagree",
      technical: `${clashes.length} names have at least ${SEAT_MIN_WALLETS} traders on the 24h flow and at most 8 wallets still holding, on the same chain and address. ${markFlow(clash.flow)} has ${clash.flow.traderCount ?? 0} traders and ${clash.hold.holdersCount} holders.`,
      plain: `The people who traded it today and the people still holding it are a different count. More people traded it than still hold it.`,
    });
  }
  const young = flows.filter((row) => {
    const day = row.netFlow24hUsd;
    const week = row.netFlow7dUsd;
    const month = row.netFlow30dUsd;
    return (
      row.tokenAgeDays != null &&
      row.tokenAgeDays <= LIFE_AGE_DAYS &&
      week != null &&
      month != null &&
      Math.abs(day - week) < 1 &&
      Math.abs(week - month) < 1
    );
  });
  const youngLead = young[0];
  if (youngLead) {
    insights.push({
      id: "life-of-token",
      title: "The month column is the life of the token",
      technical: `${young.length} names are ${LIFE_AGE_DAYS} days old or younger, and the 24h, 7d, and 30d net flow match within $1. ${markFlow(youngLead)} is ${youngLead.tokenAgeDays} days old, so the month figure is the whole life of the token.`,
      plain: `This coin is only a few days old. The month number matches today, because there is no full month yet.`,
    });
  }
  const late = flows
    .filter((row) => {
      const day = row.netFlow24hUsd;
      const month = row.netFlow30dUsd;
      return (
        day > 0 &&
        month != null &&
        month < 0 &&
        Math.abs(month) > day * 5 &&
        (row.traderCount ?? 0) >= 15 &&
        (row.marketCapUsd ?? 0) >= 100_000_000
      );
    })
    .sort((a, b) => (a.netFlow30dUsd ?? 0) - (b.netFlow30dUsd ?? 0))[0];
  if (late) {
    insights.push({
      id: "late-blip",
      title: "A green day against a red month",
      technical: `${markFlow(late)} took in ${formatUsd(late.netFlow24hUsd)} in 24h and ${formatUsd(late.netFlow30dUsd ?? 0)} over 30d, with ${late.traderCount ?? 0} traders and market cap ${formatUsd(late.marketCapUsd ?? 0)}. The month is more than five times the day, the other way.`,
      plain: `Today money is going in. Over the month a lot more came out.`,
    });
  }
  const chainDollars = new Map<string, number>();
  let flowDollars = 0;
  for (const row of flows) {
    if (!row.chain || row.netFlow24hUsd <= 0) continue;
    chainDollars.set(row.chain, (chainDollars.get(row.chain) ?? 0) + row.netFlow24hUsd);
    flowDollars += row.netFlow24hUsd;
  }
  const dollarLead = [...chainDollars.entries()].sort((a, b) => b[1] - a[1])[0];
  if (dollarLead && flowDollars > 0 && chainDollars.size >= 2 && dollarLead[1] / flowDollars >= 0.7) {
    insights.push({
      id: "flow-one-chain",
      title: "One chain holds the day's dollars",
      technical: `${formatUsd(dollarLead[1])} of ${formatUsd(flowDollars)} in positive 24h net flow on this page sits on ${dollarLead[0]}. ${chainDollars.size} chains appear. The page is not an even mix.`,
      plain: `Most of the money moving on this list is on ${dollarLead[0]}. The other chains are small.`,
    });
  }
  if (flows.length >= 20 && flows.every((row) => row.netFlow24hUsd > 0)) {
    insights.push({
      id: "buyers-only-page",
      title: "This page cannot show who left",
      technical: `All ${flows.length} names on this flow page have positive 24h net flow. The call sorts that way, so a name people are leaving does not appear here.`,
      plain: `Every coin on this list is one people put money into today. Coins people are leaving are on a different page, so you cannot see them here.`,
    });
  }
  const valued = holds.filter((row) => row.valueUsd != null && row.valueUsd > 0);
  const pageValue = valued.reduce((sum, row) => sum + (row.valueUsd ?? 0), 0);
  const topThree = [...valued].sort((a, b) => (b.valueUsd ?? 0) - (a.valueUsd ?? 0)).slice(0, 3);
  const topSum = topThree.reduce((sum, row) => sum + (row.valueUsd ?? 0), 0);
  const pileLead = topThree[0];
  if (valued.length >= 20 && pageValue > 0 && pileLead && topSum / pageValue >= 0.4) {
    insights.push({
      id: "pile-three",
      title: "Three names are the pile",
      technical: `The three largest balances are ${formatUsd(topSum)} of ${formatUsd(pageValue)} on this holdings page, ${Math.round((100 * topSum) / pageValue)}%. The largest is ${markHolding(pileLead)}. This is the page, not the whole book.`,
      plain: `Three coins are most of what you can see. This is one page, not every coin.`,
    });
  }
  const shrinking: { flow: FlowRow; hold: HoldingRow }[] = [];
  for (const flow of flows) {
    if ((flow.traderCount ?? 0) < 5 || flow.netFlow24hUsd <= 0 || !flow.chain || !flow.tokenAddress) continue;
    const hold = byAsset.get(assetKey(flow.chain, flow.tokenAddress));
    if (hold && hold.change24hPercent != null && hold.change24hPercent <= -0.15) shrinking.push({ flow, hold });
  }
  const shrink = shrinking[0];
  if (shrink && shrink.hold.change24hPercent != null) {
    insights.push({
      id: "shrinking-pile",
      title: "Buying on the list, shrinking in the pile",
      technical: `${shrinking.length} names have positive 24h net flow and a holdings balance down at least 15% on the same chain and address. ${markFlow(shrink.flow)} is one: flow ${formatUsd(shrink.flow.netFlow24hUsd)}, balance change ${percentText(shrink.hold.change24hPercent)}.`,
      plain: `People on the moving list are putting money in, and the pile of people who already hold it is getting smaller. Those are two different groups.`,
    });
  }
  const hour = hourInsight(flows);
  if (hour) insights.push(hour);
  for (const item of acrossJoins(holds, flows, extra.buys ?? [])) insights.push(item);
  for (const item of walletInsightDrafts(extra.traders ?? [], extra.keyKind ?? null, holds)) insights.push(item);
  for (const item of printInsightDrafts(extra.topAddresses ?? [], extra.buys ?? [])) insights.push(item);
  return insights.flatMap((item) => {
    const section = INSIGHT_SECTION[item.id];
    return section ? [{ ...item, section }] : [];
  });
}

function hourInsight(flows: FlowRow[]): DepthDraft | null {
  const halves = tokenHalves(flows);
  const top = halves.ranked.slice(0, halves.top.count);
  const rest = halves.ranked.slice(halves.top.count);
  if (top.length === 0 || rest.length === 0) return null;
  const known = (rows: FlowRow[]) => rows.filter((row) => {
    const hour = hourAgainstDay(row.netFlow1hUsd, row.netFlow24hUsd);
    return hour === "differ" || hour === "match";
  });
  const differs = (rows: FlowRow[]) => rows.filter((row) => hourAgainstDay(row.netFlow1hUsd, row.netFlow24hUsd) === "differ");
  const topKnown = known(top);
  const restKnown = known(rest);
  const topDiffer = differs(top);
  const restDiffer = differs(rest);
  if (topKnown.length === 0 || restKnown.length === 0) return null;
  if (shareText(topDiffer.length / topKnown.length) === shareText(restDiffer.length / restKnown.length)) return null;
  const lead = topDiffer[0] ?? restDiffer[0];
  if (!lead) return null;
  return {
    id: "hour-against-day",
    title: "The hour fights the day",
    technical: `${topDiffer.length} of ${topKnown.length} biggest moves with an hour and a day have those windows pointing different ways. The quieter names: ${restDiffer.length} of ${restKnown.length}. ${markFlow(lead)} is one.`,
    plain: `For some loud coins, the last hour and the day point different ways. That shows up more on the loud side than on the quiet side.`,
  };
}

function acrossJoins(holds: HoldingRow[], flows: FlowRow[], buys: DexBuy[]): DepthDraft[] {
  if (buys.length === 0 || holds.length === 0) return [];
  const bought = new Set(buys.flatMap((buy) => (buy.tokenAddress ? [buy.tokenAddress] : [])));
  const held = new Set(holds.filter((row) => row.address).map((row) => assetKey(row.chain, row.address)));
  const off = tokenHalves(flows).ranked
    .filter((row) => row.chain === "solana")
    .slice(0, 50)
    .filter((row) => row.tokenAddress && !held.has(assetKey("solana", row.tokenAddress)));
  const offHit = off.filter((row) => row.tokenAddress && bought.has(row.tokenAddress));
  const flowKeys = new Set(flows.filter((row) => row.tokenAddress).map((row) => assetKey(row.chain, row.tokenAddress)));
  const quiet = [...holds]
    .filter((row) => row.address)
    .sort((a, b) => b.holdersCount - a.holdersCount)
    .slice(0, 50)
    .filter((row) => !flowKeys.has(assetKey(row.chain, row.address)));
  const quietHit = quiet.filter((row) => row.chain === "solana" && bought.has(row.address));
  const drafts: DepthDraft[] = [];
  const offLead = offHit[0];
  if (offLead) {
    drafts.push({
      id: "bought-off-book",
      title: "Bought, and still off the book",
      technical: `${offHit.length} of ${off.length} Solana names in the largest moves that are missing from holdings were bought on today's tape. ${markFlow(offLead)} is one.`,
      plain: `Some coins on the biggest moves are not in the pile, and people still bought them today.`,
    });
  }
  const quietLead = quietHit[0];
  if (quietLead) {
    drafts.push({
      id: "quiet-bought",
      title: "Quiet on the move list, bought today",
      technical: `${quietHit.length} of ${quiet.length} most-held names that are not on the netflow page were bought on today's tape. ${markHolding(quietLead)} is one.`,
      plain: `Some coins the group still holds did not make the move list, and someone still bought them today.`,
    });
  }
  return drafts;
}

function walletInsightDrafts(rows: TraderRow[], keyKind: TokenKeyKind | null, holds: HoldingRow[]): DepthDraft[] {
  const ranked = rankTraders(rows);
  const top = ranked.slice(0, Math.min(TRADER_TOP, ranked.length));
  const rest = ranked.slice(top.length);
  if (top.length === 0 || rest.length === 0) return [];
  return [roiInsight(top, rest), openRateInsight(top, rest), mintInsight(top, rest, keyKind, holds)].filter((item): item is DepthDraft => item != null);
}

function roiInsight(top: TraderRow[], rest: TraderRow[]): DepthDraft | null {
  const topMed = median(present(top.map((row) => row.avgTradeRoi)));
  const restMed = median(present(rest.map((row) => row.avgTradeRoi)));
  if (topMed == null || restMed == null || ratioText(topMed) === ratioText(restMed)) return null;
  const under = top.filter((row) => row.avgTradeRoi != null && row.avgTradeRoi < restMed);
  const lead = [...under].sort((a, b) => (a.avgTradeRoi ?? 0) - (b.avgTradeRoi ?? 0))[0];
  if (!lead || lead.avgTradeRoi == null) return null;
  return {
    id: "roi-under-total",
    title: "A big total, a small rate",
    technical: `${under.length} of ${top.length} who made the most have an average trade return below the other wallets' median of ${ratioText(restMed)}. The first ${top.length} median is ${ratioText(topMed)}. ${walletMark("solana", lead.address)} made ${formatUsd(lead.totalPnlUsd)} at ${ratioText(lead.avgTradeRoi)} per trade.`,
    plain: `Some people who made the most money still got a worse return on each trade than the typical wallet further down the list.`,
  };
}

function openRateInsight(top: TraderRow[], rest: TraderRow[]): DepthDraft | null {
  const topMed = median(present(top.map((row) => row.unrealizedRoiPercent)));
  const restMed = median(present(rest.map((row) => row.unrealizedRoiPercent)));
  if (topMed == null || restMed == null || plainNumber(topMed) === plainNumber(restMed)) return null;
  const lead = [...top].filter((row) => row.unrealizedRoiPercent != null).sort((a, b) => (b.unrealizedRoiPercent ?? 0) - (a.unrealizedRoiPercent ?? 0))[0];
  if (!lead || lead.unrealizedRoiPercent == null) return null;
  return {
    id: "open-rate",
    title: "What is still open returned more",
    technical: `Unrealized return for the first ${top.length} is ${plainNumber(topMed)}%. The other wallets: ${plainNumber(restMed)}%. ${walletMark("solana", lead.address)} is the high one on the profit cut, ${plainNumber(lead.unrealizedRoiPercent)}%.`,
    plain: `Money still sitting in open trades returned more for the people who made the most than for everyone else.`,
  };
}

function mintInsight(top: TraderRow[], rest: TraderRow[], keyKind: TokenKeyKind | null, holds: HoldingRow[]): DepthDraft | null {
  if (keyKind == null) return null;
  const lead = frequentKey(top);
  if (!lead) return null;
  const restCount = rest.filter((row) => row.traded.includes(lead.key)).length;
  if (shareText(lead.count / top.length) === shareText(rest.length === 0 ? 0 : restCount / rest.length)) return null;
  const held = holds.find((row) => row.address === lead.key);
  const name = keyKind === "symbol"
    ? lead.key
    : tokenMark({ symbol: held?.symbol || "unnamed", chain: held?.chain || "solana", address: lead.key });
  return {
    id: "one-mint",
    title: "One mint in the traded list",
    technical: `${lead.count} of ${top.length} who made the most list ${name} among the tokens they traded. The other wallets: ${restCount} of ${rest.length}.`,
    plain: `One coin shows up in the traded list of the people who made the most more often than it does further down the list.`,
  };
}

function frequentKey(rows: TraderRow[]): { key: string; count: number } | null {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const key of new Set(row.traded)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const lead = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!lead || lead[1] === 0) return null;
  return { key: lead[0], count: lead[1] };
}

const GIANT_CAP_USD = 1_000_000_000;

function printInsightDrafts(topAddresses: string[], buys: DexBuy[]): DepthDraft[] {
  if (topAddresses.length === 0 || buys.length === 0) return [];
  return [leftTheTape(topAddresses, buys), onlyTheCut(topAddresses, buys), giantBuy(topAddresses, buys)].filter((item): item is DepthDraft => item != null);
}

function leftTheTape(topAddresses: string[], buys: DexBuy[]): DepthDraft | null {
  const buyers = new Set(buys.map((buy) => buy.traderAddress));
  const absent = topAddresses.filter((address) => !buyers.has(address));
  if (absent.length === 0) return null;
  return {
    id: "left-the-tape",
    title: "Most of the profit cut is not on the tape",
    technical: `${absent.length} of ${topAddresses.length} who made the most have no buy on this tape. The age and the cap leave them out.`,
    plain: `Most of the people who made the most money did not buy anything on this page. The age and the size skip them.`,
  };
}

function onlyTheCut(topAddresses: string[], buys: DexBuy[]): DepthDraft | null {
  const topSet = new Set(topAddresses);
  const topMints = new Map<string, DexBuy>();
  const restMints = new Set<string>();
  for (const buy of buys) {
    if (!buy.tokenAddress) continue;
    if (topSet.has(buy.traderAddress)) {
      if (!topMints.has(buy.tokenAddress)) topMints.set(buy.tokenAddress, buy);
    } else restMints.add(buy.tokenAddress);
  }
  const alone = [...topMints.values()].filter((buy) => buy.tokenAddress && !restMints.has(buy.tokenAddress));
  const shared = [...topMints.keys()].filter((key) => restMints.has(key)).length;
  const lead = alone[0];
  if (!lead?.tokenAddress) return null;
  const name = tokenMark({ symbol: lead.tokenSymbol || "unnamed", chain: "solana", address: lead.tokenAddress });
  return {
    id: "only-the-cut",
    title: "Names only the profit cut bought",
    technical: `${alone.length} mints were bought by the first ${topAddresses.length} and not by the other wallets on this tape. ${shared} mints were bought by both. ${name} is one the profit cut bought alone.`,
    plain: `Some coins were bought by the people who made the most and not by the other buyers on this page.`,
  };
}

function giantBuy(topAddresses: string[], buys: DexBuy[]): DepthDraft | null {
  const topSet = new Set(topAddresses);
  const topWallets = new Set<string>();
  const restWallets = new Set<string>();
  const topGiant = new Set<string>();
  const restGiant = new Set<string>();
  let lead: DexBuy | null = null;
  for (const buy of buys) {
    if (topSet.has(buy.traderAddress)) topWallets.add(buy.traderAddress);
    else restWallets.add(buy.traderAddress);
    if (buy.boughtMarketCap == null || buy.boughtMarketCap < GIANT_CAP_USD) continue;
    if (topSet.has(buy.traderAddress)) {
      topGiant.add(buy.traderAddress);
      if (!lead || (buy.boughtMarketCap ?? 0) > (lead.boughtMarketCap ?? 0)) lead = buy;
    } else restGiant.add(buy.traderAddress);
  }
  if (topWallets.size === 0 || restWallets.size === 0 || !lead?.tokenAddress || lead.boughtMarketCap == null) return null;
  if (shareText(topGiant.size / topWallets.size) === shareText(restGiant.size / restWallets.size)) return null;
  const name = tokenMark({ symbol: lead.tokenSymbol || "unnamed", chain: "solana", address: lead.tokenAddress });
  return {
    id: "giant-at-buy",
    title: "A giant at the buy",
    technical: `${topGiant.size} of ${topWallets.size} who made the most and bought today bought a coin of ${formatUsd(GIANT_CAP_USD)} or more. The other wallets: ${restGiant.size} of ${restWallets.size}. ${name} was ${formatUsd(lead.boughtMarketCap)} at the buy.`,
    plain: `The people who made the most were more likely to buy a coin that was already huge.`,
  };
}

function groupMedian<T>(rows: T[], pick: (row: T) => number | null): number | null {
  return median(present(rows.map(pick)));
}

function medianSides<T>(
  name: string,
  left: T[],
  right: T[],
  pick: (row: T) => number | null,
  kind: "count" | "days" | "usd" | "share" | "ratio" | "pct",
  leftGroup: string,
  rightGroup: string,
  label: (row: T) => string,
): QuestTable["rows"][number] {
  const leftValue = groupMedian(left, pick);
  const rightValue = groupMedian(right, pick);
  return measureRow(
    name,
    sideMedian(leftValue, kind, leftGroup),
    sideMedian(rightValue, kind, rightGroup),
    nearestMany(left, pick, leftValue, label),
    nearestMany(right, pick, rightValue, label),
  );
}

/** Same two-column table as the trait quest. Each page compares the two insight groups. */
export function insightTables(holds: HoldingRow[], flows: FlowRow[]): Partial<Record<DepthInsight["section"], QuestTable>> {
  const tables: Partial<Record<DepthInsight["section"], QuestTable>> = {};
  const life = flows.filter((row) => {
    const week = row.netFlow7dUsd;
    const month = row.netFlow30dUsd;
    return row.tokenAgeDays != null && row.tokenAgeDays <= LIFE_AGE_DAYS && week != null && month != null && Math.abs(row.netFlow24hUsd - week) < 1 && Math.abs(week - month) < 1;
  });
  const late = flows.filter((row) => {
    const month = row.netFlow30dUsd;
    return row.netFlow24hUsd > 0 && month != null && month < 0 && Math.abs(month) > row.netFlow24hUsd * 5 && (row.traderCount ?? 0) >= 15 && (row.marketCapUsd ?? 0) >= 100_000_000;
  });
  if (flows.length > 0) {
    tables.move = {
      caption: "One side is a coin younger than 3 days whose day, week, and month flow match. The other side is a large coin with a green day and a red month more than five times as big.",
      columns: ["Measure", "Month is the life", "Green day, red month"],
      nameLabels: ["Young name", "Late name"],
      rows: [
        measureRow("Names", sideCount(life.length, flows.length, "are younger than 3 days with matching windows", "young coins"), sideCount(late.length, flows.length, "have a green day against a red month", "late coins"), clipNames(life.map(markFlow)), clipNames(late.map(markFlow))),
        medianSides("Age", life, late, (row) => row.tokenAgeDays, "days", "young coin", "late coin", markFlow),
        medianSides("24h flow", life, late, (row) => row.netFlow24hUsd, "usd", "young coin", "late coin", markFlow),
        medianSides("30d flow", life, late, (row) => row.netFlow30dUsd, "usd", "young coin", "late coin", markFlow),
        medianSides("Traders", life, late, (row) => row.traderCount, "count", "young coin", "late coin", markFlow),
      ],
    };
  }
  const byAsset = new Map<string, HoldingRow>();
  for (const row of holds) {
    if (row.chain && row.address) byAsset.set(assetKey(row.chain, row.address), row);
  }
  const clashes = flows.flatMap((flow) => {
    if ((flow.traderCount ?? 0) < SEAT_MIN_WALLETS || !flow.chain || !flow.tokenAddress) return [];
    const hold = byAsset.get(assetKey(flow.chain, flow.tokenAddress));
    return hold && hold.holdersCount <= 8 ? [{ flow, hold }] : [];
  });
  const shrinking = flows.flatMap((flow) => {
    if ((flow.traderCount ?? 0) < 5 || flow.netFlow24hUsd <= 0 || !flow.chain || !flow.tokenAddress) return [];
    const hold = byAsset.get(assetKey(flow.chain, flow.tokenAddress));
    return hold && hold.change24hPercent != null && hold.change24hPercent <= -0.15 ? [{ flow, hold }] : [];
  });
  if (flows.length > 0 && holds.length > 0) {
    const clashLabel = (item: { flow: FlowRow }) => markFlow(item.flow);
    tables.across = {
      caption: "Traders ahead means at least 9 flow traders and at most 8 holders on the same chain and address. Pile shrinking means positive 24h flow and a holdings balance down at least 15%.",
      columns: ["Measure", "Traders ahead", "Pile shrinking"],
      nameLabels: ["Disagree name", "Shrinking name"],
      rows: [
        measureRow("Names", sideCount(clashes.length, flows.length, "have more traders than holders", "disagree names"), sideCount(shrinking.length, flows.length, "are being bought while the pile shrinks", "shrinking names"), clipNames(clashes.map(clashLabel)), clipNames(shrinking.map(clashLabel))),
        medianSides("Traders", clashes, shrinking, (item) => item.flow.traderCount, "count", "disagree name", "shrinking name", clashLabel),
        medianSides("Holders", clashes, shrinking, (item) => item.hold.holdersCount, "count", "disagree name", "shrinking name", clashLabel),
        medianSides("24h flow", clashes, shrinking, (item) => item.flow.netFlow24hUsd, "usd", "disagree name", "shrinking name", clashLabel),
        medianSides("Balance change", clashes, shrinking, (item) => item.hold.change24hPercent, "pct", "disagree name", "shrinking name", clashLabel),
      ],
    };
  }
  return tables;
}

export function parseHoldings(body: unknown): { rows: HoldingRow[]; isLastPage: boolean } {
  if (!body || typeof body !== "object") {
    throw new Error("Nansen returned a body this desk cannot read.");
  }
  const record = body as { data?: unknown; pagination?: { is_last_page?: unknown } };
  if (!Array.isArray(record.data)) throw new Error("Nansen returned no data array.");
  const rows: HoldingRow[] = [];
  for (const item of record.data) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const holders = readNumber(row.holders_count);
    if (holders == null) continue;
    const sectors = Array.isArray(row.token_sectors)
      ? row.token_sectors.filter((sector): sector is string => typeof sector === "string")
      : [];
    rows.push({
      chain: typeof row.chain === "string" ? row.chain : "",
      symbol: typeof row.token_symbol === "string" ? row.token_symbol : "",
      address: typeof row.token_address === "string" ? row.token_address : "",
      sectors,
      holdersCount: holders,
      valueUsd: readNumber(row.value_usd),
      change24hPercent: readNumber(row.balance_24h_percent_change),
      sharePercent: readNumber(row.share_of_holdings_percent),
      marketCapUsd: readNumber(row.market_cap_usd),
      ageDays: readNumber(row.token_age_days),
    });
  }
  if (record.data.length > 0 && rows.length === 0) {
    throw new Error("Nansen rows were missing the fields this desk reads.");
  }
  return { rows, isLastPage: record.pagination?.is_last_page !== false };
}
