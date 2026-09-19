from typing import List, Dict, Optional, Tuple
from decimal import Decimal

try:
    from code.payment_planner import PaymentPlanner
    from code.ledger import CanonicalLedger
except ImportError:
    from payment_planner import PaymentPlanner
    from ledger import CanonicalLedger

class DecisionEngine:
    def rank_candidates(self, candidates: List[dict], deadline: str) -> Optional[dict]:
        # Hierarchy:
        # 1. Complete by deadline
        # 2. No spending changes
        # 3. Minimize total cost
        # 4. Start earlier
        # 5. Fewer payments
        # 6. Lowest payment_option_id

        def get_key(c):
            meets_dl = 0 if c["completion_date"] <= deadline else 1
            sp_changes = len(c["spending_changes"])
            cost = c["total_cost"]
            num_payments = len(c["schedule"])
            start_date = c["schedule"][0]["date"] if c["schedule"] else "9999-12-31"
            opt_id = c["option_id"] if c["option_id"] else "zzzzzzzz"
            return (meets_dl, sp_changes, cost, start_date, num_payments, opt_id)

        eligible = [c for c in candidates if c["is_safe"]]
        print(f"Eligible candidates: {len(eligible)} / {len(candidates)}")
        if not eligible:
            return None

        return min(eligible, key=get_key)

    def determine_status(self, winner: dict, method: str) -> str:
        if method == "full_payment" and not winner["spending_changes"]:
            if winner["schedule"][0]["date"] == winner["completion_date"]:
                if len(winner["schedule"]) == 1:
                    return "affordable_now"

        if method in ("full_payment", "partial_payment", "installments"):
            return "affordable_with_plan"
        if method == "wait":
            return "affordable_later"
        return "not_affordable"

    def format_plan(self, schedule: List[Dict]) -> str:
        if not schedule: return "none"
        return "|".join([f"{p['date']}:{p['amount']:.2f}" for p in schedule])

    def format_changes(self, changes: List[str]) -> str:
        if not changes: return "none"
        return "|".join(changes)

    def compute_decision(self, ledger: CanonicalLedger, request, candidates: List[dict]) -> dict:
        winner = self.rank_candidates(candidates, request.desired_completion_date)

        if not winner:
            return {
                "amount_safe_to_pay": Decimal("0.0"),
                "affordability_status": "not_affordable",
                "recommended_payment_method": "not_recommended",
                "payment_plan": "none",
                "earliest_date_for_full_payment": "",
                "spending_changes_needed": "none",
                "decision_explanation": "No safe payment plan found within the 90-day horizon."
            }

        status = self.determine_status(winner, winner["method"])

        return {
            "amount_safe_to_pay": Decimal("0.0"),
            "affordability_status": status,
            "recommended_payment_method": winner["method"],
            "payment_plan": self.format_plan(winner["schedule"]),
            "earliest_date_for_full_payment": "",
            "spending_changes_needed": self.format_changes(winner["spending_changes"]),
            "decision_explanation": f"Recommended {winner['method']} based on financial safety and preferences."
        }
