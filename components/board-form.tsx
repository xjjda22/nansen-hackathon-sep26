"use client";

import { CallNote } from "@/components/call-note";
import { RawJson } from "@/components/play";
import { Status } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDesk, type Credits } from "@/components/use-desk";
import { formatUsd, hourAgainstDay } from "@/lib/rules";
import { useState } from "react";

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
  larger: boolean;
};

type PickRow = {
  chain: string;
  tokenAddress: string;
  tokenSymbol: string;
  netFlow24hUsd: number;
  netFlow1hUsd: number | null;
  traderCount: number | null;
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

function sideLine(label: string, side: Side, nothing: boolean): string {
  if (!side) return nothing ? `${label}: nothing leaving.` : `${label}: none.`;
  if (side.oneToken) {
    return `${label}: ${side.sector} is not a sector move. ${side.topSymbol} on ${side.topChain} is more than half.`;
  }
  return `${label}: ${side.sector}. ${formatUsd(side.sumUsd)}.`;
}

export function BoardForm() {
  const { pending, error, run } = useDesk();
  const [book, setBook] = useState("");
  const [symbol, setSymbol] = useState("");
  const [result, setResult] = useState<BoardResult | null>(null);
  const [picked, setPicked] = useState<PickRow | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPicked(null);
    const data = await run<BoardResult>("/api/netflow", { book, symbol });
    if (!data) return;
    setResult(data);
  }

  return (
    <div className="space-y-5">
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
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Calling…" : "Call netflow"}
        </Button>
      </form>
      {error ? <Status kind="error">{error}</Status> : null}
      {!result && !error ? (
        <Status kind="empty">One netflow page. An empty book still returns weather and rails.</Status>
      ) : null}
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
                    {card.tokenSymbol} · {card.chain} · {formatUsd(card.netFlow24hUsd)}
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
                    {row.chain} · {formatUsd(row.netFlow24hUsd)}
                    {result.rails.tied ? " · tie" : row.larger ? " · larger" : ""}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
          <section>
            <h2>Row</h2>
            <p>Pick a row from this page. No extra call.</p>
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
                      {row.tokenSymbol} · {row.chain} · {formatUsd(row.netFlow24hUsd)}
                    </button>
                  </li>
                );
              })}
            </ul>
            {picked ? (
              <div className="token-read" data-token-read>
                <p>1h vs 24h: {hourAgainstDay(picked.netFlow1hUsd, picked.netFlow24hUsd)}.</p>
                <p>Sector: {picked.sectors.length > 0 ? picked.sectors.join(", ") : "none"}.</p>
                <p>Traders: {picked.traderCount == null ? "missing" : picked.traderCount}.</p>
              </div>
            ) : null}
          </section>
          <CallNote credits={result.credits} />
          <RawJson value={result.raw} />
        </div>
      ) : null}
    </div>
  );
}
