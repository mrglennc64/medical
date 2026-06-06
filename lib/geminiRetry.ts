import type { GenerativeModel } from "@google/generative-ai";

/**
 * Shared retry wrapper for Gemini calls.
 *
 * Google's Generative Language API returns transient 503 ("model is currently
 * experiencing high demand") and occasional network blips that clear within a
 * few seconds. Every API route here makes a single generateContent() call, so
 * one such blip surfaces to the user as a hard failure. This retries those —
 * and only those — with exponential backoff + jitter.
 *
 * Deliberately NOT retried: quota 429s (free-tier daily/per-minute exhaustion).
 * Those don't recover inside a request window, so we fail fast and let the
 * route surface the quota message instead of stalling for seconds.
 */

const TRANSIENT_PATTERN =
  /\b(503|Service Unavailable|overloaded|high demand|UNAVAILABLE|ECONNRESET|ETIMEDOUT|fetch failed|socket hang up)\b/i;

export function isTransientModelError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return TRANSIENT_PATTERN.test(msg);
}

type GenerateResult = Awaited<ReturnType<GenerativeModel["generateContent"]>>;

export async function generateWithRetry(
  model: GenerativeModel,
  prompt: string,
  opts: { retries?: number; baseDelayMs?: number } = {},
): Promise<GenerateResult> {
  const retries = opts.retries ?? 2;
  const baseDelayMs = opts.baseDelayMs ?? 600;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await model.generateContent(prompt);
    } catch (err) {
      lastErr = err;
      if (attempt === retries || !isTransientModelError(err)) throw err;
      const backoff =
        baseDelayMs * 2 ** attempt + Math.floor(Math.random() * 250);
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }
  throw lastErr;
}
