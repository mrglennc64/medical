"use client";

import { useMemo, useState } from "react";
import type { SampleNote, SuggestedCode } from "@/lib/sampleNotes";
import { NotePicker } from "./NotePicker";
import { NoteViewer } from "./NoteViewer";
import { SuggestedCodesPanel, type Decision } from "./SuggestedCodesPanel";
import { DecisionTally } from "./DecisionTally";

type DecisionState = Record<string, { decision: Decision; edited?: string; notes?: string }>;

export function DemoApp({ notes }: { notes: SampleNote[] }) {
  const [activeId, setActiveId] = useState(notes[0].id);
  const [decisions, setDecisions] = useState<Record<string, DecisionState>>({});
  const [hoveredCodeId, setHoveredCodeId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});

  const active = useMemo(
    () => notes.find((n) => n.id === activeId) ?? notes[0],
    [notes, activeId],
  );

  const noteDecisions = decisions[active.id] ?? {};
  const isSubmitted = submitted[active.id] ?? false;

  const hoveredCode: SuggestedCode | null = hoveredCodeId
    ? active.suggested.find((c) => c.id === hoveredCodeId) ?? null
    : null;

  function setDecision(codeId: string, patch: Partial<DecisionState[string]>) {
    setDecisions((prev) => {
      const noteState = { ...(prev[active.id] ?? {}) };
      const current: DecisionState[string] =
        noteState[codeId] ?? { decision: "pending" };
      noteState[codeId] = { ...current, ...patch };
      return { ...prev, [active.id]: noteState };
    });
  }

  function pickNote(id: string) {
    setActiveId(id);
    setHoveredCodeId(null);
  }

  function resetActive() {
    setDecisions((prev) => ({ ...prev, [active.id]: {} }));
    setSubmitted((prev) => ({ ...prev, [active.id]: false }));
  }

  function submit() {
    setSubmitted((prev) => ({ ...prev, [active.id]: true }));
  }

  return (
    <div className="space-y-6">
      <NotePicker notes={notes} activeId={active.id} onPick={pickNote} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NoteViewer note={active} highlightCode={hoveredCode} />
        <SuggestedCodesPanel
          note={active}
          decisions={noteDecisions}
          onChange={setDecision}
          onHover={setHoveredCodeId}
          submitted={isSubmitted}
        />
      </div>

      <DecisionTally
        note={active}
        decisions={noteDecisions}
        submitted={isSubmitted}
        onSubmit={submit}
        onReset={resetActive}
      />
    </div>
  );
}
