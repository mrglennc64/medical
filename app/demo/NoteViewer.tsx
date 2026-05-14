"use client";

import { useMemo } from "react";
import type { SampleNote, SuggestedCode } from "@/lib/sampleNotes";

type Span = { start: number; end: number };

function findSpans(text: string, quotes: string[]): Span[] {
  const spans: Span[] = [];
  for (const q of quotes) {
    if (!q) continue;
    const idx = text.indexOf(q);
    if (idx >= 0) spans.push({ start: idx, end: idx + q.length });
  }
  spans.sort((a, b) => a.start - b.start);
  // Merge overlaps.
  const merged: Span[] = [];
  for (const s of spans) {
    const last = merged[merged.length - 1];
    if (last && s.start <= last.end) last.end = Math.max(last.end, s.end);
    else merged.push({ ...s });
  }
  return merged;
}

export function NoteViewer({
  note,
  highlightCode,
}: {
  note: SampleNote;
  highlightCode: SuggestedCode | null;
}) {
  const spans = useMemo(() => {
    if (!highlightCode) return [];
    return findSpans(
      note.note,
      highlightCode.evidence.map((e) => e.quote),
    );
  }, [note, highlightCode]);

  const fragments = useMemo(() => {
    if (spans.length === 0) return [{ text: note.note, highlight: false }];
    const out: { text: string; highlight: boolean }[] = [];
    let cursor = 0;
    for (const s of spans) {
      if (s.start > cursor) out.push({ text: note.note.slice(cursor, s.start), highlight: false });
      out.push({ text: note.note.slice(s.start, s.end), highlight: true });
      cursor = s.end;
    }
    if (cursor < note.note.length) out.push({ text: note.note.slice(cursor), highlight: false });
    return out;
  }, [note, spans]);

  return (
    <section
      aria-label="Clinical note"
      className="rounded-lg border border-border bg-bg p-4 lg:p-5 flex flex-col"
    >
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-text">{note.title}</h2>
          <p className="text-xs text-text-subtle">{note.setting} · {note.source}</p>
        </div>
        {highlightCode ? (
          <span className="text-xs text-text-subtle">
            highlighting evidence for{" "}
            <span className="font-mono text-text">{highlightCode.code}</span>
          </span>
        ) : (
          <span className="text-xs text-text-subtle">hover a code to see evidence</span>
        )}
      </header>
      <pre className="whitespace-pre-wrap text-sm leading-6 text-text font-sans flex-1 overflow-auto max-h-[60vh]">
        {fragments.map((f, i) =>
          f.highlight ? (
            <mark key={i} className="evidence">
              {f.text}
            </mark>
          ) : (
            <span key={i}>{f.text}</span>
          ),
        )}
      </pre>
    </section>
  );
}
