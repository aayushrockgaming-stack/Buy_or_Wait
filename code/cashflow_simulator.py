from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import List, Dict, Optional, Tuple
from decimal import Decimal
import calendar

try:
    from code.ledger import CanonicalLedger, ResolvedEvent
except ImportError:
    from ledger import CanonicalLedger, ResolvedEvent

@dataclass
class DailyBalance:
    date: str
    starting_balance: Decimal
    ending_balance: Decimal
    income: Decimal
    expenses: Decimal
    payment: Decimal
    is_safe: bool

@dataclass
class SimulationResult:
    daily_balances: List[DailyBalance]
    minimum_projected_balance: Decimal
    is_safe: bool
    first_violation_date: Optional[str]
    ending_balance: Decimal

class CashflowSimulator:
    def simulate(
        self,
        ledger: CanonicalLedger,
        request_date: str,
        payment_schedule: List[Dict],
        spending_changes: List[str] = None,
        horizon_days: int = 90
    ) -> SimulationResult:
        start_date = datetime.strptime(request_date, "%Y-%m-%d").date()
        end_date = start_date + timedelta(days=horizon_days)

        stopped_ids = set()
        reduced_map = {}
        if spending_changes:
            for sc in spending_changes:
                parts = sc.split(":")
                if parts[0] == "stop":
                    stopped_ids.add(parts[1])
                elif parts[0] == "reduce_to":
                    reduced_map[parts[1]] = Decimal(parts[2])

        income_map: Dict[date, Decimal] = {}
        expense_map: Dict[date, Decimal] = {}

        # 1. Fixed/One-time events
        for ev in ledger.all_events:
            if ev.lifecycle_state != "CONFIRMED": continue
            if ev.is_recurring: continue

            dt_str = ev.settlement_date or ev.event_date
            dt = datetime.strptime(dt_str, "%Y-%m-%d").date()
            if start_date <= dt <= end_date:
                if ev.direction == "credit":
                    income_map[dt] = income_map.get(dt, Decimal("0.0")) + ev.amount
                else:
                    expense_map[dt] = expense_map.get(dt, Decimal("0.0")) + ev.amount

        # 2. Recurring events
        for ev in ledger.recurring_income + ledger.recurring_expenses:
            if ev.lifecycle_state != "CONFIRMED": continue

            amt = ev.amount
            if ev.direction == "debit":
                if ev.event_id in stopped_ids:
                    amt = Decimal("0.0")
                elif ev.event_id in reduced_map:
                    amt = min(amt, reduced_map[ev.event_id])

            if ev.cadence == "MONTHLY":
                self._project_monthly(ev, start_date, end_date, amt, income_map if ev.direction == "credit" else expense_map)
            elif ev.cadence != "ONE_TIME":
                self._project_fixed_interval(ev, start_date, end_date, amt, income_map if ev.direction == "credit" else expense_map)

        # 3. Pending Debits
        for ev in ledger.pending_debits:
            dt_str = ev.settlement_date or ev.event_date
            dt = datetime.strptime(dt_str, "%Y-%m-%d").date()
            actual_date = max(start_date, dt)
            if actual_date <= end_date:
                expense_map[actual_date] = expense_map.get(actual_date, Decimal("0.0")) + ev.amount

        current_balance = ledger.starting_balance
        min_bal = current_balance
        first_violation = None
        daily_results = []

        pay_map = {}
        for p in payment_schedule:
            d = datetime.strptime(p["date"], "%Y-%m-%d").date()
            pay_map[d] = pay_map.get(d, Decimal("0.0")) + Decimal(str(p["amount"]))

        curr_d = start_date
        while curr_d <= end_date:
            day_income = income_map.get(curr_d, Decimal("0.0"))
            day_expense = expense_map.get(curr_d, Decimal("0.0"))
            day_pay = pay_map.get(curr_d, Decimal("0.0"))

            start_bal = current_balance
            end_bal = start_bal + day_income - day_expense - day_pay

            safe = end_bal >= ledger.minimum_balance_to_keep
            if not safe and first_violation is None:
                first_violation = curr_d.strftime("%Y-%m-%d")

            if end_bal < min_bal:
                min_bal = end_bal

            daily_results.append(DailyBalance(
                date=curr_d.strftime("%Y-%m-%d"),
                starting_balance=start_bal,
                ending_balance=end_bal,
                income=day_income,
                expenses=day_expense,
                payment=day_pay,
                is_safe=safe
            ))
            current_balance = end_bal
            curr_d += timedelta(days=1)

        return SimulationResult(
            daily_balances=daily_results,
            minimum_projected_balance=min_bal,
            is_safe=all(db.is_safe for db in daily_results),
            first_violation_date=first_violation,
            ending_balance=current_balance
        )

    def _project_monthly(self, ev, start, end, amt, target_map):
        anchor_dt = datetime.strptime(ev.anchor_date, "%Y-%m-%d").date()
        day = anchor_dt.day

        y, m = start.year, start.month
        _, days_in_month = calendar.monthrange(y, m)
        first_occ = date(y, m, min(day, days_in_month))
        if first_occ < start:
            m += 1
            y = start.year
            if m > 12:
                m = 1
                y += 1
            _, days_in_month = calendar.monthrange(y, m)
            first_occ = date(y, m, min(day, days_in_month))

        curr = first_occ
        while curr <= end:
            target_map[curr] = target_map.get(curr, Decimal("0.0")) + amt
            m = curr.month + 1
            y = curr.year
            if m > 12:
                m = 1
                y += 1
            _, days_in_month = calendar.monthrange(y, m)
            curr = date(y, m, min(day, days_in_month))

    def _project_fixed_interval(self, ev, start, end, amt, target_map):
        anchor_dt = datetime.strptime(ev.anchor_date, "%Y-%m-%d").date()
        interval = ev.interval_days
        curr = anchor_dt
        if curr < start:
            diff = (start - curr).days
            num_intervals = (diff + interval - 1) // interval
            curr += timedelta(days=num_intervals * interval)
        while curr <= end:
            target_map[curr] = target_map.get(curr, Decimal("0.0")) + amt
            curr += timedelta(days=interval)
