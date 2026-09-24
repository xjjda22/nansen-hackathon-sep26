"use client";

import { CallNote } from "@/components/call-note";
import { RawJson } from "@/components/play";
import { Status } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { publishCredits, useDesk, type Credits } from "@/components/use-desk";
import { formatUsd, hourAgainstDay, onloadRead } from "@/lib/rules";
import { useEffect, useState } from "react";

type Card = {
  chain: string;
  tokenAddress: string;
  tokenSymbol: string;
  netFlow24hUsd: number;
};

type Side = {
  sector: string;
  sumUsd: number;
  topSymbol: string;
  topChain: string;
  oneToken: boolean;
} | null;

type RailRow = {
  chain: string;
  tokenSymbol: string;
  netFlow24hUsd: number;
  netFlow1hUsd: number | null;
  netFlow7dUsd: number | null;
  netFlow30dUsd: number | null;
  larger: boolean;
};

type PickRow = {
  chain: string;
  tokenAddress: string;
  tokenSymbol: string;
  netFlow1hUsd: number | null;
  netFlow24hUsd: number;
  netFlow7dUsd: number | null;
  netFlow30dUsd: number | null;
  traderCount: number | null;
  tokenAgeDays: number | null;
  marketCapUsd: number | null;
  sectors: string[];
};

type BoardResult = {
  pageCut: boolean;
  ledger: {
    skipped: boolean;
    line: string;
    cards: Card[];
    ignored: string[];
    unmatchedSymbols: string[];
  };
  weather: {
    sentence: string;
    entering: Side;
    leaving: Side;
    nothingLeaving: boolean;
    noWeather: boolean;
    unmapped: number;
  };
  rails: {
    skipped: boolean;
    line: string;
    rows: RailRow[];
    tied: boolean;
  };
  rows: PickRow[];
  credits: Credits;
  raw?: unknown;
};

function flowText(value: number | null): string {
  if (value == null) return "absent";
  return formatUsd(value);
}

function countText(value: number | null): string {
  if (value == null) return "absent";
  return String(value);
}

function sideLine(label: string, side: Side, nothing: boolean): string {
  if (!side) return nothing ? `${label}: nothing leaving.` : `${label}: none.`;
  const moved = `${side.topSymbol} on ${side.topChain} moved it most.`;
  const half = side.oneToken ? " More than half of the sum." : "";
  return `${label}: ${side.sector}. ${formatUsd(side.sumUsd)}. ${moved}${half}`;
}

let boardLoad: Promise<{ data: BoardResult | null; error: string | null }> | null = null;

function loadBoard(): Promise<{ data: BoardResult | null; error: string | null }> {
  if (!boardLoad) {
    boardLoad = (async () => {
      try {
        const response = await fetch("/api/netflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ book: "", symbol: "" }),
        });
        const data = (await response.json()) as BoardResult & { ok?: boolean; error?: string };
        if (data.credits) publishCredits(data.credits);
        if (!response.ok || data.ok === false) {
          return { data: null, error: data.error ?? "The desk could not complete that." };
        }
        return { data, error: null };
      } catch {
        return { data: null, error: "The request failed before a result came back." };
      }
    })();
  }
  return boardLoad;
}

function windowLine(row: RailRow, tied: boolean, several: boolean): string {
  const windows = `${row.chain} · 24h ${flowText(row.netFlow24hUsd)} · 1h ${flowText(row.netFlow1hUsd)} · 7d ${flowText(row.netFlow7dUsd)} · 30d ${flowText(row.netFlow30dUsd)}`;
  if (!several) return windows;
  const mark = tied ? "tie" : row.larger ? "larger 24h" : "smaller 24h";
  return `${windows} · ${mark}`;
}

