import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  buyerPageVerdict,
  classifyTokenInput,
  cohortSentence,
  hourAgainstDay,
  judgeDay,
  onloadRead,
  judgeFive,
  notOnYourList,
  tokenHalves,
  parseBook,
  publicPayload,
  sameTickerTwoChains,
  sectorWeather,
  type FlowRow,
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

test("sold volume absent never becomes a one-way claim", () => {
  const absent = buyerPageVerdict(
    [
      { address: "0x" + "a".repeat(40), bought: 1000, sold: null },
      { address: "0x" + "b".repeat(40), bought: 500, sold: null },
    ],
    true,
  );
  assert.equal(absent.verdict, "SOLD_VOLUME_ABSENT");
  assert.equal(JSON.stringify(absent).includes("ONE WAY"), false);

  const empty = buyerPageVerdict([], true);
  assert.equal(empty.verdict, "NO_TRADES");
});

test("the quarter and the relative floor decide who also sold", () => {
  const rows = [
    { address: "0xkeep", bought: 1000, sold: 400 },
    { address: "0xdust", bought: 5, sold: 5 },
    { address: "0xthin", bought: 1000, sold: 100 },
    { address: "0xmiss", bought: 800, sold: null },
  ];
  const verdict = buyerPageVerdict(rows, false);
  assert.equal(verdict.verdict, "COUNT");
  assert.equal(verdict.counted, 1);
  assert.deepEqual(verdict.addresses, ["0xkeep"]);
  assert.match(verdict.sentence, /Of the top page of buyers \(25\), 1 also sold/);
  assert.equal(verdict.pageCut, true);
});

test("a symbol alone is not an address, and a quote symbol is recognized", () => {
  assert.equal(classifyTokenInput("PENGU").kind, "symbol");
  assert.equal(classifyTokenInput("0x" + "ab".repeat(20)).kind, "address");
  assert.equal(classifyTokenInput("").kind, "bad");
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
  assert.equal(read.pair?.symbol, "PEPE");
  assert.equal(read.pair?.leftChain, "ethereum");
  assert.equal(read.pair?.rightChain, "solana");
  assert.equal(read.pair?.tied, false);

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
  assert.deepEqual(halves.lines, [
    "This page has 2 tokens, not 100, and fewer than 50, so there is no rest.",
  ]);
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
  assert.deepEqual(halves.lines, [
    "This page has 60 tokens, not 100. Top 50 by absolute 24h net flow. The rest of this page: 10.",
    "Top sector: Memes, 50 of 50. Rest: DeFi, 10 of 10.",
    "Top chain: solana, 50 of 50. Rest: ethereum, 10 of 10.",
    "7d sign differs from 30d on 50 of 50 in the top, and 0 of 10 in the rest. A zero or an absent window is not a difference.",
    "Median trader count: 10 in the top, 4 in the rest.",
    "Median token age: 8 days in the top, 80 days in the rest.",
    "Median market cap: $5,000 in the top, absent in the rest.",
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
  assert.equal(halves.lines[0], "Top 50 tokens by absolute 24h net flow. The rest of this page: 50.");
  assert.equal(
    halves.lines[1],
    "Both halves have the same dominant sector, DeFi and Memes. Top 50 of 50. Rest 50 of 50. That is not unique to the top.",
  );
  assert.match(halves.lines[4], /absent in the top, absent in the rest/);
  assert.equal(
    halves.lines[5],
    "Median token age: 2 days in the top, absent in the rest.",
  );
  assert.doesNotMatch(halves.lines.join(" "), /not 100/);
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
