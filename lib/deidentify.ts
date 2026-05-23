/**
 * Safe Harbor de-identification (HIPAA §164.514(b)(2)).
 *
 * Detects and redacts the 18 identifier categories that, when removed, allow PHI
 * to be treated as de-identified under the Safe Harbor method. Regex can only
 * cover the textual categories — biometric identifiers and full-face photos are
 * out of scope here and must be handled upstream (don't accept image uploads at
 * all in a Safe Harbor workflow).
 *
 * This module is intentionally conservative: it favours flagging real PHI over
 * minimising false positives. Callers should treat findings as a *stop and ask
 * the human* signal, not as a silent rewrite.
 */

export type PhiCategory =
  | "name"
  | "address"
  | "zip"
  | "date"
  | "age_over_89"
  | "phone_or_fax"
  | "email"
  | "ssn"
  | "mrn"
  | "account"
  | "url"
  | "ip"
  | "device_or_id";

export type PhiFinding = {
  category: PhiCategory;
  /** Human-readable name of the Safe Harbor category. */
  label: string;
  /** Char offset (UTF-16 code units) into the input string. */
  start: number;
  end: number;
  /** Raw substring matched. Callers that surface this to the UI should mask it. */
  match: string;
  /** Replacement token written by deidentify(). */
  redacted: string;
};

/**
 * Order matters: rules that match longer / more-specific tokens run first so
 * later rules don't carve up the same substring. We dedupe overlapping ranges
 * after collecting all matches.
 */
const RULES: {
  category: PhiCategory;
  label: string;
  pattern: RegExp;
  redacted: string;
}[] = [
  {
    category: "ssn",
    label: "Social Security Number",
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    redacted: "[SSN]",
  },
  {
    category: "email",
    label: "Email address",
    pattern: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g,
    redacted: "[EMAIL]",
  },
  {
    category: "url",
    label: "URL",
    pattern: /\bhttps?:\/\/[^\s<>"')]+/gi,
    redacted: "[URL]",
  },
  {
    category: "ip",
    label: "IP address",
    pattern: /\b(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}\b/g,
    redacted: "[IP]",
  },
  {
    category: "mrn",
    label: "Medical Record Number",
    pattern: /\bMRN\s*[#:.]?\s*[A-Z0-9-]{4,}\b/gi,
    redacted: "[MRN]",
  },
  {
    category: "account",
    label: "Account / member / policy number",
    pattern:
      /\b(?:acct|account|member(?:\s+id)?|policy(?:\s+(?:no|number|#))?)\s*[#:.]?\s*[A-Z0-9-]{4,}\b/gi,
    redacted: "[ACCOUNT]",
  },
  {
    category: "device_or_id",
    label: "Device / serial / certificate identifier",
    pattern:
      /\b(?:serial|s\/n|sn|device(?:\s+id)?|cert(?:ificate)?(?:\s+no)?|license(?:\s+no)?|vin)\s*[#:.]?\s*[A-Z0-9-]{4,}\b/gi,
    redacted: "[DEVICE_ID]",
  },
  {
    category: "name",
    label: "Name (labeled)",
    // "Patient: Jane Smith", "Pt Name: J Smith", "DOB ... Name: ..."
    // Label part is case-insensitive via character classes; the *name* part
    // stays Title-cased so we don't flag every "patient: see attached" string.
    pattern:
      /\b(?:[Pp][Tt](?:\s+[Nn]ame)?|[Pp]atient(?:\s+[Nn]ame)?|[Nn]ame)\s*[:#]\s*(?:Dr\.?|Mr\.?|Mrs\.?|Ms\.?\s+)?[A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+/g,
    redacted: "[NAME]",
  },
  {
    category: "address",
    label: "Street address",
    pattern:
      /\b\d{1,5}\s+(?:[A-Z][a-z]+\s+){1,4}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way|Place|Pl|Terrace|Ter|Highway|Hwy)\.?\b/g,
    redacted: "[ADDRESS]",
  },
  {
    category: "phone_or_fax",
    label: "Phone or fax number",
    pattern:
      /(?<!\d)(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}(?!\d)/g,
    redacted: "[PHONE]",
  },
  {
    category: "date",
    label: "Date more precise than year",
    pattern:
      /\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:,\s*|\s+)\d{4})\b/gi,
    redacted: "[DATE]",
  },
  {
    category: "age_over_89",
    label: "Age over 89",
    // "92 y/o", "94-year-old", "101 yo" — Safe Harbor caps age at 89.
    pattern: /\b(?:9[0-9]|1\d{2})[-\s]?(?:y\.?o\.?|yo|year[-\s]?old|years?\s*old)\b/gi,
    redacted: "[AGE_OVER_89]",
  },
  {
    category: "zip",
    label: "ZIP code",
    // Labeled ZIPs only — bare 5-digit numbers are too ambiguous (lab values,
    // dose mg, etc). Catches "ZIP 90210", "ZIP: 90210-1234".
    pattern: /\bzip\s*(?:code)?[:.\s]*\d{5}(?:-\d{4})?\b/gi,
    redacted: "[ZIP]",
  },
];

/** Find all PHI matches in `text`. Overlapping matches are deduped (longest wins). */
export function detectPhi(text: string): PhiFinding[] {
  const raw: PhiFinding[] = [];

  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rule.pattern.exec(text)) !== null) {
      if (m[0].length === 0) {
        rule.pattern.lastIndex++;
        continue;
      }
      raw.push({
        category: rule.category,
        label: rule.label,
        start: m.index,
        end: m.index + m[0].length,
        match: m[0],
        redacted: rule.redacted,
      });
    }
  }

  raw.sort((a, b) => a.start - b.start || b.end - a.end);
  const kept: PhiFinding[] = [];
  let lastEnd = -1;
  for (const f of raw) {
    if (f.start >= lastEnd) {
      kept.push(f);
      lastEnd = f.end;
    }
  }
  return kept;
}

/**
 * Replace every detected identifier with its category token (e.g. `[SSN]`).
 * Returns the redacted text and the findings list so the caller can show the
 * user what was removed.
 */
export function deidentify(text: string): { text: string; findings: PhiFinding[] } {
  const findings = detectPhi(text);
  let out = text;
  for (let i = findings.length - 1; i >= 0; i--) {
    const f = findings[i];
    out = out.slice(0, f.start) + f.redacted + out.slice(f.end);
  }
  return { text: out, findings };
}

/**
 * Mask a matched substring for safe display in the UI — keeps a couple of
 * leading characters so the user can recognise their own input, hides the rest.
 */
export function maskFinding(match: string): string {
  if (match.length <= 4) return "•".repeat(match.length);
  return match.slice(0, 2) + "•".repeat(Math.min(match.length - 2, 10));
}

/** Group findings by category for compact UI rendering. */
export function summarizeFindings(
  findings: PhiFinding[],
): { category: PhiCategory; label: string; count: number; examples: string[] }[] {
  const byCat = new Map<
    PhiCategory,
    { category: PhiCategory; label: string; count: number; examples: string[] }
  >();
  for (const f of findings) {
    const entry =
      byCat.get(f.category) ??
      { category: f.category, label: f.label, count: 0, examples: [] };
    entry.count += 1;
    if (entry.examples.length < 3) entry.examples.push(maskFinding(f.match));
    byCat.set(f.category, entry);
  }
  return Array.from(byCat.values());
}
