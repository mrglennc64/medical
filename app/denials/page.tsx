import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/app/components/Container";
import { DenialWorkspace } from "./DenialWorkspace";
import { SAMPLE_DENIALS } from "@/lib/denial/sampleDenials";

export const metadata: Metadata = {
  title: "Denial Engine — Analyze, correct, appeal",
  description:
    "Working AI demo for outpatient denial management: paste an EOB excerpt, get a structured denial analysis, a proposed correction, and a payer-ready appeal letter.",
};

export default function DenialsPage() {
  return (
    <div className="bg-bg-muted">
      <Container className="py-8 lg:py-12 max-w-4xl">
        <header className="mb-6 lg:mb-8">
          <p className="text-sm font-medium text-brand flex items-center gap-2">
            <Link href="/" className="hover:underline">
              ← Home
            </Link>
            <span className="text-text-subtle">/</span>
            <span>Denial Engine · v1</span>
          </p>
          <h1 className="mt-1 text-2xl lg:text-3xl font-semibold text-text">
            From a denied claim to a correction and an appeal letter.
          </h1>
          <p className="mt-2 max-w-2xl text-text-muted">
            Paste an EOB excerpt or denial letter. Three sequential model calls
            produce a structured denial analysis, a proposed corrected claim,
            and a payer-ready appeal packet — all grounded in the original
            denial text and claim context.
          </p>
          <p className="mt-2 text-xs text-text-subtle">
            Synthetic samples only — no PHI. The production architecture for
            handling real payer correspondence is described on the{" "}
            <Link href="/architecture" className="text-brand hover:underline">
              architecture page
            </Link>
            .
          </p>
        </header>

        <DenialWorkspace samples={SAMPLE_DENIALS} />

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-text mb-3">
            Honest limitations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {LIMITATIONS.map((l) => (
              <div
                key={l.title}
                className="rounded-md border border-border bg-bg p-4"
              >
                <h3 className="text-sm font-semibold text-text">{l.title}</h3>
                <p className="mt-1 text-sm text-text-muted">{l.body}</p>
              </div>
            ))}
          </div>
        </section>
      </Container>
    </div>
  );
}

const LIMITATIONS: { title: string; body: string }[] = [
  {
    title: "No live payer integration",
    body:
      "Nothing is submitted anywhere. The appeal packet is generated for inspection, not transmission.",
  },
  {
    title: "Synthetic denials only",
    body:
      "Sample EOB excerpts and claim contexts were written for this demo. No real payer correspondence and no PHI is processed.",
  },
  {
    title: "Not legal, billing, or coding advice",
    body:
      "Output needs a certified coder and the payer-specific policy in front of them before any production claim is corrected or appealed.",
  },
  {
    title: "No catalog validation in v1",
    body:
      "Suggested CPT and ICD-10 codes are not validated against current AMA/CMS catalogs here — that's the next deterministic layer, mirroring the E/M demo's NCCI table.",
  },
  {
    title: "Three single-shot calls, no agent loop",
    body:
      "Each step is one Gemini call with the prior step's result as input. No retry, no critic pass, no tool use. Deliberate simplicity for v1.",
  },
  {
    title: "HIPAA-aware, not HIPAA-compliant",
    body:
      "This route calls Google AI Studio without a BAA. Production deployment requires Vertex AI under BAA — see the architecture page.",
  },
];
