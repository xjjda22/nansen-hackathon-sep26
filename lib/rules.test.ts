import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  combinedQuest,
  cohortSentence,
  findOnPage,
  probeQuest,
  hourAgainstDay,
  judgeDay,
  onloadRead,
  judgeFive,
  notOnYourList,
  tokenHalves,
  keptTokenMeasures,
  tokenMeasures,
  moveExample,
  walletExample,
  printExample,
  holdExample,
  crossTraits,
  crossWalk,
  holdWalkTraits,
  bandQuests,
  offBookExample,
  parseBook,
  buyComparisons,
  holdingComparisons,
  holdingTraits,
  splitQuests,
  deeperInsights,
  insightTables,
  parseHoldings,
  parseDexTrades,
  parseLeaderboard,
  profitCutAddresses,
  publicPayload,
  sameTickerTwoChains,
  sectorWeather,
  traderComparisons,
  type FlowRow,
  type HoldingRow,
  type TraderRow,
} from "./rules";

function row(partial: Partial<FlowRow> & Pick<FlowRow, "tokenSymbol" | "netFlow24hUsd">): FlowRow {
  return {
    chain: partial.chain ?? "ethereum",
    tokenAddress: partial.tokenAddress ?? `0x${partial.tokenSymbol.padEnd(40, "a").slice(0, 40)}`,
    tokenSymbol: partial.tokenSymbol,
    netFlow24hUsd: partial.netFlow24hUsd,
    netFlow1hUsd: partial.netFlow1hUsd === undefined ? null : partial.netFlow1hUsd,
    netFlow7dUsd: partial.netFlow7dUsd === undefined ? null : partial.netFlow7dUsd,
    netFlow30dUsd: partial.netFlow30dUsd === undefined ? null : partial.netFlow30dUsd,
    tokenSectors: partial.tokenSectors ?? ["Memes"],
    traderCount: partial.traderCount === undefined ? 4 : partial.traderCount,
    tokenAgeDays: partial.tokenAgeDays === undefined ? null : partial.tokenAgeDays,
    marketCapUsd: partial.marketCapUsd === undefined ? null : partial.marketCapUsd,
  };
}

test("empty book skips the ledger line", () => {
  const result = notOnYourList([row({ tokenSymbol: "PEPE", netFlow24hUsd: 100 })], true, "   ");
  assert.equal(result.call, false);
  assert.equal(result.skipped, true);
  assert.match(result.line, /Empty book/);
});

test("bad strings are ignored and still make no call when nothing remains", () => {
  const result = notOnYourList([], true, "!!!");
  assert.equal(result.call, false);
  assert.deepEqual(result.ignored, ["!!!"]);
});

test("ETH does not drop WETH, and the same symbol drops every chain", () => {
  const rows = [
    row({ tokenSymbol: "WETH", netFlow24hUsd: 5000, chain: "ethereum", tokenAddress: "0x" + "c".repeat(40) }),
    row({ tokenSymbol: "ETH", netFlow24hUsd: 4000, chain: "ethereum", tokenAddress: "0x" + "d".repeat(40) }),
    row({ tokenSymbol: "PEPE", netFlow24hUsd: 3000, chain: "ethereum" }),
    row({ tokenSymbol: "PEPE", netFlow24hUsd: 2500, chain: "solana", tokenAddress: "So11111111111111111111111111111111111111112" }),
  ];
  const result = notOnYourList(rows, true, "ETH");
  assert.equal(result.call, true);
  if (!result.call) return;
  assert.deepEqual(
    result.cards.map((card) => `${card.tokenSymbol}:${card.chain}`),
    ["WETH:ethereum", "PEPE:ethereum", "PEPE:solana"],
  );
});

test("EVM addresses match case-insensitively and a wallet that matches nothing is ignored", () => {
  const token = "0x" + "ab".repeat(20);
  const rows = [row({ tokenSymbol: "AAVE", netFlow24hUsd: 9000, tokenAddress: token })];
  const wallet = "0x" + "11".repeat(20);
  const result = notOnYourList(rows, false, `${token.toUpperCase()}, ${wallet}`);
  assert.equal(result.call, true);
  if (!result.call) return;
  assert.equal(result.cards.length, 0);
  assert.ok(result.ignored.includes(wallet));
  assert.equal(result.pageCut, true);
});

test("Solana addresses are case-sensitive", () => {
  const address = "So11111111111111111111111111111111111111112";
  const rows = [
    row({
      tokenSymbol: "BONK",
      netFlow24hUsd: 8000,
      chain: "solana",
      tokenAddress: address,
    }),
  ];
  const missed = notOnYourList(rows, true, address.toLowerCase());
  assert.equal(missed.call, true);
  if (missed.call) assert.equal(missed.cards.length, 1);
  const hit = notOnYourList(rows, true, address);
  assert.equal(hit.call, true);
  if (hit.call) assert.equal(hit.cards.length, 0);
});

test("dust, a single trader, and a negative row do not pad the three", () => {
  const rows = [
    row({ tokenSymbol: "BIG", netFlow24hUsd: 10_000, traderCount: 5 }),
    row({ tokenSymbol: "DUST", netFlow24hUsd: 50, traderCount: 9 }),
    row({ tokenSymbol: "LONE", netFlow24hUsd: 4000, traderCount: 1 }),
    row({ tokenSymbol: "DOWN", netFlow24hUsd: -9000, traderCount: 8 }),
    row({ tokenSymbol: "MID", netFlow24hUsd: 2000, traderCount: 3 }),
  ];
  const result = notOnYourList(rows, true, "BIG");
  assert.equal(result.call, true);
  if (!result.call) return;
  assert.deepEqual(
    result.cards.map((card) => card.tokenSymbol),
    ["MID"],
  );
  assert.equal(result.count, 1);
});

test("sector sums overlap, empty sectors stay unmapped, and all-positive means nothing is leaving", () => {
  const rows = [
    row({ tokenSymbol: "PEPE", netFlow24hUsd: 100, tokenSectors: ["Memes", "Culture"] }),
    row({ tokenSymbol: "DOGE", netFlow24hUsd: 80, tokenSectors: ["Memes"] }),
    row({ tokenSymbol: "NONE", netFlow24hUsd: 40, tokenSectors: [] }),
  ];
  const weather = sectorWeather(rows, true);
  const memes = weather.sums.find((side) => side.sector === "Memes");
  const culture = weather.sums.find((side) => side.sector === "Culture");
  assert.equal(memes?.sumUsd, 180);
  assert.equal(culture?.sumUsd, 100);
  assert.equal(weather.unmapped, 1);
  assert.equal(weather.nothingLeaving, true);
  assert.match(weather.sentence, /Nothing is leaving/);
  assert.match(weather.sentence, /overlap/i);
});

test("one token over half is not called a sector move, and a flat book has no weather", () => {
  const dominated = sectorWeather(
    [
      row({ tokenSymbol: "WBTC", netFlow24hUsd: 900, tokenSectors: ["Majors"], chain: "ethereum" }),
      row({ tokenSymbol: "TBTC", netFlow24hUsd: 100, tokenSectors: ["Majors"], chain: "ethereum" }),
    ],
    true,
  );
  assert.equal(dominated.entering?.oneToken, true);
  assert.match(dominated.sentence, /not a sector move/);
  assert.match(dominated.sentence, /WBTC/);

  const quiet = sectorWeather(
    [
      row({ tokenSymbol: "BIG", netFlow24hUsd: 10_000, tokenSectors: [] }),
      row({ tokenSymbol: "A", netFlow24hUsd: 50, tokenSectors: ["X"] }),
      row({ tokenSymbol: "B", netFlow24hUsd: -40, tokenSectors: ["Y"] }),
    ],
    true,
  );
  assert.equal(quiet.noWeather, true);
  assert.match(quiet.sentence, /No sector weather/);
});

