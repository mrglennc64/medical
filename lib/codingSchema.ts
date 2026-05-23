import { z } from "zod";

/**
 * The contract Gemini must return. Mirrors `SuggestedCode` from sampleNotes.ts
 * minus the `id` (assigned post-validation) and `flags` (added by the rule engine).
 */
export const ModelCodeSchema = z.object({
  system: z.enum(["CPT", "ICD-10-CM", "HCPCS"]),
  code: z.string().min(1).max(20),
  description: z.string().min(1).max(500),
  confidence: z.number().min(0).max(1),
  evidence: z
    .array(
      z.object({
        quote: z.string().min(3).max(400),
      }),
    )
    .min(1)
    .max(8),
  reasoning: z.string().min(1).max(1000),
});

export const ModelResponseSchema = z.object({
  codes: z.array(ModelCodeSchema).min(0).max(15),
});

export type ModelCode = z.infer<typeof ModelCodeSchema>;
export type ModelResponse = z.infer<typeof ModelResponseSchema>;

/** Gemini structured-output schema (subset of OpenAPI 3 schema). */
export const GEMINI_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    codes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          system: { type: "string", enum: ["CPT", "ICD-10-CM", "HCPCS"] },
          code: { type: "string" },
          description: { type: "string" },
          confidence: { type: "number" },
          evidence: {
            type: "array",
            items: {
              type: "object",
              properties: { quote: { type: "string" } },
              required: ["quote"],
            },
          },
          reasoning: { type: "string" },
        },
        required: [
          "system",
          "code",
          "description",
          "confidence",
          "evidence",
          "reasoning",
        ],
      },
    },
  },
  required: ["codes"],
} as const;
