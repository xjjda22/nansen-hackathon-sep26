import assert from "node:assert/strict";
import test from "node:test";
import { explorerLink, leadFigure, nansenTokenUrl, readTokenMark, shortAddress, splitRich, tokenIconUrl, tokenMark, walletMark } from "./token-ref";

test("a token mark round-trips symbol, chain, and address", () => {
  const encoded = tokenMark({ symbol: "PEPE", chain: "ethereum", address: "0xABC" });
  assert.deepEqual(readTokenMark(encoded), { symbol: "PEPE", chain: "ethereum", address: "0xABC" });
  assert.equal(readTokenMark("PEPE 0xABC"), null);
});

test("leadFigure takes the first number and skips marks", () => {
  const mint = tokenMark({ symbol: "A1", chain: "solana", address: "Mint9" });
  assert.equal(leadFigure(`8 of 50 Solana names are off the book. ${mint} is one.`), "8 of 50");
  assert.equal(leadFigure(`${mint} leads. Share held: 56.8%. Others: 42.9%.`), "56.8%");
  assert.equal(leadFigure("Flow in: $1,204,331 over the day."), "$1,204,331");
  assert.equal(leadFigure("When. First 50: 2173 days (15 of 50 present). The others: 895 days."), "2173 days");
  assert.equal(leadFigure("AI Meme is 15 names and $25,521,677."), "15 names");
  assert.equal(leadFigure("No figure here."), null);
});

test("the words after a mark stay text", () => {
  const line = `${tokenMark({ symbol: "PEPE", chain: "solana", address: "Mint1" })} is one. ${walletMark("solana", "Wal1")}.`;
  assert.deepEqual(splitRich(line), [
    { kind: "token", token: { symbol: "PEPE", chain: "solana", address: "Mint1" } },
    { kind: "text", text: " is one. " },
    { kind: "wallet", chain: "solana", address: "Wal1" },
    { kind: "text", text: "." },
  ]);
});

test("ethereum links to Nansen and Etherscan, solana links to Solscan", () => {
  assert.equal(
    nansenTokenUrl("ethereum", "0xabc"),
    "https://app.nansen.ai/token-god-mode?chain=ethereum&tokenAddress=0xabc",
  );
  assert.deepEqual(explorerLink("ethereum", "0xabc"), {
    label: "Etherscan",
    href: "https://etherscan.io/token/0xabc",
  });
  assert.equal(explorerLink("solana", "Mint111")?.href, "https://solscan.io/token/Mint111");
  assert.equal(explorerLink("solana", "Mint111", "wallet")?.href, "https://solscan.io/account/Mint111");
  assert.equal(explorerLink("ethereum", "0xabc", "wallet")?.href, "https://etherscan.io/address/0xabc");
  assert.equal(explorerLink("unknown", "0xabc"), null);
  assert.match(tokenIconUrl("ethereum", "0xAbC") ?? "", /ethereum\/0xabc\.png$/);
  assert.equal(shortAddress("0x1234567890abcdef"), "0x12…cdef");
});
