/**
 * NCCI Procedure-to-Procedure (PTP) edit lookup.
 *
 * For v1 we ship a small hand-curated subset relevant to outpatient E/M coding.
 * The production version would load the quarterly CMS PTP CSV
 * (https://www.cms.gov/medicare/coding-billing/national-correct-coding-initiative-ncci-edits)
 * which is ~2M rows.
 *
 * Each entry: column-1 code, column-2 code, modifier indicator
 *   "0" = no modifier allowed (always denied)
 *   "1" = modifier allowed if clinically justified
 *   "9" = no longer active
 *
 * If the chart's accepted code set contains a (col1, col2) pair, the col2 code
 * is denied unless an appropriate modifier is appended.
 */

export type PtpEdit = {
  col1: string;
  col2: string;
  modifierIndicator: "0" | "1";
  reason: string;
};

const PTP_EDITS: PtpEdit[] = [
  // E/M visits bundled with minor procedures performed same day
  {
    col1: "10060",
    col2: "99213",
    modifierIndicator: "1",
    reason:
      "Office visit (99213) bundled into incision and drainage of abscess (10060). Append modifier -25 to the E/M if a separately identifiable evaluation occurred.",
  },
  {
    col1: "11042",
    col2: "99213",
    modifierIndicator: "1",
    reason:
      "Office visit bundled into debridement (11042). Modifier -25 required on E/M if separately documented.",
  },
  {
    col1: "73562",
    col2: "73560",
    modifierIndicator: "0",
    reason:
      "73562 (knee, 3 views) and 73560 (knee, 1-2 views) cannot be reported together for the same encounter — bill the more comprehensive code only.",
  },
  // Combination diagnosis codes that should not be paired with their components
  {
    col1: "E11.42",
    col2: "E11.9",
    modifierIndicator: "0",
    reason:
      "E11.42 (T2DM with diabetic polyneuropathy) is a combination code. Do not also report E11.9 (T2DM without complications).",
  },
  {
    col1: "E11.42",
    col2: "G62.9",
    modifierIndicator: "0",
    reason:
      "E11.42 already includes the polyneuropathy. Do not separately report G62.9 (polyneuropathy, unspecified).",
  },
];

const ALL_CODES = new Set<string>();
for (const e of PTP_EDITS) {
  ALL_CODES.add(e.col1);
  ALL_CODES.add(e.col2);
}

export type PtpFlag = {
  pair: [string, string];
  modifierIndicator: "0" | "1";
  reason: string;
};

/**
 * Given a set of codes the coder has accepted, return any PTP edits that fire.
 * Returns flags scoped to the col2 (the code that would be denied).
 */
export function findPtpConflicts(codes: string[]): PtpFlag[] {
  const set = new Set(codes);
  const flags: PtpFlag[] = [];
  for (const e of PTP_EDITS) {
    if (set.has(e.col1) && set.has(e.col2)) {
      flags.push({
        pair: [e.col1, e.col2],
        modifierIndicator: e.modifierIndicator,
        reason: e.reason,
      });
    }
  }
  return flags;
}

/** Lookup any single-code-against-everything PTP risk for highlighting in suggestions. */
export function ptpRisksFor(code: string): PtpEdit[] {
  return PTP_EDITS.filter((e) => e.col1 === code || e.col2 === code);
}

export function isCodeInPtpTable(code: string): boolean {
  return ALL_CODES.has(code);
}
