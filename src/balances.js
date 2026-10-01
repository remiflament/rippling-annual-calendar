// Leave balances from `get_pto_summary_v2`, see docs/api/pto-summary.md.

const num = v => parseFloat(v ?? 0) || 0;

// Accruing policies only, in API order:
// [{ policy, accrued, taken, planned, balance, annual, periodStart }], in days.
// `annual` is null when the policy does not accrue in days.
export function balancesFromSummary(summary) {
  return (summary?.pto_summary ?? [])
    .filter(p => p.isFixedLeavePolicy && p.accruedInCurrentPeriod)
    .map(p => {
      const ts = p.takenAndScheduled ?? {};
      return {
        policy: p.policyDisplayName || '??',
        accrued: num(p.accruedInCurrentPeriod.days),
        taken: num(ts.taken?.days),
        planned: num(ts.futureApproved?.days) + num(ts.pending?.days),
        balance: num(p.balanceDays),
        annual: p.accrueInDays ? num(p.hourlyRate) : null,
        periodStart: p.accountingYearStart,
      };
    });
}
