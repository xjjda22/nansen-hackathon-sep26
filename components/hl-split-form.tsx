"use client";

import { CallNote } from "@/components/call-note";
import { Status } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDesk, type Credits } from "@/components/use-desk";
import { useState } from "react";

type Split = {
  verdict: "SPLIT" | "ALIGNED" | "FLAT";
  sentence: string;
  credits: Credits;
};

export function HlSplitForm() {
  const { pending, error, run } = useDesk();
  const [tokenAddress, setTokenAddress] = useState("");
  const [result, setResult] = useState<Split | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const data = await run<Split>("/api/hl-split", { tokenAddress });
    if (!data) return;
    setResult(data);
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-sm font-semibold" htmlFor="hl-token">
          Hyperliquid token
        </label>
        <Input
          id="hl-token"
          value={tokenAddress}
          onChange={(event) => setTokenAddress(event.target.value)}
          placeholder="BTC"
          autoComplete="off"
          spellCheck={false}
        />
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Reading the perp book…" : "Read the position split"}
        </Button>
      </form>
      <p className="aside">
        Smart HL Perps against Whales on the Hyperliquid perp book. An empty box makes no call. Spot
        netflow is not consulted, and wallet counts stay off the page.
      </p>
      {error ? <Status kind="error">{error}</Status> : null}
      {!result && !error ? (
        <Status kind="empty">No token yet. The stamp waits for position intelligence.</Status>
      ) : null}
      {pending ? <Status kind="loading">One request is in flight. The button stays off until it returns.</Status> : null}
      {result ? (
        <div className="space-y-3">
          <p className="stamp">{result.verdict}</p>
          <p className="verdict">{result.sentence}</p>
          <CallNote credits={result.credits} />
        </div>
      ) : null}
    </div>
  );
}
