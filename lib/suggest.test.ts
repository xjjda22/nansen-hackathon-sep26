import assert from "node:assert/strict";
import test from "node:test";
import { boardSuggestions } from "./suggest";

test("boardSuggestions picks moving names missing from holdings, and the most held", () => {
  const flow = [
    { chain: "solana", tokenAddress: "A", tokenSymbol: "AAA", netFlow24hUsd: 100 },
    { chain: "solana", tokenAddress: "B", tokenSymbol: "BBB", netFlow24hUsd: 900 },
    { chain: "solana", tokenAddress: "H", tokenSymbol: "HHH", netFlow24hUsd: 5000 },
    { chain: "base", tokenAddress: "0xC", tokenSymbol: "CCC", netFlow24hUsd: 9000 },
  ];
  const holds = [
    { chain: "solana", address: "H", symbol: "HHH", holdersCount: 12 },
    { chain: "ethereum", address: "0xE", symbol: "EEE", holdersCount: 40 },
  ];
  const { offBook, held } = boardSuggestions(flow, holds);
  assert.deepEqual(offBook.map((item) => item.symbol), ["BBB", "AAA"]);
  assert.deepEqual(held.map((item) => item.symbol), ["EEE", "HHH"]);
  assert.equal(held[0]?.why, "40 wallets hold it");
});

test("boardSuggestions offers nothing when holdings are empty, since off the book cannot be told", () => {
  const { offBook, held } = boardSuggestions([{ chain: "solana", tokenAddress: "A", tokenSymbol: "AAA", netFlow24hUsd: 1 }], []);
  assert.equal(offBook.length, 0);
  assert.equal(held.length, 0);
});
