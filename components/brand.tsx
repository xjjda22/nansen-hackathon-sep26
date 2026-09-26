export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="6" y="22" width="22" height="32" fill="currentColor" />
      <rect x="36" y="8" width="22" height="46" fill="currentColor" />
    </svg>
  );
}
