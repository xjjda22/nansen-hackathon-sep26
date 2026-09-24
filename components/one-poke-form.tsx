"use client";

import { BoardPicker, type BoardRow } from "@/components/board-picker";
import { CallNote } from "@/components/call-note";
import { Status } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDesk, type Credits } from "@/components/use-desk";
import { POKE_SHARE, TRADE_CHAINS } from "@/lib/constants";
import { useState } from "react";

type Poke = {
  verdict: "NO_TRADES" | "VOLUME_ABSENT" | "ONE_POKE" | "MANY_CALLERS";
  sentence: string;
  share: number | null;
  kept: number;
  pageCut: boolean;
  addressOnly: boolean;
  credits: Credits;
};

export function OnePokeForm() {
  const { pending, error, run } = useDesk();
  const [chain, setChain] = useState("solana");
  const [tokenAddress, setTokenAddress] = useState("");
  const [symbol, setSymbol] = useState("");
  const [result, setResult] = useState<Poke | null>(null);

  function pick(row: BoardRow) {
    setChain(row.chain);
    setTokenAddress(row.tokenAddress);
    setSymbol(row.tokenSymbol);
    setResult(null);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const data = await run<Poke>("/api/one-poke", { chain, tokenAddress, symbol, side: "BUY" });
    if (!data) return;
    setResult(data);
  }

  return (
    <div className="space-y-5">
      <BoardPicker disabled={pending} onPick={pick} />
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-sm font-semibold" htmlFor="poke-chain">
          Chain
        </label>
        <select id="poke-chain" className="field" value={chain} onChange={(event) => setChain(event.target.value)}>
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
          onChange={(event) => {
            setTokenAddress(event.target.value);
            setSymbol("");
          }}
          placeholder="0x… or a Solana mint"
          autoComplete="off"
          spellCheck={false}
        />
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Reading the buy page…" : "Read one poke"}
        </Button>
      </form>
      <p className="aside">
        Buy side only. The half is {POKE_SHARE}, printed here. Rows under 1% of the largest bought USD on
        the page are dropped. Addresses and labels stay off. There is no sell button.
        {symbol ? ` Selected symbol: ${symbol}.` : ""}
      </p>
      {error ? <Status kind="error">{error}</Status> : null}
      {!result && !error ? (
        <Status kind="empty">No token yet. A chain and an address. A ticker alone does not call.</Status>
      ) : null}
      {pending ? <Status kind="loading">One request is in flight. The button stays off until it returns.</Status> : null}
      {result ? (
        <div className="space-y-3">
          <p className="stamp">{result.verdict.replaceAll("_", " ")}</p>
          <p className="verdict">{result.sentence}</p>
          <CallNote credits={result.credits} />
          {result.pageCut ? <p className="aside">The buy page was cut. The next page was not fetched.</p> : null}
          {result.addressOnly ? (
            <p className="aside">No symbol came with this address, so a quote-leg refusal could not run.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
