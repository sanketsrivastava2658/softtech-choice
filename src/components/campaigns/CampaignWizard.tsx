"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  launchCampaign,
  type LaunchLead,
  type LaunchResult,
} from "@/app/(app)/campaigns/actions";
import { Icon } from "@/components/ui/Icon";

interface Sender {
  id: string;
  label: string;
  sub: string;
}

const STEPS = ["Details", "Sequence", "Schedule", "Senders", "Leads", "Review"];
const DAYS = [
  { n: 1, l: "Mon" },
  { n: 2, l: "Tue" },
  { n: 3, l: "Wed" },
  { n: 4, l: "Thu" },
  { n: 5, l: "Fri" },
  { n: 6, l: "Sat" },
  { n: 7, l: "Sun" },
];

function parseLeads(text: string): { leads: LaunchLead[]; invalid: number } {
  const leads: LaunchLead[] = [];
  let invalid = 0;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split(/[,\t]/).map((p) => p.trim());
    const email = parts.find((p) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p));
    if (!email) {
      invalid++;
      continue;
    }
    const rest = parts.filter((p) => p !== email);
    leads.push({
      email,
      firstName: rest[0] || undefined,
      lastName: rest[1] || undefined,
      companyName: rest[2] || undefined,
    });
  }
  return { leads, invalid };
}

const inputCls =
  "rounded-lg border border-line px-3 py-2 text-[13.5px] outline-none focus:border-purple";

