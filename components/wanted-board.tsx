"use client";

import { identiconCells, nansenTokenUrl, tokenIconUrl } from "@/lib/token-ref";
import type { HoldingRow } from "@/lib/rules";
import { useState } from "react";

const POSTER_COUNT = 3;

export type WantedFace = {
  symbol: string;
  chain: string;
  address: string;
  holders: number;
};

export function topHeld(rows: HoldingRow[]): WantedFace[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => b.row.holdersCount - a.row.holdersCount || a.index - b.index)
    .slice(0, POSTER_COUNT)
    .map(({ row }) => ({
      symbol: row.symbol,
      chain: row.chain,
      address: row.address,
      holders: row.holdersCount,
    }));
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
      <p className="wanted-note">The three names the most wallets still hold.</p>
    </section>
  );
}

function Poster({ face }: { face: WantedFace }) {
  const icon = tokenIconUrl(face.chain, face.address);
  const [failed, setFailed] = useState(false);
  const cells = identiconCells(face.address || face.symbol);
  const wallets = face.holders === 1 ? "1 wallet" : `${face.holders} wallets`;
  return (
    <a className="wanted-poster" href={nansenTokenUrl(face.chain, face.address)} target="_blank" rel="noreferrer">
      <span className="wanted-nail" aria-hidden="true" />
      <span className="wanted-kicker">Wanted</span>
      {icon && !failed ? (
        <img className="wanted-mug" src={icon} alt="" width={72} height={72} onError={() => setFailed(true)} />
      ) : (
        <svg className="wanted-mug" viewBox="0 0 5 5" width={72} height={72} aria-hidden="true">
          {cells.map((on, index) =>
            on ? <rect key={index} x={index % 5} y={Math.floor(index / 5)} width={1} height={1} /> : null,
          )}
        </svg>
      )}
      <span className="wanted-symbol">{face.symbol}</span>
      <span className="wanted-chain">{chainLabel(face.chain)}</span>
      <span className="wanted-bounty">{wallets}</span>
    </a>
  );
}
