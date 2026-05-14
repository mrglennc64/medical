"use client";

import { useState } from "react";
import type { SampleNote, SuggestedCode } from "@/lib/sampleNotes";

export type Decision = "pending" | "accept" | "reject" | "edit";

type DecisionRecord = { decision: Decision; edited?: string; notes?: string };

export function SuggestedCodesPanel({
  note,
  decisions,
  onChange,
  onHover,
  submitted,
}: {
  note: SampleNote;
  decisions: Record<string, DecisionRecord>;
  onChange: (codeId: string, patch: Partial<DecisionRecord>) => void;
  onHover: (codeId: string | null) => void;
  submitted: boolean;
}) {
  return (
    <section
      aria-label="Suggested codes"
      className="rounded-lg border border-border bg-bg p-4 lg:p-5 flex flex-col"
    >
      <header className="mb-3 flex items-baseline justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text">Suggested codes</h2>
          <p className="text-xs text-text-subtle">
            {note.suggested.length} candidates · review each
          </p>
        </div>
        <span className="text-xs text-text-subtle">accept · reject · edit</span>
      </header>

      <ul className="flex-1 overflow-auto max-h-[60vh] divide-y divide-border">
        {note.suggested.map((code) => (
          <CodeRow
            key={code.id}
            code={code}
            record={decisions[code.id]}
            onChange={(patch) => onChange(code.id, patch)}
            onHover={onHover}
            disabled={submitted}
          />
        ))}
      </ul>
    </section>
  );
}

function CodeRow({
  code,
  record,
  onChange,
  onHover,
  disabled,
}: {
  code: SuggestedCode;
  record: DecisionRecord | undefined;
  onChange: (patch: Partial<DecisionRecord>) => void;
  onHover: (codeId: string | null) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const decision: Decision = record?.decision ?? "pending";

  return (
    <li
      className="py-3 group"
      onMouseEnter={() => onHover(code.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex items-start gap-3">
        <SystemBadge system={code.system} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm font-semibold text-text">{code.code}</span>
            <ConfidenceDot value={code.confidence} />
          </div>
          <p className="text-sm text-text mt-0.5">{code.description}</p>
          <p className="text-xs text-text-muted mt-1">{code.reasoning}</p>
          {code.flags && code.flags.length > 0 && (
            <ul className="mt-2 space-y-1">
              {code.flags.map((f, i) => (
                <li
                  key={i}
                  className="text-xs rounded border border-border bg-bg-soft px-2 py-1 text-text-muted"
                >
                  <span className="uppercase font-mono text-[10px] text-warn mr-1.5">
                    {f.kind}
                  </span>
                  {f.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <DecisionButton
          label="Accept"
          active={decision === "accept"}
          tone="ok"
          onClick={() => onChange({ decision: "accept", edited: undefined })}
          disabled={disabled}
        />
        <DecisionButton
          label="Reject"
          active={decision === "reject"}
          tone="bad"
          onClick={() => onChange({ decision: "reject", edited: undefined })}
          disabled={disabled}
        />
        <DecisionButton
          label="Edit"
          active={decision === "edit"}
          tone="warn"
          onClick={() => {
            onChange({ decision: "edit", edited: record?.edited ?? code.code });
            setOpen(true);
          }}
          disabled={disabled}
        />
        {decision === "edit" && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="text-xs text-text-subtle hover:text-text ml-1"
          >
            {open ? "hide" : "show"} edit
          </button>
        )}
      </div>

      {decision === "edit" && open && (
        <div className="mt-2 space-y-2 rounded-md border border-border bg-bg-soft p-2">
          <label className="block">
            <span className="text-xs text-text-subtle">Replacement code</span>
            <input
              type="text"
              value={record?.edited ?? ""}
              onChange={(e) => onChange({ edited: e.target.value })}
              disabled={disabled}
              className="mt-0.5 w-full rounded border border-border bg-bg px-2 py-1 font-mono text-sm"
              placeholder="e.g. 99214"
            />
          </label>
          <label className="block">
            <span className="text-xs text-text-subtle">Note for auditor</span>
            <textarea
              value={record?.notes ?? ""}
              onChange={(e) => onChange({ notes: e.target.value })}
              disabled={disabled}
              rows={2}
              className="mt-0.5 w-full rounded border border-border bg-bg px-2 py-1 text-sm"
              placeholder="Why this change?"
            />
          </label>
        </div>
      )}
    </li>
  );
}

function SystemBadge({ system }: { system: SuggestedCode["system"] }) {
  const tone =
    system === "CPT" ? "bg-brand-soft text-brand-hover" :
    system === "ICD-10-CM" ? "bg-blue-100 text-blue-900" :
    "bg-purple-100 text-purple-900";
  return (
    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold ${tone}`}>
      {system}
    </span>
  );
}

function ConfidenceDot({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tone =
    value >= 0.85 ? "bg-ok" : value >= 0.6 ? "bg-warn" : "bg-bad";
  return (
    <span className="inline-flex items-center gap-1 text-xs text-text-subtle">
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${tone}`} />
      {pct}%
    </span>
  );
}

function DecisionButton({
  label,
  active,
  tone,
  onClick,
  disabled,
}: {
  label: string;
  active: boolean;
  tone: "ok" | "bad" | "warn";
  onClick: () => void;
  disabled: boolean;
}) {
  const activeBg =
    tone === "ok" ? "bg-ok text-white border-ok" :
    tone === "bad" ? "bg-bad text-white border-bad" :
    "bg-warn text-white border-warn";
  const idle =
    "border-border bg-bg text-text-muted hover:border-border-strong hover:text-text";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "rounded-md border px-2.5 py-1 text-xs font-medium transition " +
        (active ? activeBg : idle) +
        (disabled ? " opacity-60 cursor-not-allowed" : "")
      }
    >
      {label}
    </button>
  );
}
