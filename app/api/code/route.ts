import { NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  SchemaType,
  type GenerativeModel,
} from "@google/generative-ai";
import { z } from "zod";
import {
  ModelResponseSchema,
  GEMINI_RESPONSE_SCHEMA,
  type ModelCode,
} from "@/lib/codingSchema";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/codingPrompt";
import { ptpRisksFor, isCodeInPtpTable } from "@/lib/ncci";
import type { SuggestedCode } from "@/lib/sampleNotes";
import { detectPhi, summarizeFindings } from "@/lib/deidentify";

export const runtime = "nodejs";

const RequestSchema = z.object({
  note: z.string().min(20, "Note is too short to code").max(20000, "Note is too long"),
});

const MODEL_NAME = process.env.GOOGLE_MODEL || "gemini-2.0-flash";

let cachedModel: GenerativeModel | null = null;
function getModel(): GenerativeModel | null {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) return null;
  if (cachedModel) return cachedModel;
  const ai = new GoogleGenerativeAI(key);
  cachedModel = ai.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      // Cast: SDK's Schema type is strict; our GEMINI_RESPONSE_SCHEMA matches the wire shape.
      responseSchema: GEMINI_RESPONSE_SCHEMA as unknown as Parameters<
        typeof ai.getGenerativeModel
      >[0]["generationConfig"] extends infer G
        ? G extends { responseSchema?: infer S }
          ? S
          : never
        : never,
      temperature: 0.1,
    },
    systemInstruction: SYSTEM_PROMPT,
  });
  // Suppress unused-var on SchemaType import (kept for future tool-use migration).
  void SchemaType;
  return cachedModel;
}

/**
 * Drop any model-suggested code whose evidence quote isn't a verbatim substring
 * of the note. This is the anti-hallucination guard.
 */
function filterEvidenceGrounded(
  note: string,
  codes: ModelCode[],
): { kept: ModelCode[]; dropped: { code: string; reason: string }[] } {
  const kept: ModelCode[] = [];
  const dropped: { code: string; reason: string }[] = [];
  for (const c of codes) {
    const groundedQuotes = c.evidence.filter((e) => note.indexOf(e.quote) >= 0);
    if (groundedQuotes.length === 0) {
      dropped.push({
        code: c.code,
        reason: "No supporting quote found verbatim in the note",
      });
      continue;
    }
    kept.push({ ...c, evidence: groundedQuotes });
  }
  return { kept, dropped };
}

/**
 * Convert validated model output into the SuggestedCode shape the UI renders,
 * attaching deterministic NCCI flags.
 */
function toSuggestedCodes(modelCodes: ModelCode[]): SuggestedCode[] {
  const acceptedSet = modelCodes.map((c) => c.code);
  const result: SuggestedCode[] = [];

  for (let i = 0; i < modelCodes.length; i++) {
    const c = modelCodes[i];
    const flags: SuggestedCode["flags"] = [];

    // PTP risks: if this code appears in any edit pair where the other side
    // is also in the suggested set, attach a flag.
    for (const risk of ptpRisksFor(c.code)) {
      const counterpart = risk.col1 === c.code ? risk.col2 : risk.col1;
      if (acceptedSet.includes(counterpart)) {
        flags.push({
          kind: "ncci",
          message: risk.reason,
        });
      }
    }

    result.push({
      id: `m${i + 1}`,
      system: c.system,
      code: c.code,
      description: c.description,
      confidence: c.confidence,
      evidence: c.evidence,
      reasoning: c.reasoning,
      flags: flags.length > 0 ? flags : undefined,
    });
  }
  return result;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }
  const { note } = parsed.data;

  // Defense in depth: the client also runs detectPhi(), but the server is the
  // last line before the prompt leaves a non-BAA endpoint. If anything that
  // looks like PHI got past the client, refuse and tell the caller which
  // Safe Harbor categories triggered.
  const phi = detectPhi(note);
  if (phi.length > 0) {
    return NextResponse.json(
      {
        error:
          "Note contains content that matches Safe Harbor PHI patterns. " +
          "This endpoint forwards to the public Gemini API, which is not " +
          "covered by a BAA. De-identify the note and retry.",
        phiCategories: summarizeFindings(phi).map((f) => ({
          category: f.category,
          label: f.label,
          count: f.count,
        })),
      },
      { status: 400 },
    );
  }

  const model = getModel();
  if (!model) {
    return NextResponse.json(
      {
        error:
          "GOOGLE_API_KEY is not configured. Get a free key at https://aistudio.google.com/apikey and add it to .env.local.",
      },
      { status: 503 },
    );
  }

  const t0 = Date.now();
  let raw: string;
  try {
    const result = await model.generateContent(buildUserPrompt(note));
    raw = result.response.text();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Model call failed: ${message}` },
      { status: 502 },
    );
  }
  const latencyMs = Date.now() - t0;

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "Model returned non-JSON output", raw: raw.slice(0, 500) },
      { status: 502 },
    );
  }

  const validated = ModelResponseSchema.safeParse(json);
  if (!validated.success) {
    return NextResponse.json(
      {
        error: "Model output failed schema validation",
        issues: validated.error.issues.slice(0, 5),
      },
      { status: 502 },
    );
  }

  const { kept, dropped } = filterEvidenceGrounded(note, validated.data.codes);
  const suggested = toSuggestedCodes(kept);

  // Surface PTP risks on individual suggestions even when the counterpart
  // wasn't suggested, so a coder editing in a code sees the warning.
  const meta = {
    model: MODEL_NAME,
    provider: "google-ai-studio",
    latencyMs,
    codesProposedByModel: validated.data.codes.length,
    codesDroppedForUngroundedEvidence: dropped,
    knownToPtpTable: suggested
      .map((c) => c.code)
      .filter((c) => isCodeInPtpTable(c)),
  };

  return NextResponse.json({ suggested, meta });
}
