"use client";

import { CallNote } from "@/components/call-note";
import { labelOf, RawJson, RoundMark, StampPicker } from "@/components/play";
import { markRound } from "@/components/score";
import { Status } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDesk, type Credits } from "@/components/use-desk";
import { formatUsd } from "@/lib/rules";
import { useState } from "react";

const BETS = [
  { id: "OFF", label: "A name" },
  { id: "NONE", label: "None" },
];

type Card = {
  chain: string;
  tokenAddress: string;
  tokenSymbol: string;
  netFlow24hUsd: number;
  sectors: string[];
};

type BoardResult = {
  count: number;
  cards: Card[];
  ignored: string[];
  unmatchedSymbols: string[];
  floorUsd: number;
  pageCut: boolean;
  credits: Credits;
  raw?: unknown;
};

type CohortResult = {
  sentence: string;
  credits: Credits;
  raw?: unknown;
};

function stampOf(result: BoardResult): string {
  return result.count > 0 ? "OFF" : "NONE";
}

export function NotOnYourListForm() {
  const { pending, error, run } = useDesk();
  const [book, setBook] = useState("");
  const [bet, setBet] = useState("");
  const [result, setResult] = useState<BoardResult | null>(null);
  const [cohorts, setCohorts] = useState<Record<string, CohortResult>>({});

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!bet || result) return;
    const data = await run<BoardResult>("/api/not-on-your-list", { book });
    if (!data) return;
    markRound(bet === stampOf(data));
    setResult(data);
    setCohorts({});
  }

  async function openCohort(card: Card) {
    const data = await run<CohortResult>("/api/not-on-your-list", {
      action: "cohort",
      book,
      chain: card.chain,
      tokenAddress: card.tokenAddress,
    });
    if (!data) return;
    setCohorts((current) => ({ ...current, [`${card.chain}:${card.tokenAddress}`]: data }));
  }

  function reset() {
    setResult(null);
    setBet("");
    setCohorts({});
  }

  const reveal = result ? stampOf(result) : "";

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="space-y-3">
        <StampPicker label="Ledger bet" options={BETS} value={bet} disabled={pending || Boolean(result)} onChange={setBet} />
        <label className="block text-sm font-semibold" htmlFor="book">
          Book
        </label>
        <Input
          id="book"
          value={book}
          disabled={pending || Boolean(result)}
          onChange={(event) => setBook(event.target.value)}
          placeholder="PEPE, AAVE, 0x…"
          autoComplete="off"
        />
        {result ? (
          <Button type="button" variant="line" onClick={reset}>
            New round
          </Button>
        ) : (
          <Button type="submit" disabled={pending || !bet} className="w-full sm:w-auto">
            {pending ? "Calling…" : "Call netflow"}
          </Button>
        )}
      </form>
      {error ? <Status kind="error">{error}</Status> : null}
      {!result && !error ? <Status kind="empty">Lock a stamp. An empty book does not call.</Status> : null}
      {pending ? <Status kind="loading">One request is in flight.</Status> : null}
      {result ? (
        <div className="space-y-4">
          <RoundMark hit={bet === reveal} you={labelOf(BETS, bet)} api={labelOf(BETS, reveal)} />
          <p className="rule-mark">
            {result.count}
            <small>off the book · floor {formatUsd(result.floorUsd)}</small>
          </p>
          <CallNote credits={result.credits} />
          {result.pageCut ? <p className="aside">Page cut.</p> : null}
          {result.unmatchedSymbols.length > 0 ? (
            <p className="aside">No row: {result.unmatchedSymbols.join(", ")}.</p>
          ) : null}
          {result.ignored.length > 0 ? <p className="aside">Ignored: {result.ignored.join(", ")}.</p> : null}
          {result.cards.length === 0 ? (
            <Status kind="empty">No name cleared the book.</Status>
          ) : (
            <ul className="space-y-3">
              {result.cards.map((card) => {
                const key = `${card.chain}:${card.tokenAddress}`;
                const cohort = cohorts[key];
                return (
                  <li key={key} className="ledger-line">
                    <p className="font-display text-xl text-rust">
                      {card.tokenSymbol} · {card.chain}
                    </p>
                    <p className="mt-1 text-sm">
                      24h {formatUsd(card.netFlow24hUsd)}
                      {card.sectors.length > 0 ? ` · ${card.sectors.join(", ")}` : ""}
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-[#5c4632]">{card.tokenAddress}</p>
                    <Button type="button" variant="line" className="mt-3" disabled={pending} onClick={() => openCohort(card)}>
                      {pending ? "Calling…" : "Call 1d flow"}
                    </Button>
                    {cohort ? (
                      <div className="mt-3">
                        <p className="verdict">{cohort.sentence}</p>
                        <CallNote credits={cohort.credits} />
                        <RawJson value={cohort.raw} />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
          <RawJson value={result.raw} />
        </div>
      ) : null}
    </div>
  );
}
