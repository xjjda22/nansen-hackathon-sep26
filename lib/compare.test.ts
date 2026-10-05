import assert from "node:assert/strict";
import test from "node:test";
import { barShares, groupName, rowGap, widestRow } from "./compare";
import { offBookExample, type FlowRow, type HoldMark, type QuestTable } from "./rules";

test("rowGap reads a ratio when both sides are positive", () => {
  const gap = rowGap({ kind: "usd", value: 6908 }, { kind: "usd", value: 12685 });
  assert.deepEqual(gap && { leader: gap.leader, figure: gap.figure, word: gap.word }, { leader: 1, figure: "1.8×", word: "higher" });
});

test("rowGap counts names when the totals match", () => {
  const gap = rowGap({ kind: "count", value: 8, total: 50 }, { kind: "count", value: 42, total: 50 });
  assert.equal(gap?.figure, "34");
  assert.equal(gap?.word, "more names");
  assert.equal(gap?.leader, 1);
});

test("rowGap reads points for shares and a level for near ties", () => {
  assert.equal(rowGap({ kind: "share", value: 0.568 }, { kind: "share", value: 0.429 })?.figure, "13.9 pts");
  assert.equal(rowGap({ kind: "days", value: 100 }, { kind: "days", value: 101 })?.leader, null);
});

test("rowGap falls back to the difference when a side is not positive", () => {
  assert.equal(rowGap({ kind: "usd", value: -500 }, { kind: "usd", value: 1500 })?.figure, "$2,000");
});

test("barShares fills counts against their total", () => {
  assert.deepEqual(barShares({ kind: "count", value: 8, total: 50 }, { kind: "count", value: 42, total: 50 }), [0.16, 0.84]);
  assert.deepEqual(barShares({ kind: "usd", value: 50 }, { kind: "usd", value: 100 }), [0.5, 1]);
});

test("widestRow picks the largest relative split", () => {
  const table: QuestTable = {
    caption: "",
    columns: ["Measure", "A", "B lacks"],
    nameLabels: ["A", "B"],
    rows: [
      { name: "Small", top: "", topPlain: "", bottom: "", bottomPlain: "", topNames: [], bottomNames: [], topStat: { kind: "usd", value: 100 }, bottomStat: { kind: "usd", value: 110 } },
      { name: "Wide", top: "", topPlain: "", bottom: "", bottomPlain: "", topNames: [], bottomNames: [], topStat: { kind: "days", value: 10 }, bottomStat: { kind: "days", value: 900 } },
    ],
  };
  assert.equal(widestRow(table)?.row.name, "Wide");
  assert.equal(groupName(table.columns[2] ?? ""), "B");
});

test("offBookExample carries range, coverage, and a value on each name", () => {
  const flow = (address: string, usd: number): FlowRow => ({
    chain: "solana",
    tokenAddress: address,
    tokenSymbol: address.toUpperCase(),
    netFlow24hUsd: usd,
    netFlow1hUsd: null,
    netFlow7dUsd: null,
    netFlow30dUsd: null,
    tokenSectors: [],
    traderCount: 10,
    tokenAgeDays: null,
    marketCapUsd: null,
  });
  const holds: HoldMark[] = [{ chain: "solana", address: "b", symbol: "B", holdersCount: 3, marketCapUsd: null }];
  const table = offBookExample([flow("a", 3000), flow("c", 1000), flow("b", 2000)], holds);
  const row = table?.rows.find((item) => item.name === "24h flow");
  assert.equal(row?.namesNearMiddle, true);
  assert.deepEqual(row?.topStat, { kind: "usd", value: 2000, low: 1000, high: 3000, present: 2, of: 2 });
  assert.match(row?.topNames[0] ?? "", / · \$/);
  const ages = table?.rows.find((item) => item.name === "Age");
  assert.equal(ages?.topStat, undefined);
});
