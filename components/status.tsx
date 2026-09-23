export function Status({
  kind,
  children,
}: {
  kind: "empty" | "error" | "loading";
  children: React.ReactNode;
}) {
  const tone =
    kind === "error"
      ? "border-rust bg-[#f8e4d8] text-rust"
      : kind === "loading"
        ? "border-gold bg-[#f8f1e2] text-ink"
        : "border-[#d7c4a3] bg-[#f8f1e2] text-[#5c4632]";
  return (
    <p className={`rounded-sm border px-3 py-3 text-sm leading-relaxed ${tone}`} role={kind === "error" ? "alert" : "status"}>
      {children}
    </p>
  );
}
