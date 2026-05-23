import Link from "next/link";
import { Container } from "@/app/components/Container";

export default function HomePage() {
  return (
    <>
      <section className="border-b border-border">
        <Container className="py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-[2.1fr_1.4fr] gap-10 lg:gap-12 items-start">
            <div>
              <p className="text-sm font-medium text-brand">
                AI medical coding · portfolio
              </p>
              <h1 className="mt-2 text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-text">
                One platform for outpatient coding and denial correction.
              </h1>
              <p className="mt-5 text-lg text-text-muted max-w-xl">
                From a clinical note to billable codes — and from a denied
                claim to a corrected appeal — in minutes.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
                >
                  Open the coder dashboard →
                </Link>
                <Link
                  href="/denials"
                  className="rounded-md border border-border-strong px-4 py-2.5 text-sm font-medium text-text hover:bg-bg-soft"
                >
                  Try the denial engine →
                </Link>
              </div>
              <p className="mt-6 text-sm text-text-subtle max-w-xl">
                Two workflows, one platform — structured, auditable outputs for
                coders, billers, and denial teams. Demo runs on synthetic notes;
                production path is BAA-gated and described on the{" "}
                <Link href="/architecture" className="text-brand hover:underline">
                  architecture page
                </Link>
                .
              </p>
            </div>
            <SessionSnapshot />
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-14 lg:py-16 max-w-5xl">
          <h2 className="text-2xl font-semibold text-text">
            Two workflows. One platform.
          </h2>
          <p className="mt-3 text-text-muted max-w-2xl">
            The same system handles both sides of the outpatient revenue cycle:
            coding visits correctly the first time, and correcting denials when
            payers push back.
          </p>
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
            <WorkflowCard
              tag="Workflow 1"
              title="Outpatient coding"
              bullets={[
                "From a clinical note to CPT and ICD-10 suggestions.",
                "Justification spans that show exactly which words in the note support each code.",
                "Documentation flags for missing elements and E/M leveling.",
                "Evidence-grounded reasoning — model output drops any code whose quote isn't verbatim in the note.",
                "Per-code accept / reject / edit, then export the coding packet.",
              ]}
              cta={{ label: "Open the coder dashboard", href: "/dashboard" }}
              footnote="For coding visits correctly the first time."
            />
            <WorkflowCard
              tag="Workflow 2"
              title="Denial correction"
              bullets={[
                "From a denied claim to a corrected claim and an appeal letter.",
                "Parse denial reasons and surface the documentation that's missing.",
                "Generate corrected claim text aligned with payer expectations.",
                "Produce a structured appeal letter with reusable, defensible language.",
                "Track acknowledgment, reviewer, and notes for each denial.",
              ]}
              cta={{ label: "Try the denial engine", href: "/denials" }}
              footnote="For when payers reject claims and you need a repeatable correction workflow."
            />
          </div>
        </Container>
      </section>

      <section className="border-t border-border bg-bg-muted">
        <Container className="py-14 lg:py-16 max-w-5xl">
          <h2 className="text-2xl font-semibold text-text">
            Why this matters
          </h2>
          <p className="mt-3 text-text-muted max-w-2xl">
            Outpatient clinics and billing teams lose time and revenue when
            coding is unclear and denial workflows are improvised. Both coders
            and denial teams get a structured, inspectable system instead of
            ad-hoc documents and emails.
          </p>
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
            <Card
              title="For coders"
              bullets={[
                "See exactly which note span supports each suggested code.",
                "Catch missing documentation before the claim is submitted.",
                "Keep an audit trail of every decision, edit, and flag.",
              ]}
            />
            <Card
              title="For denial teams"
              bullets={[
                "Standardize how denials are parsed and corrected.",
                "Generate consistent, payer-ready appeal letters.",
                "Keep a structured record of what was changed and why.",
              ]}
            />
          </div>
        </Container>
      </section>

      <section className="border-t border-border">
        <Container className="py-14 lg:py-16 max-w-5xl">
          <h2 className="text-2xl font-semibold text-text">Who it&apos;s for</h2>
          <p className="mt-3 text-text-muted max-w-2xl">
            Built for teams that live in outpatient documentation, coding, and
            denials — and need a system that reflects real workflows instead of
            screenshots.
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card
              compact
              title="Outpatient clinics"
              bullets={[
                "Primary care, specialty, telehealth, urgent care.",
                "Code visits and handle denials without new EHR integrations.",
              ]}
            />
            <Card
              compact
              title="Billing companies (RCM)"
              bullets={[
                "One coding and denial layer across multiple clinics.",
                "Standardize how denials are corrected and appealed.",
              ]}
            />
            <Card
              compact
              title="Telehealth & healthcare SaaS"
              bullets={[
                "Embed coding and denial workflows alongside existing tools.",
                "Exportable packets for internal or external review.",
              ]}
            />
            <Card
              compact
              title="CDI and QA teams"
              bullets={[
                "Review justification spans and documentation flags.",
                "Audit how each code and correction was derived.",
              ]}
            />
            <Card
              compact
              title="Denial management teams"
              bullets={[
                "Move from ad-hoc appeals to a repeatable process.",
                "Structured record of each denial and response.",
              ]}
            />
            <Card
              compact
              title="Healthcare-AI teams"
              bullets={[
                "Working, inspectable architecture for coding and denials.",
                "Reference implementation for real-world workflows.",
              ]}
            />
          </div>
        </Container>
      </section>

      <section className="border-t border-border bg-bg-muted">
        <Container className="py-14 lg:py-16 max-w-5xl">
          <h2 className="text-2xl font-semibold text-text">What you get</h2>
          <p className="mt-3 text-text-muted max-w-2xl">
            One platform covering both sides of the outpatient revenue cycle,
            with outputs that can be inspected, exported, and defended.
          </p>
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
            <Card
              title="Coding side"
              bullets={[
                "CPT and ICD-10 suggestions with confidence scores.",
                "Justification spans tied verbatim to the clinical note.",
                "Documentation flags and E/M leveling support.",
                "Per-code accept / reject / edit, plus exportable coding packet.",
              ]}
            />
            <Card
              title="Denial side"
              bullets={[
                "Denial reason parsing.",
                "Correction text for resubmission.",
                "Structured appeal letter generation.",
                "Acknowledgment, reviewer, and notes tracking.",
              ]}
            />
          </div>
          <p className="mt-5 text-sm text-text-subtle max-w-2xl">
            HIPAA-aware architecture — no marketing claim of compliance, just an
            honest, documented production path with BAA-gated model serving,
            encryption, audit logging, and a Safe Harbor de-identification
            boundary. Details on the{" "}
            <Link href="/architecture" className="text-brand hover:underline">
              architecture page
            </Link>
            .
          </p>
        </Container>
      </section>

      <section className="border-t border-border">
        <Container className="py-14 lg:py-16 max-w-3xl">
          <h2 className="text-2xl font-semibold text-text">
            Start with either workflow
          </h2>
          <p className="mt-3 text-text-muted">
            Begin from a clinical note or a denied claim — both paths use the
            same underlying system. Coding and denials are not separate
            products; they share the data model, the audit log, and the export
            packet.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
            >
              Open the coder dashboard →
            </Link>
            <Link
              href="/denials"
              className="rounded-md border border-border-strong px-4 py-2.5 text-sm font-medium text-text hover:bg-bg-soft"
            >
              Try the denial engine →
            </Link>
          </div>
          <p className="mt-6 text-sm text-text-subtle">
            Available for remote contract or full-time work on healthcare-AI
            systems — autonomous coding, clinical NLP, RCM automation, EHR
            integration.{" "}
            <a
              href="mailto:mrglenncarter@gmail.com"
              className="text-brand hover:underline"
            >
              mrglenncarter@gmail.com
            </a>
            .
          </p>
        </Container>
      </section>
    </>
  );
}

