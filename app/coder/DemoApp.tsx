"use client";

import { useMemo, useState } from "react";
import type { SampleNote, SuggestedCode } from "@/lib/sampleNotes";
import { NotePicker } from "./NotePicker";
import { NoteViewer } from "./NoteViewer";
import { SuggestedCodesPanel, type Decision } from "./SuggestedCodesPanel";
import { DecisionTally } from "./DecisionTally";
import { CustomNoteForm, type CodeApiMeta } from "./CustomNoteForm";

type DecisionState = Record<string, { decision: Decision; edited?: string; notes?: string }>;

const CUSTOM_ID = "__custom__";

export function DemoApp({
  notes,
  initialId,
}: {
  notes: SampleNote[];
  initialId?: string;
}) {
  const [activeId, setActiveId] = useState<string>(initialId ?? notes[0].id);
  const [decisions, setDecisions] = useState<Record<string, DecisionState>>({});
  const [hoveredCodeId, setHoveredCodeId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [customNote, setCustomNote] = useState<SampleNote | null>(null);
  const [customMeta, setCustomMeta] = useState<CodeApiMeta | null>(null);
  const [composing, setComposing] = useState(false);

  const allNotes = useMemo(
    () => (customNote ? [customNote, ...notes] : notes),
    [customNote, notes],
  );

  const active = useMemo(
    () => allNotes.find((n) => n.id === activeId) ?? allNotes[0],
    [allNotes, activeId],
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
    if (id === CUSTOM_ID) {
      setComposing(true);
      return;
    }
    setActiveId(id);
    setHoveredCodeId(null);
    setComposing(false);
  }

  function resetActive() {
    setDecisions((prev) => ({ ...prev, [active.id]: {} }));
    setSubmitted((prev) => ({ ...prev, [active.id]: false }));
  }

  function submit() {
    setSubmitted((prev) => ({ ...prev, [active.id]: true }));
  }

  function handleCoded({
    note,
    suggested,
    meta,
  }: {
    note: string;
    suggested: SuggestedCode[];
    meta: CodeApiMeta;
  }) {
    const customSampleNote: SampleNote = {
      id: CUSTOM_ID,
      chart_id: "CHT-CUSTOM",
      patient_label: "Custom note",
      age: 0,
      sex: "F",
      visit_type: "established",
      chief_complaint: note.split("\n")[0]?.slice(0, 80) ?? "Custom note",
      title: "Your note · coded by Gemini",
      setting: "User-supplied",
      source: `Gemini ${meta.model}`,
      status: "in_review",
      received_at: "just now",
      note,
      suggested,
    };
    setCustomNote(customSampleNote);
    setCustomMeta(meta);
    setActiveId(CUSTOM_ID);
    setComposing(false);
    setDecisions((prev) => ({ ...prev, [CUSTOM_ID]: {} }));
    setSubmitted((prev) => ({ ...prev, [CUSTOM_ID]: false }));
  }

  return (
    <div className="space-y-6">
      <NotePicker
        notes={allNotes}
        activeId={composing ? CUSTOM_ID : active.id}
        composing={composing}
        hasCustom={!!customNote}
        onPick={pickNote}
      />

      {composing ? (
        <CustomNoteForm
          initialNote={customNote?.note ?? ""}
          onCoded={handleCoded}
          onCancel={() => setComposing(false)}
        />
      ) : (
        <>
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

          {active.id === CUSTOM_ID && customMeta && (
            <CustomMetaBanner meta={customMeta} onRecode={() => setComposing(true)} />
          )}

          <DecisionTally
            note={active}
            decisions={noteDecisions}
            submitted={isSubmitted}
            onSubmit={submit}
            onReset={resetActive}
          />
        </>
      )}
    </div>
  );
}

function CustomMetaBanner({
  meta,
  onRecode,
}: {
  meta: CodeApiMeta;
  onRecode: () => void;
}) {
  const dropped = meta.codesDroppedForUngroundedEvidence.length;
  return (
    <div className="rounded-md border border-border bg-bg-soft px-4 py-3 text-xs text-text-muted flex flex-wrap items-center gap-x-4 gap-y-1">
      <span>
        <span className="text-text font-medium">{meta.model}</span> via{" "}
        <span className="font-mono">{meta.provider}</span>
      </span>
      <span aria-hidden>·</span>
      <span>{meta.latencyMs.toLocaleString()} ms</span>
      <span aria-hidden>·</span>
      <span>{meta.codesProposedByModel} proposed</span>
      {dropped > 0 && (
        <>
          <span aria-hidden>·</span>
          <span className="text-warn">
            {dropped} dropped (no verbatim quote in note)
          </span>
        </>
      )}
      <button
        type="button"
        onClick={onRecode}
        className="ml-auto rounded border border-border bg-bg px-2 py-0.5 text-xs text-text-muted hover:text-text hover:border-border-strong"
      >
        Edit &amp; recode
      </button>
    </div>
  );
}
