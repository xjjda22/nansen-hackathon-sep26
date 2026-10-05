const SEP = "\u001f";
/** Closes a mark, so the words after it are not read as the symbol or address. */
const END = "\u001e";

export type TokenRef = {
  symbol: string;
  chain: string;
  address: string;
};

const DEX_SLUG: Record<string, string> = {
  ethereum: "ethereum",
  solana: "solana",
  base: "base",
  bnb: "bsc",
  arbitrum: "arbitrum",
  optimism: "optimism",
  polygon: "polygon",
  avalanche: "avalanche",
  linea: "linea",
  scroll: "scroll",
  mantle: "mantle",
  sei: "sei",
  sonic: "sonic",
  berachain: "berachain",
  hyperevm: "hyperevm",
};

type Explorer = { label: string; href: (address: string) => string };

const EXPLORERS: Record<string, Explorer> = {
  ethereum: { label: "Etherscan", href: (address) => `https://etherscan.io/token/${address}` },
  base: { label: "Basescan", href: (address) => `https://basescan.org/token/${address}` },
  bnb: { label: "BscScan", href: (address) => `https://bscscan.com/token/${address}` },
  arbitrum: { label: "Arbiscan", href: (address) => `https://arbiscan.io/token/${address}` },
  optimism: { label: "Etherscan", href: (address) => `https://optimistic.etherscan.io/token/${address}` },
  polygon: { label: "Polygonscan", href: (address) => `https://polygonscan.com/token/${address}` },
  avalanche: { label: "Snowtrace", href: (address) => `https://snowtrace.io/token/${address}` },
  linea: { label: "Lineascan", href: (address) => `https://lineascan.build/token/${address}` },
  scroll: { label: "Scrollscan", href: (address) => `https://scrollscan.com/token/${address}` },
  mantle: { label: "Mantlescan", href: (address) => `https://mantlescan.xyz/token/${address}` },
  solana: { label: "Solscan", href: (address) => `https://solscan.io/token/${address}` },
};

export function walletMark(chain: string, address: string): string {
  return ["w", chain, address].join(SEP) + END;
}

export function tokenMark(token: TokenRef): string {
  const symbol = token.symbol.split(SEP).join("").split(END).join("");
  return ["t", token.chain, token.address, symbol].join(SEP) + END;
}

export function readTokenMark(value: string): TokenRef | null {
  const parts = (value.endsWith(END) ? value.slice(0, -END.length) : value).split(SEP);
  if (parts.length !== 4 || parts[0] !== "t" || !parts[1] || !parts[2]) return null;
  return { chain: parts[1], address: parts[2], symbol: parts[3] || "token" };
}

export function shortAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export type AddressKind = "token" | "wallet";

export type RichPart =
  | { kind: "text"; text: string }
  | { kind: "token"; token: TokenRef }
  | { kind: "wallet"; chain: string; address: string };

const MARK = /t\u001f([^\u001f\u001e]+)\u001f([^\u001f\u001e]+)\u001f([^\u001f\u001e]*)\u001e?|w\u001f([^\u001f\u001e]+)\u001f([^\u001f\u001e]+)\u001e?/g;

export function splitRich(value: string): RichPart[] {
  const parts: RichPart[] = [];
  let cursor = 0;
  for (const match of value.matchAll(MARK)) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push({ kind: "text", text: value.slice(cursor, index) });
    if (match[1] && match[2]) {
      parts.push({ kind: "token", token: { chain: match[1], address: match[2], symbol: match[3] || "token" } });
    } else if (match[4] && match[5]) {
      parts.push({ kind: "wallet", chain: match[4], address: match[5] });
    }
    cursor = index + match[0].length;
  }
  if (cursor < value.length) parts.push({ kind: "text", text: value.slice(cursor) });
  if (parts.length === 0) parts.push({ kind: "text", text: value });
  return parts;
}

const FIGURE = /[+-]?\$\d[\d,]*(?:\.\d+)?[KMB]?|[+-]?\d[\d,]*(?:\.\d+)?(?:%|x| of \d[\d,]*| (?:days?|names?|wallets?|buys?)\b)?/g;

/** The first number in a line, the one a stamp leads with. Marks, years, and labels such as "First 50:" are skipped. */
export function leadFigure(value: string): string | null {
  for (const part of splitRich(value)) {
    if (part.kind !== "text") continue;
    for (const match of part.text.matchAll(FIGURE)) {
      const after = part.text.charAt((match.index ?? 0) + match[0].length);
      if (after === ":" || /^(19|20)\d\d$/.test(match[0])) continue;
      return match[0];
    }
  }
  return null;
}

export function nansenTokenUrl(chain: string, address: string): string {
  const params = new URLSearchParams({ chain, tokenAddress: address });
  return `https://app.nansen.ai/token-god-mode?${params.toString()}`;
}

export function nansenWalletUrl(address: string): string {
  const params = new URLSearchParams({ address });
  return `https://app.nansen.ai/profiler?${params.toString()}`;
}

const WALLET_EXPLORERS: Record<string, Explorer> = {
  ethereum: { label: "Etherscan", href: (address) => `https://etherscan.io/address/${address}` },
  base: { label: "Basescan", href: (address) => `https://basescan.org/address/${address}` },
  bnb: { label: "BscScan", href: (address) => `https://bscscan.com/address/${address}` },
  arbitrum: { label: "Arbiscan", href: (address) => `https://arbiscan.io/address/${address}` },
  optimism: { label: "Etherscan", href: (address) => `https://optimistic.etherscan.io/address/${address}` },
  polygon: { label: "Polygonscan", href: (address) => `https://polygonscan.com/address/${address}` },
  avalanche: { label: "Snowtrace", href: (address) => `https://snowtrace.io/address/${address}` },
  solana: { label: "Solscan", href: (address) => `https://solscan.io/account/${address}` },
};

export function explorerLink(chain: string, address: string, kind: AddressKind = "token"): { label: string; href: string } | null {
  const table = kind === "wallet" ? WALLET_EXPLORERS : EXPLORERS;
  const explorer = table[chain];
  if (!explorer) return null;
  return { label: explorer.label, href: explorer.href(address) };
}

/** Dexscreener hosts a logo for the chains it indexes. A miss falls back to the identicon. */
export function tokenIconUrl(chain: string, address: string): string | null {
  const slug = DEX_SLUG[chain];
  if (!slug || !address) return null;
  const id = slug === "solana" ? address : address.toLowerCase();
  return `https://dd.dexscreener.com/ds-data/tokens/${slug}/${id}.png`;
}

export function identiconCells(address: string): boolean[] {
  let hash = 0;
  for (let index = 0; index < address.length; index += 1) {
    hash = (hash * 33 + address.charCodeAt(index)) >>> 0;
  }
  const cells: boolean[] = [];
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const on = ((hash >> (row * 3 + col)) & 1) === 1;
      cells[row * 5 + col] = on;
      cells[row * 5 + (4 - col)] = on;
    }
  }
  return cells;
}
