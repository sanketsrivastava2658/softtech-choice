import type { ReactNode } from "react";
import { Icon } from "./Icon";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-card border border-line bg-surface ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  subtitle,
  info,
  right,
}: {
  title: string;
  subtitle?: ReactNode;
  info?: boolean;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div>
        <h2 className="flex items-center gap-1.5 text-[15px] font-bold text-ink">
          {title}
          {info && (
            <span className="text-ghost">
              <Icon name="info" size={15} />
            </span>
          )}
        </h2>
        {subtitle && (
          <div className="mt-1 text-[13px] text-muted">{subtitle}</div>
        )}
      </div>
      {right}
    </div>
  );
}
