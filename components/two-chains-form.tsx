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
  { id: "TWO", label: "Two chains" },
  { id: "ONE", label: "One chain" },
  { id: "ABSENT", label: "Not on the page" },
];

type Hit = {
  chain: string;
  tokenAddress: string;
  tokenSymbol: string;
  netFlow24hUsd: number;
  larger: boolean;
};

type TwoChains = {
  status: "absent" | "once" | "several";
  sentence: string;
  rows: Hit[];
  tied: boolean;
  floorUsd: number;
  pageCut: boolean;
  credits: Credits;
  raw?: unknown;
};

function stampOf(result: TwoChains): string {
  if (result.status === "several") return "TWO";
  if (result.status === "once") return "ONE";
  return "ABSENT";
}

export function TwoChainsForm() {
  const { pending, error, run } = useDesk();
  const [symbol, setSymbol] = useState("");
  const [bet, setBet] = useState("");
  const [result, setResult] = useState<TwoChains | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!bet || result) return;
    const data = await run<TwoChains>("/api/two-chains", { symbol });
    if (!data) return;
    markRound(bet === stampOf(data));
    setResult(data);
  }

  function reset() {
    setResult(null);
    setBet("");
  }

  const reveal = result ? stampOf(result) : "";

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="space-y-3">
        <StampPicker label="Rails bet" options={BETS} value={bet} disabled={pending || Boolean(result)} onChange={setBet} />
        <label className="block text-sm font-semibold" htmlFor="symbol">
          Symbol
        </label>
        <Input
          id="symbol"
          value={symbol}
          disabled={pending || Boolean(result)}
          onChange={(event) => setSymbol(event.target.value)}
          placeholder="PEPE"
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
      {!result && !error ? <Status kind="empty">Lock a stamp. Exact symbol.</Status> : null}
      {pending ? <Status kind="loading">One request is in flight.</Status> : null}
      {result ? (
        <div className="space-y-3">
          <RoundMark hit={bet === reveal} you={labelOf(BETS, bet)} api={labelOf(BETS, reveal)} />
          <p className="verdict">{result.sentence}</p>
          <CallNote credits={result.credits} />
          <p className="aside">Floor {formatUsd(result.floorUsd)}.</p>
          {result.rows.length === 0 ? (
            <Status kind="empty">No row cleared the floor.</Status>
          ) : (
            <ul className="space-y-2">
              {result.rows.map((row) => (
                <li key={`${row.chain}:${row.tokenAddress}`} className={`ticket text-sm ${row.larger ? "ticket-lead" : ""}`}>
                  <p className="font-semibold">
                    {row.tokenSymbol} · {row.chain}
                    {row.larger ? " · larger" : ""}
                    {result.tied && row.larger ? " · tie" : ""}
                  </p>
                  <p>24h {formatUsd(row.netFlow24hUsd)}</p>
                  <p className="mt-1 break-all font-mono text-xs text-[#5c4632]">{row.tokenAddress}</p>
                </li>
              ))}
            </ul>
          )}
          <RawJson value={result.raw} />
        </div>
      ) : null}
    </div>
  );
}
