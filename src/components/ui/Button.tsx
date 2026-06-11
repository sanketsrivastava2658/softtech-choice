import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const VARIANT: Record<Variant, string> = {
  primary: "bg-amber text-amber-ink font-semibold hover:bg-amber-deep",
  secondary:
    "bg-elevated text-text border border-line hover:border-line-strong",
  ghost: "bg-transparent text-muted hover:text-text hover:bg-hover",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

/** App button. Amber primary carries the action; the rest stay quiet (DESIGN.md). */
export function Button({
  variant = "secondary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`cursor-pointer rounded-input border border-transparent px-[15px] py-[8px] font-sans text-[13px] font-medium transition-colors ${VARIANT[variant]} ${className}`}
      {...props}
    />
  );
}
