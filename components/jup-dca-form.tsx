"use client";

import { CallNote } from "@/components/call-note";
import { Status } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDesk, type Credits } from "@/components/use-desk";
import { useState } from "react";

type Dca = {
  verdict: "NONE" | "STILL_FILLING" | "CLOSED";
  sentence: string;
  credits: Credits;
};

export function JupDcaForm() {
  const { pending, error, run } = useDesk();
  const [tokenAddress, setTokenAddress] = useState("");
  const [result, setResult] = useState<Dca | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const data = await run<Dca>("/api/jup-dca", { tokenAddress });
    if (!data) return;
    setResult(data);
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-sm font-semibold" htmlFor="dca-mint">
          Solana mint
        </label>
        <Input
          id="dca-mint"
          value={tokenAddress}
          onChange={(event) => setTokenAddress(event.target.value)}
          placeholder="A Solana mint, not a ticker"
          autoComplete="off"
          spellCheck={false}
        />
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Reading Jupiter vaults…" : "Read Jupiter DCA"}
        </Button>
      </form>
      <p className="aside">
        One page of 25 vaults, trailing 14 days. Trader labels stay off. A missing list is NONE, not a
        made-up vault.
      </p>
      {error ? <Status kind="error">{error}</Status> : null}
      {!result && !error ? <Status kind="empty">No mint yet. A ticker alone does not call.</Status> : null}
      {pending ? <Status kind="loading">One request is in flight. The button stays off until it returns.</Status> : null}
      {result ? (
        <div className="space-y-3">
          <p className="stamp">{result.verdict.replaceAll("_", " ")}</p>
          <p className="verdict">{result.sentence}</p>
          <CallNote credits={result.credits} />
        </div>
      ) : null}
    </div>
  );
}
