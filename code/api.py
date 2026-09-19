import os
import sys
from pathlib import Path
from decimal import Decimal
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Ensure code directory and repo root are in path
code_dir = Path(__file__).parent.resolve()
repo_root = code_dir.parent.resolve()
for p in (str(repo_root), str(code_dir)):
    if p not in sys.path:
        sys.path.insert(0, p)

from code.data_loader import DataLoader, Request, RequestPaymentOption
from code.evidence import EvidenceProcessor
from code.ledger import LedgerReconstructor
from code.cashflow_simulator import CashflowSimulator
from code.payment_planner import PaymentPlanner
from code.decision_engine import DecisionEngine

app = FastAPI(
    title="Buy or Wait? — AI Financial Affordability API Engine",
    description="Real-time 90-day financial forecasting & affordability decision engine API",
    version="2.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static images if present
images_dir = repo_root / "dataset" / "media" / "images"
if images_dir.exists():
    app.mount("/media/images", StaticFiles(directory=str(images_dir)), name="images")

# Global engine instances
dataset_dir = repo_root / "dataset"
loader = DataLoader(str(dataset_dir))
evidence = EvidenceProcessor(str(dataset_dir))
reconstructor = LedgerReconstructor(loader, evidence)
simulator = CashflowSimulator()
planner = PaymentPlanner(simulator)
engine = DecisionEngine()

class EvaluateRequestInput(BaseModel):
    user_id: str
    request_id: Optional[str] = "custom_req"
    request_date: str
    request_type: str = "purchase"
    requested_amount: float
    desired_completion_date: str
    allows_partial_payment: bool = True
    request_text: str = ""
    custom_payment_options: Optional[List[Dict[str, Any]]] = None

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "engine": "Buy or Wait? V2 Deterministic Simulator",
        "total_requests": len(loader.requests),
        "total_profiles": len(loader.profiles),
        "total_events": len(loader.events)
    }

@app.get("/api/profiles")
def get_profiles():
    res = []
    for uid, p in loader.profiles.items():
        res.append({
            "user_id": p.user_id,
            "user_name": f"User {p.user_id}",
            "home_currency": p.home_currency,
            "current_available_balance": float(p.current_available_balance),
            "minimum_balance_to_keep": float(p.minimum_balance_to_keep),
            "financial_priorities": p.financial_priorities,
            "protected_spending_categories": p.protected_spending_categories,
            "adjustable_spending_categories": p.adjustable_spending_categories,
            "payment_methods_user_will_consider": p.payment_methods_user_will_consider,
            "max_installment_months": p.max_installment_months
        })
    return res

@app.get("/api/profiles/{user_id}")
def get_profile_by_id(user_id: str):
    p = loader.get_profile(user_id)
    if not p:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {
        "user_id": p.user_id,
        "user_name": f"User {p.user_id}",
        "home_currency": p.home_currency,
        "current_available_balance": float(p.current_available_balance),
        "minimum_balance_to_keep": float(p.minimum_balance_to_keep),
        "financial_priorities": p.financial_priorities,
        "protected_spending_categories": p.protected_spending_categories,
        "adjustable_spending_categories": p.adjustable_spending_categories,
        "payment_methods_user_will_consider": p.payment_methods_user_will_consider,
        "max_installment_months": p.max_installment_months
    }

@app.get("/api/profiles/{user_id}/ledger")
def get_user_ledger(user_id: str):
    p = loader.get_profile(user_id)
    if not p:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    events = loader.get_user_events(user_id)
    res_events = []
    for e in events:
        res_events.append({
            "event_id": e.event_id,
            "user_id": e.user_id,
            "event_type": e.event_type,
            "description": e.description,
            "category": e.category,
            "direction": e.direction,
            "amount": float(e.amount) if e.amount is not None else 0.0,
            "currency": e.currency,
            "event_date": e.event_date,
            "settlement_date": e.settlement_date,
            "status": e.status,
            "linked_event_id": e.linked_event_id,
            "flexibility": e.flexibility,
            "minimum_allowed_amount": float(e.minimum_allowed_amount) if e.minimum_allowed_amount else None
        })
    
    return {
        "user_id": user_id,
        "home_currency": p.home_currency,
        "events": res_events
    }

