"use client";

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

export function RoundMark({ hit, you, api }: { hit: boolean; you: string; api: string }) {
  return (
    <p className="round-line">
      <span className="stamp">{hit ? "RIGHT" : "WRONG"}</span>
      <span>
        You {you}. API {api}.
      </span>
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
