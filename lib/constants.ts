/** Relative floor from hackathon-edge-cases.md. Printed on the pages. */
export const RELATIVE_FLOOR = 0.01;

/** A buy-page row counts only when the smaller USD volume is at least this share of the larger. */
export const QUARTER = 0.25;

export const NETFLOW_PER_PAGE = 100;
export const BUYERS_PER_PAGE = 25;
export const MAX_CARDS = 3;
export const MIN_TRADERS = 2;
export const MAX_ADDRESSES_SHOWN = 3;
export const CACHE_MS = 2 * 60 * 1000;

export const NETFLOW_COST = 5;
export const FLOW_COST = 1;
export const TRADES_COST = 1;

export const NETFLOW_PATH = "/api/v1/smart-money/netflow";
export const FLOW_PATH = "/api/v1/tgm/flow-intelligence";
export const TRADES_PATH = "/api/v1/tgm/who-bought-sold";

/**
 * Quote legs and gas tokens. Refused only when the symbol is known
 * (a row from the netflow board). An address alone is not on this list.
 */
export const QUOTE_SYMBOLS = new Set([
  "USDC",
  "USDT",
  "DAI",
  "USDE",
  "USD1",
  "FRAX",
  "TUSD",
  "USDS",
  "PYUSD",
  "FDUSD",
  "EURC",
  "USDBC",
  "USDC.E",
  "USDT.E",
  "WETH",
  "WBTC",
  "WSOL",
  "WBNB",
  "WMATIC",
  "WPOL",
  "WAVAX",
  "ETH",
  "SOL",
  "BNB",
]);

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

/** Who-bought/sold chains. hyperliquid is legal here and illegal on netflow. */
export const TRADE_CHAINS = [
  "arbitrum",
  "arc",
  "avalanche",
  "base",
  "bnb",
  "ethereum",
  "hyperevm",
  "hyperliquid",
  "injective",
  "iotaevm",
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
