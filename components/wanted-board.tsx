"use client";

import { identiconCells, nansenTokenUrl, tokenIconUrl } from "@/lib/token-ref";
import { assetKey, formatUsd, type FlowRow, type HoldingRow } from "@/lib/rules";
import { useState } from "react";

const POSTER_COUNT = 3;

export type WantedFace = {
  symbol: string;
  chain: string;
  address: string;
  holders: number;
  /** Null when the name is not on the netflow page. */
  flow24hUsd: number | null;
};

export function topHeld(rows: HoldingRow[], flow: Pick<FlowRow, "chain" | "tokenAddress" | "netFlow24hUsd">[]): WantedFace[] {
  const flowByKey = new Map(flow.map((row) => [assetKey(row.chain, row.tokenAddress), row.netFlow24hUsd]));
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => b.row.holdersCount - a.row.holdersCount || a.index - b.index)
    .slice(0, POSTER_COUNT)
    .map(({ row }) => ({
      symbol: row.symbol,
      chain: row.chain,
      address: row.address,
      holders: row.holdersCount,
      flow24hUsd: flowByKey.get(assetKey(row.chain, row.address)) ?? null,
    }));
}

export function flowLabel(flow24hUsd: number | null): string {
  if (flow24hUsd == null) return "Not on the netflow page";
  const sign = flow24hUsd > 0 ? "+" : "";
  return `24h flow ${sign}${formatUsd(flow24hUsd)}`;
}

export function wantedNote(faces: WantedFace[]): string {
  const off = faces.filter((face) => face.flow24hUsd == null).length;
  const head = `The ${faces.length} names the most wallets still hold.`;
  if (off === 0) return `${head} All ${faces.length} are also on the netflow page.`;
  if (off === faces.length) return `${head} None of them is on the netflow page. Held is not moving.`;
  return `${head} ${off} of ${faces.length} are not on the netflow page. Held is not moving.`;
}

function chainLabel(chain: string): string {
  if (chain.length === 0) return chain;
  return chain.charAt(0).toUpperCase() + chain.slice(1);
}

export function WantedBoard({ faces }: { faces: WantedFace[] }) {
  if (faces.length === 0) return null;
  return (
    <section className="wanted-wall" aria-label="Wanted">
      <ul className="wanted-board">
        {faces.map((face) => (
          <li key={`${face.chain}-${face.address}`}>
            <Poster face={face} />
          </li>
        ))}
      </ul>
      <p className="wanted-note">{wantedNote(faces)}</p>
    </section>
  );
}

export function walletCount(holders: number): string {
  return holders === 1 ? "1 wallet" : `${holders} wallets`;
}

/** The token logo, or its identicon when the logo does not load. */
export function Mug({ face, size, className = "wanted-mug" }: { face: WantedFace; size: number; className?: string }) {
  const icon = tokenIconUrl(face.chain, face.address);
  const [failed, setFailed] = useState(false);
  const cells = identiconCells(face.address || face.symbol);
  if (icon && !failed) {
    return <img className={className} src={icon} alt="" width={size} height={size} onError={() => setFailed(true)} />;
  }
  return (
    <svg className={className} viewBox="0 0 5 5" width={size} height={size} aria-hidden="true">
      {cells.map((on, index) => (on ? <rect key={index} x={index % 5} y={Math.floor(index / 5)} width={1} height={1} /> : null))}
    </svg>
  );
}

function Poster({ face }: { face: WantedFace }) {
  const wallets = walletCount(face.holders);
  return (
    <a className="wanted-poster" href={nansenTokenUrl(face.chain, face.address)} target="_blank" rel="noreferrer">
      <span className="wanted-nail" aria-hidden="true" />
      <span className="wanted-kicker">Wanted</span>
      <Mug face={face} size={72} />
      <span className="wanted-symbol">{face.symbol}</span>
      <span className="wanted-chain">{chainLabel(face.chain)}</span>
      <span className="wanted-bounty">{wallets}</span>
      <span className="wanted-flow" data-off={face.flow24hUsd == null}>{flowLabel(face.flow24hUsd)}</span>
    </a>
  );
}
