"use client";

import { CallNote } from "@/components/call-note";
import { labelOf, RawJson, RoundMark, StampPicker } from "@/components/play";
import { markRound } from "@/components/score";
import { Status } from "@/components/status";
import { Button } from "@/components/ui/button";
import { useDesk, type Credits } from "@/components/use-desk";
import { formatUsd } from "@/lib/rules";
import { useState } from "react";

const BETS = [
  { id: "ETHEREUM", label: "Ethereum leads" },
  { id: "NOT_ETHEREUM", label: "Not Ethereum" },
];

type Named = { chain: string; gasUsd: number | null; missing?: boolean };

type Gas = {
  verdict: "GAS_MISSING" | "MAINNET_STILL_BURNS_MOST" | "L2_BURNS_MOST";
  leader: string | null;
  leaderGas: number | null;
  sentence: string;
  named: Named[];
  credits: Credits;
  raw?: unknown;
};

function revealId(result: Gas): string {
  if (result.verdict === "MAINNET_STILL_BURNS_MOST") return "ETHEREUM";
  if (result.verdict === "L2_BURNS_MOST") return "NOT_ETHEREUM";
  return "GAS_MISSING";
}

export function GasLeadForm() {
  const { pending, error, run } = useDesk();
  const [bet, setBet] = useState("");
  const [result, setResult] = useState<Gas | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!bet || result) return;
    const data = await run<Gas>("/api/gas-lead", {});
    if (!data) return;
    markRound(bet === revealId(data));
    setResult(data);
  }

  function reset() {
    setResult(null);
    setBet("");
  }

  const rows = result
    ? result.leader && !result.named.some((row) => row.chain.toLowerCase() === result.leader?.toLowerCase())
      ? [{ chain: result.leader, gasUsd: result.leaderGas, missing: false }, ...result.named]
      : result.named
    : [];
  const max = Math.max(...rows.map((row) => row.gasUsd ?? 0), 1);

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="space-y-3">
        <StampPicker
          label="Gas bet"
          options={BETS}
          value={bet}
          disabled={pending || Boolean(result)}
          onChange={setBet}
        />
        {result ? (
          <Button type="button" variant="line" onClick={reset}>
            New round
          </Button>
        ) : (
          <Button type="submit" disabled={pending || !bet} className="w-full sm:w-auto">
            {pending ? "Calling…" : "Call chain rank"}
          </Button>
        )}
      </form>
      {error ? <Status kind="error">{error}</Status> : null}
      {!result && !error ? <Status kind="empty">Lock Ethereum or not. Then call.</Status> : null}
      {pending ? <Status kind="loading">One request is in flight.</Status> : null}
      {result ? (
        <div className="space-y-3">
          <RoundMark
            hit={bet === revealId(result)}
            you={labelOf(BETS, bet)}
            api={revealId(result) === "GAS_MISSING" ? "Gas missing" : labelOf(BETS, revealId(result))}
          />
          <p className="stamp">{result.leader ? result.leader : "GAS MISSING"}</p>
          <ul className="bars">
            {rows.map((row) => {
              const leads = result.leader?.toLowerCase() === row.chain.toLowerCase();
              const width = row.gasUsd != null ? `${(row.gasUsd / max) * 100}%` : "0%";
              return (
                <li key={row.chain} className={`bar-row${leads ? " bar-lead" : ""}`}>
                  <span>{row.chain}</span>
                  <span className="bar-track">
                    <span className="bar-fill" style={{ width }} />
                  </span>
                  <span>
                    {row.missing
                      ? "not on the page"
                      : row.gasUsd == null
                        ? "null"
                        : formatUsd(row.gasUsd)}
                    {leads ? " · leads" : ""}
                  </span>
                </li>
              );
            })}
          </ul>
          <CallNote credits={result.credits} />
          <RawJson value={result.raw} />
        </div>
      ) : null}
    </div>
  );
}
