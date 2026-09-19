import type {
  FinancialProfile,
  FinancialEvent,
  RequestItem,
  RequestPaymentOption,
  EvaluationResult,
  CandidatePlan,
  SimulationDay,
  AffordabilityStatus,
  PaymentMethod
} from '../types';

export function evaluateAffordability(
  profile: FinancialProfile,
  events: FinancialEvent[],
  request: RequestItem,
  options: RequestPaymentOption[]
): { result: EvaluationResult; simulation: SimulationDay[] } {
  const reqDateStr = request.request_date;
  const requestedAmt = Number(request.requested_amount);
  const userEvents = events.filter(e => e.user_id === profile.user_id);

  // Filter valid events (ignore cancelled/failed/unrealized)
  const activeEvents = userEvents.filter(
    e => e.status !== 'cancelled' && e.status !== 'unrealized'
  );

  // 1. Calculate safe amount today via binary search simulation
  const safeAmountToday = calculateAmountSafeToday(
    profile,
    activeEvents,
    reqDateStr,
    requestedAmt
  );

  // 2. Calculate earliest safe full payment date within 90 days
  const earliestFullDate = findEarliestFullPaymentDate(
    profile,
    activeEvents,
    reqDateStr,
    requestedAmt
  );

  // 3. Generate candidate plans
  const candidates: CandidatePlan[] = [];

  // A. Full Payment Candidate
  if (profile.payment_methods_user_will_consider.includes('full_payment')) {
    const isSafe = testPlanSafety(profile, activeEvents, [
      { date: reqDateStr, amount: requestedAmt }
    ], []);

    candidates.push({
      id: 'plan_full',
      payment_method: 'full_payment',
      payment_schedule: [{ date: reqDateStr, amount: requestedAmt }],
      spending_changes: [],
      total_cost: requestedAmt,
      is_safe: isSafe,
      first_payment_date: reqDateStr,
      number_of_payments: 1
    });

    // If unsafe, try flexible spending changes
    if (!isSafe) {
      const flexEvents = activeEvents.filter(e => e.flexibility === 'flexible');
      for (const flexEvt of flexEvents) {
        const changeStr = `stop:${flexEvt.event_id}`;
        const isSafeWithStop = testPlanSafety(profile, activeEvents, [
          { date: reqDateStr, amount: requestedAmt }
        ], [changeStr]);

        if (isSafeWithStop) {
          candidates.push({
            id: `plan_full_${changeStr}`,
            payment_method: 'full_payment',
            payment_schedule: [{ date: reqDateStr, amount: requestedAmt }],
            spending_changes: [changeStr],
            total_cost: requestedAmt,
            is_safe: true,
            first_payment_date: reqDateStr,
            number_of_payments: 1
          });
        }
      }
    }
  }

  // B. Partial Payment Candidate
  if (
    request.allows_partial_payment &&
    profile.payment_methods_user_will_consider.includes('partial_payment') &&
    safeAmountToday > 0 &&
    safeAmountToday < requestedAmt &&
    earliestFullDate &&
    earliestFullDate <= request.desired_completion_date
  ) {
    const remainder = requestedAmt - safeAmountToday;
    const schedule = [
      { date: reqDateStr, amount: safeAmountToday },
      { date: earliestFullDate, amount: remainder }
    ];

    const isSafe = testPlanSafety(profile, activeEvents, schedule, []);

    candidates.push({
      id: 'plan_partial',
      payment_method: 'partial_payment',
      payment_schedule: schedule,
      spending_changes: [],
      total_cost: requestedAmt,
      is_safe: isSafe,
      first_payment_date: reqDateStr,
      number_of_payments: 2
    });
  }

  // C. Installment Candidates
  if (profile.payment_methods_user_will_consider.includes('installments')) {
    const allowedOptions = options.filter(opt => opt.payment_method === 'installments');
    for (const opt of allowedOptions) {
      if (
        profile.max_installment_months &&
        opt.number_of_payments > profile.max_installment_months
      ) {
        continue;
      }

      const schedule = buildInstallmentSchedule(opt);
      const totalCost = Number(opt.total_payable_amount);
      const isSafe = testPlanSafety(profile, activeEvents, schedule, []);

      candidates.push({
        id: `plan_inst_${opt.payment_option_id}`,
        payment_method: 'installments',
        payment_option_id: opt.payment_option_id,
        payment_schedule: schedule,
        spending_changes: [],
        total_cost: totalCost,
        is_safe: isSafe,
        first_payment_date: opt.first_payment_date,
        number_of_payments: opt.number_of_payments
      });
    }
  }

  // D. Wait Candidate
  if (
    profile.payment_methods_user_will_consider.includes('wait') &&
    earliestFullDate &&
    earliestFullDate > reqDateStr &&
    earliestFullDate <= request.desired_completion_date
  ) {
    const schedule = [{ date: earliestFullDate, amount: requestedAmt }];
    const isSafe = testPlanSafety(profile, activeEvents, schedule, []);

    candidates.push({
      id: 'plan_wait',
      payment_method: 'wait',
      payment_schedule: schedule,
      spending_changes: [],
      total_cost: requestedAmt,
      is_safe: isSafe,
      first_payment_date: earliestFullDate,
      number_of_payments: 1
    });
  }

  // Rank eligible safe candidates
  const safeCandidates = candidates.filter(c => c.is_safe);

  let winningPlan: CandidatePlan | null = null;
  let status: AffordabilityStatus = 'not_affordable';
  let method: PaymentMethod = 'not_recommended';

  if (safeCandidates.length > 0) {
    safeCandidates.sort((a, b) => {
      // 1. Deadline compliance
      const aComples = (a.payment_schedule[a.payment_schedule.length - 1]?.date || '') <= request.desired_completion_date;
      const bComples = (b.payment_schedule[b.payment_schedule.length - 1]?.date || '') <= request.desired_completion_date;
      if (aComples !== bComples) return aComples ? -1 : 1;

      // 2. No spending changes
      if (a.spending_changes.length !== b.spending_changes.length) {
        return a.spending_changes.length - b.spending_changes.length;
      }

      // 3. Minimize total cost
      if (Math.abs(a.total_cost - b.total_cost) > 0.01) {
        return a.total_cost - b.total_cost;
      }

      // 4. Start earlier
      if (a.first_payment_date !== b.first_payment_date) {
        return a.first_payment_date.localeCompare(b.first_payment_date);
      }

      // 5. Fewer payments
      return a.number_of_payments - b.number_of_payments;
    });

    winningPlan = safeCandidates[0];
    method = winningPlan.payment_method;

    if (method === 'full_payment' && winningPlan.spending_changes.length === 0) {
      status = 'affordable_now';
    } else if (method === 'wait') {
      status = 'affordable_later';
    } else {
      status = 'affordable_with_plan';
    }
  } else if (earliestFullDate) {
    status = 'affordable_later';
    method = 'wait';
  } else {
    status = 'not_affordable';
    method = 'not_recommended';
  }

  // Format outputs
  const planString = winningPlan
    ? winningPlan.payment_schedule.map(p => `${p.date}:${p.amount.toFixed(2)}`).join('|')
    : 'none';

  const spendingChangesStr = winningPlan && winningPlan.spending_changes.length > 0
    ? winningPlan.spending_changes.join('|')
    : 'none';

  const earliestFullStr = (status === 'affordable_now')
    ? reqDateStr
    : (earliestFullDate || '');

  // Build grounded decision explanation
  const explanation = generateExplanation(
    profile,
    request,
    status,
    safeAmountToday,
    earliestFullStr,
    winningPlan
  );

  // Generate 90-day daily balance simulation points for UI chart
  const simulation = generate90DaySimulation(
    profile,
    activeEvents,
    reqDateStr,
    winningPlan ? winningPlan.payment_schedule : [],
    winningPlan ? winningPlan.spending_changes : []
  );

  return {
    result: {
      request_id: request.request_id,
      amount_safe_to_pay: safeAmountToday,
      affordability_status: status,
      recommended_payment_method: method,
      payment_plan: planString,
      earliest_date_for_full_payment: earliestFullStr,
      spending_changes_needed: spendingChangesStr,
      decision_explanation: explanation,
      winning_candidate: winningPlan || undefined,
      evaluated_at: new Date().toISOString()
    },
    simulation
  };
}

