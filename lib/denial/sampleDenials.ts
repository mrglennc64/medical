/**
 * Synthetic denial samples for the /denials demo workspace.
 * All payer names are fictional ("... Demonstration ..."). No PHI.
 *
 * Each sample provides:
 *   - rawDenial: an EOB/remittance excerpt the model sees as input to /analyze
 *   - claimContext: the original claim summary the model sees as input to /correct
 */

export type SampleDenial = {
  id: string;
  label: string;
  payer: string;
  denialCode: string;
  rawDenial: string;
  claimContext: string;
};

export const SAMPLE_DENIALS: SampleDenial[] = [
  {
    id: "co16-missing-mod",
    label: "CO-16 · Missing modifier (Aetna Demo)",
    payer: "Aetna Demonstration Health Plans",
    denialCode: "CO-16",
    rawDenial: `Aetna Demonstration Health Plans
Remittance Advice — Claim Status Report

Claim ID: ACME-2025-44128
Member: [REDACTED]
Date of Service: 2025-04-12
Provider NPI: 1234567890

Claim Status: DENIED

CARC: CO-16 — Claim/service lacks information or has submission/billing error(s).
RARC: M51 — Missing/incomplete/invalid procedure code(s).

Adjustment Reason: A modifier is required when an evaluation and management
service is billed with a same-day procedural service for the same patient.
The E/M line was submitted without an appropriate modifier indicating it was
significant and separately identifiable from the procedure performed.
Resubmit with the correct modifier on the E/M line.

Payable Amount: $0.00`,
    claimContext: `Date of service: 2025-04-12
Place of service: 11 (office)
Billed CPT lines:
  99213 — Office/outpatient visit, established patient (no modifier)
  96372 — Therapeutic, prophylactic, or diagnostic injection (subcutaneous or intramuscular)
ICD-10-CM pointers: J02.9 (Acute pharyngitis, unspecified), Z23 (Encounter for immunization)
Modifiers on claim: none
Documentation summary: Established patient seen for sore throat; rapid strep
positive; ceftriaxone IM injection given same visit. Provider notes a
separate, fully documented E/M evaluation prior to the procedure.`,
  },
  {
    id: "co50-not-medically-necessary",
    label: "CO-50 · Not medically necessary (Medicare DAC)",
    payer: "Medicare Demonstration Administrative Contractor",
    denialCode: "CO-50",
    rawDenial: `Medicare Demonstration Administrative Contractor
Remittance Advice

Claim ID: MDM-2025-77931
Beneficiary: [REDACTED]
Date of Service: 2025-03-22
Provider: [REDACTED] MD

Claim Status: DENIED

CARC: CO-50 — These are non-covered services because this is not deemed a
"medical necessity" by the payer.
RARC: N115 — This decision was based on a Local Coverage Determination (LCD).

Adjustment Reason: The diagnosis submitted does not support medical necessity
for advanced imaging of the knee under LCD L34050. The LCD requires
documentation of at least 6 weeks of conservative management (NSAIDs,
physical therapy, activity modification) prior to MRI, or a specific
traumatic injury diagnosis indicating internal derangement. The submitted
diagnosis of unspecified pain does not meet this threshold.

Payable Amount: $0.00`,
    claimContext: `Date of service: 2025-03-22
Place of service: 11 (office)
Billed CPT lines:
  73721 — MRI knee, lower extremity, without contrast
ICD-10-CM pointers: M25.561 (Pain in right knee)
Modifiers on claim: none
Documentation summary: Provider notes 3 weeks of right knee pain after
"twisting" while gardening. No conservative therapy (NSAIDs, PT) documented
as tried and failed. No prior imaging. Exam noted "tender medial joint line,
no effusion." MRI ordered same visit.`,
  },
  {
    id: "co197-prior-auth",
    label: "CO-197 · Prior auth missing (UnitedHealth Demo)",
    payer: "UnitedHealth Demonstration Group",
    denialCode: "CO-197",
    rawDenial: `UnitedHealth Demonstration Group
Explanation of Benefits

Claim ID: UHC-2025-90214
Member: [REDACTED]
Date of Service: 2025-05-08
Facility: [REDACTED] Imaging Center

Claim Status: DENIED

CARC: CO-197 — Precertification/authorization/notification/pre-treatment
absent.

Adjustment Reason: Prior authorization is required for advanced outpatient
imaging under the member's benefit plan. No authorization number was found
attached to the submitted claim. Provider may request retroactive
authorization within 30 calendar days of the date of service by submitting
clinical documentation supporting the medical necessity of the imaging study.

Submit appeals and retro-auth requests to: Provider Services Portal at
demo.uhc.example.com/providers or fax to (800) 555-0144.

Payable Amount: $0.00`,
    claimContext: `Date of service: 2025-05-08
Place of service: 22 (outpatient hospital)
Billed CPT lines:
  70553 — MRI brain, with and without contrast
ICD-10-CM pointers: R51.9 (Headache, unspecified), G44.1 (Vascular headache, NEC)
Modifiers on claim: none
Prior authorization on claim: none
Documentation summary: 6-week history of new-onset headaches with visual
aura. Neuro exam noted as normal. Patient referred by primary care for
imaging to rule out intracranial pathology.`,
  },
];
