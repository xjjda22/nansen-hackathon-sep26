import { assetKey, type FlowRow, type HoldMark } from "./rules";

export type Suggestion = { symbol: string; chain: string; address: string; why: string };

const EACH = 4;

/** Names worth checking on the board: the largest Solana moves missing from holdings, and the most-held names. */
export function boardSuggestions(
  flow: Pick<FlowRow, "chain" | "tokenAddress" | "tokenSymbol" | "netFlow24hUsd">[],
  holds: Pick<HoldMark, "chain" | "address" | "symbol" | "holdersCount">[],
): { offBook: Suggestion[]; held: Suggestion[] } {
  const held = new Set(holds.filter((row) => row.address).map((row) => assetKey(row.chain, row.address)));
  if (held.size === 0) return { offBook: [], held: [] };
  const offBook = flow
    .filter((row) => row.chain === "solana" && row.tokenAddress && row.tokenSymbol && !held.has(assetKey(row.chain, row.tokenAddress)))
    .sort((a, b) => b.netFlow24hUsd - a.netFlow24hUsd)
    .slice(0, EACH)
    .map((row) => ({ symbol: row.tokenSymbol, chain: row.chain, address: row.tokenAddress, why: "Moving, not held" }));
  const most = holds
    .filter((row) => row.address && row.symbol)
    .map((row, index) => ({ row, index }))
    .sort((a, b) => b.row.holdersCount - a.row.holdersCount || a.index - b.index)
    .slice(0, EACH)
    .map(({ row }) => ({ symbol: row.symbol, chain: row.chain, address: row.address, why: `${row.holdersCount} wallets hold it` }));
  return { offBook, held: most };
}
