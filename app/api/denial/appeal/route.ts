import { NextResponse } from "next/server";
import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import { z } from "zod";
import {
  DenialAnalysisSchema,
  DenialCorrectionSchema,
  AppealPacketSchema,
  GEMINI_APPEAL_PACKET_SCHEMA,
} from "@/lib/denial/schemas";
import {
  APPEAL_SYSTEM_PROMPT,
  buildAppealUserPrompt,
} from "@/lib/denial/prompts";
import { generateWithRetry, isTransientModelError } from "@/lib/geminiRetry";

export const runtime = "nodejs";

const RequestSchema = z.object({
  denialText: z.string().min(30).max(20000),
  claimContext: z.string().min(10).max(5000),
  analysis: DenialAnalysisSchema,
  correction: DenialCorrectionSchema,
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
      responseSchema: GEMINI_APPEAL_PACKET_SCHEMA as unknown as Parameters<
        typeof ai.getGenerativeModel
      >[0]["generationConfig"] extends infer G
        ? G extends { responseSchema?: infer S }
          ? S
          : never
        : never,
      temperature: 0.2,
    },
    systemInstruction: APPEAL_SYSTEM_PROMPT,
  });
  return cachedModel;
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
  const { denialText, claimContext, analysis, correction } = parsed.data;

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
    const result = await generateWithRetry(
      model,
      buildAppealUserPrompt(denialText, claimContext, analysis, correction),
    );
    raw = result.response.text();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (isTransientModelError(err)) {
      return NextResponse.json(
        {
          error:
            "The model is temporarily overloaded. Please try again in a moment.",
        },
        { status: 503 },
      );
    }
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

  const validated = AppealPacketSchema.safeParse(json);
  if (!validated.success) {
    return NextResponse.json(
      {
        error: "Model output failed schema validation",
        issues: validated.error.issues.slice(0, 5),
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    packet: validated.data,
    meta: {
      model: MODEL_NAME,
      provider: "google-ai-studio",
      latencyMs,
    },
  });
}