test("two chains: once, absent, tie, and exact symbol", () => {
  const rows = [
    row({ tokenSymbol: "PEPE", netFlow24hUsd: 10_000, chain: "ethereum", tokenAddress: "0x" + "1".repeat(40) }),
    row({ tokenSymbol: "PEPE", netFlow24hUsd: -9_950, chain: "solana", tokenAddress: "So11111111111111111111111111111111111111112" }),
    row({ tokenSymbol: "WETH", netFlow24hUsd: 8_000, chain: "base", tokenAddress: "0x" + "2".repeat(40) }),
    row({ tokenSymbol: "DUST", netFlow24hUsd: 10, chain: "base" }),
  ];
  const pepe = sameTickerTwoChains(rows, false, "pepe");
  assert.equal(pepe.call, true);
  if (pepe.call) {
    assert.equal(pepe.status, "several");
    assert.equal(pepe.tied, true);
    assert.equal(pepe.pageCut, true);
    assert.match(pepe.sentence, /tied/);
    assert.equal(pepe.sentence.toLowerCase().includes("buy"), false);
  }
  const weth = sameTickerTwoChains(rows, true, "WETH");
  assert.equal(weth.call, true);
  if (weth.call) assert.equal(weth.status, "once");
  const eth = sameTickerTwoChains(rows, true, "ETH");
  assert.equal(eth.call, true);
  if (eth.call) {
    assert.equal(eth.status, "absent");
    assert.match(eth.sentence, /hyperliquid/);
  }
  const dust = sameTickerTwoChains(rows, true, "DUST");
  assert.equal(dust.call, true);
  if (dust.call) assert.equal(dust.status, "absent");
});

test("cohort sentence requires the largest absolute and the same sign", () => {
  const line = cohortSentence(
    {
      smart_trader_net_flow_usd: 10,
      whale_net_flow_usd: -50,
      top_pnl_net_flow_usd: null,
      exchange_net_flow_usd: null,
      fresh_wallets_net_flow_usd: null,
      public_figure_net_flow_usd: null,
    },
    20,
  );
  assert.equal(line, "Cohorts are flat or missing.");
  const named = cohortSentence(
    {
      smart_trader_net_flow_usd: 40,
      whale_net_flow_usd: 10,
      top_pnl_net_flow_usd: null,
      exchange_net_flow_usd: null,
      fresh_wallets_net_flow_usd: null,
      public_figure_net_flow_usd: null,
    },
    20,
  );
  assert.equal(named, "Smart traders, positive.");
  assert.equal(named.toLowerCase().includes("buying"), false);
});

test("flat days do not agree, null is not zero, and fresh wallets are unavailable", () => {
  const flat = judgeDay({
    smart_trader_net_flow_usd: null,
    whale_net_flow_usd: 0,
    top_pnl_net_flow_usd: null,
    exchange_net_flow_usd: null,
    fresh_wallets_net_flow_usd: null,
    public_figure_net_flow_usd: null,
  });
  assert.equal(flat.flat, true);
  assert.equal(flat.line, "FLAT");

  const fresh = judgeDay({
    smart_trader_net_flow_usd: 5,
    fresh_wallets_net_flow_usd: 100,
    whale_net_flow_usd: null,
    top_pnl_net_flow_usd: null,
    exchange_net_flow_usd: null,
    public_figure_net_flow_usd: null,
  });
  assert.equal(judgeFive(fresh.winners, { fresh_wallets_net_flow_usd: -100 }, false), "UNAVAILABLE");

  const day = judgeDay({
    smart_trader_net_flow_usd: 80,
    whale_net_flow_usd: null,
    top_pnl_net_flow_usd: null,
    exchange_net_flow_usd: null,
    fresh_wallets_net_flow_usd: null,
    public_figure_net_flow_usd: null,
  });
  assert.equal(
    judgeFive(day.winners, { smart_trader_net_flow_usd: null }, false),
    "UNAVAILABLE",
  );
  assert.equal(
    judgeFive(day.winners, { smart_trader_net_flow_usd: -3 }, false),
    "DISAGREE",
  );
  assert.equal(judgeFive(day.winners, { smart_trader_net_flow_usd: 3 }, false), "AGREE");
});

test("onload stamps count positive flow, the leading sector, sign flips, and a rails pair", () => {
  const rows = [
    row({
      tokenSymbol: "PEPE",
      netFlow24hUsd: 10_000,
      netFlow7dUsd: 4_000,
      netFlow30dUsd: -9_000,
      traderCount: 6,
      chain: "ethereum",
      tokenSectors: ["Memes"],
    }),
    row({
      tokenSymbol: "PEPE",
      netFlow24hUsd: 8_000,
      netFlow7dUsd: 1_000,
      netFlow30dUsd: 2_000,
      traderCount: 3,
      chain: "solana",
      tokenAddress: "So11111111111111111111111111111111111111112",
      tokenSectors: ["Memes"],
    }),
    row({
      tokenSymbol: "DOWN",
      netFlow24hUsd: -500,
      netFlow7dUsd: 0,
      netFlow30dUsd: -100,
      tokenSectors: ["DeFi"],
    }),
    row({
      tokenSymbol: "WIDE",
      netFlow24hUsd: 2_000,
      netFlow7dUsd: -20_000,
      netFlow30dUsd: 50_000,
      traderCount: 11,
      tokenSectors: ["Culture"],
    }),
    row({
      tokenSymbol: "DUST",
      netFlow24hUsd: 10,
      chain: "base",
      tokenSectors: ["Memes"],
    }),
    row({
      tokenSymbol: "DUST",
      netFlow24hUsd: 12,
      chain: "arbitrum",
      tokenAddress: "0x" + "9".repeat(40),
      tokenSectors: ["Memes"],
    }),
  ];
  const read = onloadRead(rows);
  assert.equal(read.positive, 5);
  assert.equal(read.sector, "Memes");
  assert.equal(read.sectorSumUsd, 10_000 + 8_000 + 10 + 12);
  assert.equal(read.flipCount, 2);
  assert.equal(read.sharpestSymbol, "WIDE");
  assert.equal(read.sharpestTraders, 11);
  assert.equal(read.pageCount, 6);
  assert.equal(read.entering?.topSymbol, "PEPE");
  assert.equal(read.entering?.oneToken, true);
  assert.equal(read.leaving?.sector, "DeFi");
  assert.equal(read.leaving?.oneToken, true);
  assert.equal(read.nothingLeaving, false);
  assert.equal(read.sharpest7dUsd, -20_000);
  assert.equal(read.sharpest30dUsd, 50_000);
  assert.equal(read.pair?.symbol, "PEPE");
  assert.equal(read.pair?.leftChain, "ethereum");
  assert.equal(read.pair?.rightChain, "solana");
  assert.equal(read.pair?.tied, false);
  assert.equal(read.pair?.week, "match");
  assert.equal(read.pair?.month, "differ");

  const alone = onloadRead([
    row({ tokenSymbol: "SOLO", netFlow24hUsd: 100, netFlow7dUsd: null, netFlow30dUsd: 40, tokenSectors: ["Memes"] }),
  ]);
  assert.equal(alone.pair, null);
  assert.equal(alone.flipCount, 0);
  assert.equal(alone.positive, 1);
});

