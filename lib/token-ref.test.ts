import assert from "node:assert/strict";
import test from "node:test";
import { explorerLink, nansenTokenUrl, readTokenMark, shortAddress, tokenIconUrl, tokenMark } from "./token-ref";

test("a token mark round-trips symbol, chain, and address", () => {
  const encoded = tokenMark({ symbol: "PEPE", chain: "ethereum", address: "0xABC" });
  assert.deepEqual(readTokenMark(encoded), { symbol: "PEPE", chain: "ethereum", address: "0xABC" });
  assert.equal(readTokenMark("PEPE 0xABC"), null);
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
