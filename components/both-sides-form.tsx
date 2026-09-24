"use client";

import { BoardPicker, type BoardRow } from "@/components/board-picker";
import { CallNote } from "@/components/call-note";
import { RawJson } from "@/components/play";
import { Status } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDesk, type Credits } from "@/components/use-desk";
import { TRADE_CHAINS } from "@/lib/constants";
import { useState } from "react";

type BuyResult = {
  verdict: "NO_TRADES" | "SOLD_VOLUME_ABSENT" | "COUNT";
  sentence: string;
  counted: number;
  pageCut: boolean;
  credits: Credits;
  raw?: unknown;
};

export function BothSidesForm() {
  const { pending, error, run } = useDesk();
  const [chain, setChain] = useState("ethereum");
  const [tokenAddress, setTokenAddress] = useState("");
  const [symbol, setSymbol] = useState("");
  const [buy, setBuy] = useState<BuyResult | null>(null);

  function pick(row: BoardRow) {
    if (pending) return;
    setChain(row.chain);
    setTokenAddress(row.tokenAddress);
    setSymbol(row.tokenSymbol);
    setBuy(null);
  }

  async function onBuy(event: React.FormEvent) {
    event.preventDefault();
    const data = await run<BuyResult>("/api/both-sides", { chain, tokenAddress, symbol, side: "BUY" });
    if (!data) return;
    setBuy(data);
  }

  return (
    <div className="space-y-5">
      <BoardPicker disabled={pending} onPick={pick} />
      <form onSubmit={onBuy} className="space-y-3">
        <label className="block text-sm font-semibold" htmlFor="trade-chain">
          Chain
        </label>
        <select
          id="trade-chain"
          value={chain}
          disabled={pending}
          onChange={(event) => setChain(event.target.value)}
          className="field"
        >
          {TRADE_CHAINS.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <label className="block text-sm font-semibold" htmlFor="trade-address">
          Token address
        </label>
        <Input
          id="trade-address"
          value={tokenAddress}
          disabled={pending}
          onChange={(event) => {
            setTokenAddress(event.target.value);
            setSymbol("");
          }}
          placeholder="0x… or a Solana mint"
          autoComplete="off"
          spellCheck={false}
        />
        <Button type="submit" disabled={pending || !tokenAddress.trim()} className="w-full sm:w-auto">
          {pending ? "Calling…" : "Call the buy page"}
        </Button>
      </form>
      {error ? <Status kind="error">{error}</Status> : null}
      {!buy && !error ? <Status kind="empty">One buy page. A ticker with no address does not call.</Status> : null}
      {pending ? <Status kind="loading">One request is in flight.</Status> : null}
      {buy ? (
        <div className="space-y-3">
          <p>{buy.sentence}</p>
          {buy.verdict === "COUNT" ? (
            <p>
              {buy.counted} also sold.
            </p>
          ) : null}
          {buy.pageCut ? <p>Page cut. Page 2 was not fetched.</p> : null}
          <CallNote credits={buy.credits} />
          <RawJson value={buy.raw} />
        </div>
      ) : null}
    </div>
  );
}