test("absolute 24h ranks a large outflow above a small inflow", () => {
  const halves = tokenHalves([
    row({
      tokenSymbol: "SMALL",
      netFlow24hUsd: 10,
      chain: "ethereum",
      tokenSectors: ["DeFi"],
      traderCount: 2,
      tokenAgeDays: 10,
      marketCapUsd: 100,
      netFlow7dUsd: null,
      netFlow30dUsd: -10,
    }),
    row({
      tokenSymbol: "BIG",
      netFlow24hUsd: -500,
      chain: "solana",
      tokenSectors: ["Memes", "DeFi"],
      traderCount: 8,
      tokenAgeDays: 4,
      marketCapUsd: 900,
      netFlow7dUsd: -5,
      netFlow30dUsd: 5,
    }),
  ]);
  assert.deepEqual(
    halves.ranked.map((item) => item.tokenSymbol),
    ["BIG", "SMALL"],
  );
  assert.equal(halves.shortPage, true);
  assert.equal(halves.rest.count, 0);
  assert.deepEqual(halves.top.sectors, ["DeFi"]);
  assert.equal(halves.top.sectorCount, 2);
  assert.equal(halves.top.flipCount, 1);
  assert.equal(halves.top.medianTraders, 5);
    assert.equal(halves.frame, "This list has 2 tokens, not 100, and fewer than 50, so there is nothing quieter to set beside them.");
  assert.deepEqual(halves.common, []);
  assert.deepEqual(halves.meaningful, []);
});

test("one netflow page yields fifty measure rows", () => {
  const rows = Array.from({ length: 100 }, (_, index) =>
    row({
      tokenSymbol: `T${index}`,
      tokenAddress: `addr${index}`,
      chain: index < 60 ? "solana" : "base",
      netFlow24hUsd: 100 - index,
      netFlow7dUsd: index < 40 ? -1 : 1,
      netFlow30dUsd: 1,
      traderCount: index < 50 ? 20 : 5,
      tokenAgeDays: index < 50 ? 10 : 40,
      marketCapUsd: index < 50 ? 2_000_000 : 100_000,
      tokenSectors: index % 2 === 0 ? ["Memecoins"] : [],
    }),
  );
  const measures = tokenMeasures(rows, 50);
  assert.equal(measures.length, 50);
  const kept = keptTokenMeasures(measures);
  assert.deepEqual(kept.map((item) => item.name), ["Sector", "Chain", "7d sign ≠ 30d", "Median traders", "Median age", "Median market cap"]);
  assert.equal(new Set(measures.map((item) => item.name)).size, 50);
  const flips = measures.find((item) => item.name === "7d sign ≠ 30d");
  assert.match(flips?.bar ?? "", /40 of 50 names/);
  assert.match(flips?.climb ?? "", /0 of 50 names/);
  assert.match(flips?.barPlain ?? "", /loud coins/);
  const age = measures.find((item) => item.name === "Median age");
  assert.match(age?.bar ?? "", /10 days/);
  assert.match(age?.climb ?? "", /40 days/);
  assert.match(age?.gap ?? "", /older than the bar/);
});

test("move example names one token on each side of the four gaps", () => {
  const rows = Array.from({ length: 100 }, (_, index) =>
    row({
      tokenSymbol: `T${index}`,
      tokenAddress: `addr${index}`,
      netFlow24hUsd: 100 - index,
      netFlow7dUsd: index < 10 ? -1 : 1,
      netFlow30dUsd: 1,
      traderCount: index < 50 ? 20 : 5,
      tokenAgeDays: index < 50 ? 18 : 12,
      marketCapUsd: index < 50 ? 2_000_000 : 100_000,
    }),
  );
  const table = moveExample(rows);
  assert.equal(table?.columns[1], "Top 50");
  assert.equal(table?.columns[2], "Bottom 50 lacks");
  assert.equal(table?.nameLabels[0], "Top token");
  assert.ok((table?.rows[0]?.topNames.length ?? 0) <= 10);
  assert.ok((table?.rows[1]?.topNames.length ?? 0) >= 5);
  assert.ok((table?.rows[0]?.topNames.length ?? 0) <= 10);
  assert.match(table?.rows[0]?.bottom ?? "", /fewer than the top group/);
  assert.match(table?.rows[0]?.bottomPlain ?? "", /quiet coins/);
  assert.match(table?.rows[0]?.topPlain ?? "", /loud coins/);
  assert.match(table?.rows[1]?.bottom ?? "", /fewer wallets/);
  assert.match(table?.rows[2]?.bottom ?? "", /younger/);
  assert.match(table?.rows[3]?.bottom ?? "", /smaller/);
});

test("each quest page has a measure table", () => {
  const wallets = walletExample([
    ...Array.from({ length: 50 }, (_, index) =>
      wallet({
        totalPnlUsd: 100 - index,
        address: `TopWallet${index}`,
        heldTokensCount: 3,
        nTokens: 4,
        realizedPnlUsd: 40,
        nTrades: 8,
        traded: ["a", "b"],
      }),
    ),
    wallet({ totalPnlUsd: 1, address: "RestWallet1", heldTokensCount: 1, nTokens: 4, realizedPnlUsd: 1, nTrades: 4, traded: ["a"] }),
    wallet({ totalPnlUsd: 1, address: "RestWallet2", heldTokensCount: 1, nTokens: 4, realizedPnlUsd: 1, nTrades: 4, traded: ["z"] }),
  ]);
  assert.ok(wallets?.rows.some((item) => item.name === "Still holding" && /less still held/.test(item.bottom)));
  assert.match(wallets?.rows[0]?.topNames[0] ?? "", /TopWallet/);
  assert.ok((wallets?.rows[0]?.topNames.length ?? 0) <= 10);
  const prints = printExample(
    ["Aaa"],
    [
      { traderAddress: "Aaa", boughtAgeDays: 100, boughtMarketCap: 1_000, tokenSymbol: "OLD" },
      { traderAddress: "Bbb", boughtAgeDays: 2, boughtMarketCap: 10, tokenSymbol: "NEW" },
    ],
  );
  assert.deepEqual(
    prints?.rows.map((item) => item.name),
    ["Age at the buy", "Size at the buy"],
  );
  assert.match(prints?.rows[0]?.bottomNames.join(" ") ?? "", /NEW/);
  const holds = holdExample([
    ...Array.from({ length: 50 }, (_, index) => held({ symbol: `T${index}`, holdersCount: 100 - index, valueUsd: 1_000, change24hPercent: 0.01, sharePercent: 0.01, marketCapUsd: 5_000_000 })),
    held({ symbol: "THIN", holdersCount: 1, valueUsd: 10, change24hPercent: 0, sharePercent: 0.0001, marketCapUsd: 100_000 }),
  ]);
  assert.equal(holds?.rows.length, 5);
  assert.match(holds?.rows[0]?.bottomNames.join(" ") ?? "", /THIN/);
});