// Internal simulation functions
function calculateAmountSafeToday(
  profile: FinancialProfile,
  events: FinancialEvent[],
  reqDateStr: string,
  requestedAmt: number
): number {
  let low = 0;
  let high = requestedAmt;
  let best = 0;

  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    const testSchedule = [{ date: reqDateStr, amount: mid }];
    if (testPlanSafety(profile, events, testSchedule, [])) {
      best = mid;
      low = mid;
    } else {
      high = mid;
    }
  }

  return Math.floor(best * 100) / 100;
}

function findEarliestFullPaymentDate(
  profile: FinancialProfile,
  events: FinancialEvent[],
  reqDateStr: string,
  requestedAmt: number
): string | null {
  const reqDate = new Date(reqDateStr);
  for (let d = 0; d <= 90; d++) {
    const targetDate = new Date(reqDate.getTime() + d * 86400000);
    const dateStr = targetDate.toISOString().split('T')[0];
    const testSchedule = [{ date: dateStr, amount: requestedAmt }];
    if (testPlanSafety(profile, events, testSchedule, [])) {
      return dateStr;
    }
  }
  return null;
}

function testPlanSafety(
  profile: FinancialProfile,
  events: FinancialEvent[],
  schedule: { date: string; amount: number }[],
  spendingChanges: string[]
): boolean {
  const sim = generate90DaySimulation(
    profile,
    events,
    schedule[0]?.date || new Date().toISOString().split('T')[0],
    schedule,
    spendingChanges
  );
  return sim.every(day => day.is_safe);
}

