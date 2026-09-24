"use client";

import { markRound } from "@/components/score";

export function roundHit(bet: string, reveal: string, options: { id: string }[]): boolean | null {
  if (!options.some((option) => option.id === reveal)) return null;
  return bet === reveal;
}

export function recordRound(
  bet: string,
  reveal: string,
  options: { id: string }[],
  cached: boolean,
): boolean | null {
  const hit = roundHit(bet, reveal, options);
  if (hit !== null && !cached) markRound(hit);
  return hit;
}

export function StampPicker({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="bet-row" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className="bet"
          aria-pressed={value === option.id}
          disabled={disabled}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function RoundMark({ hit, you, api }: { hit: boolean | null; you: string; api: string }) {
  const stamp = hit === null ? "NO SCORE" : hit ? "RIGHT" : "WRONG";
  const line = hit === null ? `API ${api}. That stamp was not in the bet.` : `You ${you}. API ${api}.`;
  return (
    <p className="round-line">
      <span className="stamp">{stamp}</span>
      <span>{line}</span>
    </p>
  );
}

export function RawJson({ value }: { value: unknown }) {
  if (value == null) return null;
  return (
    <details className="raw">
      <summary>Response</summary>
      <pre>{JSON.stringify(value, null, 2)}</pre>
    </details>
  );
}

export function labelOf(options: { id: string; label: string }[], id: string): string {
  return options.find((option) => option.id === id)?.label ?? id;
}