test("cross traits need two pages and refuse a median restatement", () => {
  const section = crossTraits({
    flow: [
      row({ chain: "solana", tokenSymbol: "MOVE", tokenAddress: "mint-move", netFlow24hUsd: 100, marketCapUsd: 50 }),
      row({ chain: "solana", tokenSymbol: "QUIET", tokenAddress: "mint-quiet", netFlow24hUsd: 1, marketCapUsd: 10 }),
    ],
    holds: [
      { chain: "solana", address: "mint-quiet", symbol: "QUIET", holdersCount: 20, marketCapUsd: 80 },
      { chain: "solana", address: "mint-held", symbol: "HELD", holdersCount: 15, marketCapUsd: 90 },
    ],
    buys: [{ traderAddress: "A", boughtAgeDays: 3, boughtMarketCap: 40, tokenAddress: "mint-quiet", tokenSymbol: "QUIET" }],
    traded: ["mint-move"],
    keyKind: "address",
  });
  assert.equal(section?.id, "across");
  assert.deepEqual(
    section?.traits.map((item) => item.id),
    ["cross-off-book", "cross-quiet", "cross-printed", "cross-cap"],
  );
  assert.match(section?.traits[0]?.line ?? "", /MOVE/);
  assert.match(section?.traits[1]?.line ?? "", /HELD/);
  assert.match(section?.traits[2]?.line ?? "", /QUIET/);
  assert.match(section?.traits[3]?.line ?? "", /at the buy/);
  assert.equal(section?.traits.some((item) => /top 50/i.test(item.line)), false);
  const emptyBook = crossTraits({
    flow: [row({ chain: "solana", tokenSymbol: "MOVE", tokenAddress: "mint-move", netFlow24hUsd: 100 })],
    holds: [],
    buys: [],
    traded: [],
    keyKind: null,
  });
  assert.equal(emptyBook, null);
  const onFlow = crossTraits({
    flow: [row({ chain: "ethereum", tokenSymbol: "ETH", tokenAddress: "eth-aaa", netFlow24hUsd: 80 })],
    holds: [
      { chain: "ethereum", address: "eth-aaa", symbol: "ETH", holdersCount: 30, marketCapUsd: 90 },
      { chain: "solana", address: "sol-ccc", symbol: "CCC", holdersCount: 10, marketCapUsd: 20 },
    ],
    buys: [],
    traded: [],
    keyKind: null,
  });
  const quiet = onFlow?.traits.find((item) => item.id === "cross-quiet");
  assert.match(quiet?.line ?? "", /1 of 2/);
  assert.match(quiet?.line ?? "", /CCC/);
  assert.equal(/ETH/.test(quiet?.line ?? ""), false);
  const sameCap = crossTraits({
    flow: [row({ chain: "solana", tokenSymbol: "SAME", tokenAddress: "mint-same", netFlow24hUsd: 40, marketCapUsd: 100 })],
    holds: [{ chain: "solana", address: "mint-same", symbol: "SAME", holdersCount: 4, marketCapUsd: 900 }],
    buys: [{ traderAddress: "A", boughtAgeDays: 2, boughtMarketCap: 100, tokenAddress: "mint-same", tokenSymbol: "SAME" }],
    traded: [],
    keyKind: null,
  });
  assert.equal(sameCap?.traits.some((item) => item.id === "cross-cap"), false);
  const table = offBookExample(
    [
      row({ chain: "solana", tokenSymbol: "MOVE", tokenAddress: "mint-move", netFlow24hUsd: 100, traderCount: 8, tokenAgeDays: 4, marketCapUsd: 50 }),
      row({ chain: "solana", tokenSymbol: "QUIET", tokenAddress: "mint-quiet", netFlow24hUsd: 10, traderCount: 2, tokenAgeDays: 40, marketCapUsd: 500 }),
    ],
    [
      { chain: "solana", address: "mint-quiet", symbol: "QUIET", holdersCount: 20, marketCapUsd: 80 },
    ],
  );
  assert.equal(table?.columns[1], "Off the book");
  assert.equal(table?.columns[2], "On the book");
  assert.match(table?.rows[0]?.top ?? "", /1 of 2/);
  assert.match(table?.rows[0]?.topNames.join(" ") ?? "", /MOVE/);
  assert.match(table?.rows[0]?.bottomNames.join(" ") ?? "", /QUIET/);
  assert.equal(offBookExample([], []), null);
});

test("equal absolute flow keeps the page order", () => {
  const halves = tokenHalves([
    row({ tokenSymbol: "FIRST", netFlow24hUsd: -10 }),
    row({ tokenSymbol: "SECOND", netFlow24hUsd: 10 }),
  ]);
  assert.deepEqual(
    halves.ranked.map((item) => item.tokenSymbol),
    ["FIRST", "SECOND"],
  );
});

test("top 50 against a short rest uses only fields on the tokens", () => {
  const rows: FlowRow[] = [];
  for (let i = 0; i < 60; i += 1) {
    rows.push(
      row({
        tokenSymbol: `T${String(i).padStart(2, "0")}`,
        netFlow24hUsd: 1_000 - i,
        chain: i < 50 ? "solana" : "ethereum",
        tokenSectors: i < 50 ? ["Memes"] : ["DeFi"],
        traderCount: i < 50 ? 10 : 4,
        tokenAgeDays: i < 50 ? 8 : 80,
        marketCapUsd: i < 50 ? 5_000 : null,
        netFlow7dUsd: i < 50 ? -5 : 5,
        netFlow30dUsd: 5,
      }),
    );
  }
  const halves = tokenHalves(rows);
  assert.equal(halves.pageCount, 60);
  assert.equal(halves.shortPage, true);
  assert.equal(halves.top.count, 50);
  assert.equal(halves.rest.count, 10);
  assert.equal(halves.ranked[0].tokenSymbol, "T00");
  assert.equal(halves.ranked[49].tokenSymbol, "T49");
  assert.equal(halves.ranked[50].tokenSymbol, "T50");
  assert.deepEqual(halves.top.sectors, ["Memes"]);
  assert.equal(halves.top.sectorShare, 1);
  assert.deepEqual(halves.rest.sectors, ["DeFi"]);
  assert.deepEqual(halves.top.chains, ["solana"]);
  assert.deepEqual(halves.rest.chains, ["ethereum"]);
  assert.equal(halves.top.flipCount, 50);
  assert.equal(halves.rest.flipCount, 0);
  assert.equal(halves.top.flipShare, 1);
  assert.equal(halves.rest.flipShare, 0);
  assert.equal(halves.top.medianTraders, 10);
  assert.equal(halves.rest.medianTraders, 4);
  assert.equal(halves.top.medianAgeDays, 8);
  assert.equal(halves.rest.medianAgeDays, 80);
  assert.equal(halves.top.medianMarketCapUsd, 5_000);
  assert.equal(halves.rest.medianMarketCapUsd, null);
  assert.equal(halves.frame, "60 tokens, not 100. The 50 largest 24h moves, then 10 quieter names on this list. The rank is the size of the move.");
  assert.deepEqual(halves.common, []);
  assert.deepEqual(halves.meaningful, [
    "Sector. The crowd the name sits in. Biggest moves: Memes, 50 of 50. Quieter names: DeFi, 10 of 10.",
    "Chain. Where the move happened. Biggest moves: solana, 50 of 50. Quieter names: ethereum, 10 of 10.",
    "Sign flip. Week and month point different ways. Biggest moves 50 of 50. Quieter names 0 of 10. A zero, or a missing window, is not a flip.",
    "Wallets in the name. How many smart-money wallets traded it. First 50: 10. The others: 4.",
    "Age. How many days since the token was deployed. First 50: 8 days. The others: 80 days.",
    "Size now. Market cap today, not the cap when someone bought. First 50: $5,000. The others: absent.",
  ]);
});

