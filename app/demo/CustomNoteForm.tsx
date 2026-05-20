"use client";

import { useRef, useState } from "react";
import type { SuggestedCode } from "@/lib/sampleNotes";

export type CodeApiMeta = {
  model: string;
  provider: string;
  latencyMs: number;
  codesProposedByModel: number;
  codesDroppedForUngroundedEvidence: { code: string; reason: string }[];
  knownToPtpTable: string[];
};

type CodeApiResponse = { suggested: SuggestedCode[]; meta: CodeApiMeta };

export function CustomNoteForm({
  initialNote = "",
  onCoded,
  onCancel,
}: {
  initialNote?: string;
  onCoded: (args: { note: string; suggested: SuggestedCode[]; meta: CodeApiMeta }) => void;
  onCancel: () => void;
}) {
  const [note, setNote] = useState(initialNote);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.size > 200 * 1024) {
      setError("File too large — limit is 200 KB. Paste shorter excerpts.");
      return;
    }
    if (!/\.(txt|md)$/i.test(file.name) && file.type !== "text/plain") {
      setError("Only plain-text files (.txt, .md) for v1. Paste-text works for anything.");
      return;
    }
    const text = await file.text();
    setNote(text);
    setError(null);
  }

  async function submit() {
    setError(null);
    if (note.trim().length < 20) {
      setError("Note is too short. Paste at least a chief complaint + a couple lines.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? `Request failed (${res.status})`);
        return;
      }
      onCoded({ note, suggested: data.suggested, meta: data.meta });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-bg p-4 lg:p-6">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-text">Code your own note</h2>
        <p className="mt-1 text-sm text-text-muted">
          Paste a clinical note (or upload a <code>.txt</code> file) and the model
          will propose codes. Use synthetic / public data only — this calls the
          public Gemini API and is <strong>not</strong> a HIPAA-eligible path. The
          architecture page describes the production BAA route.
        </p>
      </header>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={submitting}
            className="rounded-md border border-border bg-bg-soft px-3 py-1.5 text-sm text-text hover:border-border-strong"
          >
            Upload .txt
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,text/plain"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() =>
              setNote(
                "CHIEF COMPLAINT: Sore throat x 3 days.\n\nHPI: 28-year-old established patient with 3-day history of sore throat, fever to 101, and tender anterior cervical lymphadenopathy. No cough. No rhinorrhea.\n\nEXAM: T 100.8F. Pharynx erythematous with white tonsillar exudates. Anterior cervical nodes 1.5 cm, tender bilaterally.\n\nASSESSMENT/PLAN:\n1. Acute streptococcal pharyngitis (rapid strep positive in office). Amoxicillin 500 mg BID x 10 days.\n\nTime: 17 minutes total. MDM low-moderate.",
              )
            }
            disabled={submitting}
            className="text-xs text-text-subtle hover:text-text underline"
          >
            Use a 1-paragraph example
          </button>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={submitting}
          rows={14}
          placeholder="CHIEF COMPLAINT: ...&#10;HPI: ...&#10;EXAM: ...&#10;ASSESSMENT/PLAN: ...&#10;Time: ..."
          className="w-full rounded-md border border-border bg-bg p-3 font-mono text-sm leading-6 text-text"
        />

        <div className="flex items-center justify-between text-xs text-text-subtle">
          <span>{note.length.toLocaleString()} chars</span>
          <span>powered by Gemini 2.0 Flash · production routes via Vertex AI under BAA</span>
        </div>

        {error && (
          <div className="rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-md border border-border bg-bg px-3 py-1.5 text-sm text-text-muted hover:text-text hover:border-border-strong"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || note.trim().length < 20}
            className={
              "rounded-md px-4 py-1.5 text-sm font-medium transition " +
              (submitting || note.trim().length < 20
                ? "bg-bg-soft text-text-subtle cursor-not-allowed"
                : "bg-brand text-white hover:bg-brand-hover")
            }
          >
            {submitting ? "Coding…" : "Code this note →"}
          </button>
        </div>
      </div>
    </section>
  );
}
