import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/app/components/Container";
import { DemoApp } from "./DemoApp";
import { SAMPLE_NOTES } from "@/lib/sampleNotes";

export const metadata: Metadata = {
  title: "Coder — Outpatient E/M coding",
  description:
    "Pick a synthetic clinical note, see suggested CPT and ICD-10 codes with reasoning, NCCI flags, and per-code accept / reject / edit decisions.",
};

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ chart?: string }>;
}) {
  const { chart } = await searchParams;
  const initialId = SAMPLE_NOTES.find((n) => n.id === chart)?.id;

  return (
    <div className="bg-bg-muted">
      <div className="bg-warn/10 border-b border-warn/30">
        <Container className="py-2 flex items-start gap-2 text-xs text-text">
          <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-warn text-[10px] font-bold text-white">
            !
          </span>
          <span>
            <strong>Synthetic data only — no PHI.</strong> Sample notes are
            MTSamples-style fabrications. The &ldquo;Code your own note&rdquo;
            form calls the public Gemini API and is{" "}
            <strong>not</strong> a HIPAA-eligible path. See the{" "}
            <Link href="/architecture" className="text-brand underline hover:no-underline">
              architecture page
            </Link>{" "}
            for the BAA-gated production route.
          </span>
        </Container>
      </div>
      <Container className="py-8 lg:py-12">
        <header className="mb-6 lg:mb-8">
          <p className="text-sm font-medium text-brand flex items-center gap-2">
            <Link href="/dashboard" className="hover:underline">
              ← Dashboard
            </Link>
            <span className="text-text-subtle">/</span>
            <span>Outpatient E/M coding · v1</span>
          </p>
          <h1 className="mt-1 text-2xl lg:text-3xl font-semibold text-text">
            From clinical note to billable codes
          </h1>
          <p className="mt-2 max-w-2xl text-text-muted">
            Pick a synthetic MTSamples-style note. The assistant proposes CPT and ICD-10
            codes with the exact note span that justifies each one, surfaces NCCI and
            documentation flags, and asks you to accept, reject, or edit before pushing
            back to a (simulated) EHR.
          </p>
          <p className="mt-2 text-xs text-text-subtle">
            Demo runs on a hardcoded mapping — no LLM call, no PHI. The production path
            (Bedrock / Azure OpenAI under BAA) is described on the{" "}
            <a href="/architecture" className="text-brand hover:underline">
              architecture page
            </a>
            .
          </p>
        </header>

        <DemoApp notes={SAMPLE_NOTES} initialId={initialId} />
      </Container>
    </div>
  );
}
