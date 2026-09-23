import { cn } from "@/lib/cn";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-sm border border-[#c4a15a] bg-white px-3 py-2 text-base text-ink outline-none placeholder:text-[#8a735c] focus:border-rust",
        className,
      )}
      {...props}
    />
  );
}
