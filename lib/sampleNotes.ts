/**
 * MTSamples-style outpatient E/M sample notes with hardcoded coding suggestions.
 * No PHI. Notes are synthetic and follow public MTSamples patterns.
 *
 * Each `evidence.quote` is a verbatim substring of `note` — the demo highlights its
 * first occurrence when the user inspects the code.
 */

export type CodeSystem = "CPT" | "ICD-10-CM" | "HCPCS";

export type SuggestedCode = {
  id: string;
  system: CodeSystem;
  code: string;
  description: string;
  /** 0..1 model confidence (synthetic for the demo). */
  confidence: number;
  /** Substring(s) of `note` justifying this code. */
  evidence: { quote: string }[];
  /** One-sentence rationale. */
  reasoning: string;
  /** NCCI / payer-rule flags. */
  flags?: { kind: "ncci" | "modifier" | "lcd" | "documentation"; message: string }[];
};

export type QueueStatus = "pending" | "in_review" | "done";

export type SampleNote = {
  id: string;
  /** Stable, fake chart number for inbox display. */
  chart_id: string;
  /** Deidentified patient label. Never a real name. */
  patient_label: string;
  age: number;
  sex: "M" | "F";
  visit_type: "new" | "established";
  chief_complaint: string;
  title: string;
  setting: string;
  source: string;
  status: QueueStatus;
  /** Pre-rendered relative time so static prerender stays deterministic. */
  received_at: string;
  note: string;
  suggested: SuggestedCode[];
};

/**
 * Hardcoded historical KPI numbers for the dashboard.
 * In a real system these would come from an analytics warehouse.
 */
export const STATS = {
  done_today: 7,
  done_this_week: 142,
  accuracy_week: 96.2,
  avg_tat_hours: 18,
  top_flags: [
    { label: "NCCI PTP edit", count: 12 },
    { label: "Documentation gap", count: 8 },
    { label: "Modifier missing", count: 5 },
    { label: "LCD payer-specific", count: 3 },
  ],
  daily_throughput: [18, 22, 19, 26, 24, 21, 12], // last 7 days
} as const;

