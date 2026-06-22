"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

/** Read-only access link with a copy button. */
export function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  if (!link) return null;
  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        readOnly
        value={link}
        onFocus={(e) => e.currentTarget.select()}
        className="num min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3 py-2 text-[12px] text-strong outline-none"
      />
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* clipboard blocked — user can still select the field */
          }
        }}
        className="flex flex-none items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[12.5px] font-semibold text-strong hover:bg-hover"
      >
        <Icon name={copied ? "check" : "external"} size={14} className={copied ? "text-green" : "text-faint"} />
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