function buildInstallmentSchedule(opt: RequestPaymentOption): { date: string; amount: number }[] {
  const schedule = [];
  const startDate = new Date(opt.first_payment_date);
  const pmtAmt = Number(opt.payment_amount);

  for (let i = 0; i < opt.number_of_payments; i++) {
    const pmtDate = new Date(startDate.getTime() + i * opt.payment_frequency_days * 86400000);
    schedule.push({
      date: pmtDate.toISOString().split('T')[0],
      amount: pmtAmt
    });
  }

  return schedule;
}

function generate90DaySimulation(
  profile: FinancialProfile,
  events: FinancialEvent[],
  startDateStr: string,
  paymentSchedule: { date: string; amount: number }[],
  spendingChanges: string[]
): SimulationDay[] {
  const startDate = new Date(startDateStr);
  const minReserve = Number(profile.minimum_balance_to_keep);
  let currentBal = Number(profile.current_available_balance);

  const stoppedEventIds = new Set(
    spendingChanges.filter(c => c.startsWith('stop:')).map(c => c.split(':')[1])
  );

  const days: SimulationDay[] = [];

  for (let d = 0; d < 90; d++) {
    const currDate = new Date(startDate.getTime() + d * 86400000);
    const currDateStr = currDate.toISOString().split('T')[0];
    const dayEvents: { name: string; amount: number; type: 'income' | 'expense' | 'payment' }[] = [];

    let incomeToday = 0;
    let debitsToday = 0;
    let requestPmtToday = 0;

    for (const pmt of paymentSchedule) {
      if (pmt.date === currDateStr) {
        requestPmtToday += pmt.amount;
        dayEvents.push({ name: 'Request Payment', amount: pmt.amount, type: 'payment' });
      }
    }

    for (const evt of events) {
      if (evt.settlement_date === currDateStr || evt.event_date === currDateStr) {
        if (stoppedEventIds.has(evt.event_id)) continue;

        const amt = Number(evt.amount);
        if (evt.direction === 'credit' && (evt.status === 'settled' || evt.status === 'confirmed')) {
          incomeToday += amt;
          dayEvents.push({ name: evt.description, amount: amt, type: 'income' });
        } else if (evt.direction === 'debit' && (evt.status === 'settled' || evt.status === 'pending')) {
          debitsToday += amt;
          dayEvents.push({ name: evt.description, amount: amt, type: 'expense' });
        }
      }
    }

    const startingBal = currentBal;
    const endingBal = startingBal + incomeToday - debitsToday - requestPmtToday;
    const isSafe = endingBal >= minReserve;
    currentBal = endingBal;

    days.push({
      date: currDateStr,
      starting_balance: startingBal,
      income: incomeToday,
      pending_debits: 0,
      essential_expenses: debitsToday,
      flexible_expenses: 0,
      request_payments: requestPmtToday,
      ending_balance: endingBal,
      minimum_reserve: minReserve,
      is_safe: isSafe,
      events: dayEvents
    });
  }

  return days;
}

function generateExplanation(
  profile: FinancialProfile,
  request: RequestItem,
  status: AffordabilityStatus,
  safeAmount: number,
  earliestDate: string,
  winningPlan: CandidatePlan | null
): string {
  const currency = profile.home_currency;
  const reqAmt = Number(request.requested_amount);
  const minBal = Number(profile.minimum_balance_to_keep);

  if (status === 'affordable_now') {
    return `The full request of ${currency} ${reqAmt.toLocaleString()} is safe to pay today on ${request.request_date}. Your current balance covers the full amount while maintaining your required reserve of ${currency} ${minBal.toLocaleString()} throughout the 90-day forecast.`;
  }

  if (status === 'affordable_with_plan' && winningPlan) {
    if (winningPlan.payment_method === 'installments') {
      return `Recommended ${winningPlan.number_of_payments}-part installment plan. Paying ${currency} ${winningPlan.payment_schedule[0].amount.toFixed(2)} starting on ${winningPlan.first_payment_date} keeps your balance above the ${currency} ${minBal.toLocaleString()} minimum safety threshold across the 90-day forecast.`;
    }
    if (winningPlan.payment_method === 'partial_payment') {
      return `Recommended partial payment: pay ${currency} ${safeAmount.toFixed(2)} safe today on ${request.request_date}, and pay the remaining ${currency} ${(reqAmt - safeAmount).toFixed(2)} on ${earliestDate} after projected income settlement.`;
    }
    if (winningPlan.spending_changes.length > 0) {
      return `Affordable with flexible spending adjustment. By pausing ${winningPlan.spending_changes.join(', ')}, full payment of ${currency} ${reqAmt.toLocaleString()} becomes safe while maintaining your required reserve of ${currency} ${minBal.toLocaleString()}.`;
    }
  }

  if (status === 'affordable_later') {
    return `Full payment is not safe today (${currency} ${safeAmount.toFixed(2)} safe on ${request.request_date}), but is forecast to become fully safe on ${earliestDate} following upcoming confirmed salary income.`;
  }

  return `The request of ${currency} ${reqAmt.toLocaleString()} is not affordable within the 90-day forecast period. The maximum safe payment today is ${currency} ${safeAmount.toFixed(2)} to maintain your required minimum reserve of ${currency} ${minBal.toLocaleString()}.`;
}
