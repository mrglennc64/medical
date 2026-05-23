"use client";

import type { SampleNote } from "@/lib/sampleNotes";

const CUSTOM_ID = "__custom__";

export function NotePicker({
  notes,
  activeId,
  composing,
  hasCustom,
  onPick,
}: {
  notes: SampleNote[];
  activeId: string;
  composing: boolean;
  hasCustom: boolean;
  onPick: (id: string) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-bg p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-text-subtle mb-2">
        Pick a note
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {notes
          .filter((n) => n.id !== CUSTOM_ID)
          .map((n) => {
            const active = n.id === activeId && !composing;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => onPick(n.id)}
                className={
                  "text-left rounded-md border p-3 transition " +
                  (active
                    ? "border-brand bg-brand-soft/40"
                    : "border-border hover:border-border-strong bg-bg")
                }
              >
                <span className="block text-sm font-medium text-text">{n.title}</span>
                <span className="block text-xs text-text-subtle mt-0.5">{n.setting}</span>
              </button>
            );
          })}

        {hasCustom && (
          <button
            type="button"
            onClick={() => onPick(CUSTOM_ID)}
            className={
              "text-left rounded-md border p-3 transition " +
              (activeId === CUSTOM_ID && !composing
                ? "border-brand bg-brand-soft/40"
                : "border-border hover:border-border-strong bg-bg")
            }
          >
            <span className="block text-sm font-medium text-text">
              Your note · coded by Gemini
            </span>
            <span className="block text-xs text-text-subtle mt-0.5">just now</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onPick(CUSTOM_ID)}
          className={
            "text-left rounded-md border-2 border-dashed p-3 transition " +
            (composing
              ? "border-brand bg-brand-soft/40"
              : "border-border hover:border-brand text-text-muted hover:text-text")
          }
        >
          <span className="block text-sm font-medium">
            {hasCustom ? "+ Code another note" : "+ Code your own note"}
          </span>
          <span className="block text-xs text-text-subtle mt-0.5">
            paste or upload .txt · powered by Gemini
          </span>
        </button>
      </div>
    </div>
  );
}
