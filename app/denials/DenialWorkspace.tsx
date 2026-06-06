"use client";

import { useRef, useState } from "react";
import type { SampleDenial } from "@/lib/denial/sampleDenials";
import type {
  DenialAnalysis,
  DenialCorrection,
  AppealPacket,
} from "@/lib/denial/schemas";

type StepState<T> = { data: T | null; error: string | null; loading: boolean };
type Meta = { model: string; provider: string; latencyMs: number };

const EMPTY = { data: null, error: null, loading: false } as const;

export function DenialWorkspace({ samples }: { samples: SampleDenial[] }) {
  const first = samples[0];
  const [activeSampleId, setActiveSampleId] = useState(first.id);
  const [denialText, setDenialText] = useState(first.rawDenial);
  const [claimContext, setClaimContext] = useState(first.claimContext);

  const [analyze, setAnalyze] = useState<StepState<DenialAnalysis>>(EMPTY);
  const [analyzeMeta, setAnalyzeMeta] = useState<Meta | null>(null);
  const [correct, setCorrect] = useState<StepState<DenialCorrection>>(EMPTY);
  const [correctMeta, setCorrectMeta] = useState<Meta | null>(null);
  const [appeal, setAppeal] = useState<StepState<AppealPacket>>(EMPTY);
  const [appealMeta, setAppealMeta] = useState<Meta | null>(null);

  const abortAnalyze = useRef<AbortController | null>(null);
  const abortCorrect = useRef<AbortController | null>(null);
  const abortAppeal = useRef<AbortController | null>(null);

  function clearDownstream(from: "analyze" | "correct") {
    abortAppeal.current?.abort();
    setAppeal(EMPTY);
    setAppealMeta(null);
    if (from === "analyze") {
      abortCorrect.current?.abort();
      setCorrect(EMPTY);
      setCorrectMeta(null);
    }
  }

  function pickSample(id: string) {
    const s = samples.find((x) => x.id === id);
    if (!s) return;
    abortAnalyze.current?.abort();
    abortCorrect.current?.abort();
    abortAppeal.current?.abort();
    setActiveSampleId(id);
    setDenialText(s.rawDenial);
    setClaimContext(s.claimContext);
    setAnalyze(EMPTY);
    setAnalyzeMeta(null);
    setCorrect(EMPTY);
    setCorrectMeta(null);
    setAppeal(EMPTY);
    setAppealMeta(null);
  }

  async function runAnalyze() {
    abortAnalyze.current?.abort();
    const ctrl = new AbortController();
    abortAnalyze.current = ctrl;
    clearDownstream("analyze");
    setAnalyze({ data: null, error: null, loading: true });
    try {
      const r = await fetch("/api/denial/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ denialText }),
        signal: ctrl.signal,
      });
      const json = await r.json();
      if (!r.ok) {
        setAnalyze({
          data: null,
          error: json.error ?? `HTTP ${r.status}`,
          loading: false,
        });
        return;
      }
      setAnalyze({ data: json.analysis, error: null, loading: false });
      setAnalyzeMeta(json.meta);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setAnalyze({
        data: null,
        error: (e as Error).message,
        loading: false,
      });
    }
  }

  async function runCorrect() {
    if (!analyze.data) return;
    abortCorrect.current?.abort();
    const ctrl = new AbortController();
    abortCorrect.current = ctrl;
    clearDownstream("correct");
    setCorrect({ data: null, error: null, loading: true });
    try {
      const r = await fetch("/api/denial/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          denialText,
          claimContext,
          analysis: analyze.data,
        }),
        signal: ctrl.signal,
      });
      const json = await r.json();
      if (!r.ok) {
        setCorrect({
          data: null,
          error: json.error ?? `HTTP ${r.status}`,
          loading: false,
        });
        return;
      }
      setCorrect({ data: json.correction, error: null, loading: false });
      setCorrectMeta(json.meta);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setCorrect({
        data: null,
        error: (e as Error).message,
        loading: false,
      });
    }
  }

  async function runAppeal() {
    if (!analyze.data || !correct.data) return;
    abortAppeal.current?.abort();
    const ctrl = new AbortController();
    abortAppeal.current = ctrl;
    setAppeal({ data: null, error: null, loading: true });
    try {
      const r = await fetch("/api/denial/appeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          denialText,
          claimContext,
          analysis: analyze.data,
          correction: correct.data,
        }),
        signal: ctrl.signal,
      });
      const json = await r.json();
      if (!r.ok) {
        setAppeal({
          data: null,
          error: json.error ?? `HTTP ${r.status}`,
          loading: false,
        });
        return;
      }
      setAppeal({ data: json.packet, error: null, loading: false });
      setAppealMeta(json.meta);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setAppeal({
        data: null,
        error: (e as Error).message,
        loading: false,
      });
    }
  }

  const canAnalyze = !analyze.loading && denialText.trim().length >= 30;
  const canCorrect = !correct.loading && !!analyze.data;
  const canAppeal = !appeal.loading && !!correct.data;
  const canExport = !!analyze.data && !!correct.data && !!appeal.data;

  function exportPdf() {
    if (!analyze.data || !correct.data || !appeal.data) return;
    openPacketPrintWindow({
      denialText,
      claimContext,
      analysis: analyze.data,
      correction: correct.data,
      appeal: appeal.data,
      meta: appealMeta,
    });
  }

  return (
    <div className="space-y-6">
      <SamplePicker
        samples={samples}
        activeId={activeSampleId}
        onPick={pickSample}
      />

      <section className="rounded-lg border border-border bg-bg p-4 space-y-4">
        <Field
          label="Denial text"
          hint="EOB excerpt or denial letter. Synthetic only — no PHI."
        >
          <textarea
            value={denialText}
            onChange={(e) => setDenialText(e.target.value)}
            rows={10}
            spellCheck={false}
            className="w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm font-mono leading-relaxed text-text focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </Field>

        <Field
          label="Claim context"
          hint="CPT / ICD / DOS — the original claim the correction step works from."
        >
          <textarea
            value={claimContext}
            onChange={(e) => setClaimContext(e.target.value)}
            rows={6}
            spellCheck={false}
            className="w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm font-mono leading-relaxed text-text focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-text-subtle">
            {denialText.trim().length < 30 ? (
              <span className="text-warn">
                Add at least 30 characters of denial text to analyze.
              </span>
            ) : (
              <>Step 1 will call <code className="font-mono">/api/denial/analyze</code>.</>
            )}
          </p>
          <PrimaryButton
            onClick={runAnalyze}
            disabled={!canAnalyze}
            loading={analyze.loading}
          >
            Analyze denial
          </PrimaryButton>
        </div>
      </section>

      <StepCard label="1. Analysis" meta={analyzeMeta}>
        <AnalysisPanel state={analyze} />
        <div className="mt-4 flex items-center justify-end">
          <SecondaryButton
            onClick={runCorrect}
            disabled={!canCorrect}
            loading={correct.loading}
          >
            Generate correction
          </SecondaryButton>
        </div>
      </StepCard>

      <StepCard label="2. Correction" meta={correctMeta}>
        <CorrectionPanel state={correct} />
        <div className="mt-4 flex items-center justify-end">
          <SecondaryButton
            onClick={runAppeal}
            disabled={!canAppeal}
            loading={appeal.loading}
          >
            Generate appeal packet
          </SecondaryButton>
        </div>
      </StepCard>

      <StepCard label="3. Appeal packet" meta={appealMeta}>
        <AppealPanel state={appeal} />
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-text-subtle">
            {canExport
              ? "Exports analysis, correction, and appeal letter as one print-ready case file."
              : "Complete all three steps to export the full packet."}
          </p>
          <PrimaryButton
            onClick={exportPdf}
            disabled={!canExport}
            loading={false}
          >
            Download packet (PDF)
          </PrimaryButton>
        </div>
      </StepCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sample picker
// ---------------------------------------------------------------------------

function SamplePicker({
  samples,
  activeId,
  onPick,
}: {
  samples: SampleDenial[];
  activeId: string;
  onPick: (id: string) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Sample denials"
      className="flex flex-wrap gap-2"
    >
      {samples.map((s) => {
        const active = s.id === activeId;
        return (
          <button
            key={s.id}
            role="tab"
            aria-selected={active}
            onClick={() => onPick(s.id)}
            className={
              "rounded-md px-3 py-2 text-sm font-medium border transition " +
              (active
                ? "border-brand bg-brand-soft text-brand-hover"
                : "border-border bg-bg text-text-muted hover:border-border-strong hover:text-text")
            }
          >
            <span className="font-mono text-xs mr-1.5">{s.denialCode}</span>
            {s.label.replace(/^[^·]+·\s*/, "")}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout primitives
// ---------------------------------------------------------------------------

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-sm font-medium text-text">{label}</label>
        {hint && <span className="text-xs text-text-subtle">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function StepCard({
  label,
  meta,
  children,
}: {
  label: string;
  meta: Meta | null;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-bg p-4">
      <header className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-semibold text-text">{label}</h2>
        {meta && (
          <span className="text-xs text-text-subtle font-mono">
            {meta.model} · {meta.latencyMs}ms
          </span>
        )}
      </header>
      {children}
    </section>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  loading,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:bg-bg-soft disabled:text-text-subtle disabled:cursor-not-allowed"
    >
      {loading ? "Analyzing…" : children}
    </button>
  );
}

function SecondaryButton({
  onClick,
  disabled,
  loading,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-border-strong px-3.5 py-2 text-sm font-medium text-text hover:bg-bg-soft disabled:border-border disabled:text-text-subtle disabled:cursor-not-allowed disabled:hover:bg-transparent"
    >
      {loading ? "Working…" : children}
    </button>
  );
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">
      {message}
    </div>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-text-subtle italic">{children}</p>
  );
}

function Loading() {
  return (
    <p className="text-sm text-text-subtle">Talking to the model…</p>
  );
}

// ---------------------------------------------------------------------------
// Result panels
// ---------------------------------------------------------------------------

function AnalysisPanel({ state }: { state: StepState<DenialAnalysis> }) {
  if (state.loading) return <Loading />;
  if (state.error) return <ErrorBlock message={state.error} />;
  if (!state.data) return <Placeholder>No analysis yet. Click Analyze denial.</Placeholder>;
  const a = state.data;
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Denial code" value={a.denialCode ?? "—"} mono />
        <Stat label="Category" value={a.denialCategory} />
        <Stat label="Payer" value={a.payer ?? "—"} />
        <Stat label="Claim ID" value={a.claimId ?? "—"} mono />
      </dl>
      <div>
        <p className="text-xs uppercase tracking-wide text-text-subtle">Reason (from payer)</p>
        <p className="mt-1 text-sm text-text">{a.reasonText}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-text-subtle">Suggested root cause</p>
        <p className="mt-1 text-sm text-text">{a.suggestedRootCause}</p>
      </div>
      <ConfidenceBar value={a.confidence} />
    </div>
  );
}

function CorrectionPanel({ state }: { state: StepState<DenialCorrection> }) {
  if (state.loading) return <Loading />;
  if (state.error) return <ErrorBlock message={state.error} />;
  if (!state.data) return <Placeholder>No correction yet. Run the analysis first.</Placeholder>;
  const c = state.data;
  const noCodeChanges =
    c.correctedCodes.length === 0 &&
    c.correctedModifiers.length === 0 &&
    c.correctedDiagnosisCodes.length === 0;
  return (
    <div className="space-y-4">
      {noCodeChanges ? (
        <div className="rounded-md border border-warn/30 bg-warn/5 px-3 py-2 text-sm text-warn">
          No coding changes — the model classified this as a workflow issue, not a coding error.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <CodeList label="Corrected CPT/HCPCS" items={c.correctedCodes} />
          <CodeList label="Modifiers" items={c.correctedModifiers} />
          <CodeList label="ICD-10-CM" items={c.correctedDiagnosisCodes} />
        </div>
      )}
      <div>
        <p className="text-xs uppercase tracking-wide text-text-subtle">Rationale</p>
        <p className="mt-1 text-sm text-text whitespace-pre-wrap">
          {c.correctionRationale}
        </p>
      </div>
    </div>
  );
}

function AppealPanel({ state }: { state: StepState<AppealPacket> }) {
  if (state.loading) return <Loading />;
  if (state.error) return <ErrorBlock message={state.error} />;
  if (!state.data) return <Placeholder>No appeal yet. Generate the correction first.</Placeholder>;
  const p = state.data;
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <p className="text-xs uppercase tracking-wide text-text-subtle">Appeal letter</p>
          <CopyButton text={p.appealLetter} />
        </div>
        <div className="rounded-md border border-border bg-bg-muted p-4 text-sm text-text whitespace-pre-wrap font-sans leading-relaxed">
          {p.appealLetter}
        </div>
      </div>
      {p.suggestedAttachments.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wide text-text-subtle">Suggested attachments</p>
          <ul className="mt-1 list-disc list-inside text-sm text-text space-y-0.5">
            {p.suggestedAttachments.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <p className="text-xs uppercase tracking-wide text-text-subtle">Submission instructions</p>
        <p className="mt-1 text-sm text-text">{p.payerInstructions}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-primitives
// ---------------------------------------------------------------------------

function Stat({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-text-subtle">{label}</dt>
      <dd
        className={
          "mt-0.5 text-sm text-text " + (mono ? "font-mono" : "font-medium")
        }
      >
        {value}
      </dd>
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const tone = pct >= 80 ? "bg-ok" : pct >= 50 ? "bg-warn" : "bg-bad";
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs uppercase tracking-wide text-text-subtle">
          Confidence
        </span>
        <span className="text-sm font-mono text-text">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-bg-soft overflow-hidden">
        <div
          className={`h-full ${tone}`}
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}

function CodeList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-text-subtle">{label}</p>
      {items.length === 0 ? (
        <p className="mt-1 text-sm text-text-subtle italic">—</p>
      ) : (
        <ul className="mt-1 space-y-0.5">
          {items.map((it, i) => (
            <li key={i} className="text-sm font-mono text-text">
              {it}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PDF export — open a self-contained print window and trigger Save-as-PDF.
// Zero dependencies: the new document carries its own inline styles, so it is
// independent of the app's Tailwind. The browser's print dialog handles the
// actual "Save as PDF".
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function codeRow(label: string, items: string[]): string {
  const body =
    items.length === 0
      ? '<span class="muted">—</span>'
      : items.map((i) => `<span class="code">${escapeHtml(i)}</span>`).join(" ");
  return `<tr><th>${escapeHtml(label)}</th><td>${body}</td></tr>`;
}

function openPacketPrintWindow(packet: {
  denialText: string;
  claimContext: string;
  analysis: DenialAnalysis;
  correction: DenialCorrection;
  appeal: AppealPacket;
  meta: Meta | null;
}): void {
  const { denialText, claimContext, analysis, correction, appeal, meta } =
    packet;
  const confidencePct = Math.round(
    Math.max(0, Math.min(1, analysis.confidence)) * 100,
  );
  const attachments =
    appeal.suggestedAttachments.length === 0
      ? '<p class="muted">None suggested.</p>'
      : `<ul>${appeal.suggestedAttachments
          .map((a) => `<li>${escapeHtml(a)}</li>`)
          .join("")}</ul>`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Appeal packet${analysis.claimId ? " — " + escapeHtml(analysis.claimId) : ""}</title>
<style>
  @page { size: letter; margin: 18mm; }
  * { box-sizing: border-box; }
  body {
    font: 11pt/1.5 "Segoe UI", Helvetica, Arial, sans-serif;
    color: #1a1a1a; margin: 0; padding: 24px;
  }
  h1 { font-size: 18pt; margin: 0 0 2px; }
  h2 {
    font-size: 12pt; margin: 26px 0 8px; padding-bottom: 4px;
    border-bottom: 1px solid #d0d0d0; text-transform: uppercase;
    letter-spacing: 0.04em; color: #444;
  }
  .sub { color: #666; font-size: 9.5pt; margin: 0 0 4px; }
  table { width: 100%; border-collapse: collapse; margin: 4px 0; }
  th, td { text-align: left; vertical-align: top; padding: 4px 8px 4px 0; }
  th { width: 200px; font-weight: 600; color: #444; }
  .code {
    font-family: "Cascadia Code", Consolas, monospace; font-size: 10pt;
    background: #f1f1f1; border: 1px solid #e0e0e0; border-radius: 3px;
    padding: 1px 5px; margin-right: 2px; display: inline-block;
  }
  .muted { color: #888; }
  .letter, .pre {
    white-space: pre-wrap; word-wrap: break-word;
  }
  .letter { margin-top: 4px; }
  .pre {
    font-family: "Cascadia Code", Consolas, monospace; font-size: 9.5pt;
    background: #fafafa; border: 1px solid #e6e6e6; border-radius: 4px;
    padding: 10px 12px;
  }
  ul { margin: 4px 0; padding-left: 20px; }
  li { margin: 2px 0; }
  .disclaimer {
    margin-top: 28px; padding-top: 10px; border-top: 1px solid #d0d0d0;
    font-size: 8.5pt; color: #777;
  }
  .meta { font-size: 8.5pt; color: #999; margin-top: 2px; }
</style>
</head>
<body>
  <h1>Denial Appeal Packet</h1>
  <p class="sub">
    ${analysis.payer ? escapeHtml(analysis.payer) : "Payer not identified"}
    ${analysis.claimId ? " · Claim " + escapeHtml(analysis.claimId) : ""}
    ${analysis.denialCode ? " · Denial " + escapeHtml(analysis.denialCode) : ""}
  </p>
  ${meta ? `<p class="meta">Generated by ${escapeHtml(meta.model)} · ${meta.latencyMs}ms</p>` : ""}

  <h2>1 · Denial analysis</h2>
  <table>
    <tr><th>Denial code</th><td>${analysis.denialCode ? `<span class="code">${escapeHtml(analysis.denialCode)}</span>` : '<span class="muted">—</span>'}</td></tr>
    <tr><th>Category</th><td>${escapeHtml(analysis.denialCategory)}</td></tr>
    <tr><th>Payer</th><td>${analysis.payer ? escapeHtml(analysis.payer) : '<span class="muted">—</span>'}</td></tr>
    <tr><th>Claim ID</th><td>${analysis.claimId ? escapeHtml(analysis.claimId) : '<span class="muted">—</span>'}</td></tr>
    <tr><th>Confidence</th><td>${confidencePct}%</td></tr>
    <tr><th>Reason (from payer)</th><td>${escapeHtml(analysis.reasonText)}</td></tr>
    <tr><th>Suggested root cause</th><td>${escapeHtml(analysis.suggestedRootCause)}</td></tr>
  </table>

  <h2>2 · Proposed correction</h2>
  <table>
    ${codeRow("Corrected CPT/HCPCS", correction.correctedCodes)}
    ${codeRow("Modifiers", correction.correctedModifiers)}
    ${codeRow("ICD-10-CM", correction.correctedDiagnosisCodes)}
  </table>
  <p style="margin-top:8px"><strong>Rationale</strong></p>
  <div class="letter">${escapeHtml(correction.correctionRationale)}</div>

  <h2>3 · Appeal letter</h2>
  <div class="letter">${escapeHtml(appeal.appealLetter)}</div>

  <h2>Suggested attachments</h2>
  ${attachments}

  <h2>Submission instructions</h2>
  <div class="letter">${escapeHtml(appeal.payerInstructions)}</div>

  <h2>Source inputs</h2>
  <p class="sub">Denial text</p>
  <div class="pre">${escapeHtml(denialText)}</div>
  <p class="sub" style="margin-top:10px">Claim context</p>
  <div class="pre">${escapeHtml(claimContext)}</div>

  <p class="disclaimer">
    Synthetic demo output — no PHI. Not legal, billing, or coding advice.
    Generated by a HIPAA-aware demo; review by a certified coder against
    payer-specific policy is required before any production claim is corrected
    or appealed.
  </p>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) {
    // Popup blocked — fall back to printing the current document is not ideal,
    // so surface nothing and let the user retry. (Most browsers allow this
    // because it is triggered by a user click.)
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  // Give the new document a tick to lay out before invoking print.
  const triggerPrint = () => win.print();
  if (win.document.readyState === "complete") {
    setTimeout(triggerPrint, 150);
  } else {
    win.onload = () => setTimeout(triggerPrint, 150);
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be unavailable in some browsers / contexts; silent
    }
  }
  return (
    <button
      onClick={copy}
      className="text-xs font-medium text-brand hover:text-brand-hover"
    >
      {copied ? "Copied!" : "Copy letter"}
    </button>
  );
}
