from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from decimal import Decimal
import itertools

try:
    from code.ledger import CanonicalLedger, ResolvedEvent
    from code.cashflow_simulator import CashflowSimulator
except ImportError:
    from ledger import CanonicalLedger, ResolvedEvent
    from cashflow_simulator import CashflowSimulator

class PaymentPlanner:
    def __init__(self, simulator: CashflowSimulator):
        self.simulator = simulator

    def calculate_amount_safe_to_pay(self, ledger: CanonicalLedger, request_date: str, requested_amount: Decimal) -> Decimal:
        """ Binary search for the max amount safe to pay today. """
        low = Decimal("0.0")
        high = requested_amount
        best_safe = Decimal("0.0")

        for _ in range(30):
            mid = (low + high) / 2
            res = self.simulator.simulate(ledger, request_date, [{"date": request_date, "amount": mid}], [])
            if res.is_safe:
                best_safe = mid
                low = mid
            else:
                high = mid
        return best_safe.quantize(Decimal("0.01"))

    def calculate_earliest_full_payment_date(self, ledger: CanonicalLedger, request_date: str, requested_amount: Decimal) -> Optional[str]:
        """ Find first date in 90 days where full payment is safe. """
        start_d = datetime.strptime(request_date, "%Y-%m-%d").date()
        for offset in range(91):
            curr_date = (start_d + timedelta(days=offset)).strftime("%Y-%m-%d")
            res = self.simulator.simulate(ledger, request_date, [{"date": curr_date, "amount": requested_amount}], [])
            if res.is_safe:
                return curr_date
        return None

    def calculate_earliest_remaining_payment_date(self, ledger: CanonicalLedger, request_date: str, amount_already_paid: Decimal, remaining_amount: Decimal) -> Optional[str]:
        """ Find first date in 90 days where paying the remaining amount is safe, given an initial payment. """
        start_d = datetime.strptime(request_date, "%Y-%m-%d").date()
        for offset in range(1, 91):
            curr_date = (start_d + timedelta(days=offset)).strftime("%Y-%m-%d")
            sched = [
                {"date": request_date, "amount": amount_already_paid},
                {"date": curr_date, "amount": remaining_amount}
            ]
            res = self.simulator.simulate(ledger, request_date, sched, [])
            if res.is_safe:
                return curr_date
        return None

    def generate_candidates(self, ledger: CanonicalLedger, request, payment_options: List, profile) -> List[dict]:
        candidates = []
        req_date = request.request_date
        req_amt = request.requested_amount
        deadline = request.desired_completion_date

        # 1. Full Payment
        full_opt = next((o for o in payment_options if o.payment_method == "full_payment"), None)
        if "full_payment" in profile.payment_methods_user_will_consider:
            option_cost = full_opt.total_payable_amount if full_opt else req_amt
            total_cost = max(option_cost, req_amt)
            res = self.simulator.simulate(ledger, req_date, [{"date": req_date, "amount": total_cost}], [])
            candidates.append({
                "method": "full_payment",
                "option_id": full_opt.payment_option_id if full_opt else None,
                "schedule": [{"date": req_date, "amount": total_cost}],
                "total_cost": total_cost,
                "spending_changes": [],
                "is_safe": res.is_safe,
                "completion_date": req_date
            })

        # 2. Installments
        if "installments" in profile.payment_methods_user_will_consider:
            for opt in payment_options:
                if opt.payment_method != "installments": continue
                if profile.max_installment_months and opt.number_of_payments > profile.max_installment_months:
                    continue

                sched = []
                curr_d = datetime.strptime(opt.first_payment_date, "%Y-%m-%d").date()
                for i in range(opt.number_of_payments):
                    sched.append({"date": curr_d.strftime("%Y-%m-%d"), "amount": opt.payment_amount})
                    curr_d += timedelta(days=opt.payment_frequency_days or 30)

                res = self.simulator.simulate(ledger, req_date, sched, [])
                candidates.append({
                    "method": "installments",
                    "option_id": opt.payment_option_id,
                    "schedule": sched,
                    "total_cost": opt.total_payable_amount,
                    "spending_changes": [],
                    "is_safe": res.is_safe,
                    "completion_date": sched[-1]["date"]
                })

        # 3. Partial Payment
        if request.allows_partial_payment and "partial_payment" in profile.payment_methods_user_will_consider:
            safe_now = self.calculate_amount_safe_to_pay(ledger, req_date, req_amt)
            if Decimal("0.0") < safe_now < req_amt:
                earliest_rem = self.calculate_earliest_remaining_payment_date(ledger, req_date, safe_now, req_amt - safe_now)
                if earliest_rem and earliest_rem <= deadline:
                    sched = [
                        {"date": req_date, "amount": safe_now},
                        {"date": earliest_rem, "amount": req_amt - safe_now}
                    ]
                    res = self.simulator.simulate(ledger, req_date, sched, [])
                    candidates.append({
                        "method": "partial_payment",
                        "option_id": None,
                        "schedule": sched,
                        "total_cost": req_amt,
                        "spending_changes": [],
                        "is_safe": res.is_safe,
                        "completion_date": earliest_rem
                    })

        # 4. Wait
        if "wait" in profile.payment_methods_user_will_consider:
            earliest_full = self.calculate_earliest_full_payment_date(ledger, req_date, req_amt)
            if earliest_full and earliest_full > req_date and earliest_full <= deadline:
                candidates.append({
                    "method": "wait",
                    "option_id": None,
                    "schedule": [{"date": earliest_full, "amount": req_amt}],
                    "total_cost": req_amt,
                    "spending_changes": [],
                    "is_safe": True,
                    "completion_date": earliest_full
                })

        # 5. Spending Change Variants
        if ledger.recurring_expenses:
            flex_events = [e for e in ledger.recurring_expenses if e.is_flexible]
            if flex_events:
                options = []
                for fe in flex_events:
                    ev_opts = []
                    ev_opts.append(f"stop:{fe.event_id}")
                    if fe.minimum_allowed_amount is not None:
                        ev_opts.append(f"reduce_to:{fe.event_id}:{fe.minimum_allowed_amount}")
                    options.append(ev_opts)

                all_combos = []
                for r in range(1, 4):
                    for subset in itertools.combinations(options, r):
                        for combo in itertools.product(*subset):
                            all_combos.append(list(combo))

                base_candidates = list(candidates)
                for cand in base_candidates:
                    if not cand["is_safe"]:
                        for sc in all_combos:
                            res = self.simulator.simulate(ledger, req_date, cand["schedule"], sc)
                            if res.is_safe:
                                candidates.append({
                                    **cand,
                                    "spending_changes": sc,
                                    "is_safe": True
                                })
                                break

        return candidates
