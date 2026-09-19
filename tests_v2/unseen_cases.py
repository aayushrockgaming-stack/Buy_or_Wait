import unittest
from decimal import Decimal
from datetime import date, datetime, timedelta
from typing import List, Dict, Optional, Tuple

# Adding current directory to path to allow absolute imports from code_v2
import sys
import os
sys.path.insert(0, os.getcwd())

from code.data_loader import DataLoader, FinancialProfile, FinancialEvent, Request, RequestPaymentOption
from code.evidence import EvidenceProcessor
from code.ledger import LedgerReconstructor, CanonicalLedger
from code.cashflow_simulator import CashflowSimulator
from code.payment_planner import PaymentPlanner
from code.decision_engine import DecisionEngine

class MockDataLoader:
    def __init__(self, profiles, events, requests, options, rates=None):
        self.profiles = profiles
        self.events = events
        self.requests = requests
        self.payment_options = options
        self.exchange_rates = rates or {}
        self.messages = []
        self.images = []

    def get_profile(self, user_id): return self.profiles.get(user_id)
    def get_user_events(self, user_id): return [e for e in self.events if e.user_id == user_id]
    def get_request(self, request_id): return next((r for r in self.requests if r.request_id == request_id), None)
    def get_payment_options(self, request_id): return self.payment_options.get(request_id, [])
    def get_exchange_rate(self, date_str, from_curr, to_curr):
        if from_curr == to_curr: return Decimal("1.0")
        return self.exchange_rates.get((date_str, from_curr, to_curr), Decimal("1.0"))
    def get_images_for_event(self, event_id): return []

class MockEvidenceProcessor:
    def resolve_event_amount(self, event_id, images): return None

class GeneralizationTester:
    def __init__(self):
        self.simulator = CashflowSimulator()
        self.planner = PaymentPlanner(self.simulator)
        self.engine = DecisionEngine()
        self.evidence = MockEvidenceProcessor()

    def run_case(self, profile, events, request, options):
        loader = MockDataLoader(
            profiles={profile.user_id: profile},
            events=events,
            requests=[request],
            options={request.request_id: options}
        )
        reconstructor = LedgerReconstructor(loader, self.evidence)
        ledger = reconstructor.build_ledger(request.request_id)

        safe_now = self.planner.calculate_amount_safe_to_pay(ledger, request.request_date, request.requested_amount)
        earliest_full = self.planner.calculate_earliest_full_payment_date(ledger, request.request_date, request.requested_amount)

        candidates = self.planner.generate_candidates(ledger, request, options, profile)
        decision = self.engine.compute_decision(ledger, request, candidates)

        decision["amount_safe_to_pay"] = f"{safe_now:.2f}"
        decision["earliest_date_for_full_payment"] = earliest_full if earliest_full else ""
        if decision["affordability_status"] == "affordable_now":
            decision["earliest_date_for_full_payment"] = request.request_date

        return decision

def create_profile(user_id="u1", bal=1000, min_bal=100, protected=[], adjustable=[], methods=["full_payment", "partial_payment", "installments", "wait"]):
    return FinancialProfile(
        user_id=user_id, home_currency="USD", current_available_balance=Decimal(str(bal)),
        minimum_balance_to_keep=Decimal(str(min_bal)), financial_priorities="none",
        protected_spending_categories=protected, adjustable_spending_categories=adjustable,
        payment_methods_user_will_consider=methods, max_installment_months=None
    )

def create_event(eid, uid="u1", amt=0, dir="debit", cat="general", desc="event", date="2024-01-01", sett=None, status="confirmed", flex=None, min_amt=None):
    return FinancialEvent(
        event_id=eid, user_id=uid, event_type="transaction", description=desc, category=cat,
        direction=dir, amount=Decimal(str(amt)), currency="USD", event_date=date,
        settlement_date=sett, status=status, linked_event_id=None, flexibility=flex, minimum_allowed_amount=Decimal(str(min_amt)) if min_amt else None
    )

def create_req(rid, uid="u1", date="2024-01-01", amt=500, deadline="2024-03-01", partial=True):
    return Request(
        request_id=rid, user_id=uid, request_date=date, request_type="purchase",
        requested_amount=Decimal(str(amt)), desired_completion_date=deadline,
        allows_partial_payment=partial, request_text="purchase"
    )