@app.get("/api/requests")
def get_requests(limit: int = 50, offset: int = 0):
    all_reqs = loader.requests
    sliced = all_reqs[offset:offset+limit]
    res = []
    for r in sliced:
        opts = loader.get_payment_options(r.request_id)
        res.append({
            "request_id": r.request_id,
            "user_id": r.user_id,
            "request_date": r.request_date,
            "request_type": r.request_type,
            "requested_amount": float(r.requested_amount),
            "desired_completion_date": r.desired_completion_date,
            "allows_partial_payment": r.allows_partial_payment,
            "request_text": r.request_text,
            "options_count": len(opts)
        })
    return {
        "total": len(all_reqs),
        "limit": limit,
        "offset": offset,
        "items": res
    }

@app.post("/api/evaluate")
def evaluate_request(body: EvaluateRequestInput):
    profile = loader.get_profile(body.user_id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"User {body.user_id} not found")

    # Build Request object
    req_id = body.request_id or "custom_req"
    req_obj = Request(
        request_id=req_id,
        user_id=body.user_id,
        request_date=body.request_date,
        request_type=body.request_type,
        requested_amount=Decimal(str(body.requested_amount)),
        desired_completion_date=body.desired_completion_date,
        allows_partial_payment=body.allows_partial_payment,
        request_text=body.request_text
    )

    # Get or build payment options
    opts = loader.get_payment_options(req_id)
    if not opts and body.custom_payment_options:
        opts = []
        for o in body.custom_payment_options:
            opts.append(RequestPaymentOption(
                request_id=req_id,
                payment_option_id=o.get("payment_option_id", f"{req_id}_opt"),
                payment_method=o.get("payment_method", "full_payment"),
                first_payment_date=o.get("first_payment_date", body.request_date),
                payment_frequency_days=int(o.get("payment_frequency_days", 0)),
                number_of_payments=int(o.get("number_of_payments", 1)),
                payment_amount=Decimal(str(o.get("payment_amount", body.requested_amount))),
                financing_fee=Decimal(str(o.get("financing_fee", 0))),
                total_payable_amount=Decimal(str(o.get("total_payable_amount", body.requested_amount)))
            ))
    elif not opts:
        # Default full payment option
        opts = [
            RequestPaymentOption(
                request_id=req_id,
                payment_option_id=f"{req_id}_full",
                payment_method="full_payment",
                first_payment_date=body.request_date,
                payment_frequency_days=0,
                number_of_payments=1,
                payment_amount=Decimal(str(body.requested_amount)),
                financing_fee=Decimal("0"),
                total_payable_amount=Decimal(str(body.requested_amount))
            )
        ]

    # Reconstruct ledger
    ledger = reconstructor.build_ledger(req_id)

    # Calculate safe amount today & earliest date
    safe_now = planner.calculate_amount_safe_to_pay(ledger, req_obj.request_date, req_obj.requested_amount)
    earliest_full = planner.calculate_earliest_full_payment_date(ledger, req_obj.request_date, req_obj.requested_amount)

    # Candidate plans
    candidates = planner.generate_candidates(ledger, req_obj, opts, profile)

    # Decision
    decision = engine.compute_decision(ledger, req_obj, candidates)

    decision["amount_safe_to_pay"] = f"{safe_now:.2f}"
    decision["earliest_date_for_full_payment"] = earliest_full if earliest_full else ""
    if decision["affordability_status"] == "affordable_now":
        decision["earliest_date_for_full_payment"] = req_obj.request_date

    # Run 90-day simulation curve for UI line chart
    winning_candidate = None
    safe_candidates = [c for c in candidates if c.is_safe]
    if safe_candidates:
        winning_candidate = safe_candidates[0]

    sim_schedule = winning_candidate.payment_schedule if winning_candidate else []
    sim_changes = winning_candidate.spending_changes if winning_candidate else []
    sim_result = simulator.simulate_90_days(ledger, req_obj.request_date, sim_schedule, sim_changes)

    sim_days = []
    for day in sim_result.days:
        sim_days.append({
            "date": day.date,
            "starting_balance": float(day.starting_balance),
            "income": float(day.income),
            "pending_debits": float(day.pending_debits),
            "essential_expenses": float(day.essential_expenses),
            "flexible_expenses": float(day.flexible_expenses),
            "request_payments": float(day.request_payments),
            "ending_balance": float(day.ending_balance),
            "minimum_reserve": float(profile.minimum_balance_to_keep),
            "is_safe": day.ending_balance >= profile.minimum_balance_to_keep
        })

    return {
        "result": decision,
        "amount_safe_to_pay": float(safe_now),
        "earliest_date_for_full_payment": decision["earliest_date_for_full_payment"],
        "simulation": sim_days,
        "candidates_evaluated": len(candidates)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
