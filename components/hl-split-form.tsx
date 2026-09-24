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
  { id: "SPLIT", label: "Split" },
  { id: "ALIGNED", label: "Aligned" },
  { id: "FLAT", label: "Flat" },
];

type Split = {
  verdict: "SPLIT" | "ALIGNED" | "FLAT";
  sentence: string;
  smartNet: number | null;
  whaleNet: number | null;
  credits: Credits;
  raw?: unknown;
};

function side(value: number | null): string {
  if (value == null) return "missing";
  if (value > 0) return "long";
  if (value < 0) return "short";
  return "zero";
}

export function HlSplitForm() {
  const { pending, error, run } = useDesk();
  const [tokenAddress, setTokenAddress] = useState("");
  const [bet, setBet] = useState("");
  const [result, setResult] = useState<Split | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!bet || result) return;
    const data = await run<Split>("/api/hl-split", { tokenAddress });
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
          label="Split bet"
          options={BETS}
          value={bet}
          disabled={pending || Boolean(result)}
          onChange={setBet}
        />
        <label className="block text-sm font-semibold" htmlFor="hl-token">
          Perp ticker
        </label>
        <Input
          id="hl-token"
          value={tokenAddress}
          disabled={pending || Boolean(result)}
          onChange={(event) => setTokenAddress(event.target.value)}
          placeholder="BTC"
          autoComplete="off"
          spellCheck={false}
        />
        {result ? (
          <Button type="button" variant="line" onClick={reset}>
            New round
          </Button>
        ) : (
          <Button type="submit" disabled={pending || !bet} className="w-full sm:w-auto">
            {pending ? "Calling…" : "Call the perp book"}
          </Button>
        )}
      </form>
      {error ? <Status kind="error">{error}</Status> : null}
      {!result && !error ? <Status kind="empty">Lock a stamp. An empty ticker does not call.</Status> : null}
      {pending ? <Status kind="loading">One request is in flight.</Status> : null}
      {result ? (
        <div className="space-y-3">
          <RoundMark hit={bet === result.verdict} you={labelOf(BETS, bet)} api={labelOf(BETS, result.verdict)} />
          <p className="stamp">{result.verdict}</p>
          <ul className="pair">
            <li>
              <span>Smart HL Perps</span>
              <span>
                {result.smartNet == null ? "missing" : formatUsd(result.smartNet)} · {side(result.smartNet)}
              </span>
            </li>
            <li>
              <span>Whales</span>
              <span>
                {result.whaleNet == null ? "missing" : formatUsd(result.whaleNet)} · {side(result.whaleNet)}
              </span>
            </li>
          </ul>
          {result.verdict === "FLAT" ? <p className="aside">{result.sentence}</p> : null}
          <CallNote credits={result.credits} />
          <RawJson value={result.raw} />
        </div>
      ) : null}
    </div>
  );
}