def create_opt(rid, oid, method="full_payment", first="2024-01-01", freq=30, num=1, amt=500, fee=0):
    return RequestPaymentOption(
        request_id=rid, payment_option_id=oid, payment_method=method, first_payment_date=first,
        payment_frequency_days=freq, number_of_payments=num, payment_amount=Decimal(str(amt)),
        financing_fee=Decimal(str(fee)), total_payable_amount=Decimal(str(amt * num + fee))
    )

def run_tests():
    tester = GeneralizationTester()
    cases = []

    # 1. Safe purchase today
    cases.append({
        "id": "case_01",
        "profile": create_profile(bal=1000, min_bal=100),
        "events": [],
        "request": create_req("r1", amt=500),
        "options": [create_opt("r1", "o1")],
        "expected": "affordable_now",
        "why": "1000 - 500 = 500 >= 100"
    })

    # 2. Barely unsafe
    cases.append({
        "id": "case_02",
        "profile": create_profile(bal=600, min_bal=100),
        "events": [],
        "request": create_req("r2", amt=501),
        "options": [create_opt("r2", "o2")],
        "expected": "not_affordable",
        "why": "600 - 501 = 99 < 100"
    })

    # 3. Future salary
    cases.append({
        "id": "case_03",
        "profile": create_profile(bal=200, min_bal=100),
        "events": [
            create_event("e1", amt=1000, dir="credit", date="2023-11-20", desc="Salary"),
            create_event("e2", amt=1000, dir="credit", date="2023-12-20", desc="Salary"),
        ],
        "request": create_req("r3", date="2024-01-01", amt=500, partial=False),
        "options": [create_opt("r3", "o3", first="2024-01-01")],
        "expected": "affordable_later",
        "why": "Salary recurring monthly. Jan 20 is safe. 200 + 1000 - 500 = 700 >= 100"
    })

    # 4. Uncertain income
    cases.append({
        "id": "case_04",
        "profile": create_profile(bal=200, min_bal=100),
        "events": [create_event("e1", amt=1000, dir="credit", date="2024-01-05", status="pending")],
        "request": create_req("r4", date="2024-01-01", amt=500),
        "options": [create_opt("r4", "o4")],
        "expected": "not_affordable",
        "why": "Pending credits are not counted."
    })

    # 5. Pending debit reserved
    cases.append({
        "id": "case_05",
        "profile": create_profile(bal=1000, min_bal=100),
        "events": [create_event("e1", amt=600, dir="debit", date="2024-01-05", status="pending")],
        "request": create_req("r5", date="2024-01-01", amt=500),
        "options": [create_opt("r5", "o5")],
        "expected": "not_affordable",
        "why": "1000 - 600 (pending) - 500 = -100 < 100"
    })

    # 6. Pending credit not counted
    cases.append({
        "id": "case_06",
        "profile": create_profile(bal=200, min_bal=100),
        "events": [create_event("e1", amt=1000, dir="credit", date="2024-01-05", status="pending")],
        "request": create_req("r6", date="2024-01-01", amt=500),
        "options": [create_opt("r6", "o6")],
        "expected": "not_affordable",
        "why": "Same as case 4"
    })

    # 7. Cancelled transaction
    cases.append({
        "id": "case_07",
        "profile": create_profile(bal=1000, min_bal=100),
        "events": [create_event("e1", amt=500, dir="debit", date="2023-12-20", status="cancelled")],
        "request": create_req("r7", date="2024-01-01", amt=500),
        "options": [create_opt("r7", "o7")],
        "expected": "affordable_now",
        "why": "Cancelled event doesn't affect balance."
    })

    # 8. Settled not projected twice
    cases.append({
        "id": "case_08",
        "profile": create_profile(bal=1000, min_bal=100),
        "events": [create_event("e1", amt=100, dir="debit", date="2023-12-20", status="confirmed")],
        "request": create_req("r8", date="2024-01-01", amt=500),
        "options": [create_opt("r8", "o8")],
        "expected": "affordable_now",
        "why": "Confirmed event in past is already in current balance."
    })

    # 9. Weekly expense
    cases.append({
        "id": "case_09",
        "profile": create_profile(bal=1000, min_bal=100),
        "events": [
            create_event("e1", amt=100, dir="debit", date="2023-12-01", desc="Gym"),
            create_event("e2", amt=100, dir="debit", date="2023-12-08", desc="Gym"),
            create_event("e3", amt=100, dir="debit", date="2023-12-15", desc="Gym"),
            create_event("e4", amt=100, dir="debit", date="2023-12-22", desc="Gym"),
        ],
        "request": create_req("r9", date="2024-01-01", amt=500),
        "options": [create_opt("r9", "o9")],
        "expected": "not_affordable",
        "why": "Weekly expense eventually drops balance below 100."
    })

    # 10. Biweekly expense
    cases.append({
        "id": "case_10",
        "profile": create_profile(bal=1000, min_bal=100),
        "events": [
            create_event("e1", amt=100, dir="debit", date="2023-12-01", desc="Bill"),
            create_event("e2", amt=100, dir="debit", date="2023-12-15", desc="Bill"),
            create_event("e3", amt=100, dir="debit", date="2023-12-29", desc="Bill"),
        ],
        "request": create_req("r10", date="2024-01-01", amt=500),
        "options": [create_opt("r10", "o10")],
        "expected": "not_affordable",
        "why": "Biweekly expense eventually drops balance below 100."
    })

    # 11. Monthly expense
    cases.append({
        "id": "case_11",
        "profile": create_profile(bal=1000, min_bal=100),
        "events": [
            create_event("e1", amt=100, dir="debit", date="2023-11-01", desc="Rent"),
            create_event("e2", amt=100, dir="debit", date="2023-12-01", desc="Rent"),
        ],
        "request": create_req("r11", date="2024-01-01", amt=500),
        "options": [create_opt("r11", "o11")],
        "expected": "affordable_now",
        "why": "Monthly expense doesn't drop balance below 100."
    })

    # 12. Irregular expenses
    cases.append({
        "id": "case_12",
        "profile": create_profile(bal=1000, min_bal=100),
        "events": [
            create_event("e1", amt=100, dir="debit", date="2023-12-01", desc="Random"),
            create_event("e2", amt=100, dir="debit", date="2023-12-10", desc="Random"),
        ],
        "request": create_req("r12", date="2024-01-01", amt=500),
        "options": [create_opt("r12", "o12")],
        "expected": "affordable_now",
        "why": "No recurrence."
    })

    # 13. Same cat diff desc
    cases.append({
        "id": "case_13",
        "profile": create_profile(bal=1000, min_bal=100),
        "events": [
            create_event("e1", amt=50, dir="debit", cat="Food", desc="Shop A", date="2023-11-01"),
            create_event("e2", amt=50, dir="debit", cat="Food", desc="Shop B", date="2023-12-01"),
        ],
        "request": create_req("r13", date="2024-01-01", amt=500),
        "options": [create_opt("r13", "o13")],
        "expected": "affordable_now",
        "why": "Monthly recurrence on Category Food."
    })

    # 14. One-off large
    cases.append({
        "id": "case_14",
        "profile": create_profile(bal=1000, min_bal=100),
        "events": [
            create_event("e1", amt=500, dir="debit", date="2023-12-01", desc="BigBuy"),
        ],
        "request": create_req("r14", date="2024-01-01", amt=500),
        "options": [create_opt("r14", "o14")],
        "expected": "affordable_now",
        "why": "No recurrence."
    })

    # 15. Foreign currency
    cases.append({
        "id": "case_15",
        "profile": create_profile(bal=1000, min_bal=100),
        "events": [],
        "request": create_req("r15", date="2024-01-01", amt=500),
        "options": [create_opt("r15", "o15")],
        "expected": "affordable_now",
        "why": "Simple case, but we check logic flow."
    })

    # 16. Spending reduction
    cases.append({
        "id": "case_16",
        "profile": create_profile(bal=600, min_bal=100, adjustable=["Gym"]),
        "events": [
            create_event("e1", amt=100, dir="debit", cat="Gym", desc="Gym", date="2023-12-01", flex="flexible", min_amt=20),
            create_event("e2", amt=100, dir="debit", cat="Gym", desc="Gym", date="2023-12-15"), # Not really a pattern yet
        ],
        "request": create_req("r16", date="2024-01-01", amt=500),
        "options": [create_opt("r16", "o16")],
        "expected": "affordable_with_plan",
        "why": "600-500=100. With Gym expense, it drops. If we stop Gym, it's safe."
    })

    # 17. Spending stop
    cases.append({
        "id": "case_17",
        "profile": create_profile(bal=600, min_bal=100, adjustable=["Gym"]),
        "events": [
            create_event("e1", amt=100, dir="debit", cat="Gym", desc="Gym", date="2023-12-01", flex="flexible"),
            create_event("e2", amt=100, dir="debit", cat="Gym", desc="Gym", date="2023-12-15"),
        ],
        "request": create_req("r17", date="2024-01-01", amt=500),
        "options": [create_opt("r17", "o17")],
        "expected": "affordable_with_plan",
        "why": "Similar to 16."
    })

    # 18. Partial payment
    cases.append({
        "id": "case_18",
        "profile": create_profile(bal=600, min_bal=100),
        "events": [
            create_event("e1", amt=1000, dir="credit", date="2024-01-15", desc="Salary"),
            create_event("e2", amt=1000, dir="credit", date="2023-12-15", desc="Salary"),
        ],
        "request": create_req("r18", date="2024-01-01", amt=1000, partial=True),
        "options": [create_opt("r18", "o18")],
        "expected": "affordable_with_plan",
        "why": "Safe now: 600-100=500. Pay 500 now, 500 on Jan 15 after salary."
    })

    # 19. Installment plan
    cases.append({
        "id": "case_19",
        "profile": create_profile(bal=200, min_bal=100),
        "events": [
            create_event("e1", amt=500, dir="credit", date="2024-01-15", desc="Salary"),
            create_event("e2", amt=500, dir="credit", date="2023-12-15", desc="Salary"),
        ],
        "request": create_req("r19", date="2024-01-01", amt=1000, deadline="2024-01-31", partial=False),
        "options": [create_opt("r19", "o19", method="installments", first="2024-01-01", num=2, amt=500)],
        "expected": "not_affordable",
        "why": "Payment 1 (Jan 1): 200-500 = -300 (Unsafe)."
    })

    # 20. No valid plan
    cases.append({
        "id": "case_20",
        "profile": create_profile(bal=100, min_bal=100),
        "events": [],
        "request": create_req("r20", amt=1000),
        "options": [create_opt("r20", "o20")],
        "expected": "not_affordable",
        "why": "No funds, no income."
    })

    # Edge Cases
    # 21. Exact min balance
    cases.append({
        "id": "edge_01",
        "profile": create_profile(bal=600, min_bal=100),
        "events": [],
        "request": create_req("re1", amt=500),
        "options": [create_opt("re1", "oe1")],
        "expected": "affordable_now",
        "why": "600 - 500 = 100 == 100"
    })

    # 22. Zero safe amount
    cases.append({
        "id": "edge_02",
        "profile": create_profile(bal=100, min_bal=100),
        "events": [],
        "request": create_req("re2", amt=500),
        "options": [create_opt("re2", "oe2")],
        "expected": "not_affordable",
        "why": "100 - 500 = -400 < 100"
    })

    # 23. Purchase amount == safe amount
    cases.append({
        "id": "edge_03",
        "profile": create_profile(bal=600, min_bal=100),
        "events": [],
        "request": create_req("re3", amt=500),
        "options": [create_opt("re3", "oe3")],
        "expected": "affordable_now",
        "why": "Exact match"
    })

    # 24. Income on payment date
    cases.append({
        "id": "edge_04",
        "profile": create_profile(bal=200, min_bal=100),
        "events": [create_event("e1", amt=500, dir="credit", date="2024-01-01")],
        "request": create_req("re4", date="2024-01-01", amt=600),
        "options": [create_opt("re4", "oe4", first="2024-01-01")],
        "expected": "affordable_now",
        "why": "200 + 500 - 600 = 100 >= 100"
    })

    # 25. Expense on payment date
    cases.append({
        "id": "edge_05",
        "profile": create_profile(bal=700, min_bal=100),
        "events": [create_event("e1", amt=100, dir="debit", date="2024-01-01")],
        "request": create_req("re5", date="2024-01-01", amt=500),
        "options": [create_opt("re5", "oe5", first="2024-01-01")],
        "expected": "affordable_now",
        "why": "700 - 100 - 500 = 100 >= 100"
    })

    results = []
    for c in cases:
        try:
            res = tester.run_case(c["profile"], c["events"], c["request"], c["options"])
            actual = res["affordability_status"]
            if c["id"] == "case_02":
                print(f"Case 02 Status: {actual}")
            results.append({
                "id": c["id"],
                "expected": c["expected"],
                "actual": actual,
                "passed": actual == c["expected"],
                "details": res
            })
        except Exception as e:
            results.append({
                "id": c["id"],
                "expected": c["expected"],
                "actual": f"CRASH: {str(e)}",
                "passed": False,
                "details": None
            })

    return results

if __name__ == "__main__":
    res = run_tests()
    passed = sum(1 for r in res if r["passed"])
    print(f"UNSEEN TESTS: {len(res)}")
    print(f"PASSED: {passed}")
    print(f"FAILED: {len(res) - passed}")
    for r in res:
        if not r["passed"]:
            print(f"FAIL: {r['id']} | Exp: {r['expected']} | Act: {r['actual']}")
