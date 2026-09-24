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
  { id: "STILL_FILLING", label: "Still filling" },
  { id: "CLOSED", label: "Closed" },
  { id: "NONE", label: "None" },
];

type Dca = {
  verdict: "NONE" | "STILL_FILLING" | "CLOSED";
  active: number;
  closed: number;
  leftover: number | null;
  pageCut: boolean;
  credits: Credits;
  raw?: unknown;
};

export function JupDcaForm() {
  const { pending, error, run } = useDesk();
  const [tokenAddress, setTokenAddress] = useState("");
  const [bet, setBet] = useState("");
  const [result, setResult] = useState<Dca | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!bet || result) return;
    const data = await run<Dca>("/api/jup-dca", { tokenAddress });
    if (!data) return;
    markRound(bet === data.verdict);
    setResult(data);
  }

  function reset() {
    setResult(null);
    setBet("");
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="space-y-3">
        <StampPicker
          label="Vault bet"
          options={BETS}
          value={bet}
          disabled={pending || Boolean(result)}
          onChange={setBet}
        />
        <label className="block text-sm font-semibold" htmlFor="dca-mint">
          Solana mint
        </label>
        <Input
          id="dca-mint"
          value={tokenAddress}
          disabled={pending || Boolean(result)}
          onChange={(event) => setTokenAddress(event.target.value)}
          placeholder="Mint address"
          autoComplete="off"
          spellCheck={false}
        />
        {result ? (
          <Button type="button" variant="line" onClick={reset}>
            New round
          </Button>
        ) : (
          <Button type="submit" disabled={pending || !bet} className="w-full sm:w-auto">
            {pending ? "Calling…" : "Call Jupiter DCA"}
          </Button>
        )}
      </form>
      {error ? <Status kind="error">{error}</Status> : null}
      {!result && !error ? <Status kind="empty">Lock a stamp. A ticker does not call.</Status> : null}
      {pending ? <Status kind="loading">One request is in flight.</Status> : null}
      {result ? (
        <div className="space-y-3">
          <RoundMark hit={bet === result.verdict} you={labelOf(BETS, bet)} api={labelOf(BETS, result.verdict)} />
          <p className="stamp">{result.verdict.replaceAll("_", " ")}</p>
          <ul className="pair">
            <li>
              <span>Active</span>
              <span>{result.active}</span>
            </li>
            <li>
              <span>Closed</span>
              <span>{result.closed}</span>
            </li>
            <li>
              <span>Unspent</span>
              <span>{result.leftover == null ? "no figure" : formatUsd(result.leftover)}</span>
            </li>
          </ul>
          <CallNote credits={result.credits} />
          {result.pageCut ? <p className="aside">Page cut.</p> : null}
          <RawJson value={result.raw} />
        </div>
      ) : null}
    </div>
  );
}
