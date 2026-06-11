import type { Reply, ReplyIntent } from "@/lib/types";

const INTENT: Record<ReplyIntent, { label: string; className: string }> = {
  meeting: {
    label: "↳ meeting",
    className: "text-amber border-amber bg-amber-dim",
  },
  interested: { label: "interested", className: "text-mint border-mint-line" },
  later: { label: "later", className: "text-orange border-orange-line" },
  "not-interested": {
    label: "not now",
    className: "text-faint border-line",
  },
};

function ReplyRow({ reply }: { reply: Reply }) {
  const intent = INTENT[reply.intent];
  return (
    <div className="border-b border-line py-[11px] last:border-b-0">
      <div className="mb-[5px] flex items-center gap-[7px]">
        <span className="grid h-5 w-5 place-items-center rounded-chip border border-line bg-elevated font-mono text-[10px] text-muted">
          {reply.initials}
        </span>
        <b className="text-[12.5px] font-medium">{reply.name}</b>
        <span className="ml-auto font-mono text-[10px] text-faint">
          {reply.timeAgo}
        </span>
      </div>
      <p className="pl-[27px] text-[12px] leading-[1.45] text-muted">
        &ldquo;{reply.snippet}&rdquo;
      </p>
      <span
        className={`ml-[27px] mt-[6px] inline-block rounded-[4px] border px-[6px] py-px font-mono text-[10px] uppercase tracking-[0.05em] ${intent.className}`}
      >
        {intent.label}
      </span>
    </div>
  );
}

/** Right-rail live feed of positive replies (DESIGN.md right context panel). */
export function RepliesPanel({ replies }: { replies: Reply[] }) {
  const today = replies.length;
  return (
    <div>
      <div className="mb-[14px] flex items-center justify-between">
        <h4 className="text-[12.5px] font-semibold">Positive replies</h4>
        <span className="rounded-full bg-amber-dim px-[7px] py-[2px] font-mono text-[11px] text-amber">
          +{today} today
        </span>
      </div>
      {replies.map((r) => (
        <ReplyRow key={r.id} reply={r} />
      ))}
    </div>
  );
}
