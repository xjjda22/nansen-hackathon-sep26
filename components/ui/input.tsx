import { cn } from "@/lib/cn";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-11 w-full border border-[#1c140e] bg-[#f7edd6] px-3 py-2 text-base text-ink outline-none placeholder:text-[#6b5344] focus:border-[#8e1d1d]",
        className,
      )}
      {...props}
    />
  );
}