function SessionSnapshot() {
  return (
    <div className="rounded-lg border border-border bg-bg p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-text-subtle uppercase tracking-wider">
          Example session
        </p>
        <span className="text-xs text-text-subtle font-mono">2 codes · 1 denial</span>
      </div>

      <div className="space-y-3">
        <SnapshotRow
          system="CPT"
          code="99214"
          confidence="0.95"
          description="Office/outpatient E/M, established patient"
          status="justified"
          tone="ok"
        />
        <SnapshotRow
          system="ICD-10"
          code="J02.0"
          confidence="1.00"
          description="Acute streptococcal pharyngitis"
          status="justified"
          tone="ok"
        />
        <SnapshotRow
          system="flag"
          code="—"
          description="Missing time documentation"
          status="flagged before submission"
          tone="warn"
        />
        <SnapshotRow
          system="denial"
          code="CO-16"
          description="Missing/invalid information"
          status="corrected · appeal letter generated"
          tone="brand"
        />
      </div>

      <div className="mt-5 pt-3 border-t border-border flex items-center justify-between text-xs">
        <span className="text-text-muted">Coding + denial packet</span>
        <span className="text-ok font-medium">Ready to export</span>
      </div>
    </div>
  );
}

function SnapshotRow({
  system,
  code,
  confidence,
  description,
  status,
  tone,
}: {
  system: string;
  code: string;
  confidence?: string;
  description: string;
  status: string;
  tone: "ok" | "warn" | "brand";
}) {
  const border =
    tone === "ok" ? "border-ok" : tone === "warn" ? "border-warn" : "border-brand";
  const statusColor =
    tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : "text-brand";

  return (
    <div className={`border-l-2 ${border} pl-3`}>
      <div className="flex items-baseline gap-2 text-sm">
        <span className="font-mono text-[10px] uppercase text-text-subtle tracking-wider">
          {system}
        </span>
        <span className="font-mono font-semibold text-text">{code}</span>
        {confidence && (
          <span className="ml-auto text-xs text-text-subtle font-mono">
            conf {confidence}
          </span>
        )}
      </div>
      <p className="mt-0.5 text-xs text-text-muted">{description}</p>
      <p className={`mt-1 text-xs ${statusColor}`}>{status}</p>
    </div>
  );
}

