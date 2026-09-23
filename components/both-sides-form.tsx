"use client";

import { BoardPicker, type BoardRow } from "@/components/board-picker";
import { Status } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDesk, type Credits } from "@/components/use-desk";
import { QUARTER, TRADE_CHAINS } from "@/lib/constants";
import { useState } from "react";

type BuyResult = {
  verdict: "NO_TRADES" | "SOLD_VOLUME_ABSENT" | "COUNT";
  sentence: string;
  addresses: string[];
  counted: number;
  pageCut: boolean;
  addressOnly: boolean;
  hyperliquidLegal: boolean;
  credits: Credits;
};

type SellResult = {
  sentence: string;
  addresses: string[];
  rowCount: number;
  pageCut: boolean;
  credits: Credits;
};

export function BothSidesForm() {
  const { pending, error, run } = useDesk();
  const [chain, setChain] = useState<string>("ethereum");
  const [tokenAddress, setTokenAddress] = useState("");
  const [symbol, setSymbol] = useState("");
  const [buy, setBuy] = useState<BuyResult | null>(null);
  const [sell, setSell] = useState<SellResult | null>(null);

  function pick(row: BoardRow) {
    setChain(row.chain);
    setTokenAddress(row.tokenAddress);
    setSymbol(row.tokenSymbol);
    setBuy(null);
    setSell(null);
  }

  async function onBuy(event: React.FormEvent) {
    event.preventDefault();
    setSell(null);
    const data = await run<BuyResult>("/api/both-sides", {
      chain,
      tokenAddress,
      symbol,
      side: "BUY",
    });
    if (!data) return;
    setBuy(data);
  }

  async function onSell() {
    const data = await run<SellResult>("/api/both-sides", {
      chain,
      tokenAddress,
      symbol,
      side: "SELL",
    });
    if (!data) return;
    setSell(data);
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
          onChange={(event) => setChain(event.target.value)}
          className="min-h-11 w-full rounded-sm border border-gold bg-white px-3 text-base text-ink"
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
          onChange={(event) => {
            setTokenAddress(event.target.value);
            setSymbol("");
          }}
          placeholder="0x… or a Solana address"
          autoComplete="off"
          spellCheck={false}
        />
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Reading the buy page…" : "Read the buy page"}
        </Button>
      </form>
      <p className="text-sm leading-relaxed text-[#5c4632]">
        The quarter is {QUARTER}. It is a constant printed here, not a law. A row counts when both USD
        volumes are present, the smaller is at least a quarter of the larger, and the row clears the
        same 1% floor. Page size is 25. An address typed by itself is not checked against a stablecoin
        list, so this page cannot tell that an address is USDC. hyperliquid is legal on this call and
        is not a netflow chain.
      </p>
      {error ? <Status kind="error">{error}</Status> : null}
      {!buy && !error ? (
        <Status kind="empty">No token yet. A chain and an address, or a cached row. A ticker alone does not call.</Status>
      ) : null}
      {pending ? <Status kind="loading">One request is in flight. The buttons stay off until it returns.</Status> : null}
      {buy ? (
        <div className="space-y-3">
          <p className="text-lg leading-relaxed">{buy.sentence}</p>
          {buy.addresses.length > 0 ? (
            <ul className="space-y-1 break-all font-mono text-xs">
              {buy.addresses.map((address) => (
                <li key={address}>{address}</li>
              ))}
            </ul>
          ) : null}
          {buy.pageCut ? <p className="text-sm text-[#5c4632]">The buy page was cut. The next page was not fetched.</p> : null}
          {buy.addressOnly ? (
            <p className="text-sm text-[#5c4632]">No symbol came with this address, so a quote-leg refusal could not run.</p>
          ) : null}
          {buy.verdict === "COUNT" ? (
            <Button type="button" variant="line" disabled={pending} onClick={onSell}>
              {pending ? "Waiting…" : "Read the sell page"}
            </Button>
          ) : null}
          {sell ? (
            <div className="space-y-2 border-t border-[#eadcc4] pt-3">
              <p>{sell.sentence}</p>
              {sell.addresses.length > 0 ? (
                <ul className="space-y-1 break-all font-mono text-xs">
                  {sell.addresses.map((address) => (
                    <li key={address}>{address}</li>
                  ))}
                </ul>
              ) : (
                <Status kind="empty">The sell page came back with no addresses.</Status>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
