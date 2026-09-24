"use client";

import { BoardPicker, type BoardRow } from "@/components/board-picker";
import { CallNote } from "@/components/call-note";
import { labelOf, RawJson, recordRound, roundHit, RoundMark, StampPicker } from "@/components/play";
import { Status } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDesk, type Credits } from "@/components/use-desk";
import { BUYERS_PER_PAGE, POKE_SHARE, TRADE_CHAINS } from "@/lib/constants";
import { useState } from "react";

const BETS = [
  { id: "ONE_POKE", label: "One poke" },
  { id: "MANY_CALLERS", label: "Many callers" },
];

const REVEALS = [
  ...BETS,
  { id: "NO_TRADES", label: "No trades" },
  { id: "VOLUME_ABSENT", label: "Volume absent" },
];

type Poke = {
  verdict: "NO_TRADES" | "VOLUME_ABSENT" | "ONE_POKE" | "MANY_CALLERS";
  sentence: string;
  share: number | null;
  kept: number;
  pageCut: boolean;
  credits: Credits;
  raw?: unknown;
};

export function OnePokeForm() {
  const { pending, error, run } = useDesk();
  const [chain, setChain] = useState("solana");
  const [tokenAddress, setTokenAddress] = useState("");
  const [symbol, setSymbol] = useState("");
  const [bet, setBet] = useState("");
  const [result, setResult] = useState<Poke | null>(null);

  function pick(row: BoardRow) {
    if (pending || result) return;
    setChain(row.chain);
    setTokenAddress(row.tokenAddress);
    setSymbol(row.tokenSymbol);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!bet || result) return;
    const data = await run<Poke>("/api/one-poke", { chain, tokenAddress, symbol, side: "BUY" });
    if (!data) return;
    recordRound(bet, data.verdict, BETS, Boolean(data.credits.cached));
    setResult(data);
  }

  function reset() {
    setResult(null);
    setBet("");
  }

  const percent = result?.share == null ? null : `${Math.round(result.share * 1000) / 10}%`;

  return (
    <div className="space-y-5">
      <p className="rule-mark">
        {Math.round(POKE_SHARE * 100)}%
        <small>Of this buy page of {BUYERS_PER_PAGE}. At or above is one poke.</small>
      </p>
      <BoardPicker disabled={pending || Boolean(result)} onPick={pick} />
      <form onSubmit={onSubmit} className="space-y-3">
        <StampPicker
          label="Poke bet"
          options={BETS}
          value={bet}
          disabled={pending || Boolean(result)}
          onChange={setBet}
        />
        <label className="block text-sm font-semibold" htmlFor="poke-chain">
          Chain
        </label>
        <select
          id="poke-chain"
          className="field"
          value={chain}
          disabled={pending || Boolean(result)}
          onChange={(event) => setChain(event.target.value)}
        >
          {TRADE_CHAINS.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <label className="block text-sm font-semibold" htmlFor="poke-address">
          Token address
        </label>
        <Input
          id="poke-address"
          value={tokenAddress}
          disabled={pending || Boolean(result)}
          onChange={(event) => {
            setTokenAddress(event.target.value);
            setSymbol("");
          }}
          placeholder="0x… or a Solana mint"
          autoComplete="off"
          spellCheck={false}
        />
        {result ? (
          <Button type="button" variant="line" onClick={reset}>
            New round
          </Button>
        ) : (
          <Button type="submit" disabled={pending || !bet} className="w-full sm:w-auto">
            {pending ? "Calling…" : "Call the buy page"}
          </Button>
        )}
      </form>
      {error ? <Status kind="error">{error}</Status> : null}
      {!result && !error ? <Status kind="empty">Lock a stamp. A ticker with no address does not call.</Status> : null}
      {pending ? <Status kind="loading">One request is in flight.</Status> : null}
      {result ? (
        <div className="space-y-3">
          <RoundMark
            hit={roundHit(bet, result.verdict, BETS)}
            you={labelOf(BETS, bet)}
            api={labelOf(REVEALS, result.verdict)}
          />
          <p className="stamp">{result.verdict.replaceAll("_", " ")}</p>
          {percent ? (
            <>
              <p className="rule-mark">
                {percent}
                <small>of this page of {BUYERS_PER_PAGE}</small>
              </p>
              <div className="meter" role="img" aria-label={`${percent} against 50%`}>
                <div className="meter-fill" style={{ width: `${Math.min(100, (result.share ?? 0) * 100)}%` }} />
                <div className="meter-mark" />
              </div>
            </>
          ) : (
            <p className="verdict">{result.sentence}</p>
          )}
          <CallNote credits={result.credits} />
          {result.pageCut ? <p className="aside">First page only.</p> : null}
          <RawJson value={result.raw} />
        </div>
      ) : null}
    </div>
  );
}
