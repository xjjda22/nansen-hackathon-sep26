"use client";

import { BoardPicker, type BoardRow } from "@/components/board-picker";
import { CallNote } from "@/components/call-note";
import { labelOf, RawJson, recordRound, roundHit, RoundMark, StampPicker } from "@/components/play";
import { Status } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDesk, type Credits } from "@/components/use-desk";
import { FLOW_CHAINS } from "@/lib/constants";
import { useState } from "react";

const BETS = [
  { id: "AGREE", label: "Agree" },
  { id: "DISAGREE", label: "Disagree" },
  { id: "FLAT", label: "Flat" },
  { id: "UNAVAILABLE", label: "Unavailable" },
];

const SHOWN = [...BETS, { id: "NO_FLOW", label: "No flow" }];

type SignResult = {
  line: string;
  agreement: "AGREE" | "DISAGREE" | "UNAVAILABLE" | null;
  flat: boolean;
  noFlow?: boolean;
  fiveSkipped?: string;
  credits: Credits;
  raw?: unknown;
};

function stampOf(result: SignResult): string {
  if (result.noFlow) return "NO_FLOW";
  if (result.agreement) return result.agreement;
  if (result.flat) return "FLAT";
  return "UNAVAILABLE";
}

export function CohortSignForm() {
  const { pending, error, run } = useDesk();
  const [chain, setChain] = useState("ethereum");
  const [tokenAddress, setTokenAddress] = useState("");
  const [symbol, setSymbol] = useState("");
  const [bet, setBet] = useState("");
  const [result, setResult] = useState<SignResult | null>(null);

  function pick(row: BoardRow) {
    if (pending || result) return;
    setChain(row.chain);
    setTokenAddress(row.tokenAddress);
    setSymbol(row.tokenSymbol);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!bet || result) return;
    const data = await run<SignResult>("/api/cohort-sign", { chain, tokenAddress, symbol });
    if (!data) return;
    recordRound(bet, stampOf(data), BETS, Boolean(data.credits.cached));
    setResult(data);
  }

  function reset() {
    setResult(null);
    setBet("");
  }

  const reveal = result ? stampOf(result) : "";

  return (
    <div className="space-y-5">
      <BoardPicker disabled={pending || Boolean(result)} onPick={pick} />
      <form onSubmit={onSubmit} className="space-y-3">
        <StampPicker label="Wire bet" options={BETS} value={bet} disabled={pending || Boolean(result)} onChange={setBet} />
        <label className="block text-sm font-semibold" htmlFor="flow-chain">
          Chain
        </label>
        <select
          id="flow-chain"
          value={chain}
          disabled={pending || Boolean(result)}
          onChange={(event) => setChain(event.target.value)}
          className="field"
        >
          {FLOW_CHAINS.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <label className="block text-sm font-semibold" htmlFor="flow-address">
          Token address
        </label>
        <Input
          id="flow-address"
          value={tokenAddress}
          disabled={pending || Boolean(result)}
          onChange={(event) => {
            setTokenAddress(event.target.value);
            setSymbol("");
          }}
          placeholder="0x…"
          autoComplete="off"
          spellCheck={false}
        />
        {result ? (
          <Button type="button" variant="line" onClick={reset}>
            New round
          </Button>
        ) : (
          <Button type="submit" disabled={pending || !bet} className="w-full sm:w-auto">
            {pending ? "Calling…" : "Call flow intelligence"}
          </Button>
        )}
      </form>
      {symbol ? <p className="aside">{symbol}</p> : null}
      {error ? <Status kind="error">{error}</Status> : null}
      {!result && !error ? <Status kind="empty">Lock a stamp. A symbol alone does not call.</Status> : null}
      {pending ? <Status kind="loading">One request is in flight.</Status> : null}
      {result ? (
        <div className="space-y-3">
          <RoundMark hit={roundHit(bet, reveal, BETS)} you={labelOf(BETS, bet)} api={labelOf(SHOWN, reveal)} />
          <p className="wire-line">{result.line}</p>
          <p className="stamp">{labelOf(SHOWN, reveal)}</p>
          <CallNote credits={result.credits} />
          {result.fiveSkipped ? <p className="aside">{result.fiveSkipped}</p> : null}
          <RawJson value={result.raw} />
        </div>
      ) : null}
    </div>
  );
}
