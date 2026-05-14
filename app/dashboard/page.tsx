import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/app/components/Container";
import { SAMPLE_NOTES, STATS, type SampleNote, type QueueStatus } from "@/lib/sampleNotes";

export const metadata: Metadata = {
  title: "Dashboard — Coder workspace | Glenn Carter",
  description:
    "Coder workspace: KPI strip, queue of charts awaiting review, and a recently-completed log.",
};

export default function DashboardPage() {
  const pending = SAMPLE_NOTES.filter((n) => n.status === "pending");
  const inReview = SAMPLE_NOTES.filter((n) => n.status === "in_review");
  const done = SAMPLE_NOTES.filter((n) => n.status === "done");

  return (
    <div className="bg-bg-muted">
      <Container className="py-8 lg:py-10">
        <header className="mb-6">
          <p className="text-sm font-medium text-brand">Coder workspace</p>
          <h1 className="mt-1 text-2xl lg:text-3xl font-semibold text-text">
            Glenn&apos;s queue
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            What a certified coder sees on log-in. KPIs are last-7-day
            aggregates; the inbox is hand-built sample data — pick a chart to
            open it in the coding view.
          </p>
        </header>

        <KpiStrip
          pending={pending.length}
          inReview={inReview.length}
          doneToday={STATS.done_today}
          accuracy={STATS.accuracy_week}
          tatHours={STATS.avg_tat_hours}
        />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <Inbox pending={pending} inReview={inReview} />
          <Sidebar />
        </div>
      </Container>
    </div>
  );
}

function KpiStrip({
  pending,
  inReview,
  doneToday,
  accuracy,
  tatHours,
}: {
  pending: number;
  inReview: number;
  doneToday: number;
  accuracy: number;
  tatHours: number;
}) {
  const items: { label: string; value: string; tone?: "ok" | "warn" }[] = [
    { label: "Pending", value: String(pending), tone: pending > 0 ? "warn" : undefined },
    { label: "In review", value: String(inReview) },
    { label: "Done today", value: String(doneToday), tone: "ok" },
    { label: "Accuracy (7d)", value: `${accuracy}%`, tone: "ok" },
    { label: "Avg TAT", value: `${tatHours}h` },
  ];
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 lg:gap-3">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-lg border border-border bg-bg px-3 py-3"
        >
          <dt className="text-[10px] uppercase tracking-wide text-text-subtle">
            {it.label}
          </dt>
          <dd
            className={
              "mt-1 text-2xl font-semibold tabular-nums " +
              (it.tone === "ok"
                ? "text-ok"
                : it.tone === "warn"
                ? "text-warn"
                : "text-text")
            }
          >
            {it.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Inbox({
  pending,
  inReview,
}: {
  pending: SampleNote[];
  inReview: SampleNote[];
}) {
  return (
    <section
      aria-label="Inbox"
      className="rounded-lg border border-border bg-bg overflow-hidden"
    >
      <header className="flex items-baseline justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-text">
          Inbox{" "}
          <span className="text-text-subtle font-normal">
            ({pending.length + inReview.length})
          </span>
        </h2>
        <span className="text-xs text-text-subtle">click a chart to code it</span>
      </header>
      <ul className="divide-y divide-border">
        {[...pending, ...inReview].map((n) => (
          <ChartRow key={n.id} note={n} />
        ))}
      </ul>
    </section>
  );
}

function ChartRow({ note }: { note: SampleNote }) {
  const codeCount = note.suggested.length;
  const flagCount = note.suggested.reduce(
    (sum, c) => sum + (c.flags?.length ?? 0),
    0,
  );

  return (
    <li>
      <Link
        href={`/demo?chart=${note.id}`}
        className="block px-4 py-3 hover:bg-bg-soft transition"
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-mono text-xs text-text-subtle">{note.chart_id}</span>
          <span className="text-sm font-medium text-text">
            {note.patient_label} · {note.age}{note.sex}
          </span>
          <VisitBadge visitType={note.visit_type} />
          <StatusBadge status={note.status} />
          <span className="ml-auto text-xs text-text-subtle">{note.received_at}</span>
        </div>
        <p className="mt-1 text-sm text-text-muted line-clamp-1">
          {note.chief_complaint}
        </p>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-text-subtle">
          <span>{note.setting}</span>
          <span aria-hidden>·</span>
          <span>{codeCount} suggested codes</span>
          {flagCount > 0 && (
            <>
              <span aria-hidden>·</span>
              <span className="text-warn">
                {flagCount} flag{flagCount === 1 ? "" : "s"}
              </span>
            </>
          )}
        </div>
      </Link>
    </li>
  );
}

function VisitBadge({ visitType }: { visitType: SampleNote["visit_type"] }) {
  const label = visitType === "new" ? "EM new" : "EM est";
  return (
    <span className="rounded bg-brand-soft text-brand-hover px-1.5 py-0.5 text-[10px] font-mono font-semibold">
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: QueueStatus }) {
  const cfg =
    status === "pending"
      ? { label: "Pending", cls: "bg-bg-soft text-text-muted" }
      : status === "in_review"
      ? { label: "In review", cls: "bg-warn/10 text-warn" }
      : { label: "Done", cls: "bg-ok/10 text-ok" };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function Sidebar() {
  const peak = Math.max(...STATS.daily_throughput);
  return (
    <aside className="space-y-4">
      <section className="rounded-lg border border-border bg-bg p-4">
        <h3 className="text-sm font-semibold text-text">Throughput · 7d</h3>
        <p className="mt-0.5 text-xs text-text-subtle">charts coded per day</p>
        <div className="mt-3 flex items-end gap-1.5 h-20">
          {STATS.daily_throughput.map((v, i) => {
            const h = Math.max(8, Math.round((v / peak) * 72));
            const isToday = i === STATS.daily_throughput.length - 1;
            return (
              <div
                key={i}
                className={`flex-1 rounded-t ${isToday ? "bg-brand" : "bg-brand-soft"}`}
                style={{ height: `${h}px` }}
                title={`${v} charts`}
                aria-label={`Day ${i + 1}: ${v} charts`}
              />
            );
          })}
        </div>
        <p className="mt-2 text-xs text-text-subtle">
          {STATS.done_this_week} this week · peak {peak}/day
        </p>
      </section>

      <section className="rounded-lg border border-border bg-bg p-4">
        <h3 className="text-sm font-semibold text-text">Top flags · 7d</h3>
        <ul className="mt-2 space-y-1.5">
          {STATS.top_flags.map((f) => (
            <li
              key={f.label}
              className="flex items-baseline justify-between text-xs"
            >
              <span className="text-text-muted">{f.label}</span>
              <span className="font-mono tabular-nums text-text">{f.count}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-border bg-bg-muted p-4 text-xs text-text-muted">
        Built by Glenn Carter. All data is synthetic — no PHI.{" "}
        <Link href="/architecture" className="text-brand hover:underline">
          See the production architecture →
        </Link>
      </section>
    </aside>
  );
}
