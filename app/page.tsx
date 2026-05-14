import Link from "next/link";
import { Container } from "@/app/components/Container";

export default function HomePage() {
  return (
    <>
      <section className="border-b border-border">
        <Container className="py-16 lg:py-24 max-w-3xl">
          <p className="text-sm font-medium text-brand">
            AI medical coding · portfolio
          </p>
          <h1 className="mt-2 text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-text">
            From a clinical note to billable codes — with the receipts.
          </h1>
          <p className="mt-5 text-lg text-text-muted">
            A working outpatient E/M coding assistant: pick a synthetic note, see
            the suggested CPT and ICD-10 codes, the exact note span that justifies
            each one, and the NCCI / documentation flags a real coder would want.
            Accept, reject, or edit and push back to a (simulated) EHR.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/demo"
              className="rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
            >
              Try the demo →
            </Link>
            <Link
              href="/architecture"
              className="rounded-md border border-border-strong px-4 py-2.5 text-sm font-medium text-text hover:bg-bg-soft"
            >
              Read the architecture
            </Link>
            <a
              href="https://github.com/mrglennc64/medical"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-border px-4 py-2.5 text-sm font-medium text-text-muted hover:text-text hover:border-border-strong"
            >
              GitHub ↗
            </a>
          </div>
          <p className="mt-6 text-xs text-text-subtle">
            Built by Glenn Carter. Demo runs on hardcoded synthetic notes — no
            PHI, no live LLM call. The production path (BAA-gated model serving,
            encryption, audit logging) is on the architecture page.
          </p>
        </Container>
      </section>

      <section>
        <Container className="py-12 lg:py-16 max-w-3xl">
          <h2 className="text-xl font-semibold text-text">What this shows</h2>
          <ul className="mt-4 space-y-3 text-text-muted">
            {POINTS.map((p) => (
              <li key={p.title} className="flex gap-3">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                <div>
                  <strong className="text-text">{p.title}.</strong>{" "}
                  <span>{p.body}</span>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-t border-border bg-bg-muted">
        <Container className="py-12 lg:py-16 max-w-3xl">
          <h2 className="text-xl font-semibold text-text">For hiring managers</h2>
          <p className="mt-3 text-text-muted">
            I&apos;m available for remote contract or full-time work on healthcare-AI
            systems — autonomous coding, clinical NLP, RCM automation, EHR
            integration. The fastest read on whether I can do the work is to click{" "}
            <Link href="/demo" className="text-brand hover:underline">
              the demo
            </Link>{" "}
            and skim{" "}
            <Link href="/architecture" className="text-brand hover:underline">
              the architecture page
            </Link>
            . If that hits the bar, message me at{" "}
            <a href="mailto:mrglenncarter@yahoo.com" className="text-brand hover:underline">
              mrglenncarter@yahoo.com
            </a>
            .
          </p>
        </Container>
      </section>
    </>
  );
}

const POINTS: { title: string; body: string }[] = [
  {
    title: "Evidence-grounded suggestions",
    body:
      "Every suggested code links to the exact span of the note that justified it — not a black box.",
  },
  {
    title: "Real coder workflow",
    body:
      "Per-code accept / reject / edit decisions, mirroring the worksheet pattern used in production correction tooling.",
  },
  {
    title: "Rule-engine flags surfaced, not buried",
    body:
      "NCCI edits, modifier reminders, LCD warnings, and documentation gaps render alongside the code instead of being hidden in a downstream report.",
  },
  {
    title: "Honest about HIPAA",
    body:
      "Architecture page names where PHI flows at every hop and which model-serving paths are BAA-eligible. No “HIPAA compliant” marketing label.",
  },
  {
    title: "Deployable and inspectable",
    body:
      "Next.js 16 App Router, no API keys required for the demo, Vercel-ready. Source on GitHub with a clean README.",
  },
];