test("a full page can share a sector and still record a tie", () => {
  const rows = Array.from({ length: 100 }, (_, index) =>
    row({
      tokenSymbol: `T${index}`,
      netFlow24hUsd: 1_000 - index,
      chain: "ethereum",
      tokenSectors: ["Memes", "DeFi"],
      traderCount: null,
      tokenAgeDays: index < 50 ? 2 : null,
      marketCapUsd: null,
      netFlow7dUsd: 0,
      netFlow30dUsd: -10,
    }),
  );
  const halves = tokenHalves(rows);
  assert.equal(halves.shortPage, false);
  assert.equal(halves.top.count, 50);
  assert.equal(halves.rest.count, 50);
  assert.deepEqual(halves.top.sectors, ["DeFi", "Memes"]);
  assert.equal(halves.top.sectorCount, 50);
  assert.equal(halves.top.flipCount, 0);
  assert.equal(halves.top.medianTraders, null);
  assert.equal(halves.top.medianAgeDays, 2);
  assert.equal(halves.rest.medianAgeDays, null);
  assert.equal(halves.frame, "The 50 largest 24h moves, then 50 quieter names on this list. The rank is the size of the move.");
  assert.deepEqual(halves.common, [
    "Sector. The crowd the name sits in. Same either way: DeFi and Memes. Biggest moves 50 of 50. Quieter names 50 of 50.",
    "Chain. Where the move happened. Same either way: ethereum. Biggest moves 50 of 50. Quieter names 50 of 50.",
    "Sign flip. Week and month point different ways. Same either way. Biggest moves 0 of 50. Quieter names 0 of 50. A zero, or a missing window, is not a flip.",
    "Wallets in the name. How many smart-money wallets traded it. Neither side has a number.",
    "Size now. Market cap today, not the cap when someone bought. Neither side has a number.",
  ]);
  assert.deepEqual(halves.meaningful, ["Age. How many days since the token was deployed. First 50: 2 days. The others: absent."]);
  assert.doesNotMatch(`${halves.frame} ${halves.common.join(" ")}`, /not 100/);
});

test("a symbol or an address is read off the same ranked page", () => {
  const rows = [
    row({ tokenSymbol: "PEPE", netFlow24hUsd: 100, chain: "ethereum", tokenAddress: "0x" + "a".repeat(40), netFlow7dUsd: 5, netFlow30dUsd: -5 }),
    row({ tokenSymbol: "PEPE", netFlow24hUsd: -40, chain: "solana", tokenAddress: "So11111111111111111111111111111111111111112", netFlow7dUsd: 1, netFlow30dUsd: 2 }),
    row({ tokenSymbol: "AAVE", netFlow24hUsd: 10, chain: "base", tokenAddress: "0x" + "b".repeat(40) }),
  ];
  const bySymbol = findOnPage(rows, "pepe");
  assert.equal(bySymbol.status, "found");
  if (bySymbol.status === "found") {
    assert.equal(bySymbol.hits.length, 2);
    assert.equal(bySymbol.hits[0].row.chain, "ethereum");
    assert.equal(bySymbol.hits[0].half, "top");
    assert.equal(bySymbol.hits[0].windows, "differ");
    assert.equal(bySymbol.hits[1].half, "top");
    assert.equal(bySymbol.rest, false);
  }
  const byAddress = findOnPage(rows, "0x" + "A".repeat(40));
  assert.equal(byAddress.status, "found");
  if (byAddress.status === "found") assert.equal(byAddress.hits[0].row.tokenSymbol, "PEPE");
  const missed = findOnPage(rows, "So11111111111111111111111111111111111111113");
  assert.equal(missed.status, "absent");
  assert.equal(findOnPage(rows, "!!").status, "ignored");
  assert.equal(findOnPage(rows, "PEPE AAVE").status, "several");
  assert.equal(findOnPage(rows, " ").status, "empty");
  const probe = probeQuest({
    query: "MOVE EXTRA1 EXTRA2 EXTRA3 EXTRA4 EXTRA5",
    flow: [row({ chain: "solana", tokenSymbol: "MOVE", tokenAddress: "mint-move", netFlow24hUsd: 40, netFlow7dUsd: 1, netFlow30dUsd: -1, traderCount: 4, tokenAgeDays: 9, marketCapUsd: 1000 })],
    holds: [{ chain: "solana", address: "mint-move", symbol: "MOVE", holdersCount: 6, marketCapUsd: 1000, valueUsd: 50, sharePercent: 0.01, change24hPercent: 0 }],
    buys: [{ traderAddress: "TraderOne", boughtAgeDays: 9, boughtMarketCap: 800, tokenAddress: "mint-move", tokenSymbol: "MOVE" }],
    traded: ["mint-move"],
    keyKind: "address",
  });
  assert.equal(probe.note, "Five is the limit. 1 left off.");
  assert.equal(probe.sections.length, 5);
  assert.equal(probe.sections[0]?.traits.length, 4);
  assert.match(probe.sections[0]?.traits[0]?.line ?? "", /mint-move/);
  assert.match(probe.sections[0]?.traits[1]?.line ?? "", /6 wallets/);
  assert.match(probe.sections[0]?.traits[2]?.line ?? "", /TraderOne/);
  assert.match(probe.sections[0]?.traits[3]?.line ?? "", /not on the top wallets/);
  assert.equal(probe.sections.some((section) => section.table), false);
});

test("1h against 24h is match, differ, flat, or absent", () => {
  assert.equal(hourAgainstDay(10, 20), "match");
  assert.equal(hourAgainstDay(-4, -8), "match");
  assert.equal(hourAgainstDay(-4, 20), "differ");
  assert.equal(hourAgainstDay(null, 20), "absent");
  assert.equal(hourAgainstDay(10, null), "absent");
  assert.equal(hourAgainstDay(0, 20), "flat");
  assert.equal(hourAgainstDay(10, 0), "flat");
  assert.equal(hourAgainstDay(0, 0), "flat");
});

function wallet(partial: Partial<TraderRow> & Pick<TraderRow, "totalPnlUsd">): TraderRow {
  return {
    address: partial.address ?? "",
    totalPnlUsd: partial.totalPnlUsd,
    nTokens: partial.nTokens ?? 4,
    heldTokensCount: partial.heldTokensCount ?? 2,
    nTrades: partial.nTrades ?? 8,
    openTrades: partial.openTrades ?? 2,
    realizedPnlUsd: partial.realizedPnlUsd ?? partial.totalPnlUsd,
    winRate: partial.winRate === undefined ? 0.5 : partial.winRate,
    avgTradeRoi: partial.avgTradeRoi ?? null,
    unrealizedRoiPercent: partial.unrealizedRoiPercent ?? null,
    traded: partial.traded ?? ["a"],
    balance: partial.balance ?? ["a"],
  };
}

test("trader comparisons 1 through 8 split a match from a difference", () => {
  const top = Array.from({ length: 50 }, () =>
    wallet({
      totalPnlUsd: 100,
      nTokens: 4,
      heldTokensCount: 1,
      nTrades: 8,
      openTrades: 2,
      realizedPnlUsd: 80,
      winRate: 0.5,
      traded: ["sol", "bonk"],
      balance: ["sol"],
    }),
  );
  const rest = [
    wallet({
      totalPnlUsd: 10,
      nTokens: 0,
      heldTokensCount: 3,
      nTrades: 0,
      openTrades: 1,
      realizedPnlUsd: 1,
      winRate: null,
      traded: ["sol"],
      balance: [],
    }),
    wallet({
      totalPnlUsd: 9,
      nTokens: 10,
      heldTokensCount: 8,
      nTrades: 10,
      openTrades: 8,
      realizedPnlUsd: 1,
      winRate: 0.2,
      traded: ["wif"],
      balance: ["wif", "bonk"],
    }),
  ];
  const read = traderComparisons([...top, ...rest], true, "symbol");
  assert.equal(read.frame, "52 Solana wallets over 30 days, ordered by profit, not 1000. The first 50 made the most. The other 2 are the rest of this list.");
  assert.equal(read.unscored, null);
  assert.ok(read.meaningful.some((line) => line.startsWith("Names traded. How many different tokens they touched. Who made the money: 4. The other wallets: 5.")));
  assert.ok(read.meaningful.some((line) => line.startsWith("Wins. The share of trades that made money. The rank is dollars, not this. Who made the money: 50%. The other wallets: 20% (1 of 2).")));
  assert.ok(read.meaningful.some((line) => line.startsWith("Same names. How much these wallets traded the same tokens as each other. Who made the money: 100%")));
  assert.equal(read.common.some((line) => line.includes("9 through")), false);
});