function WorkflowCard({
  tag,
  title,
  bullets,
  cta,
  footnote,
}: {
  tag: string;
  title: string;
  bullets: string[];
  cta: { label: string; href: string };
  footnote: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-bg p-6 flex flex-col">
      <span className="self-start text-[10px] font-semibold uppercase tracking-wider text-brand bg-brand-soft rounded px-2 py-0.5">
        {tag}
      </span>
      <h3 className="mt-3 text-xl font-semibold text-text">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-text-muted">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="mt-2 inline-block h-1 w-1 rounded-full bg-brand shrink-0" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5">
        <Link
          href={cta.href}
          className="inline-block rounded-md bg-brand px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-hover"
        >
          {cta.label} →
        </Link>
      </div>
      <p className="mt-4 text-xs text-text-subtle">{footnote}</p>
    </div>
  );
}

function Card({
  title,
  bullets,
  compact,
}: {
  title: string;
  bullets: string[];
  compact?: boolean;
}) {
  return (
    <div className={`rounded-lg border border-border bg-bg ${compact ? "p-4" : "p-5"}`}>
      <h3 className={`font-semibold text-text ${compact ? "text-sm" : "text-base"}`}>
        {title}
      </h3>
      <ul className={`mt-2 space-y-1.5 ${compact ? "text-xs" : "text-sm"} text-text-muted`}>
        {bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="mt-1.5 inline-block h-1 w-1 rounded-full bg-brand shrink-0" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
