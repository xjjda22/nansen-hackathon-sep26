"use client";

import { TechFoot } from "@/components/desk";
import { Ladder } from "@/components/ladder";
import { TokenMark } from "@/components/token-mark";
import { SplitReadout } from "@/components/split-readout";
import { Status } from "@/components/status";
import { publishCredits, type Credits } from "@/components/use-desk";
import { formatUsd, keptTokenMeasures, tokenHalves, tokenMeasures, type TokenHalves } from "@/lib/rules";
import { Fragment, useEffect, useState } from "react";

type TokenRow = {
  chain: string;
  tokenAddress: string;
  tokenSymbol: string;
  netFlow24hUsd: number;
  netFlow1hUsd: number | null;
  netFlow7dUsd: number | null;
  netFlow30dUsd: number | null;
  traderCount: number | null;
  tokenAgeDays: number | null;
  marketCapUsd: number | null;
  sectors: string[];
};

type Load = {
  rows: TokenRow[];
  credits: Credits;
  raw?: unknown;
};

let tokenLoad: Promise<{ data: Load | null; error: string | null }> | null = null;

export function loadTokens(): Promise<{ data: Load | null; error: string | null }> {
  if (!tokenLoad) {
    tokenLoad = (async () => {
      try {
        const response = await fetch("/api/netflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ book: "", symbol: "" }),
        });
        const data = (await response.json()) as Load & { ok?: boolean; error?: string; rows?: TokenRow[] };
        if (data.credits) publishCredits(data.credits);
        if (!response.ok || data.ok === false || !data.rows) {
          return { data: null, error: data.error ?? "The desk could not complete that." };
        }
        return { data: { rows: data.rows, credits: data.credits, raw: data.raw }, error: null };
      } catch {
        return { data: null, error: "The request failed before a result came back." };
      }
    })();
  }
  return tokenLoad;
}

export function TokenBoard() {
  const [load, setLoad] = useState<Load | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadTokens().then((outcome) => {
      if (cancelled) return;
      setLoad(outcome.data);
      setError(outcome.error);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const halves = load
    ? tokenHalves(load.rows.map((row) => ({ ...row, tokenSectors: row.sectors, netFlow1hUsd: null })))
    : null;

  return (
    <div className="space-y-5">
      {error ? <Status kind="error">{error}</Status> : null}
      {!load && !error ? <Status kind="loading">One request is in flight.</Status> : null}
      {halves ? <TokenSplit halves={halves} /> : null}
      <TechFoot credits={load?.credits} raw={load?.raw} />
    </div>
  );
}

function TokenSplit({ halves }: { halves: TokenHalves }) {
  const topTitle = halves.top.count === 50 ? "Top 50" : `Top ${halves.top.count}`;
  return (
    <section className="token-split" data-token-split>
      <SplitReadout
        frame={halves.frame}
        common={halves.common}
        meaningful={halves.meaningful}
        compared={halves.rest.count > 0}
      />
      <Ladder
        topTitle={topTitle}
        rows={keptTokenMeasures(tokenMeasures(halves.ranked, halves.top.count))}
        caption="The climb is the quieter names on this page. These six are what the 24h rank leaves out."
      />
      <details className="fold">
        <summary>
          Every token
          <span>{halves.ranked.length} rows</span>
        </summary>
        <div className="token-table-wrap">
        <table className="token-table" data-token-table>
          <caption>Tokens ranked by absolute 24h net flow. Trader count is a number on the token.</caption>
          <thead>
            <tr>
              <th scope="col">Symbol</th>
              <th scope="col">Chain</th>
              <th scope="col" className="num">24h</th>
              <th scope="col" className="num">7d</th>
              <th scope="col" className="num">30d</th>
              <th scope="col" className="num">Trader count</th>
              <th scope="col">Sector</th>
              <th scope="col" className="num">Age</th>
            </tr>
          </thead>
          <tbody>
            {halves.ranked.map((row, index) => {
              const boundary = index === halves.top.count && halves.rest.count > 0;
              return (
                <Fragment key={`${row.chain}:${row.tokenAddress}:${index}`}>
                  {boundary ? (
                    <tr className="split-rule">
                      <td colSpan={8}>Rest of this page · {halves.rest.count} tokens</td>
                    </tr>
                  ) : null}
                  <tr className={index >= halves.top.count ? "is-rest" : undefined}>
                    <td>
                      <TokenMark
                        symbol={row.tokenSymbol}
                        chain={row.chain}
                        address={row.tokenAddress}
                        symbolHref={`/board?q=${encodeURIComponent(row.tokenSymbol)}`}
                      />
                    </td>
                    <td>{row.chain}</td>
                    <td className="num">{flowText(row.netFlow24hUsd)}</td>
                    <td className="num">{flowText(row.netFlow7dUsd)}</td>
                    <td className="num">{flowText(row.netFlow30dUsd)}</td>
                    <td className="num">{countText(row.traderCount)}</td>
                    <td className="sector">{row.tokenSectors.length > 0 ? row.tokenSectors.join(", ") : "absent"}</td>
                    <td className="num">{row.tokenAgeDays == null ? "absent" : `${row.tokenAgeDays} days`}</td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
        </div>
      </details>
    </section>
  );
}

function flowText(value: number | null): string {
  if (value == null) return "absent";
  return formatUsd(value);
}

function countText(value: number | null): string {
  if (value == null) return "absent";
  return String(value);
}
