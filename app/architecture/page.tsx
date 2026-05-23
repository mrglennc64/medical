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
        <p className="text-sm font-medium text-brand">Architecture · v2</p>
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

        <div className="mt-5 rounded-md border-l-4 border-brand bg-bg-muted p-4">
          <p className="text-sm font-semibold text-text">
            Rule 0: PHI never leaves a BAA-covered endpoint.
          </p>
          <p className="mt-1 text-sm text-text-muted">
            No pasting notes into public ChatGPT, Gemini, Grok, or Claude.ai. If a
            tool that touches the request body doesn&apos;t have a signed BAA, the
            only thing that can reach it is data run through the Safe Harbor
            de-identification step first.
          </p>
        </div>
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
            <strong className="text-text">PHI minimization.</strong> Strip the 18
            Safe Harbor identifiers (§164.514(b)(2)) before the prompt: names,
            geographic subdivisions smaller than state, dates more precise than
            year, phone, fax, email, SSN, MRN, account, plan number, device
            identifiers, URLs, IPs, biometric IDs, photos, and any other unique
            identifying number or code. The model sees the clinical narrative
            plus age band, sex, and visit type — not the patient identity.
          </li>
          <li>
            <strong className="text-text">Model serving (BAA gate).</strong> Calls go
            to a foundation model under a signed BAA — Gemini via{" "}
            <strong>Google Vertex AI</strong> (HIPAA-eligible under a Google Cloud
            BAA), Claude via <strong>AWS Bedrock</strong>, GPT-class via{" "}
            <strong>Azure OpenAI Service</strong>, or a self-hosted open model
            (Llama-3, Mistral, MedPaLM-style fine-tune) inside the VPC. The public
            Google AI Studio / Anthropic / OpenAI APIs without a BAA are{" "}
            <strong>not</strong> a permissible path. The demo on this site uses
            Google AI Studio because its inputs are synthetic; the only change to
            run in production is the SDK endpoint and a signed BAA.
          </li>
          <li>
            <strong className="text-text">Code lookup &amp; rule engine.</strong> The
            model proposes candidate codes; a deterministic post-processor validates
            each against current CPT / ICD-10-CM / HCPCS catalogs, runs NCCI edits
            (PTP and MUE tables), and applies payer-specific LCDs. Rule violations
            become flags shown to the human reviewer.
          </li>
          <li>
            <strong className="text-text">Human-in-the-loop review.</strong> Every
            AI-suggested code is validated by a certified coder before claim
            submission — AI suggests, a human decides. The reviewer sees the
            supporting evidence span and chooses <code>accept</code>,{" "}
            <code>reject</code>, or <code>edit</code> — the same shape as the
            demo&apos;s decision panel and the worksheet pattern in{" "}
            <code>kataloghub-app/app/api/corrections/worksheet/route.ts</code>.
            Rejected suggestions are logged back to the vendor for accuracy
            tuning.
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
          BAA: the clauses that actually matter
        </h2>
        <p className="text-sm text-text-muted mb-3">
          &ldquo;HIPAA-eligible&rdquo; is a vendor checkbox. The BAA is where the
          eligibility is enforced. Four clauses I look for before signing:
        </p>
        <ul className="space-y-2 text-sm text-text-muted list-disc list-inside">
          <li>
            <strong className="text-text">No training on PHI.</strong> The vendor
            cannot use customer prompts, completions, or any payload-derived data
            to train, fine-tune, or evaluate models — for this customer or any
            other.
          </li>
          <li>
            <strong className="text-text">No retention after task completion.</strong>{" "}
            PHI is held only as long as needed to return the response, then
            deleted. Any cache (prompt cache, KV cache, batch buffer) is scoped to
            the request and purged.
          </li>
          <li>
            <strong className="text-text">No commingling across tenants.</strong>{" "}
            Tenant data is logically isolated; no shared embeddings store, no
            shared evaluation set, no &ldquo;learn from all customers&rdquo;
            feature.
          </li>
          <li>
            <strong className="text-text">No PHI in vendor logs.</strong> Whatever
            the vendor logs for debugging, abuse detection, or analytics excludes
            request/response bodies — or hashes them. PHI in a log line is still
            a breach.
          </li>
        </ul>
        <p className="mt-3 text-sm text-text-muted">
          If a vendor won&apos;t put these in writing, the tool is for synthetic
          or de-identified data only. That covers prototyping; it does not cover
          production.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-text mb-4">
          Ongoing compliance
        </h2>
        <ul className="space-y-2 text-sm text-text-muted list-disc list-inside">
          <li>
            <strong className="text-text">Annual security risk assessment.</strong>{" "}
            Per §164.308(a)(1)(ii)(A), the SRA runs at minimum yearly — re-map
            data flows, re-check access controls, re-verify that every PHI hop
            still ends at a BAA-covered endpoint.
          </li>
          <li>
            <strong className="text-text">Re-assess when a vendor turns on an AI feature.</strong>{" "}
            A coding tool that adds an &ldquo;AI assist&rdquo; toggle six months
            after contract signing is a new data flow, even if the vendor calls
            it an &ldquo;enhancement.&rdquo; Trigger an out-of-cycle SRA and
            confirm the BAA still covers the new processing path.
          </li>
          <li>
            <strong className="text-text">BAA refresh on vendor change.</strong>{" "}
            Sub-processor list changes, new AI capabilities, new data residency
            — any of these require revisiting the agreement, not waiting for the
            renewal date.
          </li>
          <li>
            <strong className="text-text">Reject-flag feedback loop.</strong>{" "}
            Coder rejections and edits feed back to the vendor as accuracy
            signal — without sending the underlying PHI. The signal is &ldquo;code
            X was wrong in context Y,&rdquo; not the note.
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-text mb-4">
          From this public demo to a private BAA testbed
        </h2>
        <p className="text-sm text-text-muted mb-3">
          The site you&apos;re reading is a public demo on synthetic data. If a
          prospect signs a BAA and wants to evaluate against real charts, the
          live data does <em>not</em> go through{" "}
          <code>medi.usesmpt.com</code>. The codebase deploys a second time
          into a private environment with different config. The deltas:
        </p>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-bg-muted text-text">
              <tr>
                <th className="text-left font-semibold px-3 py-2 border-b border-border">
                  Concern
                </th>
                <th className="text-left font-semibold px-3 py-2 border-b border-border">
                  Public demo (this URL)
                </th>
                <th className="text-left font-semibold px-3 py-2 border-b border-border">
                  Private testbed (post-BAA)
                </th>
              </tr>
            </thead>
            <tbody className="text-text-muted">
              {TESTBED_DELTAS.map((row, i) => (
                <tr key={row.concern} className={i % 2 ? "bg-bg-muted/40" : ""}>
                  <td className="px-3 py-2 align-top font-medium text-text">
                    {row.concern}
                  </td>
                  <td className="px-3 py-2 align-top">{row.publicDemo}</td>
                  <td className="px-3 py-2 align-top">{row.privateTestbed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-text-muted mt-3">
          The codebase is one deploy target; the surrounding infrastructure is
          what changes. Standing up the private testbed is a config swap and a
          DNS record, not a rewrite — typically a one-day setup after BAA
          execution.
        </p>
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

const TESTBED_DELTAS: {
  concern: string;
  publicDemo: string;
  privateTestbed: string;
}[] = [
  {
    concern: "Host",
    publicDemo: "Hostinger shared VPS — no HIPAA BAA available",
    privateTestbed: "AWS / GCP / Azure region under a signed BAA",
  },
  {
    concern: "Model endpoint",
    publicDemo: "Public Gemini API (not BAA-eligible)",
    privateTestbed: "Vertex AI, Bedrock, or Azure OpenAI under BAA",
  },
  {
    concern: "PHI guard",
    publicDemo: "Safe Harbor detector blocks submission",
    privateTestbed: "Detector still runs, but as audit-only logging — PHI is permitted",
  },
  {
    concern: "Banner",
    publicDemo: "“Synthetic data only — no PHI”",
    privateTestbed: "“Authorized BAA testing · Client: ⟨name⟩ · Engagement: ⟨id⟩”",
  },
  {
    concern: "Access",
    publicDemo: "Open to the public internet",
    privateTestbed: "IP allow-list, basic auth or SSO, optionally mTLS",
  },
  {
    concern: "Audit log",
    publicDemo: "Dev-only console output",
    privateTestbed:
      "Append-only log: timestamp, user, hashed correlation ID, outcome — never the note body",
  },
  {
    concern: "Data retention",
    publicDemo: "No persistence — request-scoped",
    privateTestbed:
      "Configurable per engagement (default: no persistence; opt-in encrypted store for QA review)",
  },
  {
    concern: "URL",
    publicDemo: "medi.usesmpt.com",
    privateTestbed: "medi-private.⟨client⟩.usesmpt.com or per-client subdomain",
  },
];

const CONTROLS: { title: string; body: string }[] = [
  {
    title: "Business Associate Agreement",
    body:
      "Signed BAA with the covered entity before any PHI moves; cascading BAAs with the cloud provider and the model provider. A vendor that won't sign is disqualified — full stop.",
  },
  {
    title: "Encryption in transit & at rest",
    body:
      "TLS 1.2+ everywhere, AES-256 at rest with customer-managed KMS keys. Object-level keys for note storage so a breach radius is one record, not a bucket.",
  },
  {
    title: "Access controls & audit logs",
    body:
      "RBAC with MFA, least-privilege IAM. Every PHI read/write/decision logged with user, timestamp, and correlation ID — but log records reference a hashed correlation ID, never the note body. Logs themselves write-once, append-only.",
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
