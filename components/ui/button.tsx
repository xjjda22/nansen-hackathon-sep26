import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#8e1d1d] text-[#f3e6c8] hover:bg-[#6f1616]",
        line: "border border-[#1c140e] bg-transparent text-[#1c140e] hover:bg-[#1c140e] hover:text-[#f3e6c8]",
        ghost: "bg-transparent text-ink underline-offset-4 hover:underline",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Button({
  className,
  variant,
  asChild = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant }), className)} {...props} />;
}
