import type { ReactNode } from "react";

/** Screen header: an active "tab"-style title on the left, actions on the right. */
export function PageTitle({
  title,
  right,
}: {
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 className="border-b-[2.5px] border-purple pb-2 text-[15px] font-semibold text-purple">
        {title}
      </h1>
      {right}
    </div>
  );
}
