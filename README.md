# AI Medical Coding — Portfolio Demo

A working outpatient E/M coding assistant by **Glenn Carter** ([@mrglennc64](https://github.com/mrglennc64)).
Built as a portfolio piece for healthcare-AI engineering work.

- **Live demo:** _(deploy to Vercel and add link here)_
- **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4
- **Status:** v1 — hardcoded sample mapping, no live LLM call

## What it does

1. Pick one of three synthetic MTSamples-style outpatient E/M notes.
2. See suggested CPT and ICD-10 codes with confidence, the exact note span that justifies each one, and NCCI / documentation flags.
3. For each code, choose **accept**, **reject**, or **edit**.
4. Submit — the tally posts to a (simulated) EHR.

The decision shape mirrors the `WorksheetRow` pattern (`accept | reject | edit | null`) used in production correction tooling.

## Pages

| Route | Purpose |
|---|---|
| `/` | Landing — what this is, who built it, links to the rest |
| `/demo` | The interactive coding assistant |
| `/architecture` | One-page HIPAA-aware production architecture |

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

```bash
npm run build && npm start
```

## What this is NOT

- **Not HIPAA-compliant.** It is HIPAA-_aware_ (architecture documents the production path). No PHI is processed, transmitted, or stored.
- **Not a live LLM.** Suggestions are a hardcoded mapping over synthetic notes. The architecture page describes the BAA-gated production path (Bedrock / Azure OpenAI / self-hosted in VPC).
- **Not multi-specialty.** Outpatient E/M only. Specialty-specific code sets each need their own evaluation.
- **Not a real EHR integration.** "Send to EHR" is a state transition. A production build would target Epic, Cerner/Oracle, Athena, or eClinicalWorks via FHIR or HL7v2.

## Project layout

```
app/
  page.tsx                  Landing
  layout.tsx                Root layout (header, footer, fonts, metadata)
  globals.css               Tailwind 4 @theme tokens (teal / slate medical palette)
  components/
    Container.tsx
    Header.tsx
    Footer.tsx
  demo/
    page.tsx                Demo entry (server component)
    DemoApp.tsx             Client orchestrator
    NotePicker.tsx
    NoteViewer.tsx          Renders the note, highlights evidence on hover
    SuggestedCodesPanel.tsx Per-code rows with decision buttons
    DecisionTally.tsx       Running totals + Send to EHR
  architecture/
    page.tsx                HIPAA-aware production architecture
    DataFlowDiagram.tsx     SVG diagram (EHR → ingest → minimize → model → rules → reviewer → EHR)

lib/
  sampleNotes.ts            Synthetic notes + hardcoded suggestions
```

## Roadmap (not promises)

- [ ] Toggle for live model inference (Claude Haiku 4.5 via Anthropic API for the demo build only — gated behind `ANTHROPIC_API_KEY` env var; the production path remains Bedrock / Azure under BAA)
- [ ] Add dermatology and radiology specialties
- [ ] Accuracy benchmark on a public MTSamples slice with reported precision/recall per specialty
- [ ] FHIR `Claim` / `ChargeItem` round-trip mock against the public Epic FHIR sandbox

## Contact

Glenn Carter · [mrglenncarter@yahoo.com](mailto:mrglenncarter@yahoo.com) · [github.com/mrglennc64](https://github.com/mrglennc64)
