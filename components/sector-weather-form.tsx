"use client";

import { CallNote } from "@/components/call-note";
import { labelOf, RawJson, RoundMark, StampPicker } from "@/components/play";
import { markRound } from "@/components/score";
import { Status } from "@/components/status";
import { Button } from "@/components/ui/button";
import { useDesk, type Credits } from "@/components/use-desk";
import { formatUsd, type SectorSide } from "@/lib/rules";
import { useState } from "react";

const BETS = [
  { id: "LEAVING", label: "Leaving" },
  { id: "NOTHING_LEAVING", label: "Nothing leaving" },
  { id: "NO_WEATHER", label: "No weather" },
];

type Weather = {
  sentence: string;
  entering: SectorSide | null;
  leaving: SectorSide | null;
  nothingLeaving: boolean;
  noWeather: boolean;
  unmapped: number;
  floorUsd: number;
  pageCut: boolean;
  sums: SectorSide[];
  credits: Credits;
  raw?: unknown;
};

function stampOf(weather: Weather): string {
  if (weather.noWeather) return "NO_WEATHER";
  if (weather.leaving && !weather.nothingLeaving) return "LEAVING";
  return "NOTHING_LEAVING";
}

export function SectorWeatherForm() {
  const { pending, error, run } = useDesk();
  const [bet, setBet] = useState("");
  const [weather, setWeather] = useState<Weather | null>(null);
  const [showSums, setShowSums] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!bet || weather) return;
    const data = await run<Weather>("/api/sector-weather", {});
    if (!data) return;
    markRound(bet === stampOf(data));
    setWeather(data);
    setShowSums(false);
  }

  function reset() {
    setWeather(null);
    setBet("");
    setShowSums(false);
  }

  const reveal = weather ? stampOf(weather) : "";

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="space-y-3">
        <StampPicker label="Weather bet" options={BETS} value={bet} disabled={pending || Boolean(weather)} onChange={setBet} />
        {weather ? (
          <Button type="button" variant="line" onClick={reset}>
            New round
          </Button>
        ) : (
          <Button type="submit" disabled={pending || !bet} className="w-full sm:w-auto">
            {pending ? "Calling…" : "Call netflow"}
          </Button>
        )}
      </form>
      {error ? <Status kind="error">{error}</Status> : null}
      {!weather && !error ? <Status kind="empty">Lock a stamp, then call.</Status> : null}
      {pending ? <Status kind="loading">One request is in flight.</Status> : null}
      {weather ? (
        <div className="space-y-4">
          <RoundMark hit={bet === reveal} you={labelOf(BETS, bet)} api={labelOf(BETS, reveal)} />
          <p className="forecast">{weather.sentence}</p>
          <CallNote credits={weather.credits} />
          <dl className="hemispheres">
            <div className="hemisphere">
              <dt>In</dt>
              <dd className="mt-1">{sideLine(weather.entering, weather.noWeather)}</dd>
            </div>
            <div className="hemisphere">
              <dt>Out</dt>
              <dd className="mt-1">{weather.nothingLeaving ? "Nothing is leaving." : sideLine(weather.leaving, weather.noWeather)}</dd>
            </div>
          </dl>
          <p className="aside">
            Unmapped {weather.unmapped}. Floor {formatUsd(weather.floorUsd)}.
            {weather.pageCut ? " Page cut." : ""}
          </p>
          <Button type="button" variant="line" onClick={() => setShowSums((value) => !value)}>
            {showSums ? "Hide sums" : "Sums"}
          </Button>
          {showSums ? (
            weather.sums.length === 0 ? (
              <Status kind="empty">No sector sum.</Status>
            ) : (
              <ul className="space-y-2 text-sm">
                {weather.sums.map((side) => (
                  <li key={side.sector} className="flex flex-wrap justify-between gap-2 border-b border-[#eadcc4] py-2">
                    <span>
                      {side.sector}
                      {side.oneToken ? " · one token" : ""}
                    </span>
                    <span>
                      {formatUsd(side.sumUsd)} · {side.topSymbol} on {side.topChain} · {Math.round(side.share * 1000) / 10}%
                    </span>
                  </li>
                ))}
              </ul>
            )
          ) : null}
          <RawJson value={weather.raw} />
        </div>
      ) : null}
    </div>
  );
}

function sideLine(side: SectorSide | null, noWeather: boolean) {
  if (noWeather || !side) return "No sector clears the floor.";
  const share = `${Math.round(side.share * 1000) / 10}%`;
  if (side.oneToken) return `${side.sector} · ${side.topSymbol} on ${side.topChain} is ${share}. One token.`;
  return `${side.sector} · ${side.topSymbol} on ${side.topChain} is ${share}.`;
}
