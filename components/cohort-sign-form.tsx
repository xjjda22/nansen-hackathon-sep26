"use client";

import { BoardPicker, type BoardRow } from "@/components/board-picker";
import { CallNote } from "@/components/call-note";
import { Status } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDesk, type Credits } from "@/components/use-desk";
import { FLOW_CHAINS } from "@/lib/constants";
import { useState } from "react";

type SignResult = {
  line: string;
  agreement: "AGREE" | "DISAGREE" | "UNAVAILABLE" | null;
  flat: boolean;
  noFlow: boolean;
  fiveSkipped?: string;
  addressOnly: boolean;
  credits: Credits;
};

export function CohortSignForm() {
  const { pending, error, run } = useDesk();
  const [chain, setChain] = useState<string>("ethereum");
  const [tokenAddress, setTokenAddress] = useState("");
  const [symbol, setSymbol] = useState("");
  const [result, setResult] = useState<SignResult | null>(null);

  function pick(row: BoardRow) {
    setChain(row.chain);
    setTokenAddress(row.tokenAddress);
    setSymbol(row.tokenSymbol);
    setResult(null);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const data = await run<SignResult>("/api/cohort-sign", { chain, tokenAddress, symbol });
    if (!data) return;
    setResult(data);
  }

  return (
    <div className="space-y-5">
      <BoardPicker disabled={pending} night onPick={pick} />
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-sm font-semibold" htmlFor="flow-chain">
          Chain
        </label>
        <select
          id="flow-chain"
          value={chain}
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
          onChange={(event) => {
            setTokenAddress(event.target.value);
            setSymbol("");
          }}
          placeholder="0x…"
          autoComplete="off"
          spellCheck={false}
        />
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Reading cohorts…" : "Read cohort and sign"}
        </Button>
      </form>
      <p className="aside">
        Two lines when the day has a cohort: the largest absolute non-null 1d net flow and its sign,
        then whether that same cohort&apos;s 5-minute sign matches. Null is not zero. A symbol alone
        makes no call. hyperliquid is not a chain here.
        {symbol ? ` Selected symbol: ${symbol}.` : ""}
      </p>
      {error ? <Status kind="error">{error}</Status> : null}
      {!result && !error ? (
        <Status kind="empty">No token yet. Pick a cached row, or send a chain and an address.</Status>
      ) : null}
      {pending ? <Status kind="loading">One request is in flight. The button stays off until it returns.</Status> : null}
      {result ? (
        <div className="space-y-3">
          <p className="wire-line">{result.line}</p>
          <CallNote credits={result.credits} />
          {result.agreement ? (
            <p className="stamp">{result.agreement}</p>
          ) : result.flat ? (
            <p className="aside">No agreement line. A flat day does not agree.</p>
          ) : null}
          {result.fiveSkipped ? <p className="aside">{result.fiveSkipped}</p> : null}
          {result.addressOnly ? (
            <p className="aside">
              No symbol came with this address, so a known stable or native could not be refused up front.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
