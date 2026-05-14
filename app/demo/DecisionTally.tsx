"use client";

import type { SampleNote } from "@/lib/sampleNotes";
import type { Decision } from "./SuggestedCodesPanel";

type DecisionRecord = { decision: Decision; edited?: string; notes?: string };

export function DecisionTally({
  note,
  decisions,
  submitted,
  onSubmit,
  onReset,
}: {
  note: SampleNote;
  decisions: Record<string, DecisionRecord>;
  submitted: boolean;
  onSubmit: () => void;
  onReset: () => void;
}) {
  const total = note.suggested.length;
  let accepted = 0,
    rejected = 0,
    edited = 0,
    pending = 0;
  for (const code of note.suggested) {
    const d = decisions[code.id]?.decision ?? "pending";
    if (d === "accept") accepted++;
    else if (d === "reject") rejected++;
    else if (d === "edit") edited++;
    else pending++;
  }
  const allDecided = pending === 0;

  return (
    <section className="rounded-lg border border-border bg-bg p-4 lg:p-5">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:items-center lg:justify-between">
        <dl className="grid grid-cols-4 gap-3 text-center">
          <Stat label="Accepted" value={accepted} total={total} tone="ok" />
          <Stat label="Edited" value={edited} total={total} tone="warn" />
          <Stat label="Rejected" value={rejected} total={total} tone="bad" />
          <Stat label="Pending" value={pending} total={total} tone="muted" />
        </dl>
        <div className="flex items-center gap-2">
          {submitted ? (
            <>
              <span
                className="inline-flex items-center gap-1.5 rounded-md bg-ok/10 px-3 py-1.5 text-sm font-medium text-ok"
                role="status"
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-ok" />
                Sent to EHR · NCCI verified
              </span>
              <button
                type="button"
                onClick={onReset}
                className="rounded-md border border-border bg-bg px-3 py-1.5 text-sm text-text-muted hover:text-text hover:border-border-strong"
              >
                Reset
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onReset}
                className="rounded-md border border-border bg-bg px-3 py-1.5 text-sm text-text-muted hover:text-text hover:border-border-strong"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={!allDecided}
                className={
                  "rounded-md px-3 py-1.5 text-sm font-medium transition " +
                  (allDecided
                    ? "bg-brand text-white hover:bg-brand-hover"
                    : "bg-bg-soft text-text-subtle cursor-not-allowed")
                }
              >
                {allDecided ? "Send to EHR" : `Decide ${pending} more`}
              </button>
            </>
          )}
        </div>
      </div>
      {submitted && (
        <p className="mt-3 text-xs text-text-subtle">
          In production, this is the moment a tallied <code>WorksheetRow[]</code>{" "}
          payload would <code>POST</code> to <code>/api/encounters/{"{id}"}/codes</code>,
          trigger an audit-log write, and update the encounter status in the EHR via
          FHIR or HL7v2.
        </p>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: "ok" | "bad" | "warn" | "muted";
}) {
  const color =
    tone === "ok" ? "text-ok" :
    tone === "bad" ? "text-bad" :
    tone === "warn" ? "text-warn" :
    "text-text-subtle";
  return (
    <div className="rounded-md border border-border bg-bg-soft px-2 py-2">
      <dt className="text-[10px] uppercase tracking-wide text-text-subtle">{label}</dt>
      <dd className={`mt-0.5 text-base font-semibold ${color}`}>
        {value}
        <span className="text-text-subtle font-normal text-xs">/{total}</span>
      </dd>
    </div>
  );
}
