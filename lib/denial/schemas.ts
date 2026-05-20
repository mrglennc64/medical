import { z } from "zod";

/**
 * Co-defined Zod + Gemini OpenAPI 3 schemas for the three denial-engine endpoints.
 * Same pattern as lib/codingSchema.ts: Zod validates server-side, the OpenAPI 3
 * shape is fed to Gemini's responseSchema for structured-output enforcement.
 */

// ---------------------------------------------------------------------------
// 1. Analyze — extract a structured DenialAnalysis from raw denial text.
// ---------------------------------------------------------------------------

export const DENIAL_CATEGORIES = [
  "missing information",
  "medical necessity",
  "authorization",
  "duplicate / already paid",
  "coordination of benefits",
  "timely filing",
  "other",
] as const;

export const DenialAnalysisSchema = z.object({
  claimId: z.string().nullable(),
  payer: z.string().nullable(),
  denialCode: z.string().nullable(),
  denialCategory: z.enum(DENIAL_CATEGORIES),
  reasonText: z.string().min(1).max(800),
  suggestedRootCause: z.string().min(1).max(800),
  confidence: z.number().min(0).max(1),
});
export type DenialAnalysis = z.infer<typeof DenialAnalysisSchema>;

export const GEMINI_DENIAL_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    claimId: { type: "string", nullable: true },
    payer: { type: "string", nullable: true },
    denialCode: { type: "string", nullable: true },
    denialCategory: { type: "string", enum: [...DENIAL_CATEGORIES] },
    reasonText: { type: "string" },
    suggestedRootCause: { type: "string" },
    confidence: { type: "number" },
  },
  required: [
    "claimId",
    "payer",
    "denialCode",
    "denialCategory",
    "reasonText",
    "suggestedRootCause",
    "confidence",
  ],
} as const;

// ---------------------------------------------------------------------------
// 2. Correct — propose a corrected claim given the analysis + claim context.
// ---------------------------------------------------------------------------

export const DenialCorrectionSchema = z.object({
  // Full corrected CPT/HCPCS line list (not just deltas). Empty when the
  // root cause is a workflow issue (auth, timely filing, COB).
  correctedCodes: z.array(z.string().min(1).max(20)).max(20),
  // "CPT-MOD" pairs, e.g. "99213-25".
  correctedModifiers: z.array(z.string().min(1).max(20)).max(20),
  correctedDiagnosisCodes: z.array(z.string().min(1).max(20)).max(20),
  correctionRationale: z.string().min(1).max(1200),
});
export type DenialCorrection = z.infer<typeof DenialCorrectionSchema>;

export const GEMINI_DENIAL_CORRECTION_SCHEMA = {
  type: "object",
  properties: {
    correctedCodes: { type: "array", items: { type: "string" } },
    correctedModifiers: { type: "array", items: { type: "string" } },
    correctedDiagnosisCodes: { type: "array", items: { type: "string" } },
    correctionRationale: { type: "string" },
  },
  required: [
    "correctedCodes",
    "correctedModifiers",
    "correctedDiagnosisCodes",
    "correctionRationale",
  ],
} as const;

// ---------------------------------------------------------------------------
// 3. Appeal — generate a payer-ready appeal packet.
// ---------------------------------------------------------------------------

export const AppealPacketSchema = z.object({
  appealLetter: z.string().min(1).max(5000),
  suggestedAttachments: z.array(z.string().min(1).max(200)).max(15),
  payerInstructions: z.string().min(1).max(800),
});
export type AppealPacket = z.infer<typeof AppealPacketSchema>;

export const GEMINI_APPEAL_PACKET_SCHEMA = {
  type: "object",
  properties: {
    appealLetter: { type: "string" },
    suggestedAttachments: { type: "array", items: { type: "string" } },
    payerInstructions: { type: "string" },
  },
  required: ["appealLetter", "suggestedAttachments", "payerInstructions"],
} as const;
