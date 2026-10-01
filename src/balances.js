// Leave balances from `get_pto_summary_v2`, see docs/api/pto-summary.md.

const num = v => parseFloat(v ?? 0) || 0;

const refPeriod = r => ({ accrued: num(r?.accrued), taken: num(r?.taken), balance: num(r?.balance) });

// Accruing policies with days taken or planned, in API order:
// [{ policy, accrued, taken, planned, balance, annual, periodStart, split }],
// in days. `annual` is null when the policy does not accrue in days.
// `split` is { previous, current }, each { accrued, taken, balance }, for
// policies with a previous reference period (French paid leave), else null.
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
        split: p.frCopReferencePeriodBalance
          ? { previous: refPeriod(p.frCopReferencePeriodBalance.previous), current: refPeriod(p.frCopReferencePeriodBalance.current) }
          : null,
      };
    })
    .filter(b => b.taken > 0 || b.planned > 0);
}
