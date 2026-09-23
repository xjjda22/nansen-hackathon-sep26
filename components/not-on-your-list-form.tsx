"use client";

import { CallNote } from "@/components/call-note";
import { Status } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDesk, type Credits } from "@/components/use-desk";
import { formatUsd } from "@/lib/rules";
import { useState } from "react";

type Card = {
  chain: string;
  tokenAddress: string;
  tokenSymbol: string;
  netFlow24hUsd: number;
  traderCount: number;
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
};

type CohortResult = {
  chain: string;
  tokenAddress: string;
  sentence: string;
  credits: Credits;
};

export function NotOnYourListForm() {
  const { pending, error, run } = useDesk();
  const [book, setBook] = useState("");
  const [result, setResult] = useState<BoardResult | null>(null);
  const [cohorts, setCohorts] = useState<Record<string, CohortResult>>({});

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const data = await run<BoardResult>("/api/not-on-your-list", { book });
    if (!data) return;
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
    setCohorts((current) => ({
      ...current,
      [`${card.chain}:${card.tokenAddress}`]: data,
    }));
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-sm font-semibold" htmlFor="book">
          Symbols or token addresses you already hold
        </label>
        <Input
          id="book"
          value={book}
          onChange={(event) => setBook(event.target.value)}
          placeholder="PEPE, AAVE, 0x…"
          autoComplete="off"
        />
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Reading the board…" : "Find what is not on the list"}
        </Button>
      </form>

      {error ? <Status kind="error">{error}</Status> : null}
      {!result && !error ? (
        <Status kind="empty">
          Nothing subtracted yet. Type at least one symbol. An empty book makes no call and is not a
          leaderboard.
        </Status>
      ) : null}
      {pending ? <Status kind="loading">One request is in flight. The button stays off until it returns.</Status> : null}

      {result ? (
        <div className="space-y-4">
          <p className="verdict">
            {result.count === 0
              ? "No name survived the book and the floor."
              : `${result.count} ${result.count === 1 ? "name" : "names"} smart money is adding that ${result.count === 1 ? "is" : "are"} not on your list.`}
          </p>
          <CallNote credits={result.credits} />
          <p className="aside">
            Adding means positive 24h net flow: buys net of sells, or CEX withdrawals net of deposits.
            Stables and native gas tokens stay excluded. Rows under 1% of the largest absolute 24h flow
            on this page ({formatUsd(result.floorUsd)}) are dropped, and so is a row with fewer than 2
            traders. {result.pageCut ? "This is the first page of 100. The next page was not fetched." : "This page was the last page."}
          </p>
          {result.unmatchedSymbols.length > 0 ? (
            <p className="aside">
              Read as symbols and matched no row: {result.unmatchedSymbols.join(", ")}.
            </p>
          ) : null}
          {result.ignored.length > 0 ? (
            <p className="aside">Ignored: {result.ignored.join(", ")}.</p>
          ) : null}
          {result.cards.length === 0 ? (
            <Status kind="empty">The page had rows. None of them cleared your book, the floor, and a positive 24h flow.</Status>
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
                      24h net flow {formatUsd(card.netFlow24hUsd)} · {card.traderCount} traders
                      {card.sectors.length > 0 ? ` · ${card.sectors.join(", ")}` : ""}
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-[#5c4632]">{card.tokenAddress}</p>
                    <Button
                      type="button"
                      variant="line"
                      className="mt-3"
                      disabled={pending}
                      onClick={() => openCohort(card)}
                    >
                      {pending ? "Waiting…" : "Read the 1d cohort"}
                    </Button>
                    {cohort ? (
                      <div className="mt-3">
                        <p className="verdict">{cohort.sentence}</p>
                        <CallNote credits={cohort.credits} />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
