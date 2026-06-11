import type { InputHTMLAttributes } from "react";

/** Text input with an amber focus ring — no glow soup (DESIGN.md). */
export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-input border border-line bg-bg px-3 py-[9px] font-sans text-[13px] text-text outline-none transition-[border-color,box-shadow] placeholder:text-faint focus:border-amber focus:shadow-[0_0_0_3px_var(--amber-dim)] ${className}`}
      {...props}
    />
  );
}