test("a zero denominator drops out, and a missing token key is not another call", () => {
  const rows = [
    wallet({ totalPnlUsd: 5, nTokens: 0, nTrades: 0, realizedPnlUsd: 5, winRate: null, traded: [], balance: [] }),
    wallet({ totalPnlUsd: 4, nTokens: 0, nTrades: 0, realizedPnlUsd: 1, winRate: null, traded: [], balance: [] }),
  ];
  const short = traderComparisons(rows, false, null);
  assert.match(short.frame, /Fewer than 50/);
  assert.equal(short.unscored, null);
  assert.equal(short.common.length, 0);

  const top = Array.from({ length: 50 }, (_, index) =>
    wallet({ totalPnlUsd: 100 - index, nTokens: 0, nTrades: 0, realizedPnlUsd: -1, winRate: null, traded: [], balance: [] }),
  );
  const rest = [wallet({ totalPnlUsd: 1, nTokens: 0, nTrades: 0, realizedPnlUsd: -1, winRate: null, traded: [], balance: [] })];
  const read = traderComparisons([...top, ...rest], false, null);
  assert.match(read.frame, /The list stops here/);
  assert.equal(read.unscored, "Shared tokens and the bag match need a token name on each wallet. This list has none, so those two stay blank.");
  assert.ok(read.common.some((line) => line === "Still holding. Of the names they traded, the share they still hold. Neither side has a number."));
  assert.equal(read.meaningful.some((line) => /perp|dex-trades|chain-rank|mint/.test(line)), false);
});

test("leaderboard parse keeps the profit order inputs and prefers an address key", () => {
  const parsed = parseLeaderboard({
    data: [
      {
        total_pnl_usd: 1,
        n_tokens: 2,
        held_tokens_count: 1,
        n_trades: 3,
        open_trades: 1,
        realized_pnl_usd: 1,
        win_rate: 0.5,
        top_traded_tokens_info: [{ token_symbol: "SOL", token_address: "MintA" }],
        top_5_balance_tokens_info: [{ token_address: "MintA" }],
        address_label: "hidden",
      },
    ],
    pagination: { is_last_page: true },
  });
  assert.equal(parsed.keyKind, "address");
  assert.deepEqual(parsed.rows[0].traded, ["MintA"]);
  assert.equal(parsed.rows[0].winRate, 0.5);
  const open = parseLeaderboard({
    data: [
      {
        total_pnl_usd: 2,
        n_tokens: 1,
        held_tokens_count: 1,
        n_trades: 1,
        open_trades: 0,
        realized_pnl_usd: 2,
        top_traded_tokens_info: [{ note: "no key" }],
      },
    ],
    pagination: { is_last_page: false },
  });
  assert.equal(open.keyKind, null);
  assert.equal(open.isLastPage, false);
  assert.deepEqual(open.rows[0].traded, []);
});

test("buys compare the profit cut with other printers on the same page", () => {
  const top = ["Aaa", "Bbb"];
  const buys = [
    { traderAddress: "Aaa", boughtAgeDays: 1, boughtMarketCap: 100 },
    { traderAddress: "Aaa", boughtAgeDays: 3, boughtMarketCap: null },
    { traderAddress: "Bbb", boughtAgeDays: null, boughtMarketCap: null },
    { traderAddress: "abc", boughtAgeDays: 10, boughtMarketCap: 50 },
    { traderAddress: "Ccc", boughtAgeDays: 20, boughtMarketCap: 80 },
  ];
  const read = buyComparisons(top, buys, true);
  assert.match(read.frame, /5 buys in the newest prints, short of 1000/);
  assert.match(read.frame, /2 of them bought on this tape/);
  assert.match(read.frame, /2 other wallets/);
  assert.ok(read.meaningful.some((line) => line.startsWith("When. How old the token was on the buy. First 50: 2 days (1 of 2 present). The others: 15 days.")));
  assert.ok(read.meaningful.some((line) => line.startsWith("Size at the buy. Market cap then, not the cap now. First 50: $100 (1 of 2 present).")));
  const same = buyComparisons(["Aaa"], [{ traderAddress: "Aaa", boughtAgeDays: 4, boughtMarketCap: 10 }, { traderAddress: "Zzz", boughtAgeDays: 4, boughtMarketCap: 10 }], false);
  assert.match(same.frame, /The tape stops at this page/);
  assert.equal(same.common.length, 3);
  assert.ok(same.common.some((line) => line.startsWith("Prints today.")));
  assert.equal(buyComparisons(["Aaa"], [], true).common.length, 0);
  const alone = buyComparisons(["Aaa"], [{ traderAddress: "Aaa", boughtAgeDays: 4, boughtMarketCap: 10 }], true);
  assert.match(alone.frame, /no one to set them beside/);
  assert.equal(alone.meaningful.length, 0);
});

test("dex parse keeps the bought side and the trader address exact", () => {
  const parsed = parseDexTrades({
    data: [
      { trader_address: "SoL", token_bought_age_days: 2, token_bought_market_cap: null, trader_label: "hidden" },
      { token_bought_age_days: 9 },
    ],
    pagination: { is_last_page: true },
  });
  assert.equal(parsed.buys.length, 1);
  assert.equal(parsed.buys[0].traderAddress, "SoL");
  assert.equal(parsed.buys[0].boughtAgeDays, 2);
  assert.equal(parsed.buys[0].boughtMarketCap, null);
  const ranked = [
    wallet({ totalPnlUsd: 1, address: "low" }),
    wallet({ totalPnlUsd: 9, address: "high" }),
    wallet({ totalPnlUsd: 8, address: "" }),
  ];
  assert.deepEqual(profitCutAddresses(ranked), ["high", "low"]);
});

function held(partial: Partial<HoldingRow> & Pick<HoldingRow, "symbol" | "holdersCount">): HoldingRow {
  return {
    chain: partial.chain ?? "solana",
    symbol: partial.symbol,
    address: partial.address ?? partial.symbol,
    sectors: partial.sectors ?? [],
    holdersCount: partial.holdersCount,
    valueUsd: partial.valueUsd === undefined ? null : partial.valueUsd,
    change24hPercent: partial.change24hPercent === undefined ? null : partial.change24hPercent,
    sharePercent: partial.sharePercent === undefined ? null : partial.sharePercent,
    marketCapUsd: partial.marketCapUsd === undefined ? null : partial.marketCapUsd,
    ageDays: partial.ageDays === undefined ? null : partial.ageDays,
  };
}

test("holdings compare balance and share, and holder count is only the cut", () => {
  const top = Array.from({ length: 50 }, (_, index) =>
    held({ symbol: `T${index}`, holdersCount: 100 - index, valueUsd: 10, change24hPercent: 0, sharePercent: 0.015, marketCapUsd: null }),
  );
  const rest = [
    held({ symbol: "REST", holdersCount: 10, valueUsd: 40, change24hPercent: 0, sharePercent: 0.015, marketCapUsd: 5 }),
    held({ symbol: "GAP", holdersCount: 9, valueUsd: null, change24hPercent: null, sharePercent: null, marketCapUsd: null }),
  ];
  const read = holdingComparisons([...rest, ...top], true);
  assert.match(read.frame, /52 holdings, not 1000/);
  assert.match(read.frame, /tokens the most wallets still hold/);
  assert.ok(read.common.some((line) => line.startsWith("Today. How much that pile changed in 24 hours. Same either way: 0%.")));
  assert.ok(read.common.some((line) => line.includes("Share of the pile")));
  assert.ok(read.meaningful.some((line) => line.startsWith("Dollars still there.")));
  assert.ok(read.meaningful.some((line) => line.startsWith("Size now. Market cap today. First 50: absent.")));
  assert.equal(read.meaningful.some((line) => /holder count/.test(line)), false);
  const parsed = parseHoldings({
    data: [{ holders_count: 3, value_usd: 1, balance_24h_percent_change: -2.5, share_of_holdings_percent: 12.2, chain: "solana", token_symbol: "PEPE", token_address: "mint", token_sectors: ["Memecoins"], token_age_days: 4 }],
    pagination: { is_last_page: false },
  });
  assert.equal(parsed.isLastPage, false);
  assert.equal(parsed.rows[0].change24hPercent, -2.5);
  assert.equal(parsed.rows[0].sharePercent, 12.2);
  assert.equal(parsed.rows[0].symbol, "PEPE");
  assert.equal(parsed.rows[0].ageDays, 4);
  assert.deepEqual(parsed.rows[0].sectors, ["Memecoins"]);
});