export function BoardForm() {
  const { pending, error, run } = useDesk();
  const [book, setBook] = useState("");
  const [symbol, setSymbol] = useState("");
  const [load, setLoad] = useState<BoardResult | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [result, setResult] = useState<BoardResult | null>(null);
  const [picked, setPicked] = useState<PickRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadBoard().then((outcome) => {
      if (cancelled) return;
      setLoad(outcome.data);
      setLoadError(outcome.error);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPicked(null);
    const data = await run<BoardResult>("/api/netflow", { book, symbol });
    if (!data) return;
    setResult(data);
  }

  const stamps = load
    ? onloadRead(load.rows.map((row) => ({ ...row, tokenSectors: row.sectors })))
    : null;
  const shownError = error ?? loadError;

  return (
    <div className="space-y-5">
      {stamps ? (
        <ul className="stamps" data-onload>
          <li>
            {stamps.positive} names have positive 24h flow. The book is empty, so none were subtracted.
          </li>
          <li>
            {stamps.sector
              ? `Leading sector: ${stamps.sector}. ${formatUsd(stamps.sectorSumUsd ?? 0)}.`
              : "No leading sector on this page."}
          </li>
          <li>
            {stamps.flipCount === 0
              ? "No name flips sign between 7d and 30d."
              : `${stamps.flipCount} names flip sign between 7d and 30d. Sharpest flip: ${stamps.sharpestSymbol}, ${stamps.sharpestTraders == null ? "traders absent" : `${stamps.sharpestTraders} traders`}.`}
          </li>
          <li>
            {stamps.pair
              ? `${stamps.pair.symbol}: ${stamps.pair.leftChain} 24h ${formatUsd(stamps.pair.leftUsd)}, ${stamps.pair.rightChain} 24h ${formatUsd(stamps.pair.rightUsd)}. ${stamps.pair.tied ? "Tied." : `Larger absolute on ${stamps.pair.leader}.`}`
              : "This page has no pair."}
          </li>
        </ul>
      ) : null}
      {load ? <CallNote credits={load.credits} /> : null}
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-sm font-semibold" htmlFor="book">
          Book
        </label>
        <Input
          id="book"
          value={book}
          disabled={pending}
          onChange={(event) => setBook(event.target.value)}
          placeholder="PEPE, AAVE, 0x…"
          autoComplete="off"
        />
        <label className="block text-sm font-semibold" htmlFor="symbol">
          Rails symbol
        </label>
        <Input
          id="symbol"
          value={symbol}
          disabled={pending}
          onChange={(event) => setSymbol(event.target.value)}
          placeholder="PEPE"
          autoComplete="off"
          spellCheck={false}
        />
        <Button type="submit" disabled={pending || (!load && !shownError)} className="w-full sm:w-auto">
          {pending || (!load && !shownError) ? "Calling…" : "Call netflow"}
        </Button>
      </form>
      {shownError ? <Status kind="error">{shownError}</Status> : null}
      {!load && !shownError ? <Status kind="loading">One request is in flight.</Status> : null}
      {pending ? <Status kind="loading">One request is in flight.</Status> : null}
      {result ? (
        <div className="answers">
          {result.pageCut ? <p>Page cut. Page 2 was not fetched.</p> : null}
          <section>
            <h2>Ledger</h2>
            <p>{result.ledger.line}</p>
            {result.ledger.cards.length > 0 ? (
              <ul>
                {result.ledger.cards.map((card) => (
                  <li key={`${card.chain}:${card.tokenAddress}`}>
                    {card.tokenSymbol} · {card.chain} · 24h {formatUsd(card.netFlow24hUsd)}
                  </li>
                ))}
              </ul>
            ) : null}
            {result.ledger.unmatchedSymbols.length > 0 ? (
              <p>No row: {result.ledger.unmatchedSymbols.join(", ")}.</p>
            ) : null}
            {result.ledger.ignored.length > 0 ? <p>Ignored: {result.ledger.ignored.join(", ")}.</p> : null}
          </section>
          <section>
            <h2>Weather</h2>
            {result.weather.noWeather ? (
              <p>{result.weather.sentence}</p>
            ) : (
              <>
                <p>{sideLine("Entering", result.weather.entering, false)}</p>
                <p>{sideLine("Leaving", result.weather.leaving, result.weather.nothingLeaving)}</p>
                <p>Unmapped {result.weather.unmapped}. Overlap.</p>
              </>
            )}
          </section>
          <section>
            <h2>Rails</h2>
            <p>{result.rails.line}</p>
            {result.rails.rows.length > 0 ? (
              <ul>
                {result.rails.rows.map((row) => (
                  <li key={`${row.chain}:${row.tokenSymbol}`}>
                    {windowLine(row, result.rails.tied, result.rails.rows.length > 1)}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
          <CallNote credits={result.credits} />
          <section>
            <h2>Row</h2>
            <p>Pick a row from this page. No extra call.</p>
            {picked ? (
              <div className="token-read" data-token-read>
                <dl className="facts">
                  <dt>Symbol</dt>
                  <dd>{picked.tokenSymbol}</dd>
                  <dt>Chain</dt>
                  <dd>{picked.chain}</dd>
                  <dt>Address</dt>
                  <dd>{picked.tokenAddress}</dd>
                  <dt>1h</dt>
                  <dd>{flowText(picked.netFlow1hUsd)}</dd>
                  <dt>24h</dt>
                  <dd>{flowText(picked.netFlow24hUsd)}</dd>
                  <dt>7d</dt>
                  <dd>{flowText(picked.netFlow7dUsd)}</dd>
                  <dt>30d</dt>
                  <dd>{flowText(picked.netFlow30dUsd)}</dd>
                  <dt>1h vs 24h</dt>
                  <dd>{hourAgainstDay(picked.netFlow1hUsd, picked.netFlow24hUsd)}</dd>
                  <dt>Sectors</dt>
                  <dd>{picked.sectors.length > 0 ? picked.sectors.join(", ") : "absent"}</dd>
                  <dt>Traders</dt>
                  <dd>{countText(picked.traderCount)}</dd>
                  <dt>Age</dt>
                  <dd>{picked.tokenAgeDays == null ? "absent" : `${picked.tokenAgeDays} days`}</dd>
                  <dt>Market cap</dt>
                  <dd>{flowText(picked.marketCapUsd)}</dd>
                </dl>
              </div>
            ) : null}
            <ul className="row-list">
              {result.rows.map((row) => {
                const key = `${row.chain}:${row.tokenAddress}`;
                const active = picked?.chain === row.chain && picked.tokenAddress === row.tokenAddress;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      className={active ? "row-pick is-on" : "row-pick"}
                      onClick={() => setPicked(row)}
                    >
                      {row.tokenSymbol} · {row.chain} · 24h {formatUsd(row.netFlow24hUsd)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
          <RawJson value={result.raw} />
        </div>
      ) : null}
    </div>
  );
}