export function CampaignWizard({ senders }: { senders: Sender[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<LaunchResult | null>(null);

  const [name, setName] = useState("");
  const [seq, setSeq] = useState([{ subject: "Quick question, {{company_name}}", body: "Hi {{first_name}},\n\n", delayDays: 0 }]);
  const [schedule, setSchedule] = useState({
    timezone: "America/New_York",
    daysOfWeek: [1, 2, 3, 4, 5],
    startHour: "09:00",
    endHour: "17:00",
    minTimeBtwEmails: 15,
    maxLeadsPerDay: 50,
  });
  const [senderIds, setSenderIds] = useState<string[]>([]);
  const [leadsText, setLeadsText] = useState("");
  const [launch, setLaunch] = useState(true);

  const parsed = useMemo(() => parseLeads(leadsText), [leadsText]);

  function next() {
    setResult(null);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }
  function prev() {
    setStep((s) => Math.max(0, s - 1));
  }

  const canProceed =
    (step === 0 && name.trim().length > 0) ||
    (step === 1 && seq.every((s) => s.subject.trim() && s.body.trim())) ||
    step === 2 ||
    (step === 3 && senderIds.length > 0) ||
    (step === 4 && parsed.leads.length > 0) ||
    step === 5;

  function submit() {
    start(async () => {
      const res = await launchCampaign({
        name,
        sequence: seq,
        schedule,
        senderIds,
        leads: parsed.leads,
        launch,
      });
      setResult(res);
      if (res.ok && !res.demo) setTimeout(() => router.push("/campaigns"), 1400);
    });
  }

  function toggleDay(n: number) {
    setSchedule((s) => ({
      ...s,
      daysOfWeek: s.daysOfWeek.includes(n)
        ? s.daysOfWeek.filter((d) => d !== n)
        : [...s.daysOfWeek, n].sort(),
    }));
  }
  function toggleSender(id: string) {
    setSenderIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  }

  return (
    <div className="rounded-card border border-line bg-surface">
      {/* stepper */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-line px-5 py-3">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 rounded-full px-3 py-1 text-[12.5px] font-semibold ${
                i === step
                  ? "bg-purple-soft text-purple"
                  : i < step
                  ? "text-green"
                  : "text-faint"
              }`}
            >
              <span
                className={`num grid h-5 w-5 place-items-center rounded-full text-[11px] ${
                  i === step ? "bg-purple text-white" : i < step ? "bg-green text-white" : "bg-canvas"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </span>
              {s}
            </button>
            {i < STEPS.length - 1 && <span className="text-ghost">›</span>}
          </div>
        ))}
      </div>

      <div className="p-6">
        {step === 0 && (
          <Section title="Campaign details">
            <label className="flex max-w-md flex-col gap-1.5 text-[12.5px] font-medium text-strong">
              Campaign name
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Q3 — SaaS Founders"
                className={inputCls}
              />
            </label>
          </Section>
        )}

        {step === 1 && (
          <Section title="Email sequence" hint="Use {{first_name}}, {{company_name}} etc. Step 1 sends immediately.">
            <div className="flex flex-col gap-4">
              {seq.map((s, i) => (
                <div key={i} className="rounded-card border border-line p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[12.5px] font-bold text-ink">Step {i + 1}</span>
                    <div className="flex items-center gap-3">
                      {i > 0 && (
                        <label className="flex items-center gap-1.5 text-[12px] text-muted">
                          Delay
                          <input
                            type="number"
                            min={1}
                            value={s.delayDays}
                            onChange={(e) =>
                              setSeq((arr) =>
                                arr.map((x, j) => (j === i ? { ...x, delayDays: Number(e.target.value) } : x))
                              )
                            }
                            className={`${inputCls} w-16 py-1`}
                          />
                          days
                        </label>
                      )}
                      {seq.length > 1 && (
                        <button
                          onClick={() => setSeq((arr) => arr.filter((_, j) => j !== i))}
                          className="text-faint hover:text-red"
                        >
                          <Icon name="x" size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    value={s.subject}
                    onChange={(e) =>
                      setSeq((arr) => arr.map((x, j) => (j === i ? { ...x, subject: e.target.value } : x)))
                    }
                    placeholder="Subject"
                    className={`${inputCls} mb-2 w-full`}
                  />
                  <textarea
                    value={s.body}
                    onChange={(e) =>
                      setSeq((arr) => arr.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))
                    }
                    rows={5}
                    placeholder="Email body…"
                    className={`${inputCls} w-full resize-y`}
                  />
                </div>
              ))}
              <button
                onClick={() => setSeq((arr) => [...arr, { subject: "", body: "", delayDays: 3 }])}
                className="self-start rounded-lg border border-line px-3 py-2 text-[13px] font-medium text-strong hover:bg-hover"
              >
                + Add follow-up step
              </button>
            </div>
          </Section>
        )}

        {step === 2 && (
          <Section title="Sending schedule">
            <div className="grid max-w-xl grid-cols-2 gap-4 max-[560px]:grid-cols-1">
              <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-strong">
                Timezone
                <input
                  value={schedule.timezone}
                  onChange={(e) => setSchedule((s) => ({ ...s, timezone: e.target.value }))}
                  className={inputCls}
                />
              </label>
              <div className="flex flex-col gap-1.5 text-[12.5px] font-medium text-strong">
                Sending days
                <div className="flex flex-wrap gap-1">
                  {DAYS.map((d) => (
                    <button
                      key={d.n}
                      onClick={() => toggleDay(d.n)}
                      className={`rounded-lg border px-2.5 py-1.5 text-[12px] font-medium ${
                        schedule.daysOfWeek.includes(d.n)
                          ? "border-purple-line bg-purple-soft text-purple"
                          : "border-line text-muted hover:bg-hover"
                      }`}
                    >
                      {d.l}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-strong">
                Start hour
                <input type="time" value={schedule.startHour} onChange={(e) => setSchedule((s) => ({ ...s, startHour: e.target.value }))} className={inputCls} />
              </label>
              <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-strong">
                End hour
                <input type="time" value={schedule.endHour} onChange={(e) => setSchedule((s) => ({ ...s, endHour: e.target.value }))} className={inputCls} />
              </label>
              <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-strong">
                Min minutes between emails
                <input type="number" min={1} value={schedule.minTimeBtwEmails} onChange={(e) => setSchedule((s) => ({ ...s, minTimeBtwEmails: Number(e.target.value) }))} className={inputCls} />
              </label>
              <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-strong">
                Max new leads / day
                <input type="number" min={1} value={schedule.maxLeadsPerDay} onChange={(e) => setSchedule((s) => ({ ...s, maxLeadsPerDay: Number(e.target.value) }))} className={inputCls} />
              </label>
            </div>
          </Section>
        )}

        {step === 3 && (
          <Section title="Sending mailboxes" hint="Pick which connected mailboxes send this campaign.">
            {senders.length === 0 ? (
              <p className="text-[13px] text-muted">
                No mailboxes available. An admin connects them under Admin → Mailboxes.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {senders.map((s) => (
                  <label
                    key={s.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 ${
                      senderIds.includes(s.id) ? "border-purple-line bg-purple-soft" : "border-line hover:bg-hover"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={senderIds.includes(s.id)}
                      onChange={() => toggleSender(s.id)}
                      className="accent-purple"
                    />
                    <span className="num text-[13px] font-medium text-ink">{s.label}</span>
                    <span className="ml-auto text-[12px] text-faint">{s.sub}</span>
                  </label>
                ))}
              </div>
            )}
          </Section>
        )}

        {step === 4 && (
          <Section title="Leads" hint="One per line: email, first name, last name, company">
            <textarea
              value={leadsText}
              onChange={(e) => setLeadsText(e.target.value)}
              rows={9}
              placeholder={"jane@acme.com, Jane, Doe, Acme\njohn@globex.com, John, Roe, Globex"}
              className={`${inputCls} w-full resize-y font-[var(--font-inter)]`}
            />
            <div className="mt-2 flex gap-4 text-[12.5px]">
              <span className="text-green">
                <b className="num">{parsed.leads.length}</b> valid
              </span>
              {parsed.invalid > 0 && (
                <span className="text-red">
                  <b className="num">{parsed.invalid}</b> skipped (no email)
                </span>
              )}
            </div>
          </Section>
        )}

        {step === 5 && (
          <Section title="Review & launch">
            <div className="grid max-w-xl grid-cols-2 gap-x-8 gap-y-2 text-[13px]">
              <Summary k="Campaign" v={name} />
              <Summary k="Steps" v={`${seq.length}`} />
              <Summary k="Leads" v={`${parsed.leads.length}`} />
              <Summary k="Mailboxes" v={`${senderIds.length}`} />
              <Summary k="Days" v={schedule.daysOfWeek.map((d) => DAYS[d - 1].l).join(" ")} />
              <Summary k="Window" v={`${schedule.startHour}–${schedule.endHour}`} />
            </div>

            <label className="mt-5 flex items-center gap-2.5 text-[13px] font-medium text-strong">
              <input type="checkbox" checked={launch} onChange={(e) => setLaunch(e.target.checked)} className="accent-purple" />
              Start sending immediately after creating
            </label>

            {result?.error && (
              <p className="mt-4 rounded-lg border border-red-line bg-red-soft px-3 py-2 text-[12.5px] text-red">
                {result.error}
              </p>
            )}
            {result?.ok && (
              <p className="mt-4 rounded-lg border border-green-line bg-green-soft px-3 py-2 text-[12.5px] text-green">
                {result.message}
              </p>
            )}
          </Section>
        )}
      </div>

      {/* footer nav */}
      <div className="flex items-center justify-between border-t border-line px-5 py-3">
        <button
          onClick={prev}
          disabled={step === 0}
          className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-strong hover:bg-hover disabled:opacity-40"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={next}
            disabled={!canProceed}
            className="rounded-lg bg-purple px-5 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={pending || (result?.ok && !result?.demo)}
            className="rounded-lg bg-purple px-5 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Launching…" : launch ? "Create & launch" : "Create draft"}
          </button>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-[15px] font-bold text-ink">{title}</h2>
      {hint && <p className="mb-4 mt-0.5 text-[12.5px] text-muted">{hint}</p>}
      {!hint && <div className="mb-4" />}
      {children}
    </div>
  );
}
function Summary({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-line py-1.5">
      <span className="text-muted">{k}</span>
      <span className="font-semibold text-ink">{v || "—"}</span>
    </div>
  );
}
