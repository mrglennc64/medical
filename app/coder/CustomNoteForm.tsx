"use client";

import { useMemo, useRef, useState } from "react";
import type { SuggestedCode } from "@/lib/sampleNotes";
import {
  deidentify,
  detectPhi,
  summarizeFindings,
  type PhiFinding,
} from "@/lib/deidentify";

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
  const [extracting, setExtracting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phiBlocked, setPhiBlocked] = useState<PhiFinding[] | null>(null);
  const [extractedFrom, setExtractedFrom] = useState<{
    filename: string;
    kind: string;
    pages?: number;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const livePhi = useMemo(() => detectPhi(note), [note]);

  async function handleFile(file: File) {
    setError(null);
    if (file.size > 2 * 1024 * 1024) {
      setError("File too large — limit is 2 MB.");
      return;
    }
    const ext = file.name.toLowerCase();
    const isPlainText =
      file.type === "text/plain" || ext.endsWith(".txt") || ext.endsWith(".md");

    if (isPlainText) {
      const text = await file.text();
      setNote(text);
      setExtractedFrom(null);
      return;
    }

    const isPdfOrDocx = ext.endsWith(".pdf") || ext.endsWith(".docx");
    if (!isPdfOrDocx) {
      setError("Supported file types: .txt, .md, .pdf, .docx");
      return;
    }

    setExtracting(file.name);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? `Extraction failed (${res.status})`);
        return;
      }
      setNote(data.text);
      setExtractedFrom({
        filename: data.filename,
        kind: data.kind,
        pages: data.pages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setExtracting(null);
    }
  }

  async function submit() {
    setError(null);
    setPhiBlocked(null);
    if (note.trim().length < 20) {
      setError("Note is too short. Paste at least a chief complaint + a couple lines.");
      return;
    }
    const findings = detectPhi(note);
    if (findings.length > 0) {
      setPhiBlocked(findings);
      return;
    }
    await sendNote(note);
  }

  async function sendNote(payload: string) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? `Request failed (${res.status})`);
        return;
      }
      onCoded({ note: payload, suggested: data.suggested, meta: data.meta });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  function redactAndContinue() {
    const { text } = deidentify(note);
    setNote(text);
    setPhiBlocked(null);
    void sendNote(text);
  }

  return (
    <section className="rounded-lg border border-border bg-bg p-4 lg:p-6">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-text">Code your own note</h2>
        <p className="mt-1 text-sm text-text-muted">
          Paste a clinical note, or upload <code>.txt</code>, <code>.md</code>,{" "}
          <code>.pdf</code>, or <code>.docx</code> — the server extracts plain
          text and the model proposes codes. Use synthetic / public data only —
          this calls the public Gemini API and is <strong>not</strong> a
          HIPAA-eligible path. A Safe Harbor PHI detector runs on your input and
          will block submission if it spots SSNs, MRNs, dated identifiers,
          addresses, or other §164.514(b)(2) categories. Real-PHI evaluation
          happens in a separate BAA-covered environment — see the{" "}
          <a href="/architecture" className="text-brand hover:underline">
            architecture page
          </a>
          .
        </p>
      </header>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={submitting || extracting !== null}
            className="rounded-md border border-border bg-bg-soft px-3 py-1.5 text-sm text-text hover:border-border-strong disabled:opacity-50"
          >
            {extracting ? `Extracting ${extracting}…` : "Upload .txt / .pdf / .docx"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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

        {extractedFrom && (
          <div className="flex items-center gap-2 rounded-md border border-border bg-bg-soft px-3 py-1.5 text-xs text-text-muted">
            <span className="font-mono uppercase text-[10px] text-brand">
              {extractedFrom.kind}
            </span>
            <span>
              Extracted from <span className="font-mono">{extractedFrom.filename}</span>
              {extractedFrom.pages != null && (
                <> · {extractedFrom.pages} page{extractedFrom.pages === 1 ? "" : "s"}</>
              )}
              {" "}— review the text below before coding.
            </span>
            <button
              type="button"
              onClick={() => {
                setNote("");
                setExtractedFrom(null);
              }}
              className="ml-auto text-text-subtle hover:text-text"
            >
              clear
            </button>
          </div>
        )}

        <textarea
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            if (extractedFrom) setExtractedFrom(null);
          }}
          disabled={submitting || extracting !== null}
          rows={14}
          placeholder="CHIEF COMPLAINT: ...&#10;HPI: ...&#10;EXAM: ...&#10;ASSESSMENT/PLAN: ...&#10;Time: ..."
          className="w-full rounded-md border border-border bg-bg p-3 font-mono text-sm leading-6 text-text"
        />

        <div className="flex items-center justify-between text-xs text-text-subtle">
          <span>
            {note.length.toLocaleString()} chars
            {livePhi.length > 0 && (
              <span className="ml-2 text-warn">
                · {livePhi.length} possible PHI match{livePhi.length === 1 ? "" : "es"} detected
              </span>
            )}
          </span>
          <span>powered by Gemini 2.0 Flash · production routes via Vertex AI under BAA</span>
        </div>

        {error && (
          <div className="rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">
            {error}
          </div>
        )}

        {phiBlocked && phiBlocked.length > 0 && (
          <div className="rounded-md border border-warn/40 bg-warn/5 p-3 text-sm">
            <p className="font-semibold text-text">
              Submission blocked — possible PHI detected
            </p>
            <p className="mt-1 text-text-muted">
              The Safe Harbor detector flagged {phiBlocked.length} identifier
              {phiBlocked.length === 1 ? "" : "s"} that look like real PHI. This
              demo runs against the public Gemini API, which is{" "}
              <strong>not</strong> covered by a BAA. Edit the note to remove
              them, or auto-redact and continue with the placeholders.
            </p>
            <ul className="mt-2 space-y-1 text-xs text-text-muted">
              {summarizeFindings(phiBlocked).map((f) => (
                <li key={f.category}>
                  <span className="font-medium text-text">{f.label}</span> ·{" "}
                  {f.count} match{f.count === 1 ? "" : "es"} ·{" "}
                  <span className="font-mono">{f.examples.join(", ")}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPhiBlocked(null)}
                className="rounded-md border border-border bg-bg px-3 py-1 text-xs text-text-muted hover:text-text hover:border-border-strong"
              >
                I&apos;ll edit it
              </button>
              <button
                type="button"
                onClick={redactAndContinue}
                disabled={submitting}
                className="rounded-md border border-warn/40 bg-warn/10 px-3 py-1 text-xs text-text hover:bg-warn/20"
              >
                Auto-redact and continue
              </button>
            </div>
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