test("holdings traits split crowded names and refuse a buy", () => {
  const book = 1_000_000;
  const rows = [
    held({ symbol: "FAT", holdersCount: 40, valueUsd: 400_000, change24hPercent: 0.01, sharePercent: 400_000 / book, marketCapUsd: 50_000_000, ageDays: 40, sectors: ["Memecoins"] }),
    held({ symbol: "CAP", holdersCount: 30, valueUsd: 80_000, change24hPercent: 0.01, sharePercent: 80_000 / book, marketCapUsd: 200_000_000, ageDays: 400, sectors: ["Memecoins"] }),
    held({ symbol: "THIN", holdersCount: 20, valueUsd: 8_000, change24hPercent: 0.02, sharePercent: 8_000 / book, marketCapUsd: 2_000_000, ageDays: 20, sectors: ["Tokenized Stocks"] }),
    held({ symbol: "YOUNG", holdersCount: 15, valueUsd: 9_000, change24hPercent: 0.4, sharePercent: 9_000 / book, marketCapUsd: 1_000_000, ageDays: 2, sectors: [] }),
    held({ symbol: "CUT", holdersCount: 12, valueUsd: 50_000, change24hPercent: -0.08, sharePercent: 50_000 / book, marketCapUsd: 3_000_000, ageDays: 30, sectors: ["NFTs"] }),
    ...Array.from({ length: 8 }, (_, index) =>
      held({ symbol: `M${index}`, holdersCount: 1, valueUsd: 20, change24hPercent: 0, sharePercent: 20 / book, marketCapUsd: 1_000, ageDays: 80, sectors: ["Memecoins"] }),
    ),
    ...Array.from({ length: 20 }, (_, index) =>
      held({
        symbol: `🌱 N${index}`,
        holdersCount: 1,
        valueUsd: 100,
        change24hPercent: 0,
        sharePercent: 100 / book,
        marketCapUsd: 10_000,
        ageDays: 1,
      }),
    ),
    ...Array.from({ length: 60 }, (_, index) =>
      held({ symbol: `D${index}`, holdersCount: 1, valueUsd: 10, change24hPercent: 0, sharePercent: 10 / book, marketCapUsd: 1_000, ageDays: 100 }),
    ),
  ];
  const traits = holdingTraits(rows, false);
  assert.ok(traits.lines.some((line) => line.startsWith("Book.")));
  assert.ok(traits.lines.some((line) => line.includes("FAT")));
  assert.ok(traits.lines.some((line) => /Ballast/.test(line) && line.includes("FAT")));
  assert.ok(traits.lines.some((line) => line.startsWith("Fresh batch.")));
  const priced = traits.blocks.find((block) => block.title === "Already priced");
  const thin = traits.blocks.find((block) => block.title === "Thin overlap");
  const wait = traits.blocks.find((block) => block.title === "Wait");
  assert.ok(priced?.names.some((name) => name.symbol === "CAP"));
  assert.ok(thin?.names.some((name) => name.symbol === "THIN"));
  assert.equal(thin?.names.some((name) => name.symbol === "YOUNG"), false);
  assert.match(wait?.line ?? "", /YOUNG/);
  assert.match(wait?.line ?? "", /CUT/);
  assert.equal(traits.lines.some((line) => /buy/i.test(line)), false);
  assert.equal(traits.blocks.some((block) => /buy/i.test(block.line)), false);
  assert.equal(traits.quest.length, 5);
  assert.deepEqual(
    traits.quest.map((section) => section.traits.length),
    [4, 4, 4, 4, 4],
  );
  assert.equal(new Set(traits.quest.flatMap((section) => section.traits.map((item) => item.id))).size, 20);
  assert.equal(traits.quest.some((section) => section.traits.some((item) => /buy/i.test(item.line))), false);
  const walk = combinedQuest({
    moveLines: ["Sign flip. Week and month differ.", "Age. First 50 is younger."],
    walletLines: ["Still holding. Who made the money keeps more."],
    printLines: ["When. How old the token was on the print.", "Size then. Market cap at the print."],
    holdSections: traits.quest,
  });
  assert.deepEqual(
    walk.map((section) => section.id),
    ["move", "wallets", "prints", "holds"],
  );
  assert.equal(walk[0]?.traits.length, 2);
  assert.equal(walk[2]?.traits.length, 2);
  assert.equal(walk[3]?.traits.length, 5);
  assert.deepEqual(
    holdWalkTraits(traits.quest).map((item) => item.id),
    ["tag-ballast", "fresh-prefix", "fresh-zero", "seat-priced", "seat-thin"],
  );
  assert.equal(walk.some((section) => section.traits.some((item) => /buy/i.test(item.line))), false);
});