export const SAMPLE_NOTES: SampleNote[] = [
  {
    id: "em-established-99213",
    chart_id: "CHT-204891",
    patient_label: "Patient A",
    age: 42,
    sex: "F",
    visit_type: "established",
    chief_complaint: "Sinus congestion and facial pressure x 6 days",
    title: "Established patient — sinusitis follow-up",
    setting: "Outpatient family medicine",
    source: "Synthetic, MTSamples-style",
    status: "pending",
    received_at: "2h ago",
    note: `CHIEF COMPLAINT: Sinus congestion and facial pressure x 6 days.

HPI: 42-year-old established patient returns for follow-up of acute sinusitis. Reports persistent maxillary pressure, purulent nasal discharge, and post-nasal drip despite a 5-day course of amoxicillin started by urgent care last week. No fever today. No tooth pain. No vision changes. Sleep disrupted by nasal congestion.

ROS: Constitutional - no fever, no chills. ENT - maxillary tenderness, congestion, post-nasal drip. Resp - mild cough, no SOB. All other systems negative.

PMH: Hypertension, well-controlled on lisinopril.

EXAM: BP 128/78, HR 72, T 98.4F. General: NAD. HEENT: tenderness over bilateral maxillary sinuses. Nares with erythematous mucosa and purulent discharge. Oropharynx clear. Neck supple. Lungs clear bilaterally.

ASSESSMENT/PLAN:
1. Acute bacterial sinusitis, not improving on first-line antibiotic. Switching to amoxicillin-clavulanate 875/125 BID x 10 days. Discussed warning signs.
2. Hypertension - stable, continue lisinopril.
Patient instructed to return or call if symptoms worsen, fever develops, or vision changes occur.

Time spent: 18 minutes face-to-face, MDM moderate complexity.`,
    suggested: [
      {
        id: "c1",
        system: "CPT",
        code: "99213",
        description:
          "Office/outpatient visit, established patient, low-to-moderate MDM, 20–29 min total time",
        confidence: 0.91,
        evidence: [
          { quote: "Time spent: 18 minutes face-to-face, MDM moderate complexity." },
        ],
        reasoning:
          "Established patient, single acute uncomplicated illness with prescription drug management; documented total time 18 min and moderate MDM supports 99213 (could justify 99214 if total time includes pre/post review).",
        flags: [
          {
            kind: "documentation",
            message:
              "If total time including chart review/orders ≥ 20 min, 99214 may be supportable. Confirm with provider.",
          },
        ],
      },
      {
        id: "c2",
        system: "ICD-10-CM",
        code: "J01.00",
        description: "Acute maxillary sinusitis, unspecified",
        confidence: 0.88,
        evidence: [
          { quote: "Acute bacterial sinusitis" },
          { quote: "tenderness over bilateral maxillary sinuses" },
        ],
        reasoning:
          "Documentation specifies acute sinusitis localized to bilateral maxillary sinuses; J01.00 used because laterality not separately coded for maxillary sinusitis in ICD-10-CM.",
      },
      {
        id: "c3",
        system: "ICD-10-CM",
        code: "I10",
        description: "Essential (primary) hypertension",
        confidence: 0.95,
        evidence: [
          { quote: "Hypertension, well-controlled on lisinopril." },
          { quote: "Hypertension - stable, continue lisinopril." },
        ],
        reasoning:
          "Active comorbidity addressed in the assessment/plan; codeable as it influenced today's MDM (medication continuation).",
      },
      {
        id: "c4",
        system: "ICD-10-CM",
        code: "Z79.899",
        description: "Other long term (current) drug therapy",
        confidence: 0.42,
        evidence: [
          { quote: "continue lisinopril" },
        ],
        reasoning:
          "Optional add-on for long-term ACE inhibitor use. Some payers require it; many do not. Low confidence — recommend reject unless payer-specific guideline applies.",
        flags: [
          {
            kind: "lcd",
            message: "Payer-specific. Reject by default unless contractor LCD requires Z79.x.",
          },
        ],
      },
    ],
  },

  {
    id: "em-new-99203",
    chart_id: "CHT-204912",
    patient_label: "Patient B",
    age: 34,
    sex: "M",
    visit_type: "new",
    chief_complaint: "Right knee pain after fall, weight-bearing limp",
    title: "New patient — knee pain after fall",
    setting: "Outpatient orthopedic urgent care",
    source: "Synthetic, MTSamples-style",
    status: "pending",
    received_at: "5m ago",
    note: `CHIEF COMPLAINT: Right knee pain after a fall 2 days ago.

HPI: 34-year-old new patient slipped on icy steps and landed on flexed right knee. Reports immediate pain, mild swelling that night, and difficulty bearing full weight today. Denies hearing a pop. No prior knee injuries. Able to walk with limp. No numbness or tingling distally.

ROS: MSK - right knee pain and stiffness. Constitutional - no fever. Neuro - no numbness, no weakness. All other systems negative.

PMH: None. PSH: None. Meds: ibuprofen PRN. NKDA.

EXAM: BP 122/74, HR 68. Right knee with mild effusion, tender along medial joint line. Full extension, flexion limited to 110 degrees by pain. Negative anterior drawer, negative Lachman. McMurray equivocal medially. Distal pulses 2+, sensation intact, capillary refill brisk. Skin intact, no abrasions.

IMAGING: Right knee 3-view X-ray obtained in office: no acute fracture, no effusion-related joint widening, alignment preserved.

ASSESSMENT/PLAN:
1. Right knee contusion with possible medial meniscus strain. RICE, knee sleeve, weight-bearing as tolerated. NSAIDs continued.
2. Will obtain MRI if not improving in 2 weeks.
3. Return precautions discussed.

Time spent: 32 minutes face-to-face. New patient, MDM moderate.`,
    suggested: [
      {
        id: "c1",
        system: "CPT",
        code: "99203",
        description:
          "Office/outpatient visit, new patient, low MDM, 30–44 min total time",
        confidence: 0.86,
        evidence: [
          { quote: "Time spent: 32 minutes face-to-face. New patient" },
        ],
        reasoning:
          "New patient, total time 32 min in the 30–44 min band; one undiagnosed new problem with uncertain prognosis (low-moderate MDM) supports 99203. 99204 possible if MDM judged moderate with extended review.",
        flags: [
          {
            kind: "documentation",
            message:
              "Provider documented MDM as 'moderate' but data reviewed appears limited (X-ray only). Verify before upcoding to 99204.",
          },
        ],
      },
      {
        id: "c2",
        system: "CPT",
        code: "73562",
        description: "Radiologic exam, knee; 3 views",
        confidence: 0.94,
        evidence: [
          { quote: "Right knee 3-view X-ray obtained in office" },
        ],
        reasoning:
          "In-office 3-view knee X-ray is separately reportable. Append modifier 26 if professional component only; TC if technical only.",
        flags: [
          {
            kind: "modifier",
            message:
              "Verify global vs. split billing. If radiologist reads externally, append -TC here and -26 on radiologist's claim.",
          },
        ],
      },
      {
        id: "c3",
        system: "ICD-10-CM",
        code: "S80.011A",
        description:
          "Contusion of right knee, initial encounter",
        confidence: 0.90,
        evidence: [
          { quote: "Right knee contusion" },
          { quote: "fall 2 days ago" },
        ],
        reasoning:
          "Right knee contusion, initial encounter (7th character A). Laterality and encounter type both documented.",
      },
      {
        id: "c4",
        system: "ICD-10-CM",
        code: "W00.0XXA",
        description:
          "Fall on same level due to ice and snow, initial encounter",
        confidence: 0.83,
        evidence: [
          { quote: "slipped on icy steps" },
        ],
        reasoning:
          "External cause code for fall on ice. Required by some payers and for workers' comp / liability cases.",
        flags: [
          {
            kind: "lcd",
            message:
              "External cause codes are payer-discretionary in most outpatient settings. Verify whether this practice's payer mix requires them.",
          },
        ],
      },
    ],
  },

  {
    id: "em-established-99214",
    chart_id: "CHT-204903",
    patient_label: "Patient C",
    age: 58,
    sex: "F",
    visit_type: "established",
    chief_complaint: "Diabetes follow-up; A1c rising",
    title: "Established patient — diabetes follow-up",
    setting: "Outpatient internal medicine",
    source: "Synthetic, MTSamples-style",
    status: "in_review",
    received_at: "1h ago",
    note: `CHIEF COMPLAINT: Diabetes follow-up. A1c review.

HPI: 58-year-old established patient with type 2 diabetes mellitus and hyperlipidemia returns for routine 3-month follow-up. Reports adherence to metformin 1000 mg BID. Home glucose log shows fasting values 130–160 range, post-prandial 180–220. Occasional missed evening dose. Diet has slipped over the holidays. No polyuria, polydipsia, no episodes of hypoglycemia. Vision stable. No foot lesions. Mild paresthesias in toes bilaterally, unchanged from prior visit.

ROS: Endocrine - as per HPI. Neuro - bilateral toe paresthesias, no progression. Cardio - no chest pain, no SOB. All other systems reviewed and negative.

PMH: Type 2 DM (8 years), hyperlipidemia, mild diabetic peripheral neuropathy.
Meds: Metformin 1000 mg BID, atorvastatin 40 mg QHS, gabapentin 300 mg QHS.

EXAM: BP 138/82, HR 76, BMI 31.4. General: well-appearing. Foot exam: pulses 2+, monofilament intact at all sites, no ulceration. Cardio: RRR, no murmurs. Neuro: decreased vibratory sense bilateral great toes, otherwise intact.

LABS REVIEWED: A1c 8.2 (up from 7.6 three months ago). LDL 96. eGFR 78. UACR 24 (normal).

ASSESSMENT/PLAN:
1. Type 2 DM with neuropathy, suboptimal control. Adding empagliflozin 10 mg daily. Reviewed CV/renal benefits and risks (volume depletion, GU infection, DKA awareness). Will reassess A1c in 3 months.
2. Diabetic peripheral neuropathy - stable. Continue gabapentin.
3. Hyperlipidemia - LDL at goal on atorvastatin, continue.
4. Lifestyle: referred to dietitian, encouraged 30 min walking 5x/week.

Time spent: 28 minutes total including chart review and order entry. MDM moderate-high.`,
    suggested: [
      {
        id: "c1",
        system: "CPT",
        code: "99214",
        description:
          "Office/outpatient visit, established patient, moderate MDM, 30–39 min total time",
        confidence: 0.83,
        evidence: [
          { quote: "Time spent: 28 minutes total including chart review and order entry. MDM moderate-high." },
        ],
        reasoning:
          "Established patient, 2+ chronic conditions one of which is poorly controlled (DM A1c 8.2 trending up), prescription drug management with new SGLT2 inhibitor → moderate MDM = 99214. Total time documented at 28 min is just under the 30-min threshold; MDM-based selection is the stronger basis.",
        flags: [
          {
            kind: "documentation",
            message:
              "Time documented as 28 min (below 30-min 99214 threshold). Bill on MDM, not time. Confirm provider intent.",
          },
        ],
      },
      {
        id: "c2",
        system: "ICD-10-CM",
        code: "E11.42",
        description:
          "Type 2 diabetes mellitus with diabetic polyneuropathy",
        confidence: 0.92,
        evidence: [
          { quote: "Type 2 DM with neuropathy" },
          { quote: "Diabetic peripheral neuropathy" },
        ],
        reasoning:
          "Combination code for T2DM with diabetic polyneuropathy. Replaces both E11.9 and a separate neuropathy code per ICD-10-CM combination-coding rules.",
        flags: [
          {
            kind: "ncci",
            message:
              "Do NOT additionally code E11.9 (T2DM without complications) — combination code E11.42 captures both. Reject any E11.9 suggestion alongside this.",
          },
        ],
      },
      {
        id: "c3",
        system: "ICD-10-CM",
        code: "E78.5",
        description: "Hyperlipidemia, unspecified",
        confidence: 0.88,
        evidence: [
          { quote: "Hyperlipidemia - LDL at goal on atorvastatin" },
        ],
        reasoning:
          "Active condition addressed in the plan (continue atorvastatin). Codeable per ICD-10-CM outpatient guidelines I.B.4.",
      },
      {
        id: "c4",
        system: "ICD-10-CM",
        code: "E66.9",
        description: "Obesity, unspecified",
        confidence: 0.55,
        evidence: [
          { quote: "BMI 31.4" },
        ],
        reasoning:
          "BMI > 30 documented and provider gave lifestyle counseling — supports E66.9 + Z68.31 (BMI 31.0–31.9). Some auditors require explicit 'obesity' diagnosis in the assessment to code, which is not present here.",
        flags: [
          {
            kind: "documentation",
            message:
              "Obesity not explicitly listed in assessment. Coder may need provider clarification before adding.",
          },
        ],
      },
    ],
  },
];

export function getSampleById(id: string): SampleNote | undefined {
  return SAMPLE_NOTES.find((s) => s.id === id);
}
