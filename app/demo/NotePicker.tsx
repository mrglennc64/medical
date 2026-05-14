"use client";

import type { SampleNote } from "@/lib/sampleNotes";

export function NotePicker({
  notes,
  activeId,
  onPick,
}: {
  notes: SampleNote[];
  activeId: string;
  onPick: (id: string) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-bg p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-text-subtle mb-2">
        Sample notes
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {notes.map((n) => {
          const active = n.id === activeId;
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
      </div>
    </div>
  );
}