test("deeper insights follow fields and keep both readings", () => {
  const holds = [
    held({ chain: "robinhood", symbol: "TENDIES", address: "rh-tendies", holdersCount: 40, valueUsd: 80_000, change24hPercent: 0.01, marketCapUsd: 4_000_000, ageDays: 40 }),
    held({ chain: "solana", symbol: "CRACKER", address: "sol-cracker", holdersCount: 16, valueUsd: 1_400_000, change24hPercent: -0.02, marketCapUsd: 7_000_000, ageDays: 8 }),
    held({ chain: "solana", symbol: "META", address: "sol-meta", holdersCount: 12, valueUsd: 20_000, change24hPercent: 0, marketCapUsd: 2_000_000, ageDays: 30 }),
    held({ chain: "base", symbol: "META", address: "base-meta", holdersCount: 4, valueUsd: 9_000, change24hPercent: 0, marketCapUsd: 130_000_000, ageDays: 400 }),
    held({ chain: "solana", symbol: "CLONE", address: "same-addr", holdersCount: 3, valueUsd: 10, change24hPercent: 0, marketCapUsd: 1_000, ageDays: 10 }),
    held({ chain: "base", symbol: "CLONE", address: "same-addr", holdersCount: 3, valueUsd: 10, change24hPercent: 0, marketCapUsd: 2_000, ageDays: 10 }),
  ];
  const flows = [
    row({ chain: "solana", tokenSymbol: "JIM", tokenAddress: "sol-jim", netFlow24hUsd: 50_000, netFlow7dUsd: 50_000, netFlow30dUsd: 50_000, traderCount: 16, tokenAgeDays: 71, marketCapUsd: 6_000_000 }),
    row({ chain: "ethereum", tokenSymbol: "NEW", tokenAddress: "eth-new", netFlow24hUsd: 32_000, netFlow7dUsd: 32_000, netFlow30dUsd: 32_000, traderCount: 9, tokenAgeDays: 2, marketCapUsd: 1_000_000 }),
  ];
  holds.push(held({ chain: "solana", symbol: "JIM", address: "sol-jim", holdersCount: 8, valueUsd: 40_000, change24hPercent: 0, marketCapUsd: 6_000_000, ageDays: 71 }));
  const insights = deeperInsights(holds, flows);
  const ids = insights.map((item) => item.id);
  assert.equal(ids.includes("thin-seat"), false);
  assert.equal(ids.includes("fat-seat"), false);
  assert.equal(ids.includes("banked-vs-open"), false);
  assert.equal(ids.includes("young-print"), false);
  assert.ok(ids.includes("other-chain-seat"));
  assert.ok(ids.includes("same-ticker"));
  assert.ok(ids.includes("address-street"));
  assert.ok(ids.includes("flow-vs-hold"));
  assert.ok(ids.includes("life-of-token"));
  for (const item of insights) {
    assert.ok(item.technical.length > 0);
    assert.ok(item.plain.length > 0);
    assert.equal(/buy this|you should/i.test(item.technical + item.plain), false);
    assert.equal(/street|house number|splash|crumbs|sticker|just born/i.test(item.plain), false);
  }
  assert.match(insights.find((item) => item.id === "other-chain-seat")?.technical ?? "", /TENDIES/);
  assert.match(insights.find((item) => item.id === "same-ticker")?.technical ?? "", /META/);
  assert.equal(insights.find((item) => item.id === "other-chain-seat")?.section, "holds");
  assert.equal(insights.find((item) => item.id === "life-of-token")?.section, "move");
  assert.equal(insights.find((item) => item.id === "flow-vs-hold")?.section, "across");
  const tables = insightTables(holds, flows);
  assert.equal(tables.holds, undefined);
  assert.equal(tables.wallets, undefined);
  assert.equal(tables.prints, undefined);
  assert.equal(tables.move?.columns[1], "Month is the life");
  const placed = splitQuests(
    [{ id: "holds", title: "Holds", traits: [{ id: "book-off", title: "Off", line: "Off the book." }] }],
    insights,
    tables,
  );
  const traitIds = placed[0]?.traits.traits.map((item) => item.id) ?? [];
  const insightIds = placed[0]?.insights.traits.map((item) => item.id) ?? [];
  assert.ok(traitIds.includes("book-off"));
  assert.equal(traitIds.includes("thin-seat"), false);
  assert.ok(insightIds.includes("other-chain-seat"));
  assert.equal(placed[0]?.insights.table, undefined);
  assert.equal(insightIds.includes("life-of-token"), false);
});

test("the walk keeps three to five traits and three to five insights", () => {
  const crossed = crossTraits({
    flow: [
      row({ chain: "solana", tokenSymbol: "MOVE", tokenAddress: "mint-move", netFlow24hUsd: 100, marketCapUsd: 50 }),
      row({ chain: "solana", tokenSymbol: "QUIET", tokenAddress: "mint-quiet", netFlow24hUsd: 1, marketCapUsd: 10 }),
    ],
    holds: [
      { chain: "solana", address: "mint-quiet", symbol: "QUIET", holdersCount: 20, marketCapUsd: 80 },
      { chain: "solana", address: "mint-held", symbol: "HELD", holdersCount: 15, marketCapUsd: 90 },
    ],
    buys: [{ traderAddress: "A", boughtAgeDays: 3, boughtMarketCap: 40, tokenAddress: "mint-quiet", tokenSymbol: "QUIET" }],
    traded: ["mint-move"],
    keyKind: "address",
  });
  assert.deepEqual(crossWalk(crossed)?.traits.map((item) => item.id), ["cross-off-book", "cross-quiet", "cross-cap"]);
  const top = Array.from({ length: 50 }, (_, index) =>
    wallet({
      totalPnlUsd: 1000 - index,
      address: `Top${index}`,
      avgTradeRoi: index === 0 ? 0.1 : 2,
      unrealizedRoiPercent: 4,
      traded: index < 40 ? ["mint-a"] : ["mint-b"],
    }),
  );
  const rest = [
    wallet({ totalPnlUsd: 1, address: "Rest0", avgTradeRoi: 0.4, unrealizedRoiPercent: 0.2, traded: ["mint-b"] }),
    wallet({ totalPnlUsd: 1, address: "Rest1", avgTradeRoi: 0.5, unrealizedRoiPercent: 0.2, traded: ["mint-b"] }),
  ];
  const buys = [
    { traderAddress: "Top0", boughtAgeDays: 2, boughtMarketCap: 2_000_000_000, tokenAddress: "only-top", tokenSymbol: "ONLY", tradeValueUsd: 800, soldAgeDays: 4 },
    { traderAddress: "Rest0", boughtAgeDays: 9, boughtMarketCap: 20, tokenAddress: "rest-mint", tokenSymbol: "REST", tradeValueUsd: 10, soldAgeDays: 40 },
  ];
  const insights = deeperInsights([], [], { traders: [...top, ...rest], keyKind: "address", buys, topAddresses: top.map((item) => item.address) });
  const ids = insights.map((item) => item.id);
  assert.ok(ids.includes("roi-under-total"));
  assert.ok(ids.includes("open-rate"));
  assert.ok(ids.includes("one-mint"));
  assert.ok(ids.includes("left-the-tape"));
  assert.ok(ids.includes("only-the-cut"));
  assert.ok(ids.includes("giant-at-buy"));
  const banded = bandQuests([
    {
      id: "wallets",
      title: "Wallets",
      traits: { id: "wallets", title: "Wallets", traits: top.slice(0, 1).map((item) => ({ id: item.address, title: item.address, line: item.address })) },
      insights: { id: "wallets-insights", title: "Wallets", traits: insights.filter((item) => item.section === "wallets").map((item) => ({ id: item.id, title: item.title, line: item.technical })) },
    },
    {
      id: "prints",
      title: "Prints",
      traits: {
        id: "prints",
        title: "Prints",
        traits: ["a", "b", "c", "d", "e", "f"].map((id) => ({ id, title: id, line: id })),
      },
      insights: { id: "prints-insights", title: "Prints", traits: insights.filter((item) => item.section === "prints").map((item) => ({ id: item.id, title: item.title, line: item.technical })) },
    },
  ]);
  assert.deepEqual(banded.map((section) => section.id), ["prints"]);
  assert.equal(banded[0]?.traits.traits.length, 5);
  assert.ok((banded[0]?.insights.traits.length ?? 0) >= 3);
  assert.ok((banded[0]?.insights.traits.length ?? 0) <= 5);
});

test("public payload drops label fields", () => {
  const raw = publicPayload({
    address_label: "desk",
    trader_label: "desk",
    address: "abc",
    nested: [{ note: "clean" }],
  }) as { address: string; nested: { note: string }[] };
  assert.equal("address_label" in (raw as object), false);
  assert.equal("trader_label" in (raw as object), false);
  assert.equal(raw.address, "abc");
  assert.equal(raw.nested[0].note, "clean");
});

test("source does not contain the live key or a one-way verdict", () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const skip = new Set(["node_modules", ".next", ".git"]);
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      if (skip.has(name)) continue;
      const path = join(dir, name);
      const info = statSync(path);
      if (info.isDirectory()) walk(path);
      else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts")) files.push(path);
    }
  };
  for (const dir of ["app", "lib", "components"]) walk(join(root, dir));
  const keyPattern = /nsn_[a-z0-9]{16,}/i;
  const verdictPattern = /ONE WAY/;
  for (const path of files) {
    const text = readFileSync(path, "utf8");
    assert.equal(keyPattern.test(text), false, `${path} contains an API key`);
    assert.equal(verdictPattern.test(text), false, `${path} contains a one-way verdict`);
  }
  assert.equal(parseBook("$pepe, ETH").map((entry) => (entry.kind === "symbol" ? entry.symbol : entry.kind)).join(","), "PEPE,ETH");
});
