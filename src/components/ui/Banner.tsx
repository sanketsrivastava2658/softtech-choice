"use client";

import { useState } from "react";
import { Icon } from "./Icon";

/** Dismissible success banner — matches the green "All data loaded" strip. */
export function Banner({ message }: { message: string }) {
  const [show, setShow] = useState(true);
  if (!show) return null;
  return (
    <div
      className="mb-5 flex items-center gap-3 rounded-card border-l-4 px-4 py-3 text-[14px] text-strong"
      style={{ background: "var(--success-bg)", borderColor: "var(--success-bar)" }}
    >
      <span
        className="grid h-[22px] w-[22px] flex-none place-items-center rounded-full"
        style={{ background: "var(--success-bar)" }}
      >
        <Icon name="check" size={13} className="text-white" strokeWidth={3} />
      </span>
      {message}
      <button
        onClick={() => setShow(false)}
        className="ml-auto text-faint hover:text-strong"
        aria-label="Dismiss"
      >
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}
