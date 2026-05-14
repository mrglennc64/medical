import type { Metadata } from "next";
import { Container } from "@/app/components/Container";
import { DataFlowDiagram } from "./DataFlowDiagram";

export const metadata: Metadata = {
  title: "Architecture — HIPAA-aware AI medical coding | Glenn Carter",
  description:
    "Production architecture for an AI medical coding service: data flow from EHR to coded chart, BAA-gated model serving, encryption, audit logging, and honest limitations.",
};

export default function ArchitecturePage() {
  return (
    <Container className="py-10 lg:py-14 max-w-3xl">
      <header className="mb-8">
        <p className="text-sm font-medium text-brand">Architecture · v1</p>
        <h1 className="mt-1 text-3xl font-semibold text-text">
          HIPAA-aware AI medical coding
        </h1>
        <p className="mt-3 text-text-muted">
          The portfolio demo is hardcoded so it never breaks and never touches PHI.
          Below is the production path it stands in for — the choices a real
          deployment would make to handle protected health information legally and
          safely. <em>HIPAA-aware</em>, not <em>HIPAA-certified</em>: there is no
          such certification body, and any real claim of compliance comes from
          signed BAAs and SOC 2 / HITRUST audits, not a marketing label.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-text mb-4">Data flow</h2>
        <DataFlowDiagram />
        <ol className="mt-4 space-y-2 text-sm text-text-muted list-decimal list-inside">
          <li>
            <strong className="text-text">EHR egress.</strong> Encounter notes leave
            the EHR over a TLS 1.2+ link — typically FHIR <code>DocumentReference</code>{" "}
            with the note as a <code>Binary</code> attachment, or HL7 v2 MDM_T02
            for older systems.
          </li>
          <li>
            <strong className="text-text">Ingest gateway.</strong> Receives the note
            inside the customer-tenanted VPC, validates payload, stamps a
            correlation ID, writes an immutable audit record, and stores the raw
            note encrypted at rest (AES-256, customer-managed KMS key).
          </li>
          <li>
            <strong className="text-text">PHI minimization.</strong> Strip any fields
            not required for coding (full address, MRN, account numbers). The model
            sees the clinical narrative + minimal demographic context (age band, sex,
            visit type), not the patient identity.
          </li>
          <li>
            <strong className="text-text">Model serving (BAA gate).</strong> Calls go
            to a foundation model under a signed BAA — Claude via{" "}
            <strong>AWS Bedrock</strong>, GPT-class via{" "}
            <strong>Azure OpenAI Service</strong>, or a self-hosted open model
            (Llama-3, Mistral, MedPaLM-style fine-tune) inside the VPC. The public
            Anthropic / OpenAI APIs without a BAA are <strong>not</strong> a
            permissible path.
          </li>
          <li>
            <strong className="text-text">Code lookup &amp; rule engine.</strong> The
            model proposes candidate codes; a deterministic post-processor validates
            each against current CPT / ICD-10-CM / HCPCS catalogs, runs NCCI edits
            (PTP and MUE tables), and applies payer-specific LCDs. Rule violations
            become flags shown to the human reviewer.
          </li>
          <li>
            <strong className="text-text">Human-in-the-loop review.</strong> A
            certified coder reviews each suggestion with the supporting evidence
            span and chooses <code>accept</code>, <code>reject</code>, or{" "}
            <code>edit</code> — the same shape as the demo&apos;s decision panel and
            the worksheet pattern in{" "}
            <code>kataloghub-app/app/api/corrections/worksheet/route.ts</code>.
          </li>
          <li>
            <strong className="text-text">Push back to EHR.</strong> Final code set
            posts back via FHIR <code>Claim</code> / <code>ChargeItem</code> or HL7 v2
            DFT_P03, the encounter status updates, and a billing job picks it up.
            Every read, write, decision, and outbound call is in the audit log.
          </li>
        </ol>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-text mb-4">
          The HIPAA controls that actually matter
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CONTROLS.map((c) => (
            <div
              key={c.title}
              className="rounded-md border border-border bg-bg-muted p-4"
            >
              <h3 className="text-sm font-semibold text-text">{c.title}</h3>
              <p className="mt-1 text-sm text-text-muted">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-text mb-4">
          Honest limitations of this prototype
        </h2>
        <ul className="space-y-2 text-sm text-text-muted list-disc list-inside">
          <li>
            <strong className="text-text">No live model.</strong> Suggestions are a
            hardcoded mapping over a handful of synthetic notes. The UX, decision
            shape, and rule-engine flag pattern are real; the inference is not.
          </li>
          <li>
            <strong className="text-text">No real EHR integration.</strong> &quot;Send
            to EHR&quot; is a state transition in React, not a FHIR / HL7 call. A
            production build would target Epic, Cerner/Oracle, Athena, or
            eClinicalWorks — each its own integration project.
          </li>
          <li>
            <strong className="text-text">No live NCCI / LCD lookup.</strong> Flag
            messages are written into the sample data. A real system would query a
            current edits table updated quarterly.
          </li>
          <li>
            <strong className="text-text">Synthetic notes only.</strong> All sample
            notes were written for the demo in MTSamples style. No real PHI is, has
            been, or will be processed by this app.
          </li>
          <li>
            <strong className="text-text">Single specialty.</strong> Only outpatient
            E/M is modeled. Specialty-specific code sets (radiology, dermatology,
            anesthesia) each need their own evaluation.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-text mb-4">What this demonstrates</h2>
        <p className="text-sm text-text-muted">
          The model can call APIs — that&apos;s the easy part. What separates a
          credible build from a demo screenshot is: a working evidence-grounded
          suggestion UI, an explicit decision shape (accept / reject / edit), a
          rule engine that surfaces NCCI and documentation flags rather than
          burying them, and an architecture that names <em>where the PHI goes</em>{" "}
          at every hop. That&apos;s the gap I&apos;m optimizing the demo and this
          page to close.
        </p>
      </section>
    </Container>
  );
}

const CONTROLS: { title: string; body: string }[] = [
  {
    title: "Business Associate Agreement",
    body:
      "Signed BAA with the covered entity before any PHI moves; cascading BAAs with the cloud provider and the model provider. No BAA, no PHI — full stop.",
  },
  {
    title: "Encryption in transit & at rest",
    body:
      "TLS 1.2+ everywhere, AES-256 at rest with customer-managed KMS keys. Object-level keys for note storage so a breach radius is one record, not a bucket.",
  },
  {
    title: "Access controls & audit logs",
    body:
      "RBAC with MFA, least-privilege IAM. Every PHI read/write/decision logged with user, timestamp, and correlation ID. Logs themselves write-once, append-only.",
  },
  {
    title: "BAA-gated model serving",
    body:
      "Inference goes to Bedrock / Azure OpenAI under BAA, or a self-hosted model in a HIPAA-eligible VPC. Public Anthropic / OpenAI APIs are off-limits for PHI.",
  },
  {
    title: "Data minimization",
    body:
      "Send only the clinical narrative + minimal demographics. Strip MRN, address, account numbers before the prompt. The model never needs the patient's identity to suggest a code.",
  },
  {
    title: "SOC 2 Type II + HITRUST",
    body:
      "Self-attested HIPAA + third-party audited security controls. Penetration testing, employee training, breach notification procedures. The paperwork is the moat.",
  },
];
