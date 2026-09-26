/** Relative floor from hackathon-edge-cases.md. Printed on the pages. */
export const RELATIVE_FLOOR = 0.01;

/** The walk is the page. The four source desks stay in the code and stay off the first screen. */
export const SHOW_SOURCE_DESKS = false;

export const NETFLOW_PER_PAGE = 100;
export const MAX_CARDS = 3;
export const MIN_TRADERS = 2;

/** Each walk page shows this many traits, and the same band of insights. */
export const QUEST_MIN = 3;
export const QUEST_MAX = 5;
export const CACHE_MS = 2 * 60 * 1000;

export const NETFLOW_COST = 5;
export const FLOW_COST = 1;
export const LEADERBOARD_COST = 5;
export const DEX_TRADES_COST = 5;
export const HOLDINGS_COST = 5;

export const NETFLOW_PATH = "/api/v1/smart-money/netflow";
export const FLOW_PATH = "/api/v1/tgm/flow-intelligence";
export const LEADERBOARD_PATH = "/api/v1/smart-money/pnl-leaderboard";
export const DEX_TRADES_PATH = "/api/v1/smart-money/dex-trades";
export const HOLDINGS_PATH = "/api/v1/smart-money/holdings";

/** One Smart Money PnL page. Comparisons 1–8 share it. 9–20 are other endpoints. */
export const LEADERBOARD_PER_PAGE = 1000;

export const LEADERBOARD_BODY = {
  chains: ["solana"],
  timeframe: 30,
  pagination: { page: 1, per_page: LEADERBOARD_PER_PAGE },
  order_by: [{ field: "total_pnl_usd", direction: "DESC" }],
} as const;

/** Trailing 24h Smart Money prints. Comparisons 18 and 19 share this page. */
export const DEX_TRADES_PER_PAGE = 1000;

export const DEX_TRADES_BODY = {
  chains: ["solana"],
  pagination: { page: 1, per_page: DEX_TRADES_PER_PAGE },
  order_by: [{ field: "block_timestamp", direction: "DESC" }],
} as const;

/** All-chain holdings snapshot. Holder count is the cut, matching the live holdings board. */
export const HOLDINGS_PER_PAGE = 1000;

export const HOLDINGS_BODY = {
  chains: ["all"],
  pagination: { page: 1, per_page: HOLDINGS_PER_PAGE },
  order_by: [{ field: "holders_count", direction: "DESC" }],
} as const;

/** Flow intelligence chains. hyperliquid is not in this set. hyperevm is a different chain. */
export const FLOW_CHAINS = [
  "arbitrum",
  "arc",
  "avalanche",
  "base",
  "bnb",
  "ethereum",
  "hyperevm",
  "injective",
  "linea",
  "mantle",
  "mantra",
  "monad",
  "near",
  "optimism",
  "plasma",
  "polygon",
  "robinhood",
  "sei",
  "solana",
  "sonic",
  "starknet",
  "sui",
  "ton",
  "tron",
] as const;

export const COHORTS = [
  { key: "smart_trader_net_flow_usd", name: "Smart traders", fresh: false },
  { key: "top_pnl_net_flow_usd", name: "Top PnL", fresh: false },
  { key: "whale_net_flow_usd", name: "Whales", fresh: false },
  { key: "exchange_net_flow_usd", name: "Exchanges", fresh: false },
  { key: "fresh_wallets_net_flow_usd", name: "Fresh wallets", fresh: true },
  { key: "public_figure_net_flow_usd", name: "Public figures", fresh: false },
] as const;

export type CohortKey = (typeof COHORTS)[number]["key"];
export type CohortValue = number | null;

export const NETFLOW_BODY = {
  chains: ["all"],
  pagination: { page: 1, per_page: NETFLOW_PER_PAGE },
  order_by: [{ field: "net_flow_24h_usd", direction: "DESC" }],
} as const;
